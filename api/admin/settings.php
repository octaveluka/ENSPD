<?php
/**
 * Admin : gestion des paramètres du site (ENSPD).
 *  GET                       -> toutes les clés connues (liste blanche).
 *  POST (CSRF requis) {settings:{k:v, ...}} -> met à jour les clés autorisées.
 *
 * Seules les clés de la liste blanche peuvent être lues/écrites.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../src/cors.php';
require_once __DIR__ . '/../../src/helpers.php';

header('Content-Type: application/json; charset=utf-8');

$admin  = require_admin();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Liste blanche des clés modifiables, avec longueur max.
$allowed = [
    'annonce'         => 500,
    'directeur_nom'   => 160,
    'directeur_texte' => 8000,
    'directeur_photo' => 255,
];

if ($method === 'GET') {
    try {
        $keys = array_keys($allowed);
        $placeholders = implode(',', array_fill(0, count($keys), '?'));
        $stmt = db()->prepare('SELECT k, v FROM settings WHERE k IN (' . $placeholders . ')');
        $stmt->execute($keys);
        $rows = $stmt->fetchAll();
    } catch (Throwable $e) {
        json_response(['ok' => false, 'error' => 'server'], 500);
    }
    $settings = [];
    foreach (array_keys($allowed) as $k) {
        $settings[$k] = '';
    }
    foreach ($rows as $r) {
        $settings[(string) $r['k']] = (string) ($r['v'] ?? '');
    }
    json_response(['ok' => true, 'settings' => $settings]);
}

if ($method === 'POST') {
    if (!csrf_check()) {
        json_response(['ok' => false, 'error' => 'csrf'], 403);
    }

    $data = read_json_body();
    $incoming = $data['settings'] ?? [];
    if (!is_array($incoming)) {
        json_response(['ok' => false, 'error' => 'validation', 'fields' => ['settings' => 'Format invalide.']], 422);
    }

    try {
        $pdo = db();
        $stmt = $pdo->prepare(
            'INSERT INTO settings (k, v) VALUES (:k, :v)
             ON DUPLICATE KEY UPDATE v = VALUES(v)'
        );
        $updated = 0;
        foreach ($incoming as $k => $v) {
            $k = (string) $k;
            if (!isset($allowed[$k])) {
                continue; // clé non autorisée : ignorée silencieusement.
            }
            $value = clean_str($v, $allowed[$k]);
            $stmt->execute([':k' => $k, ':v' => $value]);
            $updated++;
        }
    } catch (Throwable $e) {
        json_response(['ok' => false, 'error' => 'server'], 500);
    }

    audit_log($admin['id'], 'settings_update', 'settings', (string) $updated);
    json_response(['ok' => true, 'updated' => $updated, 'message' => 'Paramètres enregistrés.']);
}

json_response(['ok' => false, 'error' => 'method'], 405);
