<?php
/**
 * Endpoint public : paramètres publics du site (lecture seule).
 *  GET -> { ok:true, settings:{ annonce, directeur_nom, directeur_texte, directeur_photo } }
 *
 * Seules les clés explicitement publiques sont exposées (liste blanche).
 */

declare(strict_types=1);

require_once __DIR__ . '/../src/cors.php';
require_once __DIR__ . '/../src/helpers.php';

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET') {
    json_response(['ok' => false, 'error' => 'method'], 405);
}

// Liste blanche des clés publiques exposables au frontend.
$publicKeys = ['annonce', 'directeur_nom', 'directeur_texte', 'directeur_photo'];

try {
    $placeholders = implode(',', array_fill(0, count($publicKeys), '?'));
    $stmt = db()->prepare(
        'SELECT k, v FROM settings WHERE k IN (' . $placeholders . ')'
    );
    $stmt->execute($publicKeys);
    $rows = $stmt->fetchAll();
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'server'], 500);
}

$settings = [];
foreach ($publicKeys as $k) {
    $settings[$k] = '';
}
foreach ($rows as $r) {
    $settings[(string) $r['k']] = (string) ($r['v'] ?? '');
}

json_response(['ok' => true, 'settings' => $settings]);
