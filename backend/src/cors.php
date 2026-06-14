<?php
/**
 * En-têtes CORS et sécurité, plus gestion du pré-vol OPTIONS.
 *
 * À inclure en tout début des endpoints API.
 * L'origine autorisée est lue depuis config.php ('cors_origins').
 * Les requêtes "same-origin" (sans en-tête Origin) sont toujours
 * acceptées.
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

(function (): void {
    $cfg = config();
    $allowed = $cfg['cors_origins'] ?? [];
    if (!is_array($allowed)) {
        $allowed = [];
    }

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    // En-têtes de sécurité communs.
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Cross-Origin-Resource-Policy: same-site');

    if ($origin !== '') {
        // Requête cross-origin : on n'autorise que les origines listées.
        if (in_array($origin, $allowed, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Vary: Origin');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
            header('Access-Control-Max-Age: 86400');
        } else {
            // Origine non autorisée : on ne pose pas l'en-tête CORS.
            // Le navigateur bloquera alors la lecture de la réponse.
            if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
                http_response_code(403);
                exit;
            }
        }
    }

    // Réponse au pré-vol CORS.
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
})();
