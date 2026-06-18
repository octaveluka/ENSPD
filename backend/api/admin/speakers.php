<?php
/**
 * Admin : gestion des intervenants (CRUD).
 *  GET                                  -> liste complète (tri ordre, nom)
 *  POST {op:'save', id?, nom, titre, affiliation, pays, bio, photo, type, ordre}
 *       -> crée (id absent/0) ou met à jour (id > 0)    [CSRF requis]
 *  POST {op:'delete', id}               -> supprime un intervenant [CSRF]
 *  POST {op:'reorder', order:[id1,id2,...]} -> réordonne (ordre = index) [CSRF]
 *
 * Contrat de réponse identique au reste du backend :
 *   200 ok / 422 validation+fields / 401 auth / 403 csrf / 405 method.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../src/cors.php';
require_once __DIR__ . '/../../src/helpers.php';

header('Content-Type: application/json; charset=utf-8');

$admin  = require_admin();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

$allowedTypes = ['keynote', 'invited', 'panel'];

if ($method === 'GET') {
    try {
        $stmt = db()->prepare(
            'SELECT id, nom, titre, affiliation, pays, bio, photo, type, ordre, created_at, updated_at
             FROM speakers ORDER BY ordre ASC, nom ASC LIMIT 1000'
        );
        $stmt->execute();
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
    $op   = clean_str($data['op'] ?? '', 20);

    /* ---------------------------- DELETE ---------------------------- */
    if ($op === 'delete') {
        $id = (int) ($data['id'] ?? 0);
        if ($id <= 0) {
            json_response(['ok' => false, 'error' => 'validation', 'fields' => ['id' => 'Identifiant manquant.']], 422);
        }
        try {
            $stmt = db()->prepare('DELETE FROM speakers WHERE id = :id');
            $stmt->execute([':id' => $id]);
            // Intégrité molle : on délie les sessions qui pointaient sur lui.
            $upd = db()->prepare('UPDATE program_sessions SET speaker_id = NULL WHERE speaker_id = :id');
            $upd->execute([':id' => $id]);
        } catch (Throwable $e) {
            json_response(['ok' => false, 'error' => 'server'], 500);
        }
        audit_log($admin['id'], 'speaker_delete', 'speaker', (string) $id);
        json_response(['ok' => true, 'message' => 'Intervenant supprimé.']);
    }

    /* --------------------------- REORDER ---------------------------- */
    if ($op === 'reorder') {
        $order = $data['order'] ?? null;
        if (!is_array($order)) {
            json_response(['ok' => false, 'error' => 'validation', 'fields' => ['order' => 'Liste d\'identifiants requise.']], 422);
        }
        try {
            $pdo = db();
            $pdo->beginTransaction();
            $stmt = $pdo->prepare('UPDATE speakers SET ordre = :ordre WHERE id = :id');
            $i = 0;
            foreach ($order as $id) {
                $id = (int) $id;
                if ($id <= 0) {
                    continue;
                }
                $stmt->execute([':ordre' => $i, ':id' => $id]);
                $i++;
            }
            $pdo->commit();
        } catch (Throwable $e) {
            if (isset($pdo) && $pdo->inTransaction()) {
                $pdo->rollBack();
            }
            json_response(['ok' => false, 'error' => 'server'], 500);
        }
        audit_log($admin['id'], 'speaker_reorder', 'speaker', null);
        json_response(['ok' => true, 'message' => 'Ordre mis à jour.']);
    }

    /* ----------------------------- SAVE ----------------------------- */
    if ($op === 'save' || $op === '') {
        $id          = (int) ($data['id'] ?? 0);
        $fields      = [];

        $nom = clean_str($data['nom'] ?? '', 160);
        if (!len_between($nom, 2, 160)) {
            $fields['nom'] = 'Nom requis (2 à 160 caractères).';
        }

        $titre       = clean_str($data['titre'] ?? '', 160);
        $affiliation = clean_str($data['affiliation'] ?? '', 200);
        $pays        = clean_str($data['pays'] ?? '', 80);
        $bio         = clean_str($data['bio'] ?? '', 4000);
        $photo       = clean_str($data['photo'] ?? '', 255);

        $type = clean_str($data['type'] ?? 'invited', 20);
        if (!in_array($type, $allowedTypes, true)) {
            $fields['type'] = 'Type invalide (keynote, invited ou panel).';
        }

        $ordre = (int) ($data['ordre'] ?? 0);

        if (!empty($fields)) {
            json_response(['ok' => false, 'error' => 'validation', 'fields' => $fields], 422);
        }

        try {
            if ($id > 0) {
                $stmt = db()->prepare(
                    'UPDATE speakers SET nom = :nom, titre = :titre, affiliation = :affiliation,
                        pays = :pays, bio = :bio, photo = :photo, type = :type, ordre = :ordre
                     WHERE id = :id'
                );
                $stmt->execute([
                    ':nom' => $nom, ':titre' => $titre !== '' ? $titre : null,
                    ':affiliation' => $affiliation !== '' ? $affiliation : null,
                    ':pays' => $pays !== '' ? $pays : null,
                    ':bio' => $bio !== '' ? $bio : null,
                    ':photo' => $photo !== '' ? $photo : null,
                    ':type' => $type, ':ordre' => $ordre, ':id' => $id,
                ]);
                $target = (string) $id;
                $action = 'speaker_update';
            } else {
                $stmt = db()->prepare(
                    'INSERT INTO speakers (nom, titre, affiliation, pays, bio, photo, type, ordre)
                     VALUES (:nom, :titre, :affiliation, :pays, :bio, :photo, :type, :ordre)'
                );
                $stmt->execute([
                    ':nom' => $nom, ':titre' => $titre !== '' ? $titre : null,
                    ':affiliation' => $affiliation !== '' ? $affiliation : null,
                    ':pays' => $pays !== '' ? $pays : null,
                    ':bio' => $bio !== '' ? $bio : null,
                    ':photo' => $photo !== '' ? $photo : null,
                    ':type' => $type, ':ordre' => $ordre,
                ]);
                $id = (int) db()->lastInsertId();
                $target = (string) $id;
                $action = 'speaker_create';
            }
        } catch (Throwable $e) {
            json_response(['ok' => false, 'error' => 'server'], 500);
        }

        audit_log($admin['id'], $action, 'speaker', $target);
        json_response(['ok' => true, 'id' => $id, 'message' => 'Intervenant enregistré.']);
    }

    json_response(['ok' => false, 'error' => 'validation', 'fields' => ['op' => 'Opération inconnue.']], 422);
}

json_response(['ok' => false, 'error' => 'method'], 405);
