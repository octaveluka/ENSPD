<?php
/**
 * Admin : gestion du programme (CRUD des sessions).
 *  GET                                  -> liste complète (jour, ordre)
 *  POST {op:'save', id?, jour, heure_debut, heure_fin, titre, type, salle,
 *        atelier, speaker_id, description, ordre}
 *       -> crée (id absent/0) ou met à jour (id > 0)    [CSRF requis]
 *  POST {op:'delete', id}               -> supprime une session [CSRF]
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

$allowedTypes = ['pleniere', 'conference', 'atelier', 'poster', 'pause', 'hommage', 'autre'];

if ($method === 'GET') {
    try {
        $stmt = db()->prepare(
            'SELECT s.id, s.jour, s.heure_debut, s.heure_fin, s.titre, s.type,
                    s.salle, s.atelier, s.speaker_id, s.description, s.ordre, s.created_at,
                    sp.nom AS speaker_nom
             FROM program_sessions s
             LEFT JOIN speakers sp ON sp.id = s.speaker_id
             ORDER BY s.jour ASC, s.ordre ASC, s.heure_debut ASC LIMIT 2000'
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
            $stmt = db()->prepare('DELETE FROM program_sessions WHERE id = :id');
            $stmt->execute([':id' => $id]);
        } catch (Throwable $e) {
            json_response(['ok' => false, 'error' => 'server'], 500);
        }
        audit_log($admin['id'], 'session_delete', 'program_session', (string) $id);
        json_response(['ok' => true, 'message' => 'Session supprimée.']);
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
            $stmt = $pdo->prepare('UPDATE program_sessions SET ordre = :ordre WHERE id = :id');
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
        audit_log($admin['id'], 'session_reorder', 'program_session', null);
        json_response(['ok' => true, 'message' => 'Ordre mis à jour.']);
    }

    /* ----------------------------- SAVE ----------------------------- */
    if ($op === 'save' || $op === '') {
        $id     = (int) ($data['id'] ?? 0);
        $fields = [];

        // jour : format AAAA-MM-JJ.
        $jour = clean_str($data['jour'] ?? '', 10);
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $jour)) {
            $fields['jour'] = 'Date requise au format AAAA-MM-JJ.';
        }

        $titre = clean_str($data['titre'] ?? '', 255);
        if (!len_between($titre, 2, 255)) {
            $fields['titre'] = 'Titre requis (2 à 255 caractères).';
        }

        $type = clean_str($data['type'] ?? 'autre', 20);
        if (!in_array($type, $allowedTypes, true)) {
            $fields['type'] = 'Type de session invalide.';
        }

        // heures : HH:MM optionnelles.
        $heureDebut = clean_str($data['heure_debut'] ?? '', 10);
        if ($heureDebut !== '' && !preg_match('/^\d{1,2}:\d{2}$/', $heureDebut)) {
            $fields['heure_debut'] = 'Heure de début invalide (HH:MM).';
        }
        $heureFin = clean_str($data['heure_fin'] ?? '', 10);
        if ($heureFin !== '' && !preg_match('/^\d{1,2}:\d{2}$/', $heureFin)) {
            $fields['heure_fin'] = 'Heure de fin invalide (HH:MM).';
        }

        $salle       = clean_str($data['salle'] ?? '', 120);
        $description = clean_str($data['description'] ?? '', 4000);

        // atelier : 1 à 3 ou nul.
        $atelier = null;
        if (isset($data['atelier']) && $data['atelier'] !== '' && $data['atelier'] !== null) {
            $atelier = (int) $data['atelier'];
            if ($atelier < 1 || $atelier > 3) {
                $fields['atelier'] = 'Atelier invalide (1 à 3) ou vide.';
            }
        }

        // speaker_id : optionnel ; validé s'il est fourni (> 0).
        $speakerId = null;
        if (isset($data['speaker_id']) && $data['speaker_id'] !== '' && $data['speaker_id'] !== null) {
            $speakerId = (int) $data['speaker_id'];
            if ($speakerId <= 0) {
                $speakerId = null;
            } else {
                try {
                    $chk = db()->prepare('SELECT 1 FROM speakers WHERE id = :id LIMIT 1');
                    $chk->execute([':id' => $speakerId]);
                    if (!$chk->fetchColumn()) {
                        $fields['speaker_id'] = 'Intervenant introuvable.';
                    }
                } catch (Throwable $e) {
                    json_response(['ok' => false, 'error' => 'server'], 500);
                }
            }
        }

        $ordre = (int) ($data['ordre'] ?? 0);

        if (!empty($fields)) {
            json_response(['ok' => false, 'error' => 'validation', 'fields' => $fields], 422);
        }

        $bind = [
            ':jour'        => $jour,
            ':heure_debut' => $heureDebut !== '' ? $heureDebut : null,
            ':heure_fin'   => $heureFin !== '' ? $heureFin : null,
            ':titre'       => $titre,
            ':type'        => $type,
            ':salle'       => $salle !== '' ? $salle : null,
            ':atelier'     => $atelier,
            ':speaker_id'  => $speakerId,
            ':description' => $description !== '' ? $description : null,
            ':ordre'       => $ordre,
        ];

        try {
            if ($id > 0) {
                $bind[':id'] = $id;
                $stmt = db()->prepare(
                    'UPDATE program_sessions SET jour = :jour, heure_debut = :heure_debut,
                        heure_fin = :heure_fin, titre = :titre, type = :type, salle = :salle,
                        atelier = :atelier, speaker_id = :speaker_id, description = :description,
                        ordre = :ordre
                     WHERE id = :id'
                );
                $stmt->execute($bind);
                $target = (string) $id;
                $action = 'session_update';
            } else {
                $stmt = db()->prepare(
                    'INSERT INTO program_sessions
                        (jour, heure_debut, heure_fin, titre, type, salle, atelier,
                         speaker_id, description, ordre)
                     VALUES
                        (:jour, :heure_debut, :heure_fin, :titre, :type, :salle, :atelier,
                         :speaker_id, :description, :ordre)'
                );
                $stmt->execute($bind);
                $id = (int) db()->lastInsertId();
                $target = (string) $id;
                $action = 'session_create';
            }
        } catch (Throwable $e) {
            json_response(['ok' => false, 'error' => 'server'], 500);
        }

        audit_log($admin['id'], $action, 'program_session', $target);
        json_response(['ok' => true, 'id' => $id, 'message' => 'Session enregistrée.']);
    }

    json_response(['ok' => false, 'error' => 'validation', 'fields' => ['op' => 'Opération inconnue.']], 422);
}

json_response(['ok' => false, 'error' => 'method'], 405);
