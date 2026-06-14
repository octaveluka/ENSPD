<?php
/**
 * Script en ligne de commande (CLI) pour créer un administrateur.
 *
 * Utilisation :
 *     php bin/create_admin.php <email> <nom>
 *   ex :
 *     php bin/create_admin.php admin@enspd.bj "Direction JSSED"
 *
 * Le script demande le mot de passe de façon interactive (masqué si
 * possible) puis l'enregistre HACHÉ avec password_hash().
 *
 * On peut aussi fournir le mot de passe en 3e argument (déconseillé,
 * car visible dans l'historique du shell) :
 *     php bin/create_admin.php admin@enspd.bj "Direction" "MotDePasse"
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
    fwrite(STDERR, "Usage : php bin/create_admin.php <email> <nom> [mot_de_passe]\n");
    exit(1);
}

$email = trim((string) $argv[1]);
$name  = trim((string) $argv[2]);
$role  = 'admin';

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

// Mot de passe : argument 3 si fourni, sinon saisie interactive.
if (isset($argv[3]) && $argv[3] !== '') {
    $password = (string) $argv[3];
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

fwrite(STDOUT, "Administrateur créé avec succès : " . $email . "\n");
exit(0);
