<?php
/**
 * Endpoint public : programme de l'événement (lecture seule).
 * Méthode : GET
 *
 * Renvoie les sessions groupées par jour. Chaque session est jointe au
 * nom de l'intervenant (LEFT JOIN) lorsque speaker_id est renseigné.
 *
 * Contrat de réponse :
 *   200 {
 *     "ok": true,
 *     "days": [
 *       { "jour": "2026-09-15",
 *         "sessions": [ {id,jour,heure_debut,heure_fin,titre,type,salle,
 *                        atelier,speaker_id,speaker_nom,description,ordre}, ... ] },
 *       ...
 *     ],
 *     "count": N
 *   }
 *
 * Le tri global est (jour ASC, ordre ASC, heure_debut ASC).
 */

declare(strict_types=1);

require_once __DIR__ . '/../src/cors.php';
require_once __DIR__ . '/../src/helpers.php';

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    json_response(['ok' => false, 'error' => 'method'], 405);
}

$sql = 'SELECT s.id, s.jour, s.heure_debut, s.heure_fin, s.titre, s.type,
               s.salle, s.atelier, s.speaker_id, s.description, s.ordre,
               sp.nom AS speaker_nom
        FROM program_sessions s
        LEFT JOIN speakers sp ON sp.id = s.speaker_id
        ORDER BY s.jour ASC, s.ordre ASC, s.heure_debut ASC
        LIMIT 1000';

try {
    $stmt = db()->prepare($sql);
    $stmt->execute();
    $rows = $stmt->fetchAll();
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'server', 'message' => 'Erreur serveur.'], 500);
}

// Regroupement par jour en préservant l'ordre d'apparition.
$daysIndex = [];
$days      = [];
foreach ($rows as $r) {
    $session = [
        'id'          => (int) $r['id'],
        'jour'        => (string) $r['jour'],
        'heure_debut' => $r['heure_debut'] !== null ? (string) $r['heure_debut'] : null,
        'heure_fin'   => $r['heure_fin'] !== null ? (string) $r['heure_fin'] : null,
        'titre'       => (string) $r['titre'],
        'type'        => (string) $r['type'],
        'salle'       => $r['salle'] !== null ? (string) $r['salle'] : null,
        'atelier'     => $r['atelier'] !== null ? (int) $r['atelier'] : null,
        'speaker_id'  => $r['speaker_id'] !== null ? (int) $r['speaker_id'] : null,
        'speaker_nom' => $r['speaker_nom'] !== null ? (string) $r['speaker_nom'] : null,
        'description' => $r['description'] !== null ? (string) $r['description'] : null,
        'ordre'       => (int) $r['ordre'],
    ];

    $jour = (string) $r['jour'];
    if (!isset($daysIndex[$jour])) {
        $daysIndex[$jour] = count($days);
        $days[] = ['jour' => $jour, 'sessions' => []];
    }
    $days[$daysIndex[$jour]]['sessions'][] = $session;
}

json_response(['ok' => true, 'days' => $days, 'count' => count($rows)]);
