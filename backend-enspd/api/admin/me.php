<?php
/**
 * Admin : retourne l'administrateur courant (ou 401 si non connecté).
 * GET.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../src/cors.php';
require_once __DIR__ . '/../../src/helpers.php';

header('Content-Type: application/json; charset=utf-8');

$admin = require_admin();

json_response([
    'ok'   => true,
    'csrf' => csrf_token(),
    'user' => $admin,
]);
