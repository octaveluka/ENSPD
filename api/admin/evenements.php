<?php
/**
 * Admin : gestion des événements (ENSPD).
 *
 *  GET                  -> liste de tous les événements.
 *  GET ?id=12           -> un événement.
 *
 *  POST (CSRF requis), champ "op" :
 *   - op="save"   {id?, titre, type?, date_event?, heure?, lieu?, description?,
 *                  image?, statut}  -> crée (si id absent) ou met à jour.
 *   - op="delete" {id}              -> supprime.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../src/cors.php';
require_once __DIR__ . '/../../src/helpers.php';

header('Content-Type: application/json; charset=utf-8');

$admin  = require_admin();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    try {
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        if ($id > 0) {
            $stmt = db()->prepare('SELECT * FROM evenements WHERE id = :id LIMIT 1');
            $stmt->execute([':id' => $id]);
            $row = $stmt->fetch();
            if (!$row) {
                json_response(['ok' => false, 'error' => 'not_found'], 404);
            }
            json_response(['ok' => true, 'item' => $row]);
        }
        $stmt = db()->query('SELECT * FROM evenements ORDER BY date_event DESC, id DESC LIMIT 1000');
        $rows = $stmt->fetchAll();
    } catch (Throwable $e) {
        json_response(['ok' => false, 'error' => 'server'], 500);
    }
    json_response(['ok' => true, 'items' => $rows, 'count' => count($rows)]);
}

if ($method === 'POST') {
    if (!csrf_check()) {
        json_response(['ok' => false, 'error' => 'csrf'], 403);
    }

    $data = read_json_body();
    $op   = clean_str($data['op'] ?? 'save', 20);

    if ($op === 'delete') {
        $id = (int) ($data['id'] ?? 0);
        if ($id <= 0) {
            json_response(['ok' => false, 'error' => 'validation', 'fields' => ['id' => 'Identifiant manquant.']], 422);
        }
        try {
            $stmt = db()->prepare('DELETE FROM evenements WHERE id = :id');
            $stmt->execute([':id' => $id]);
        } catch (Throwable $e) {
            json_response(['ok' => false, 'error' => 'server'], 500);
        }
        audit_log($admin['id'], 'evenement_delete', 'evenement', (string) $id);
        json_response(['ok' => true, 'message' => 'Événement supprimé.']);
    }

    // op = save
    $id          = (int) ($data['id'] ?? 0);
    $titre       = clean_str($data['titre'] ?? '', 255);
    $type        = clean_str($data['type'] ?? '', 80);
    $dateEvent   = clean_str($data['date_event'] ?? '', 10);
    $heure       = clean_str($data['heure'] ?? '', 40);
    $lieu        = clean_str($data['lieu'] ?? '', 160);
    $description = clean_str($data['description'] ?? '', 4000);
    $image       = clean_str($data['image'] ?? '', 255);
    $statut      = clean_str($data['statut'] ?? 'upcoming', 20);

    $fields = [];
    if (!len_between($titre, 2, 255)) {
        $fields['titre'] = 'Titre requis (2 à 255 caractères).';
    }
    if (!in_array($statut, ['upcoming', 'past'], true)) {
        $fields['statut'] = 'Statut invalide.';
    }
    if ($dateEvent !== '' && !valid_date($dateEvent)) {
        $fields['date_event'] = 'Date invalide (format AAAA-MM-JJ).';
    }
    if ($fields) {
        json_response(['ok' => false, 'error' => 'validation', 'fields' => $fields], 422);
    }

    try {
        if ($id > 0) {
            $stmt = db()->prepare(
                'UPDATE evenements
                 SET titre = :titre, type = :type, date_event = :date_event,
                     heure = :heure, lieu = :lieu, description = :description,
                     image = :image, statut = :statut
                 WHERE id = :id'
            );
            $params = [':id' => $id];
        } else {
            $stmt = db()->prepare(
                'INSERT INTO evenements (titre, type, date_event, heure, lieu, description, image, statut)
                 VALUES (:titre, :type, :date_event, :heure, :lieu, :description, :image, :statut)'
            );
            $params = [];
        }
        $params += [
            ':titre'       => $titre,
            ':type'        => $type !== '' ? $type : null,
            ':date_event'  => $dateEvent !== '' ? $dateEvent : null,
            ':heure'       => $heure !== '' ? $heure : null,
            ':lieu'        => $lieu !== '' ? $lieu : null,
            ':description' => $description !== '' ? $description : null,
            ':image'       => $image !== '' ? $image : null,
            ':statut'      => $statut,
        ];
        $stmt->execute($params);
        $savedId = $id > 0 ? $id : (int) db()->lastInsertId();
    } catch (Throwable $e) {
        json_response(['ok' => false, 'error' => 'server'], 500);
    }

    audit_log($admin['id'], $id > 0 ? 'evenement_update' : 'evenement_create', 'evenement', (string) $savedId);
    json_response(['ok' => true, 'id' => $savedId, 'message' => 'Événement enregistré.']);
}

json_response(['ok' => false, 'error' => 'method'], 405);
