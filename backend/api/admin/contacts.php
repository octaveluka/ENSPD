<?php
/**
 * Admin : gestion des messages de contact.
 *  GET  ?handled=0|1&q=     -> liste filtrée
 *  POST {id, handled}       -> marque traité / non traité (CSRF requis)
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

    if (isset($_GET['handled']) && $_GET['handled'] !== '') {
        $where[] = 'handled = :handled';
        $params[':handled'] = ((int) $_GET['handled']) ? 1 : 0;
    }

    $q = clean_str($_GET['q'] ?? '', 100);
    if ($q !== '') {
        $where[] = '(nom LIKE :q OR email LIKE :q OR sujet LIKE :q)';
        $params[':q'] = '%' . $q . '%';
    }

    $sql = 'SELECT * FROM contacts';
    if ($where) {
        $sql .= ' WHERE ' . implode(' AND ', $where);
    }
    $sql .= ' ORDER BY created_at DESC LIMIT 2000';

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

    $data    = read_json_body();
    $id      = (int) ($data['id'] ?? 0);
    $handled = !empty($data['handled']) ? 1 : 0;

    if ($id <= 0) {
        json_response(['ok' => false, 'error' => 'validation', 'fields' => ['id' => 'Identifiant manquant.']], 422);
    }

    try {
        $stmt = db()->prepare('UPDATE contacts SET handled = :h WHERE id = :id');
        $stmt->execute([':h' => $handled, ':id' => $id]);
    } catch (Throwable $e) {
        json_response(['ok' => false, 'error' => 'server'], 500);
    }

    audit_log($admin['id'], 'contact_handled:' . $handled, 'contact', (string) $id);
    json_response(['ok' => true, 'message' => 'Message mis à jour.']);
}

json_response(['ok' => false, 'error' => 'method'], 405);
