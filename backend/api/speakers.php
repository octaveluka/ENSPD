<?php
/**
 * Endpoint public : liste des intervenants (lecture seule).
 * Méthode : GET
 *
 * Paramètre optionnel :
 *   ?type=keynote|invited|panel  -> filtre par type d'intervenant
 *
 * Contrat de réponse :
 *   200 {"ok":true,"items":[ {id,nom,titre,affiliation,pays,bio,photo,type,ordre}, ... ],"count":N}
 *
 * Tri : ordre croissant puis nom. Aucune donnée sensible n'est exposée.
 */

declare(strict_types=1);

require_once __DIR__ . '/../src/cors.php';
require_once __DIR__ . '/../src/helpers.php';

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    json_response(['ok' => false, 'error' => 'method'], 405);
}

// Types autorisés (liste blanche — PHP 8.0 compatible, pas d'enum natif).
$allowedTypes = ['keynote', 'invited', 'panel'];

$where  = [];
$params = [];

$type = clean_str($_GET['type'] ?? '', 20);
if (in_array($type, $allowedTypes, true)) {
    $where[] = 'type = :type';
    $params[':type'] = $type;
}

$sql = 'SELECT id, nom, titre, affiliation, pays, bio, photo, type, ordre
        FROM speakers';
if ($where) {
    $sql .= ' WHERE ' . implode(' AND ', $where);
}
$sql .= ' ORDER BY ordre ASC, nom ASC LIMIT 500';

try {
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'server', 'message' => 'Erreur serveur.'], 500);
}

// Normalisation des types numériques pour le frontend.
foreach ($rows as &$r) {
    $r['id']    = (int) $r['id'];
    $r['ordre'] = (int) $r['ordre'];
}
unset($r);

json_response(['ok' => true, 'items' => $rows, 'count' => count($rows)]);
