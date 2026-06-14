<?php
/**
 * Endpoint public : inscription aux JSSED 2026.
 * Méthode : POST (corps JSON).
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

if (is_spam_honeypot($data)) {
    json_response(['ok' => true, 'ref' => gen_ref('INS2026'), 'message' => 'Inscription reçue.']);
}

if (!rate_limit_check($ip, 'register', 5, 600)) {
    json_response([
        'ok' => false, 'error' => 'rate_limit',
        'message' => 'Trop de tentatives, réessayez plus tard.',
    ], 429);
}

/* ------------------------------ Validation ------------------------------ */
$fields = [];

$type = clean_str($data['type'] ?? '', 20);
if (!in_array($type, ['etudiant', 'chercheur', 'exposant'], true)) {
    $fields['type'] = 'Type d\'inscription invalide.';
}

$prenom = clean_str($data['prenom'] ?? '', 80);
if (!len_between($prenom, 2, 80)) {
    $fields['prenom'] = 'Prénom requis (2 à 80 caractères).';
}

$nom = clean_str($data['nom'] ?? '', 80);
if (!len_between($nom, 2, 80)) {
    $fields['nom'] = 'Nom requis (2 à 80 caractères).';
}

$email = clean_str($data['email'] ?? '', 190);
if (!valid_email($email)) {
    $fields['email'] = 'Email invalide.';
}

$tel = clean_str($data['tel'] ?? '', 40);
if ($tel !== '' && !preg_match('/^[0-9+().\s-]{6,40}$/', $tel)) {
    $fields['tel'] = 'Numéro de téléphone invalide.';
}

$institution = clean_str($data['institution'] ?? '', 160);
$pays        = clean_str($data['pays'] ?? '', 80);
$statut      = clean_str($data['statut'] ?? '', 80);

$consent = !empty($data['consent']) && $data['consent'] !== '0' && $data['consent'] !== 'false';
if (!$consent) {
    $fields['consent'] = 'Le consentement est obligatoire.';
}

if (!empty($fields)) {
    json_response(['ok' => false, 'error' => 'validation', 'fields' => $fields], 422);
}

/* ------------------------------ Insertion ------------------------------ */
$ref = gen_ref('INS2026');

try {
    $pdo = db();
    for ($t = 0; $t < 5; $t++) {
        $check = $pdo->prepare('SELECT 1 FROM registrations WHERE ref = :ref LIMIT 1');
        $check->execute([':ref' => $ref]);
        if (!$check->fetchColumn()) {
            break;
        }
        $ref = gen_ref('INS2026');
    }

    $stmt = $pdo->prepare(
        'INSERT INTO registrations
            (ref, type, prenom, nom, email, tel, institution, pays, statut, consent, consent_ip)
         VALUES
            (:ref, :type, :prenom, :nom, :email, :tel, :institution, :pays, :statut, :consent, :consent_ip)'
    );
    $stmt->execute([
        ':ref'         => $ref,
        ':type'        => $type,
        ':prenom'      => $prenom,
        ':nom'         => $nom,
        ':email'       => $email,
        ':tel'         => $tel !== '' ? $tel : null,
        ':institution' => $institution !== '' ? $institution : null,
        ':pays'        => $pays !== '' ? $pays : null,
        ':statut'      => $statut !== '' ? $statut : null,
        ':consent'     => 1,
        ':consent_ip'  => $ip,
    ]);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'server', 'message' => 'Erreur serveur. Réessayez.'], 500);
}

json_response([
    'ok'      => true,
    'ref'     => $ref,
    'message' => 'Votre inscription a bien été enregistrée. Référence : ' . $ref,
]);
