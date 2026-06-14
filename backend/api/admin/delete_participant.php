<?php
/**
 * Admin : effacement RGPD (droit à l'effacement / "droit à l'oubli").
 * POST {email} ou {ref}  -> supprime les données du participant dans
 * toutes les tables (submissions, registrations, contacts).
 * CSRF requis. Journalisé dans audit_log.
 *
 * Remarque : on enregistre dans le journal d'audit une trace de l'action
 * (qui a supprimé quoi, quand) SANS conserver les données personnelles
 * effacées, ce qui est conforme à l'obligation de traçabilité.
 */

declare(strict_types=1);

require_once __DIR__ . '/../../src/cors.php';
require_once __DIR__ . '/../../src/helpers.php';

header('Content-Type: application/json; charset=utf-8');

$admin = require_admin();

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    json_response(['ok' => false, 'error' => 'method'], 405);
}

if (!csrf_check()) {
    json_response(['ok' => false, 'error' => 'csrf'], 403);
}

$data  = read_json_body();
$email = clean_str($data['email'] ?? '', 190);
$ref   = clean_str($data['ref'] ?? '', 32);

if ($email === '' && $ref === '') {
    json_response([
        'ok' => false, 'error' => 'validation',
        'fields' => ['email' => 'Indiquez un email ou une référence.'],
    ], 422);
}
if ($email !== '' && !valid_email($email)) {
    json_response(['ok' => false, 'error' => 'validation', 'fields' => ['email' => 'Email invalide.']], 422);
}

$deleted = ['submissions' => 0, 'registrations' => 0, 'contacts' => 0];

try {
    $pdo = db();
    $pdo->beginTransaction();

    if ($ref !== '') {
        // Effacement ciblé par référence.
        $s = $pdo->prepare('DELETE FROM submissions WHERE ref = :ref');
        $s->execute([':ref' => $ref]);
        $deleted['submissions'] += $s->rowCount();

        $r = $pdo->prepare('DELETE FROM registrations WHERE ref = :ref');
        $r->execute([':ref' => $ref]);
        $deleted['registrations'] += $r->rowCount();
    }

    if ($email !== '') {
        // Effacement par email dans toutes les tables.
        $s = $pdo->prepare('DELETE FROM submissions WHERE email = :email');
        $s->execute([':email' => $email]);
        $deleted['submissions'] += $s->rowCount();

        $r = $pdo->prepare('DELETE FROM registrations WHERE email = :email');
        $r->execute([':email' => $email]);
        $deleted['registrations'] += $r->rowCount();

        $c = $pdo->prepare('DELETE FROM contacts WHERE email = :email');
        $c->execute([':email' => $email]);
        $deleted['contacts'] += $c->rowCount();
    }

    $pdo->commit();
} catch (Throwable $e) {
    if (db()->inTransaction()) {
        db()->rollBack();
    }
    json_response(['ok' => false, 'error' => 'server'], 500);
}

// Trace d'audit (sans données personnelles : on consigne un hash de l'identifiant).
$targetId = $ref !== '' ? $ref : substr(hash('sha256', $email), 0, 16);
audit_log($admin['id'], 'rgpd_erase', 'participant', $targetId);

json_response([
    'ok'      => true,
    'deleted' => $deleted,
    'message' => sprintf(
        'Effacement effectué : %d soumission(s), %d inscription(s), %d message(s).',
        $deleted['submissions'],
        $deleted['registrations'],
        $deleted['contacts']
    ),
]);
