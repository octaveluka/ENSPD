<?php
/**
 * Fonctions utilitaires partagées : réponses JSON, validation,
 * limitation de débit, CSRF, garde d'authentification admin, etc.
 *
 * Aucune sortie HTML brute : tout ce qui vient de l'utilisateur est
 * échappé avec escape() avant affichage, et toutes les requêtes SQL
 * sont préparées.
 */

declare(strict_types=1);

require_once __DIR__ . '/db.php';

/**
 * Envoie une réponse JSON et termine le script.
 */
function json_response(array $data, int $code = 200): void
{
    if (!headers_sent()) {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Lit et décode le corps JSON de la requête entrante.
 * Retourne un tableau (vide si corps absent ou invalide).
 */
function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/**
 * Détermine l'adresse IP du client de façon prudente.
 * Sur hébergement partagé derrière un proxy, X-Forwarded-For peut être
 * présent ; on prend la première IP. À défaut, REMOTE_ADDR.
 */
function client_ip(): string
{
    $candidates = [];
    if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $parts = explode(',', (string) $_SERVER['HTTP_X_FORWARDED_FOR']);
        $candidates[] = trim($parts[0]);
    }
    $candidates[] = $_SERVER['REMOTE_ADDR'] ?? '';

    foreach ($candidates as $ip) {
        $ip = trim($ip);
        if ($ip !== '' && filter_var($ip, FILTER_VALIDATE_IP)) {
            return substr($ip, 0, 45);
        }
    }
    return '0.0.0.0';
}

/* =====================================================================
 *  VALIDATION
 * ===================================================================== */

/**
 * Nettoie une valeur en chaîne : force le type string, supprime les
 * caractères de contrôle, coupe les espaces, applique une longueur max.
 */
function clean_str($value, int $maxLen = 255): string
{
    if (is_array($value)) {
        return '';
    }
    $s = (string) $value;
    // Supprime les caractères de contrôle sauf retours à la ligne / tab.
    $s = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $s) ?? '';
    $s = trim($s);
    if (mb_strlen($s) > $maxLen) {
        $s = mb_substr($s, 0, $maxLen);
    }
    return $s;
}

/**
 * Valide une adresse email (et limite la longueur).
 */
function valid_email(string $email): bool
{
    if ($email === '' || mb_strlen($email) > 190) {
        return false;
    }
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Vérifie qu'une chaîne respecte une longueur min/max (en caractères).
 */
function len_between(string $s, int $min, int $max): bool
{
    $n = mb_strlen($s);
    return $n >= $min && $n <= $max;
}

/**
 * Compte les mots d'un texte (séparés par des espaces).
 */
function word_count(string $s): int
{
    $s = trim($s);
    if ($s === '') {
        return 0;
    }
    return count(preg_split('/\s+/u', $s) ?: []);
}

/* =====================================================================
 *  LIMITATION DE DÉBIT (RATE LIMITING) par IP, stockée en base
 * ===================================================================== */

/**
 * Vérifie si l'IP a dépassé $max actions de type $action dans la
 * fenêtre $windowSeconds. Si NON dépassé, enregistre une nouvelle
 * occurrence et retourne true (autorisé). Si dépassé, retourne false.
 *
 * @return bool true = autorisé, false = bloqué (trop de tentatives)
 */
function rate_limit_check(string $ip, string $action, int $max, int $windowSeconds): bool
{
    $pdo = db();

    // On calcule la borne de la fenêtre côté PHP, puis on la passe en
    // paramètre lié (DATETIME). On évite ainsi "INTERVAL :param SECOND"
    // que MySQL n'accepte pas en requête préparée réelle (emulate=false).
    $cutoff = gmdate('Y-m-d H:i:s', time() - $windowSeconds);

    // Nettoyage opportuniste des vieilles entrées de cette action.
    try {
        $del = $pdo->prepare(
            'DELETE FROM rate_limits
             WHERE action = :action
               AND created_at < :cutoff'
        );
        $del->bindValue(':action', $action, PDO::PARAM_STR);
        $del->bindValue(':cutoff', $cutoff, PDO::PARAM_STR);
        $del->execute();
    } catch (Throwable $e) {
        // On ne bloque pas si le nettoyage échoue.
    }

    // Compte les tentatives récentes de cette IP pour cette action.
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM rate_limits
         WHERE ip = :ip AND action = :action
           AND created_at >= :cutoff'
    );
    $stmt->bindValue(':ip', $ip, PDO::PARAM_STR);
    $stmt->bindValue(':action', $action, PDO::PARAM_STR);
    $stmt->bindValue(':cutoff', $cutoff, PDO::PARAM_STR);
    $stmt->execute();
    $count = (int) $stmt->fetchColumn();

    if ($count >= $max) {
        return false;
    }

    // Enregistre la tentative courante.
    $ins = $pdo->prepare(
        'INSERT INTO rate_limits (ip, action) VALUES (:ip, :action)'
    );
    $ins->bindValue(':ip', $ip, PDO::PARAM_STR);
    $ins->bindValue(':action', $action, PDO::PARAM_STR);
    $ins->execute();

    return true;
}

