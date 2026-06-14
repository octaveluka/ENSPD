<?php
/**
 * Endpoint public : soumission d'une communication / poster.
 * Méthode : POST (corps JSON).
 *
 * Contrat de réponse :
 *   200 {"ok":true,"ref":"JSSED2026-AB12CD","message":"..."}
 *   422 {"ok":false,"error":"validation","fields":{...}}
 *   429 {"ok":false,"error":"rate_limit","message":"..."}
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

// Honeypot : si le champ piège est rempli, fausse réussite (on n'insère rien).
if (is_spam_honeypot($data)) {
    json_response(['ok' => true, 'ref' => gen_ref('JSSED2026'), 'message' => 'Soumission reçue.']);
}

// Limitation de débit : max 5 soumissions / 10 minutes / IP.
if (!rate_limit_check($ip, 'submit', 5, 600)) {
    json_response([
        'ok' => false, 'error' => 'rate_limit',
        'message' => 'Trop de tentatives, réessayez plus tard.',
    ], 429);
}

/* ------------------------------ Validation ------------------------------ */
$fields = [];

$format = clean_str($data['format'] ?? '', 10);
if (!in_array($format, ['oral', 'poster'], true)) {
    $fields['format'] = 'Choisissez "oral" ou "poster".';
}

$atelier = (int) ($data['atelier'] ?? 0);
if ($atelier < 1 || $atelier > 3) {
    $fields['atelier'] = 'Atelier invalide (1 à 3).';
}

$langue = clean_str($data['langue'] ?? 'fr', 20);
if ($langue === '') {
    $langue = 'fr';
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

$statut      = clean_str($data['statut'] ?? '', 80);
$institution = clean_str($data['institution'] ?? '', 160);
$pays        = clean_str($data['pays'] ?? '', 80);

$titre = clean_str($data['titre'] ?? '', 255);
if (!len_between($titre, 5, 255)) {
    $fields['titre'] = 'Titre requis (5 à 255 caractères).';
}

$resume = clean_str($data['resume'] ?? '', 2400);
if ($resume === '') {
    $fields['resume'] = 'Résumé requis.';
} elseif (word_count($resume) > 300) {
    $fields['resume'] = 'Le résumé ne doit pas dépasser 300 mots.';
}

$keywords    = clean_str($data['keywords'] ?? '', 255);
$financement = clean_str($data['financement'] ?? '', 255);

// Co-auteurs : tableau optionnel d'objets {prenom, nom, institution}.
$coauthors = [];
if (isset($data['coauthors']) && is_array($data['coauthors'])) {
    foreach (array_slice($data['coauthors'], 0, 20) as $c) {
        if (!is_array($c)) {
            continue;
        }
        $cp = clean_str($c['prenom'] ?? '', 80);
        $cn = clean_str($c['nom'] ?? '', 80);
        $ci = clean_str($c['institution'] ?? '', 160);
        if ($cp !== '' || $cn !== '') {
            $coauthors[] = ['prenom' => $cp, 'nom' => $cn, 'institution' => $ci];
        }
    }
}

// Consentement RGPD obligatoire.
$consent = !empty($data['consent']) && $data['consent'] !== '0' && $data['consent'] !== 'false';
if (!$consent) {
    $fields['consent'] = 'Le consentement est obligatoire.';
}

if (!empty($fields)) {
    json_response(['ok' => false, 'error' => 'validation', 'fields' => $fields], 422);
}

/* ------------------------------ Insertion ------------------------------ */
$ref = gen_ref('JSSED2026');

try {
    $pdo = db();
    // Garantit l'unicité de la référence (rarement nécessaire).
    for ($try = 0; $try < 5; $try++) {
        $check = $pdo->prepare('SELECT 1 FROM submissions WHERE ref = :ref LIMIT 1');
        $check->execute([':ref' => $ref]);
        if (!$check->fetchColumn()) {
            break;
        }
        $ref = gen_ref('JSSED2026');
    }

    $stmt = $pdo->prepare(
        'INSERT INTO submissions
            (ref, format, atelier, langue, prenom, nom, email, tel, statut,
             institution, pays, titre, resume, keywords, financement,
             coauthors, consent, consent_ip)
         VALUES
            (:ref, :format, :atelier, :langue, :prenom, :nom, :email, :tel, :statut,
             :institution, :pays, :titre, :resume, :keywords, :financement,
             :coauthors, :consent, :consent_ip)'
    );
    $stmt->execute([
        ':ref'         => $ref,
        ':format'      => $format,
        ':atelier'     => $atelier,
        ':langue'      => $langue,
        ':prenom'      => $prenom,
        ':nom'         => $nom,
        ':email'       => $email,
        ':tel'         => $tel !== '' ? $tel : null,
        ':statut'      => $statut !== '' ? $statut : null,
        ':institution' => $institution !== '' ? $institution : null,
        ':pays'        => $pays !== '' ? $pays : null,
        ':titre'       => $titre,
        ':resume'      => $resume,
        ':keywords'    => $keywords !== '' ? $keywords : null,
        ':financement' => $financement !== '' ? $financement : null,
        ':coauthors'   => !empty($coauthors) ? json_encode($coauthors, JSON_UNESCAPED_UNICODE) : null,
        ':consent'     => 1,
        ':consent_ip'  => $ip,
    ]);
} catch (Throwable $e) {
    json_response(['ok' => false, 'error' => 'server', 'message' => 'Erreur serveur. Réessayez.'], 500);
}

json_response([
    'ok'      => true,
    'ref'     => $ref,
    'message' => 'Votre soumission a bien été enregistrée. Conservez votre référence : ' . $ref,
]);
