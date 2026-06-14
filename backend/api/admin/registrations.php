<?php
/**
 * Admin : gestion des inscriptions.
 *  GET  ?type=&payment=&q=          -> liste filtrée
 *  POST {ref|id, payment_status}    -> change le statut de paiement (CSRF)
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

    $type = clean_str($_GET['type'] ?? '', 20);
    if (in_array($type, ['etudiant', 'chercheur', 'exposant'], true)) {
        $where[] = 'type = :type';
        $params[':type'] = $type;
    }

    $payment = clean_str($_GET['payment'] ?? '', 20);
    if (in_array($payment, ['unpaid', 'pending', 'paid'], true)) {
        $where[] = 'payment_status = :payment';
        $params[':payment'] = $payment;
    }

    $q = clean_str($_GET['q'] ?? '', 100);
    if ($q !== '') {
        $where[] = '(nom LIKE :q OR prenom LIKE :q OR email LIKE :q OR ref LIKE :q)';
        $params[':q'] = '%' . $q . '%';
    }

    $sql = 'SELECT * FROM registrations';
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
    $ref     = clean_str($data['ref'] ?? '', 32);
    $id      = (int) ($data['id'] ?? 0);
    $payment = clean_str($data['payment_status'] ?? '', 20);

    if (!in_array($payment, ['unpaid', 'pending', 'paid'], true)) {
        json_response(['ok' => false, 'error' => 'validation', 'fields' => ['payment_status' => 'Statut invalide.']], 422);
    }
    if ($ref === '' && $id <= 0) {
        json_response(['ok' => false, 'error' => 'validation', 'fields' => ['ref' => 'Référence manquante.']], 422);
    }

    try {
        if ($ref !== '') {
            $stmt = db()->prepare('UPDATE registrations SET payment_status = :p WHERE ref = :ref');
            $stmt->execute([':p' => $payment, ':ref' => $ref]);
            $target = $ref;
        } else {
            $stmt = db()->prepare('UPDATE registrations SET payment_status = :p WHERE id = :id');
            $stmt->execute([':p' => $payment, ':id' => $id]);
            $target = (string) $id;
        }
    } catch (Throwable $e) {
        json_response(['ok' => false, 'error' => 'server'], 500);
    }

    audit_log($admin['id'], 'registration_payment:' . $payment, 'registration', $target);
    json_response(['ok' => true, 'message' => 'Statut de paiement mis à jour.']);
}

json_response(['ok' => false, 'error' => 'method'], 405);
