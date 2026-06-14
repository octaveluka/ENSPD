<?php
/**
 * Admin : gestion des actualités (ENSPD).
 *
 *  GET                       -> liste de TOUTES les actualités (brouillons inclus),
 *                               chacune avec ses images.
 *  GET ?id=12                -> une actualité avec ses images.
 *
 *  POST (CSRF requis), champ "op" :
 *   - op="save"   {id?, titre, slug?, categorie?, resume?, contenu?, image?,
 *                  date_pub?, statut}            -> crée (si id absent) ou met à jour.
 *   - op="delete" {id}                            -> supprime (images en cascade).
 *   - op="add_image"    {actualite_id, url, legende?, position?} -> ajoute une image.
 *   - op="remove_image" {image_id}               -> supprime une image.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../src/cors.php';
require_once __DIR__ . '/../../src/helpers.php';

header('Content-Type: application/json; charset=utf-8');

$admin  = require_admin();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

/**
 * Charge les images d'une liste d'identifiants d'actualités.
 */
function admin_load_images(array $ids): array
{
    if (empty($ids)) {
        return [];
    }
    $placeholders = implode(',', array_fill(0, count($ids), '?'));
    $stmt = db()->prepare(
        'SELECT id, actualite_id, url, legende, position
         FROM actualite_images
         WHERE actualite_id IN (' . $placeholders . ')
         ORDER BY position ASC, id ASC'
    );
    $stmt->execute(array_values($ids));
    $byId = [];
    foreach ($stmt->fetchAll() as $img) {
        $byId[(int) $img['actualite_id']][] = [
            'id'       => (int) $img['id'],
            'url'      => (string) $img['url'],
            'legende'  => (string) ($img['legende'] ?? ''),
            'position' => (int) $img['position'],
        ];
    }
    return $byId;
}

/* =============================== GET =============================== */
if ($method === 'GET') {
    try {
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        if ($id > 0) {
            $stmt = db()->prepare('SELECT * FROM actualites WHERE id = :id LIMIT 1');
            $stmt->execute([':id' => $id]);
            $row = $stmt->fetch();
            if (!$row) {
                json_response(['ok' => false, 'error' => 'not_found'], 404);
            }
            $imgs = admin_load_images([(int) $row['id']]);
            $row['images'] = $imgs[(int) $row['id']] ?? [];
            json_response(['ok' => true, 'item' => $row]);
        }

        $stmt = db()->query('SELECT * FROM actualites ORDER BY date_pub DESC, id DESC LIMIT 1000');
        $rows = $stmt->fetchAll();
        $ids = array_map(static fn($r) => (int) $r['id'], $rows);
        $imgs = admin_load_images($ids);
        foreach ($rows as &$r) {
            $r['images'] = $imgs[(int) $r['id']] ?? [];
        }
        unset($r);
    } catch (Throwable $e) {
        json_response(['ok' => false, 'error' => 'server'], 500);
    }
    json_response(['ok' => true, 'items' => $rows, 'count' => count($rows)]);
}

