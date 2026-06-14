<?php
/**
 * Admin : gestion de la galerie photo (ENSPD).
 *
 *  GET                  -> liste de toutes les photos (groupées + brutes).
 *
 *  POST (CSRF requis), champ "op" :
 *   - op="add"     {categorie?, src, titre?, contexte?, position?} -> ajoute.
 *   - op="update"  {id, categorie?, titre?, contexte?, position?}  -> met à jour les métadonnées.
 *   - op="delete"  {id}                                            -> supprime.
 *   - op="reorder" {order:[id1, id2, ...]}                         -> réordonne (position = index).
 */

declare(strict_types=1);

require_once __DIR__ . '/../../src/cors.php';
require_once __DIR__ . '/../../src/helpers.php';

header('Content-Type: application/json; charset=utf-8');

$admin  = require_admin();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    try {
        $stmt = db()->query(
            'SELECT id, categorie, src, titre, contexte, position, created_at
             FROM galerie
             ORDER BY categorie ASC, position ASC, id ASC LIMIT 2000'
        );
        $rows = $stmt->fetchAll();
    } catch (Throwable $e) {
        json_response(['ok' => false, 'error' => 'server'], 500);
    }
    $groups = [];
    foreach ($rows as $r) {
        $cat = ($r['categorie'] ?? '') !== '' ? (string) $r['categorie'] : 'Autres';
        $groups[$cat][] = $r;
    }
    json_response(['ok' => true, 'items' => $rows, 'groups' => $groups, 'count' => count($rows)]);
}

if ($method === 'POST') {
    if (!csrf_check()) {
        json_response(['ok' => false, 'error' => 'csrf'], 403);
    }

    $data = read_json_body();
    $op   = clean_str($data['op'] ?? '', 20);

    if ($op === 'add') {
        $categorie = clean_str($data['categorie'] ?? '', 80);
        $src       = clean_str($data['src'] ?? '', 255);
        $titre     = clean_str($data['titre'] ?? '', 160);
        $contexte  = clean_str($data['contexte'] ?? '', 255);
        $position  = (int) ($data['position'] ?? 0);

        if (!len_between($src, 1, 255)) {
            json_response(['ok' => false, 'error' => 'validation', 'fields' => ['src' => 'Source de l\'image requise.']], 422);
        }
        try {
            $stmt = db()->prepare(
                'INSERT INTO galerie (categorie, src, titre, contexte, position)
                 VALUES (:categorie, :src, :titre, :contexte, :position)'
            );
            $stmt->execute([
                ':categorie' => $categorie !== '' ? $categorie : null,
                ':src'       => $src,
                ':titre'     => $titre !== '' ? $titre : null,
                ':contexte'  => $contexte !== '' ? $contexte : null,
                ':position'  => $position,
            ]);
            $newId = (int) db()->lastInsertId();
        } catch (Throwable $e) {
            json_response(['ok' => false, 'error' => 'server'], 500);
        }
        audit_log($admin['id'], 'galerie_add', 'galerie', (string) $newId);
        json_response(['ok' => true, 'id' => $newId, 'message' => 'Photo ajoutée.']);
    }

    if ($op === 'update') {
        $id        = (int) ($data['id'] ?? 0);
        $categorie = clean_str($data['categorie'] ?? '', 80);
        $titre     = clean_str($data['titre'] ?? '', 160);
        $contexte  = clean_str($data['contexte'] ?? '', 255);
        $position  = (int) ($data['position'] ?? 0);
        if ($id <= 0) {
            json_response(['ok' => false, 'error' => 'validation', 'fields' => ['id' => 'Identifiant manquant.']], 422);
        }
        try {
            $stmt = db()->prepare(
                'UPDATE galerie
                 SET categorie = :categorie, titre = :titre, contexte = :contexte, position = :position
                 WHERE id = :id'
            );
            $stmt->execute([
                ':categorie' => $categorie !== '' ? $categorie : null,
                ':titre'     => $titre !== '' ? $titre : null,
                ':contexte'  => $contexte !== '' ? $contexte : null,
                ':position'  => $position,
                ':id'        => $id,
            ]);
        } catch (Throwable $e) {
            json_response(['ok' => false, 'error' => 'server'], 500);
        }
        audit_log($admin['id'], 'galerie_update', 'galerie', (string) $id);
        json_response(['ok' => true, 'message' => 'Photo mise à jour.']);
    }

    if ($op === 'delete') {
        $id = (int) ($data['id'] ?? 0);
        if ($id <= 0) {
            json_response(['ok' => false, 'error' => 'validation', 'fields' => ['id' => 'Identifiant manquant.']], 422);
        }
        try {
            $stmt = db()->prepare('DELETE FROM galerie WHERE id = :id');
            $stmt->execute([':id' => $id]);
        } catch (Throwable $e) {
            json_response(['ok' => false, 'error' => 'server'], 500);
        }
        audit_log($admin['id'], 'galerie_delete', 'galerie', (string) $id);
        json_response(['ok' => true, 'message' => 'Photo supprimée.']);
    }

    if ($op === 'reorder') {
        $order = $data['order'] ?? [];
        if (!is_array($order) || empty($order)) {
            json_response(['ok' => false, 'error' => 'validation', 'fields' => ['order' => 'Liste d\'ordre manquante.']], 422);
        }
        try {
            $pdo = db();
            $pdo->beginTransaction();
            $stmt = $pdo->prepare('UPDATE galerie SET position = :pos WHERE id = :id');
            $pos = 0;
            foreach ($order as $gid) {
                $gid = (int) $gid;
                if ($gid <= 0) {
                    continue;
                }
                $stmt->execute([':pos' => $pos, ':id' => $gid]);
                $pos++;
            }
            $pdo->commit();
        } catch (Throwable $e) {
            if (db()->inTransaction()) {
                db()->rollBack();
            }
            json_response(['ok' => false, 'error' => 'server'], 500);
        }
        audit_log($admin['id'], 'galerie_reorder', 'galerie', null);
        json_response(['ok' => true, 'message' => 'Ordre mis à jour.']);
    }

    json_response(['ok' => false, 'error' => 'validation', 'fields' => ['op' => 'Opération inconnue.']], 422);
}

json_response(['ok' => false, 'error' => 'method'], 405);
