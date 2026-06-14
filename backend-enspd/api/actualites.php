<?php
/**
 * Endpoint public : actualités publiées (lecture seule).
 *  GET            -> liste des actualités publiées (avec leurs images)
 *  GET ?id=12     -> une actualité publiée par identifiant
 *  GET ?slug=...  -> une actualité publiée par slug
 *
 * Réponse : { ok:true, items:[ ... ] }  ou  { ok:true, item:{ ... } }
 */

declare(strict_types=1);

require_once __DIR__ . '/../src/cors.php';
require_once __DIR__ . '/../src/helpers.php';

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    json_response(['ok' => false, 'error' => 'method'], 405);
}

/**
 * Charge les images d'une liste d'identifiants d'actualités.
 * Retourne un tableau indexé par actualite_id.
 */
function load_actualite_images(array $ids): array
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
        $aid = (int) $img['actualite_id'];
        $byId[$aid][] = [
            'id'       => (int) $img['id'],
            'url'      => (string) $img['url'],
            'legende'  => (string) ($img['legende'] ?? ''),
            'position' => (int) $img['position'],
        ];
    }
    return $byId;
}

try {
    $id   = isset($_GET['id']) ? (int) $_GET['id'] : 0;
    $slug = clean_str($_GET['slug'] ?? '', 200);

    if ($id > 0 || $slug !== '') {
        // Une seule actualité.
        if ($id > 0) {
            $stmt = db()->prepare(
                "SELECT * FROM actualites WHERE id = :id AND statut = 'published' LIMIT 1"
            );
            $stmt->execute([':id' => $id]);
        } else {
            $stmt = db()->prepare(
                "SELECT * FROM actualites WHERE slug = :slug AND statut = 'published' LIMIT 1"
            );
            $stmt->execute([':slug' => $slug]);
        }
        $row = $stmt->fetch();
        if (!$row) {
            json_response(['ok' => false, 'error' => 'not_found'], 404);
        }
        $images = load_actualite_images([(int) $row['id']]);
        $row['images'] = $images[(int) $row['id']] ?? [];
        json_response(['ok' => true, 'item' => $row]);
    }

    // Liste de toutes les actualités publiées.
    $stmt = db()->query(
        "SELECT * FROM actualites
         WHERE statut = 'published'
         ORDER BY date_pub DESC, id DESC
         LIMIT 500"
    );
    $rows = $stmt->fetchAll();

    $ids = array_map(static fn($r) => (int) $r['id'], $rows);
    $images = load_actualite_images($ids);
    foreach ($rows as &$r) {
        $r['images'] = $images[(int) $r['id']] ?? [];
    }
    unset($r);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'server'], 500);
}

json_response(['ok' => true, 'items' => $rows, 'count' => count($rows)]);
