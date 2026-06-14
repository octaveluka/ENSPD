<?php
/**
 * Endpoint public : galerie photo (lecture seule).
 *  GET -> photos groupées par catégorie.
 *
 * Réponse :
 *   { ok:true,
 *     groups: { "Categorie A":[ {...} ], "Categorie B":[ {...} ] },
 *     items: [ {...} ] }
 */

declare(strict_types=1);

require_once __DIR__ . '/../src/cors.php';
require_once __DIR__ . '/../src/helpers.php';

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    json_response(['ok' => false, 'error' => 'method'], 405);
}

try {
    $stmt = db()->query(
        'SELECT id, categorie, src, titre, contexte, position, created_at
         FROM galerie
         ORDER BY categorie ASC, position ASC, id ASC
         LIMIT 1000'
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

json_response([
    'ok'     => true,
    'groups' => $groups,
    'items'  => $rows,
    'count'  => count($rows),
]);
