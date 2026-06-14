<?php
/**
 * Endpoint public : formulaire de contact (ENSPD).
 * Méthode : POST (corps JSON).
 *
 * Sécurité : honeypot, limitation de débit par IP, validation serveur,
 * consentement RGPD obligatoire, insertion via requête préparée.
 */

declare(strict_types=1);

require_once __DIR__ . '/../src/cors.php';
require_once __DIR__ . '/../src/helpers.php';

header('Content-Type: application/json; charset=utf-8');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    json_response(['ok' => false, 'error' => 'method'], 405);
}

$ip   = client_ip();
$data = read_json_body();

// Honeypot : champ piège "website" rempli -> fausse réussite, rien inséré.
if (is_spam_honeypot($data)) {
    json_response(['ok' => true, 'ref' => 'CONTACT', 'message' => 'Message reçu.']);
}

if (!rate_limit_check($ip, 'contact', 5, 600)) {
    json_response([
        'ok' => false, 'error' => 'rate_limit',
        'message' => 'Trop de tentatives, réessayez plus tard.',
    ], 429);
}

/* ------------------------------ Validation ------------------------------ */
$fields = [];

$nom = clean_str($data['nom'] ?? '', 120);
if (!len_between($nom, 2, 120)) {
    $fields['nom'] = 'Nom requis (2 à 120 caractères).';
}

$email = clean_str($data['email'] ?? '', 190);
if (!valid_email($email)) {
    $fields['email'] = 'Email invalide.';
}

$sujet = clean_str($data['sujet'] ?? '', 160);

$message = clean_str($data['message'] ?? '', 4000);
if (!len_between($message, 5, 4000)) {
    $fields['message'] = 'Message requis (5 à 4000 caractères).';
}

$consent = !empty($data['consent']) && $data['consent'] !== '0' && $data['consent'] !== 'false';
if (!$consent) {
    $fields['consent'] = 'Le consentement est obligatoire.';
}

if (!empty($fields)) {
    json_response(['ok' => false, 'error' => 'validation', 'fields' => $fields], 422);
}

/* ------------------------------ Insertion ------------------------------ */
try {
    $stmt = db()->prepare(
        'INSERT INTO contacts (nom, email, sujet, message, consent, ip)
         VALUES (:nom, :email, :sujet, :message, :consent, :ip)'
    );
    $stmt->execute([
        ':nom'     => $nom,
        ':email'   => $email,
        ':sujet'   => $sujet !== '' ? $sujet : null,
        ':message' => $message,
        ':consent' => 1,
        ':ip'      => $ip,
    ]);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'server', 'message' => 'Erreur serveur. Réessayez.'], 500);
}

json_response([
    'ok'      => true,
    'ref'     => 'CONTACT',
    'message' => 'Votre message a bien été envoyé. Nous vous répondrons rapidement.',
]);
