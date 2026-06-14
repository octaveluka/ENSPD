<?php
/**
 * Script en ligne de commande (CLI) pour créer un administrateur ENSPD.
 *
 * Utilisation :
 *     php bin/create_admin.php <email> <nom> [role]
 *   ex :
 *     php bin/create_admin.php admin@enspd.bj "Direction ENSPD"
 *     php bin/create_admin.php redac@enspd.bj "Rédaction" editor
 *
 * Le script demande le mot de passe de façon interactive (masqué si
 * possible) puis l'enregistre HACHÉ avec password_hash().
 *
 * On peut aussi fournir le mot de passe en argument supplémentaire
 * (déconseillé, car visible dans l'historique du shell).
 *
 * Refuse de s'exécuter via le web (sécurité).
 */

declare(strict_types=1);

// Bloque l'exécution via un serveur web.
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    echo 'Ce script ne peut être exécuté qu\'en ligne de commande.';
    exit(1);
}

require_once __DIR__ . '/../src/db.php';

$argv = $_SERVER['argv'] ?? [];

if (count($argv) < 3) {
    fwrite(STDERR, "Usage : php bin/create_admin.php <email> <nom> [role] [mot_de_passe]\n");
    fwrite(STDERR, "  role : 'admin' (defaut) ou 'editor'.\n");
    exit(1);
}

$email = trim((string) $argv[1]);
$name  = trim((string) $argv[2]);
$role  = isset($argv[3]) && in_array($argv[3], ['admin', 'editor'], true) ? (string) $argv[3] : 'admin';

if (filter_var($email, FILTER_VALIDATE_EMAIL) === false) {
    fwrite(STDERR, "Email invalide.\n");
    exit(1);
}
if ($name === '' || mb_strlen($name) > 120) {
    fwrite(STDERR, "Nom invalide (1 à 120 caractères).\n");
    exit(1);
}

/**
 * Lit un mot de passe sans l'afficher à l'écran (si le terminal le permet).
 */
function prompt_password(string $label): string
{
    fwrite(STDOUT, $label);
    // Tente de masquer la saisie sous Unix.
    if (DIRECTORY_SEPARATOR === '/' && @shell_exec('command -v stty') !== null) {
        $stty = shell_exec('stty -g');
        shell_exec('stty -echo');
        $line = fgets(STDIN);
        shell_exec('stty ' . trim((string) $stty));
        fwrite(STDOUT, "\n");
    } else {
        $line = fgets(STDIN);
    }
    return rtrim((string) $line, "\r\n");
}

// Mot de passe (déconseillé en argument). On distingue deux cas :
//  - argv[3] est un rôle valide ('admin'/'editor') -> le mot de passe est argv[4] ;
//  - sinon argv[3] (s'il existe) est interprété comme le mot de passe.
$argIsRole = isset($argv[3]) && in_array($argv[3], ['admin', 'editor'], true);
if ($argIsRole) {
    $pwArg = isset($argv[4]) && $argv[4] !== '' ? (string) $argv[4] : null;
} else {
    $pwArg = isset($argv[3]) && $argv[3] !== '' ? (string) $argv[3] : null;
}

if ($pwArg !== null && $pwArg !== '') {
    $password = $pwArg;
} else {
    $password = prompt_password('Mot de passe : ');
    $confirm  = prompt_password('Confirmer    : ');
    if ($password !== $confirm) {
        fwrite(STDERR, "Les mots de passe ne correspondent pas.\n");
        exit(1);
    }
}

if (mb_strlen($password) < 10) {
    fwrite(STDERR, "Mot de passe trop court (minimum 10 caractères).\n");
    exit(1);
}

$hash = password_hash($password, PASSWORD_DEFAULT);

try {
    $pdo = db();

    // Existe déjà ?
    $check = $pdo->prepare('SELECT id FROM admins WHERE email = :email LIMIT 1');
    $check->execute([':email' => $email]);
    if ($check->fetch()) {
        fwrite(STDERR, "Un administrateur avec cet email existe déjà.\n");
        exit(1);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO admins (email, password_hash, name, role)
         VALUES (:email, :hash, :name, :role)'
    );
    $stmt->execute([
        ':email' => $email,
        ':hash'  => $hash,
        ':name'  => $name,
        ':role'  => $role,
    ]);
} catch (Throwable $e) {
    fwrite(STDERR, "Erreur base de données : " . $e->getMessage() . "\n");
    exit(1);
}

fwrite(STDOUT, "Administrateur créé avec succès : " . $email . " (" . $role . ")\n");
exit(0);
