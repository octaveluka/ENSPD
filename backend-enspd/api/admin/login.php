<?php
/**
 * Admin : connexion (ENSPD).
 * POST {email, password} -> ouvre une session admin.
 * Limité en débit (anti force brute) : 5 tentatives / 15 min / IP.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../src/cors.php';
require_once __DIR__ . '/../../src/helpers.php';

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    json_response(['ok' => false, 'error' => 'method'], 405);
}

$ip   = client_ip();
$data = read_json_body();

if (!rate_limit_check($ip, 'login', 5, 900)) {
    json_response([
        'ok' => false, 'error' => 'rate_limit',
        'message' => 'Trop de tentatives, réessayez plus tard.',
    ], 429);
}

$email = clean_str($data['email'] ?? '', 190);
$password = is_string($data['password'] ?? null) ? (string) $data['password'] : '';

if (!valid_email($email) || $password === '') {
    json_response(['ok' => false, 'error' => 'invalid_credentials', 'message' => 'Identifiants invalides.'], 401);
}

try {
    $stmt = db()->prepare('SELECT * FROM admins WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $admin = $stmt->fetch();
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'server'], 500);
}

// Vérification du mot de passe (temps constant via password_verify).
if (!$admin || !password_verify($password, (string) $admin['password_hash'])) {
    json_response(['ok' => false, 'error' => 'invalid_credentials', 'message' => 'Identifiants invalides.'], 401);
}

// Réhachage si l'algorithme par défaut a évolué.
if (password_needs_rehash((string) $admin['password_hash'], PASSWORD_DEFAULT)) {
    try {
        $up = db()->prepare('UPDATE admins SET password_hash = :h WHERE id = :id');
        $up->execute([':h' => password_hash($password, PASSWORD_DEFAULT), ':id' => $admin['id']]);
    } catch (Throwable $e) {
        // non bloquant
    }
}

// Régénération de l'ID de session après authentification réussie.
start_admin_session();
session_regenerate_id(true);

$_SESSION['admin_id']      = (int) $admin['id'];
$_SESSION['admin_email']   = (string) $admin['email'];
$_SESSION['admin_name']    = (string) $admin['name'];
$_SESSION['admin_role']    = (string) $admin['role'];
$_SESSION['last_activity'] = time();
unset($_SESSION['csrf']); // nouveau jeton CSRF pour la nouvelle session

try {
    $up = db()->prepare('UPDATE admins SET last_login = NOW() WHERE id = :id');
    $up->execute([':id' => $admin['id']]);
} catch (Throwable $e) {
}

audit_log((int) $admin['id'], 'login');

json_response([
    'ok'   => true,
    'csrf' => csrf_token(),
    'user' => [
        'id'    => (int) $admin['id'],
        'email' => (string) $admin['email'],
        'name'  => (string) $admin['name'],
        'role'  => (string) $admin['role'],
    ],
]);
