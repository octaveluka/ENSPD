<?php
/**
 * Admin : gestion des soumissions.
 *  GET  ?status=&atelier=&format=&q=  -> liste filtrée
 *  POST {ref|id, status}             -> change le statut (CSRF requis)
 */

declare(strict_types=1);

require_once __DIR__ . '/../../src/cors.php';
require_once __DIR__ . '/../../src/helpers.php';

header('Content-Type: application/json; charset=utf-8');

$admin  = require_admin();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $where  = [];
    $params = [];

    $status = clean_str($_GET['status'] ?? '', 20);
    if (in_array($status, ['pending', 'accepted', 'revision', 'rejected'], true)) {
        $where[] = 'status = :status';
        $params[':status'] = $status;
    }

    $atelier = isset($_GET['atelier']) ? (int) $_GET['atelier'] : 0;
    if ($atelier >= 1 && $atelier <= 3) {
        $where[] = 'atelier = :atelier';
        $params[':atelier'] = $atelier;
    }

    $format = clean_str($_GET['format'] ?? '', 10);
    if (in_array($format, ['oral', 'poster'], true)) {
        $where[] = 'format = :format';
        $params[':format'] = $format;
    }

    $q = clean_str($_GET['q'] ?? '', 100);
    if ($q !== '') {
        $where[] = '(nom LIKE :q OR prenom LIKE :q OR email LIKE :q OR titre LIKE :q OR ref LIKE :q)';
        $params[':q'] = '%' . $q . '%';
    }

    $sql = 'SELECT * FROM submissions';
    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }
    $sql .= ' ORDER BY created_at DESC LIMIT 1000';

    try {
        $stmt = db()->prepare($sql);
        $stmt->execute($params);
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

    $data   = read_json_body();
    $ref    = clean_str($data['ref'] ?? '', 32);
    $id     = (int) ($data['id'] ?? 0);
    $status = clean_str($data['status'] ?? '', 20);

    if (!in_array($status, ['pending', 'accepted', 'revision', 'rejected'], true)) {
        json_response(['ok' => false, 'error' => 'validation', 'fields' => ['status' => 'Statut invalide.']], 422);
    }
    if ($ref === '' && $id <= 0) {
        json_response(['ok' => false, 'error' => 'validation', 'fields' => ['ref' => 'Référence manquante.']], 422);
    }

    try {
        if ($ref !== '') {
            $stmt = db()->prepare('UPDATE submissions SET status = :status WHERE ref = :ref');
            $stmt->execute([':status' => $status, ':ref' => $ref]);
            $target = $ref;
        } else {
            $stmt = db()->prepare('UPDATE submissions SET status = :status WHERE id = :id');
            $stmt->execute([':status' => $status, ':id' => $id]);
            $target = (string) $id;
        }
    } catch (Throwable $e) {
        json_response(['ok' => false, 'error' => 'server'], 500);
    }

    audit_log($admin['id'], 'submission_status:' . $status, 'submission', $target);
    json_response(['ok' => true, 'message' => 'Statut mis à jour.']);
}

json_response(['ok' => false, 'error' => 'method'], 405);
