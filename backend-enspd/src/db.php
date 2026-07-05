<?php
/**
 * Connexion PDO à MySQL (singleton) — backend ENSPD.
 * - Mode erreur : exceptions (ERRMODE_EXCEPTION)
 * - Encodage    : utf8mb4
 * - Requêtes préparées réelles (emulate prepares = false)
 *
 * Toutes les requêtes du backend passent par cette connexion et
 * utilisent UNIQUEMENT des requêtes préparées (protection injection SQL).
 */

declare(strict_types=1);

/**
 * Retourne l'instance PDO partagée. La crée à la première utilisation.
 */
function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = config();

    if ($config['db_name'] === '' || $config['db_user'] === '') {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok'    => false,
            'error' => 'server',
            'message' => 'Configuration base de données manquante. Définissez les variables '
                . "d'environnement (DB_HOST, DB_NAME, DB_USER, DB_PASS, DB_PORT) ou créez config.php à partir de config.example.php.",
        ]);
        exit;
    }

    $host = $config['db_host'];
    $name = $config['db_name'];
    $user = $config['db_user'];
    $pass = $config['db_pass'];
    $port = $config['db_port'];

    $dsn = sprintf(
        'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
        $host,
        $port,
        $name
    );

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, $user, $pass, $options);
        // Fixe le fuseau de la session MySQL à UTC pour que NOW() /
        // CURRENT_TIMESTAMP correspondent au gmdate() utilisé côté PHP
        // (cohérence de la limitation de débit).
        $pdo->exec("SET time_zone = '+00:00'");
    } catch (PDOException $e) {
        $isDev = (($config['env'] ?? 'prod') === 'dev');
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok'      => false,
            'error'   => 'server',
            'message' => $isDev
                ? 'Connexion BDD échouée : ' . $e->getMessage()
                : 'Erreur serveur (base de données).',
        ]);
        exit;
    }

    return $pdo;
}

/**
 * Retourne le tableau de configuration complet.
 *
 * Priorité : variables d'environnement (utilisées sur Render/Railway/etc.)
 * puis, à défaut, le fichier local backend-enspd/config.php (utile en
 * hébergement mutualisé cPanel où les variables d'environnement ne sont
 * pas disponibles).
 */
function config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }

    $configPath = __DIR__ . '/../config.php';
    $file = is_file($configPath) ? require $configPath : [];

    $env = static function (string $key, $default = null) {
        $value = getenv($key);
        return ($value === false || $value === '') ? $default : $value;
    };

    $corsEnv = getenv('CORS_ORIGINS');
    $corsOrigins = $corsEnv !== false && $corsEnv !== ''
        ? array_values(array_filter(array_map('trim', explode(',', $corsEnv))))
        : ($file['cors_origins'] ?? []);

    $config = [
        'db_host'              => (string) $env('DB_HOST', $file['db_host'] ?? 'localhost'),
        'db_name'              => (string) $env('DB_NAME', $file['db_name'] ?? ''),
        'db_user'              => (string) $env('DB_USER', $file['db_user'] ?? ''),
        'db_pass'              => (string) $env('DB_PASS', $file['db_pass'] ?? ''),
        'db_port'              => (int) $env('DB_PORT', $file['db_port'] ?? 3306),
        'env'                  => (string) $env('ENV', $file['env'] ?? 'prod'),
        'cors_origins'         => $corsOrigins,
        'session_name'         => (string) $env('SESSION_NAME', $file['session_name'] ?? 'ENSPD_ADMIN'),
        'session_secret'       => (string) $env('SESSION_SECRET', $file['session_secret'] ?? ''),
        'session_idle_timeout' => (int) $env('SESSION_IDLE_TIMEOUT', $file['session_idle_timeout'] ?? 1800),
        'cookie_secure'        => filter_var(
            $env('COOKIE_SECURE', $file['cookie_secure'] ?? true),
            FILTER_VALIDATE_BOOLEAN
        ),
        'base_url'             => (string) $env('BASE_URL', $file['base_url'] ?? ''),
    ];

    return $config;
}
