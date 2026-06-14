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

    // Charge la configuration (backend-enspd/config.php).
    $configPath = __DIR__ . '/../config.php';
    if (!is_file($configPath)) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'ok'    => false,
            'error' => 'server',
            'message' => 'Configuration manquante (config.php). Copiez config.example.php.',
        ]);
        exit;
    }

    /** @var array $config */
    $config = require $configPath;

    $host = $config['db_host'] ?? 'localhost';
    $name = $config['db_name'] ?? '';
    $user = $config['db_user'] ?? '';
    $pass = $config['db_pass'] ?? '';
    $port = (int) ($config['db_port'] ?? 3306);

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
 */
function config(): array
{
    static $config = null;
    if ($config === null) {
        $configPath = __DIR__ . '/../config.php';
        $config = is_file($configPath) ? require $configPath : [];
    }
    return $config;
}
