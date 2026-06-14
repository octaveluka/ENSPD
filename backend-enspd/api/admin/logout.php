<?php
/**
 * Admin : déconnexion (ENSPD).
 */

declare(strict_types=1);

require_once __DIR__ . '/../../src/cors.php';
require_once __DIR__ . '/../../src/helpers.php';

header('Content-Type: application/json; charset=utf-8');

start_admin_session();
$adminId = isset($_SESSION['admin_id']) ? (int) $_SESSION['admin_id'] : null;

admin_logout();

if ($adminId) {
    audit_log($adminId, 'logout');
}

json_response(['ok' => true]);
