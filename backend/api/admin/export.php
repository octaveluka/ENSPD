<?php
/**
 * Admin : export CSV.
 *  GET ?type=submissions   -> CSV des soumissions
 *  GET ?type=registrations -> CSV des inscriptions
 *  GET ?type=contacts      -> CSV des messages de contact
 *
 * Authentification requise. Le CSV est encodé UTF-8 avec BOM pour une
 * ouverture correcte dans Excel.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../src/cors.php';
require_once __DIR__ . '/../../src/helpers.php';

$admin = require_admin();

$type = clean_str($_GET['type'] ?? '', 20);

$config = [
    'submissions' => [
        'sql'     => 'SELECT ref, format, atelier, langue, prenom, nom, email, tel, statut, institution, pays, titre, keywords, financement, status, consent, created_at FROM submissions ORDER BY created_at DESC',
        'headers' => ['Référence', 'Format', 'Atelier', 'Langue', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Statut auteur', 'Institution', 'Pays', 'Titre', 'Mots-clés', 'Financement', 'Décision', 'Consentement', 'Créé le'],
    ],
    'registrations' => [
        'sql'     => 'SELECT ref, type, prenom, nom, email, tel, institution, pays, statut, payment_status, consent, created_at FROM registrations ORDER BY created_at DESC',
        'headers' => ['Référence', 'Type', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Institution', 'Pays', 'Statut', 'Paiement', 'Consentement', 'Créé le'],
    ],
    'contacts' => [
        'sql'     => 'SELECT id, nom, email, sujet, message, consent, handled, created_at FROM contacts ORDER BY created_at DESC',
        'headers' => ['ID', 'Nom', 'Email', 'Sujet', 'Message', 'Consentement', 'Traité', 'Créé le'],
    ],
];

if (!isset($config[$type])) {
    json_response(['ok' => false, 'error' => 'validation', 'message' => 'Type d\'export inconnu.'], 422);
}

try {
    $stmt = db()->query($config[$type]['sql']);
    $rows = $stmt->fetchAll(PDO::FETCH_NUM);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'server'], 500);
}

audit_log($admin['id'], 'export:' . $type, $type, null);

$filename = 'jssed2026_' . $type . '_' . date('Ymd_His') . '.csv';

if (!headers_sent()) {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: no-store');
}

$out = fopen('php://output', 'w');
// BOM UTF-8 pour Excel.
fwrite($out, "\xEF\xBB\xBF");
fputcsv($out, $config[$type]['headers']);
foreach ($rows as $row) {
    fputcsv($out, $row);
}
fclose($out);
exit;