/* =============================== POST ============================== */
if ($method === 'POST') {
    if (!csrf_check()) {
        json_response(['ok' => false, 'error' => 'csrf'], 403);
    }

    $data = read_json_body();
    $op   = clean_str($data['op'] ?? 'save', 20);

    /* --- Supprimer une actualité --- */
    if ($op === 'delete') {
        $id = (int) ($data['id'] ?? 0);
        if ($id <= 0) {
            json_response(['ok' => false, 'error' => 'validation', 'fields' => ['id' => 'Identifiant manquant.']], 422);
        }
        try {
            // Les images sont supprimées en cascade (FK ON DELETE CASCADE).
            $stmt = db()->prepare('DELETE FROM actualites WHERE id = :id');
            $stmt->execute([':id' => $id]);
        } catch (Throwable $e) {
            json_response(['ok' => false, 'error' => 'server'], 500);
        }
        audit_log($admin['id'], 'actualite_delete', 'actualite', (string) $id);
        json_response(['ok' => true, 'message' => 'Actualité supprimée.']);
    }

    /* --- Ajouter une image à une actualité --- */
    if ($op === 'add_image') {
        $aid = (int) ($data['actualite_id'] ?? 0);
        $url = clean_str($data['url'] ?? '', 255);
        $legende  = clean_str($data['legende'] ?? '', 255);
        $position = (int) ($data['position'] ?? 0);
        $fields = [];
        if ($aid <= 0) {
            $fields['actualite_id'] = 'Actualité manquante.';
        }
        if (!len_between($url, 1, 255)) {
            $fields['url'] = 'URL de l\'image requise.';
        }
        if ($fields) {
            json_response(['ok' => false, 'error' => 'validation', 'fields' => $fields], 422);
        }
        try {
            // Vérifie que l'actualité existe.
            $chk = db()->prepare('SELECT id FROM actualites WHERE id = :id LIMIT 1');
            $chk->execute([':id' => $aid]);
            if (!$chk->fetch()) {
                json_response(['ok' => false, 'error' => 'not_found', 'message' => 'Actualité introuvable.'], 404);
            }
            $stmt = db()->prepare(
                'INSERT INTO actualite_images (actualite_id, url, legende, position)
                 VALUES (:aid, :url, :legende, :position)'
            );
            $stmt->execute([
                ':aid'      => $aid,
                ':url'      => $url,
                ':legende'  => $legende !== '' ? $legende : null,
                ':position' => $position,
            ]);
            $newId = (int) db()->lastInsertId();
        } catch (Throwable $e) {
            json_response(['ok' => false, 'error' => 'server'], 500);
        }
        audit_log($admin['id'], 'actualite_add_image', 'actualite', (string) $aid);
        json_response(['ok' => true, 'id' => $newId, 'message' => 'Image ajoutée.']);
    }

    /* --- Supprimer une image --- */
    if ($op === 'remove_image') {
        $imgId = (int) ($data['image_id'] ?? 0);
        if ($imgId <= 0) {
            json_response(['ok' => false, 'error' => 'validation', 'fields' => ['image_id' => 'Identifiant manquant.']], 422);
        }
        try {
            $stmt = db()->prepare('DELETE FROM actualite_images WHERE id = :id');
            $stmt->execute([':id' => $imgId]);
        } catch (Throwable $e) {
            json_response(['ok' => false, 'error' => 'server'], 500);
        }
        audit_log($admin['id'], 'actualite_remove_image', 'actualite_image', (string) $imgId);
        json_response(['ok' => true, 'message' => 'Image supprimée.']);
    }

    /* --- Créer ou mettre à jour une actualité (op = save) --- */
    $id        = (int) ($data['id'] ?? 0);
    $titre     = clean_str($data['titre'] ?? '', 255);
    $slug      = clean_str($data['slug'] ?? '', 200);
    $categorie = clean_str($data['categorie'] ?? '', 80);
    $resume    = clean_str($data['resume'] ?? '', 2000);
    $contenu   = clean_str($data['contenu'] ?? '', 60000);
    $image     = clean_str($data['image'] ?? '', 255);
    $datePub   = clean_str($data['date_pub'] ?? '', 10);
    $statut    = clean_str($data['statut'] ?? 'published', 20);

    $fields = [];
    if (!len_between($titre, 2, 255)) {
        $fields['titre'] = 'Titre requis (2 à 255 caractères).';
    }
    if (!in_array($statut, ['draft', 'published'], true)) {
        $fields['statut'] = 'Statut invalide.';
    }
    if ($datePub !== '' && !valid_date($datePub)) {
        $fields['date_pub'] = 'Date invalide (format AAAA-MM-JJ).';
    }
    if ($fields) {
        json_response(['ok' => false, 'error' => 'validation', 'fields' => $fields], 422);
    }

    if ($slug === '') {
        $slug = slugify($titre);
    } else {
        $slug = slugify($slug);
    }
    if ($datePub === '') {
        $datePub = gmdate('Y-m-d');
    }

    try {
        // Assure l'unicité du slug (ajoute un suffixe si collision).
        $base = $slug;
        $i = 1;
        while (true) {
            $chk = db()->prepare('SELECT id FROM actualites WHERE slug = :slug AND id <> :id LIMIT 1');
            $chk->execute([':slug' => $slug, ':id' => $id]);
            if (!$chk->fetch()) {
                break;
            }
            $i++;
            $slug = mb_substr($base, 0, 170) . '-' . $i;
        }

        if ($id > 0) {
            $stmt = db()->prepare(
                'UPDATE actualites
                 SET titre = :titre, slug = :slug, categorie = :categorie,
                     resume = :resume, contenu = :contenu, image = :image,
                     date_pub = :date_pub, statut = :statut
                 WHERE id = :id'
            );
            $stmt->execute([
                ':titre'     => $titre,
                ':slug'      => $slug,
                ':categorie' => $categorie !== '' ? $categorie : null,
                ':resume'    => $resume !== '' ? $resume : null,
                ':contenu'   => $contenu !== '' ? $contenu : null,
                ':image'     => $image !== '' ? $image : null,
                ':date_pub'  => $datePub,
                ':statut'    => $statut,
                ':id'        => $id,
            ]);
            $savedId = $id;
            $auditAction = 'actualite_update';
        } else {
            $stmt = db()->prepare(
                'INSERT INTO actualites (titre, slug, categorie, resume, contenu, image, date_pub, statut)
                 VALUES (:titre, :slug, :categorie, :resume, :contenu, :image, :date_pub, :statut)'
            );
            $stmt->execute([
                ':titre'     => $titre,
                ':slug'      => $slug,
                ':categorie' => $categorie !== '' ? $categorie : null,
                ':resume'    => $resume !== '' ? $resume : null,
                ':contenu'   => $contenu !== '' ? $contenu : null,
                ':image'     => $image !== '' ? $image : null,
                ':date_pub'  => $datePub,
                ':statut'    => $statut,
            ]);
            $savedId = (int) db()->lastInsertId();
            $auditAction = 'actualite_create';
        }
    } catch (Throwable $e) {
        json_response(['ok' => false, 'error' => 'server'], 500);
    }

    audit_log($admin['id'], $auditAction, 'actualite', (string) $savedId);
    json_response(['ok' => true, 'id' => $savedId, 'slug' => $slug, 'message' => 'Actualité enregistrée.']);
}

json_response(['ok' => false, 'error' => 'method'], 405);
