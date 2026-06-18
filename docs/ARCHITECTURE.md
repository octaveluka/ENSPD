# Architecture — Plateforme JSSED / ENSPD

Ce document décrit l'architecture technique de la plateforme web de l'**ENSPD
(École Nationale de Statistique, de Planification et de Démographie — Université
de Parakou, Bénin)** et de l'événement **JSSED 2026** (Journées Scientifiques de
la Statistique, de l'Évaluation et de la Démographie).

---

## 1. Vue d'ensemble

La plateforme est volontairement **simple, robuste et bon marché à héberger** :
un **frontend statique** (HTML/CSS/JS, sans build, sans framework) qui consomme,
en JSON, deux **backends PHP 8 + MySQL** indépendants. Aucune dépendance
externe (pas de Composer, pas de Node côté serveur, pas de framework) : tout
tourne sur un hébergement mutualisé cPanel/Apache standard, déployable par FTP.

Principes directeurs :

- **Découplage frontend / backend** : le site reste consultable même si le
  backend est indisponible (les formulaires basculent en mode hors-ligne :
  envoi par e-mail + sauvegarde locale).
- **Zéro dépendance / zéro build** : maintenance facile, surface d'attaque
  réduite, pas de chaîne d'outils à maintenir.
- **Sécurité par défaut** : requêtes préparées, CSRF, rate-limiting, en-têtes de
  sécurité, sessions durcies (voir `docs/SECURITY_AUDIT.md`).

---

## 2. Diagramme de composants (ASCII)

```
                          NAVIGATEUR (visiteur / admin)
        ┌──────────────────────────────────────────────────────────┐
        │  Frontend statique (Apache, fichiers servis tels quels)    │
        │   index.html / enspd.js / shared.css     → site ENSPD      │
        │   jssed.html / jssed.js / jssed.css      → site JSSED 2026 │
        │   bue.html / bue.js / bue.css            → page BUE        │
        └───────────────┬───────────────────────────┬──────────────┘
                        │ fetch() JSON (HTTPS)        │ fetch() JSON
                        ▼                             ▼
        ┌──────────────────────────┐   ┌──────────────────────────┐
        │  backend/  (JSSED 2026)  │   │  backend-enspd/ (ENSPD)   │
        │  PHP 8 + PDO             │   │  PHP 8 + PDO              │
        │                          │   │                          │
        │  api/   (public, GET/POST│   │  api/   (public)         │
        │  api/admin/ (session+CSRF│   │  api/admin/ (session+CSRF│
        │  admin/index.php (UI)    │   │  admin/index.php (UI)    │
        │  src/ db,helpers,cors    │   │  src/ db,helpers,cors    │
        └────────────┬─────────────┘   └────────────┬─────────────┘
                     │ PDO (prepared, emulate=off)    │ PDO
                     ▼                                ▼
        ┌──────────────────────────┐   ┌──────────────────────────┐
        │  MySQL : base JSSED       │   │  MySQL : base ENSPD       │
        │  submissions, registrations,  speakers, program_sessions,│
        │  contacts, admins, rate_limits, audit_log, …             │
        └──────────────────────────┘   └──────────────────────────┘
```

Les deux backends partagent la **même architecture** et les **mêmes helpers**
mais sont **isolés** (dossiers, bases, sessions, configs distincts), ce qui
limite le rayon d'impact d'un incident et autorise des cycles de vie séparés.

---

## 3. Flux de données (exemple : soumission JSSED + affichage du programme)

