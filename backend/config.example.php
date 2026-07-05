<?php
/**
 * =====================================================================
 *  JSSED 2026 — Fichier de configuration (EXEMPLE)
 * ---------------------------------------------------------------------
 *  COMMENT UTILISER CE FICHIER :
 *    1. Copiez ce fichier et renommez la copie en  "config.php"
 *       (dans le même dossier : backend/config.php).
 *    2. Remplissez les valeurs ci-dessous avec les informations
 *       fournies par votre hébergeur (cPanel / phpMyAdmin).
 *    3. Ne committez JAMAIS config.php dans Git (il est déjà ignoré).
 *
 *  Toutes les valeurs sont des chaînes de caractères entre guillemets,
 *  sauf indication contraire. Ne supprimez ni les guillemets ni les
 *  virgules.
 *
 *  ⚠️ VARIABLES D'ENVIRONNEMENT (Render, Railway, Docker...) :
 *  Sur ces hébergeurs, ce fichier config.php N'EST PAS NÉCESSAIRE.
 *  Les valeurs ci-dessous sont automatiquement remplacées par les
 *  variables d'environnement du service si elles sont définies
 *  (DB_HOST, DB_NAME, DB_USER, DB_PASS, DB_PORT, ENV, CORS_ORIGINS,
 *  SESSION_NAME, SESSION_SECRET, SESSION_IDLE_TIMEOUT, COOKIE_SECURE,
 *  BASE_URL). Voir le fichier "render-env-variables.txt" à la racine
 *  du dépôt pour la liste complète prête à copier dans le dashboard
 *  Render (Environment → Add Environment Variable).
 * =====================================================================
 */

return [

    // -----------------------------------------------------------------
    // BASE DE DONNÉES MySQL
    // -----------------------------------------------------------------

    // Hôte de la base. Sur la plupart des hébergements partagés c'est
    // "localhost". Votre hébergeur peut imposer une autre valeur.
    'db_host' => 'localhost',

    // Nom de la base de données que vous avez créée dans cPanel.
    // Souvent préfixé par votre identifiant cPanel, ex: "moncpanel_jssed2026".
    'db_name' => 'jssed2026',

    // Utilisateur MySQL ayant accès à cette base.
    'db_user' => 'jssed_user',

    // Mot de passe de cet utilisateur MySQL.
    'db_pass' => 'CHANGEZ_MOI',

    // Port MySQL (3306 par défaut, à modifier seulement si demandé).
    'db_port' => 3306,

    // -----------------------------------------------------------------
    // ENVIRONNEMENT
    // -----------------------------------------------------------------

    // 'prod' en production (masque les erreurs détaillées),
    // 'dev' en développement local (affiche les erreurs).
    'env' => 'prod',

    // -----------------------------------------------------------------
    // CORS (origines autorisées à appeler l'API depuis le navigateur)
    // -----------------------------------------------------------------
    // Indiquez l'origine EXACTE de votre site frontend (schéma + domaine,
    // SANS slash final). Exemple : "https://www.enspd-parakou.bj".
    // Vous pouvez en mettre plusieurs.
    // Si le backend et le frontend sont sur le MÊME domaine, vous pouvez
    // laisser ce tableau vide : les requêtes same-origin fonctionneront.
    'cors_origins' => [
        'https://www.exemple-jssed.bj',
        // 'http://localhost:5500', // utile pour les tests en local
    ],

    // -----------------------------------------------------------------
    // SESSIONS (administration)
    // -----------------------------------------------------------------

    // Nom du cookie de session admin (évitez le défaut "PHPSESSID").
    'session_name' => 'JSSED_ADMIN',

    // Durée d'inactivité (en secondes) avant déconnexion automatique
    // de l'administrateur. 1800 = 30 minutes.
    'session_idle_timeout' => 1800,

    // Cookie en HTTPS uniquement ? Mettez true en production (recommandé).
    // Mettez false seulement pour des tests en local sans HTTPS.
    'cookie_secure' => true,

    // -----------------------------------------------------------------
    // URL DE BASE
    // -----------------------------------------------------------------
    // URL publique du dossier backend, sans slash final.
    // Ex : "https://www.exemple-jssed.bj/backend".
    'base_url' => 'https://www.exemple-jssed.bj/backend',
];
