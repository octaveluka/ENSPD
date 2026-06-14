<?php
/**
 * Endpoint public : événements (lecture seule).
 *  GET                 -> tous les événements (à venir d'abord)
 *  GET ?statut=upcoming -> uniquement les événements à venir
 *  GET ?statut=past     -> uniquement les événements passés
 *
 * Réponse : { ok:true, upcoming:[...], past:[...], items:[...] }
 */

declare(strict_types=1);

require_once __DIR__ . '/../src/cors.php';
require_once __DIR__ . '/../src/helpers.php';

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    json_response(['ok' => false, 'error' => 'method'], 405);
}

$statut = clean_str($_GET['statut'] ?? '', 20);

try {
    if (in_array($statut, ['upcoming', 'past'], true)) {
        $stmt = db()->prepare(
            'SELECT * FROM evenements WHERE statut = :statut
             ORDER BY date_event ASC, id ASC LIMIT 500'
        );
        $stmt->execute([':statut' => $statut]);
        $rows = $stmt->fetchAll();
        json_response(['ok' => true, 'items' => $rows, 'count' => count($rows)]);
    }

    $stmt = db()->query(
        'SELECT * FROM evenements ORDER BY date_event ASC, id ASC LIMIT 500'
    );
    $rows = $stmt->fetchAll();
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'server'], 500);
}

$upcoming = [];
$past = [];
foreach ($rows as $r) {
    if (($r['statut'] ?? '') === 'past') {
        $past[] = $r;
    } else {
        $upcoming[] = $r;
    }
}

json_response([
    'ok'       => true,
    'upcoming' => $upcoming,
    'past'     => $past,
    'items'    => $rows,
    'count'    => count($rows),
]);