**Écriture (soumission d'une communication)**

```
1. L'utilisateur remplit le formulaire dans jssed.html
2. jssed.js  → fetch POST  {apiBase}/submit.php   (corps JSON + honeypot + consent)
3. cors.php   pose les en-têtes CORS/sécurité, gère le préflight OPTIONS
4. helpers.php valide (clean_str, valid_email, len_between, word_count)
5. rate_limit_check() vérifie le quota par IP (table rate_limits)
6. db()  → PDO prepared statement → INSERT INTO submissions
7. Réponse JSON 200 {ok:true, ref:"JSSED2026-XXXXXX"}  /  422  /  429
```

**Lecture (programme public)**

```
1. jssed.js → fetch GET {apiBase}/program.php
2. program.php  → SELECT … LEFT JOIN speakers …  ORDER BY jour, ordre
3. Regroupement par jour → JSON {ok:true, days:[{jour, sessions:[…]}]}
4. Le frontend rend le programme (lecture seule, aucune donnée sensible)
```

**Administration**

```
1. admin/index.php (rendu serveur) affiche le formulaire de connexion
2. POST api/admin/login.php → password_verify → session_regenerate_id
3. Le tableau de bord appelle les endpoints admin avec le header X-CSRF-Token
4. Chaque endpoint : require_admin() + csrf_check() + requêtes préparées
5. Actions journalisées dans audit_log
```

---

## 4. Arborescence du dépôt

```
ENSPD_Site/
├── index.html / enspd.js / shared.css      # Site institutionnel ENSPD
├── jssed.html / jssed.js / jssed.css       # Site événement JSSED 2026
├── bue.html / bue.js / bue.css             # Page BUE
├── assets/                                  # logos, campus, galerie
│
├── backend/                 # === Backend JSSED 2026 ===
│   ├── .htaccess            #   en-têtes sécurité + blocages d'accès
│   ├── config.example.php   #   modèle de config (copier → config.php)
│   ├── schema.sql           #   structure + données d'exemple
│   ├── admin/index.php      #   tableau de bord (onglets, CRUD)
│   ├── api/
│   │   ├── submit.php register.php contact.php
│   │   ├── speakers.php program.php          # nouveaux endpoints publics
│   │   └── admin/ (login, submissions, registrations, contacts,
│   │              speakers, program, export, delete_participant, …)
│   ├── bin/create_admin.php #   création d'admin en CLI (haché)
│   └── src/ db.php helpers.php cors.php
│
├── backend-enspd/           # === Backend ENSPD (même architecture, isolé) ===
│   └── (admin/ api/ bin/ src/ schema.sql config.example.php)
│
└── docs/                    # Documentation production (ce dossier)
    ├── ARCHITECTURE.md  SECURITY_AUDIT.md  VULNERABILITIES.md
    ├── DEPLOYMENT.md    SEO_ACCESSIBILITY.md  IMPROVEMENTS.md
```

---

## 5. Les deux backends

| | `backend/` | `backend-enspd/` |
|---|---|---|
| Périmètre | Événement **JSSED 2026** | Site institutionnel **ENSPD** |
| Frontend associé | `jssed.html` / `jssed.js` | `index.html` / `enspd.js` |
| Base MySQL | base JSSED (ex. `jssed2026`) | base ENSPD distincte |
| Sessions | cookie `JSSED_ADMIN` | cookie distinct |
| Tables clés | submissions, registrations, contacts, speakers, program_sessions, admins, rate_limits, audit_log | contenus institutionnels, admins, rate_limits, audit_log |

L'isolation est **délibérée** : configs, bases, cookies et `.htaccess` séparés.
Le code partage les **mêmes patrons** (helpers, contrat de réponse, posture de
sécurité), ce qui réduit le coût d'apprentissage et de maintenance.

---

## 6. Choix techniques et justification

| Choix | Justification |
|-------|---------------|
| **PHP 8 + PDO pur** (pas de framework) | Disponible sur tout hébergement mutualisé francophone (o2switch, LWS, OVH, Hostinger) ; pas de chaîne de build ; surface d'attaque minimale ; maintenance par un développeur junior possible. |
| **MySQL/MariaDB** | Standard cPanel, phpMyAdmin pour l'import/export, sauvegardes triviales. |
| **PDO `emulate_prepares = false`** | Vraies requêtes préparées → protection forte contre l'injection SQL. |
| **Frontend statique sans framework** | Chargement rapide même en connexion lente (contexte Bénin/Afrique de l'Ouest), hébergement trivial, SEO simple. |
| **Mode hors-ligne du formulaire** | Le site reste utile si le backend est down ou pas encore déployé. |
| **utf8mb4 partout** | Support complet des accents français et caractères spéciaux. |
| **Rate-limiting en base (table `rate_limits`)** | Aucune dépendance (pas de Redis) ; fonctionne sur mutualisé. |
| **Rendu serveur de l'admin** | Pas de SPA à builder ; CSRF et sessions natives PHP. |

---

## 7. Scalabilité et maintenabilité

- **Charge attendue** : trafic d'un événement académique (centaines à quelques
  milliers de visiteurs sur la période). Un mutualisé correct suffit ; le
  frontend statique encaisse l'essentiel des requêtes sans toucher PHP/MySQL.
- **Points de montée en charge** : si nécessaire, basculer sur un **VPS**
  (PHP-FPM + OPcache + MariaDB), activer un cache HTTP/CDN devant le statique,
  et indexer davantage MySQL. Le rate-limiting peut migrer vers Redis sans
  changer le contrat des helpers.
- **Maintenabilité** : code commenté en français, contrat de réponse unique
  (`ok` / `error` / `fields`), helpers centralisés (`src/helpers.php`), un seul
  point de connexion DB (`src/db.php`). Ajouter un module = 1 endpoint public +
  1 endpoint admin + 1 table, en copiant un patron existant.

---

## 8. Modularité

Chaque fonctionnalité suit le **même triplet** :

```
schema.sql (table)  →  api/<feature>.php (lecture publique)  →  api/admin/<feature>.php (CRUD op:save/delete/reorder)  →  onglet dans admin/index.php
```

Exemple concret ajouté dans cette version : **Intervenants** (`speakers`) et
**Programme** (`program_sessions`). La couche transverse (CORS, validation,
CSRF, rate-limit, audit) est factorisée dans `src/`, donc un nouveau module
hérite gratuitement de toute la posture de sécurité.