/* =====================================================================
 *  RÉFÉRENCES (codes uniques lisibles)
 * ===================================================================== */

/**
 * Génère une référence du type "PREFIX-AB12CD" (6 caractères
 * alphanumériques majuscules, sans caractères ambigus).
 */
function gen_ref(string $prefix): string
{
    $alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans I,O,0,1
    $code = '';
    $max = strlen($alphabet) - 1;
    for ($i = 0; $i < 6; $i++) {
        $code .= $alphabet[random_int(0, $max)];
    }
    return $prefix . '-' . $code;
}

/* =====================================================================
 *  SESSION admin
 * ===================================================================== */

/**
 * Démarre la session admin avec des paramètres de cookie sécurisés.
 */
function start_admin_session(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    $cfg = config();
    $secure = (bool) ($cfg['cookie_secure'] ?? true);

    session_name((string) ($cfg['session_name'] ?? 'JSSED_ADMIN'));
    session_set_cookie_params([
        'lifetime' => 0,
        'path'     => '/',
        'secure'   => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

/* =====================================================================
 *  CSRF (Cross-Site Request Forgery)
 * ===================================================================== */

/**
 * Retourne le jeton CSRF de la session (le crée si absent).
 */
function csrf_token(): string
{
    start_admin_session();
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return (string) $_SESSION['csrf'];
}

/**
 * Vérifie le jeton CSRF fourni (header X-CSRF-Token ou champ "csrf").
 * Retourne true si valide.
 */
function csrf_check(?string $provided = null): bool
{
    start_admin_session();
    if ($provided === null) {
        $provided = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
        if ($provided === null) {
            $body = read_json_body();
            $provided = $body['csrf'] ?? ($_POST['csrf'] ?? null);
        }
    }
    $expected = $_SESSION['csrf'] ?? '';
    return is_string($provided)
        && $expected !== ''
        && hash_equals($expected, $provided);
}

/* =====================================================================
 *  GARDE d'authentification admin
 * ===================================================================== */

/**
 * Vérifie qu'un administrateur est connecté ET que la session n'a pas
 * expiré par inactivité. Sinon répond 401 et termine.
 *
 * @return array Données de l'admin connecté.
 */
function require_admin(): array
{
    start_admin_session();
    $cfg = config();
    $idle = (int) ($cfg['session_idle_timeout'] ?? 1800);

    if (empty($_SESSION['admin_id'])) {
        json_response(['ok' => false, 'error' => 'auth'], 401);
    }

    // Délai d'inactivité.
    $now = time();
    $last = (int) ($_SESSION['last_activity'] ?? 0);
    if ($last > 0 && ($now - $last) > $idle) {
        admin_logout();
        json_response(['ok' => false, 'error' => 'auth', 'message' => 'Session expirée.'], 401);
    }
    $_SESSION['last_activity'] = $now;

    return [
        'id'    => (int) $_SESSION['admin_id'],
        'email' => (string) ($_SESSION['admin_email'] ?? ''),
        'name'  => (string) ($_SESSION['admin_name'] ?? ''),
        'role'  => (string) ($_SESSION['admin_role'] ?? 'admin'),
    ];
}

/**
 * Détruit la session admin courante.
 */
function admin_logout(): void
{
    start_admin_session();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(
            session_name(),
            '',
            [
                'expires'  => time() - 42000,
                'path'     => $params['path'],
                'secure'   => $params['secure'],
                'httponly' => $params['httponly'],
                'samesite' => $params['samesite'] ?? 'Lax',
            ]
        );
    }
    session_destroy();
}

/**
 * Écrit une entrée dans le journal d'audit.
 */
function audit_log(?int $adminId, string $action, ?string $targetType = null, ?string $targetId = null): void
{
    try {
        $stmt = db()->prepare(
            'INSERT INTO audit_log (admin_id, action, target_type, target_id, ip)
             VALUES (:admin_id, :action, :target_type, :target_id, :ip)'
        );
        $stmt->bindValue(':admin_id', $adminId, $adminId === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $stmt->bindValue(':action', $action, PDO::PARAM_STR);
        $stmt->bindValue(':target_type', $targetType, $targetType === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $stmt->bindValue(':target_id', $targetId, $targetId === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $stmt->bindValue(':ip', client_ip(), PDO::PARAM_STR);
        $stmt->execute();
    } catch (Throwable $e) {
        // Le journal d'audit ne doit jamais bloquer l'action principale.
    }
}

/* =====================================================================
 *  ÉCHAPPEMENT HTML
 * ===================================================================== */

/**
 * Échappe une valeur pour affichage HTML sûr.
 */
function escape($value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * Honeypot : retourne true si le champ piège "website" est rempli
 * (donc probablement un robot).
 */
function is_spam_honeypot(array $data): bool
{
    return isset($data['website']) && trim((string) $data['website']) !== '';
}
