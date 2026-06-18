# Déploiement en production — JSSED / ENSPD

Cible : **hébergement mutualisé cPanel + Apache + MySQL** (cas par défaut),
avec une variante **VPS** en fin de document. Déploiement par **FTP** ou
**Gestionnaire de fichiers cPanel**. Aucune chaîne de build requise.

---

## 1. Pré-requis

- Hébergement **PHP 8.0+** et **MySQL/MariaDB**, avec **phpMyAdmin**.
- Accès **FTP/SFTP** ou Gestionnaire de fichiers cPanel.
- Un **nom de domaine** (ex. `enspd-up.bj`, `jssed.enspd-up.bj`).
- **HTTPS** disponible (Let's Encrypt gratuit dans cPanel — « SSL/TLS Status »).
- Idéalement un accès **SSH / Terminal cPanel** (pour créer le premier admin).
- Module Apache **`mod_headers`** actif (par défaut sur la plupart des cPanel).

---

## 2. Étapes pas-à-pas (cPanel / Apache)

### 2.1 Téléverser les fichiers
1. Frontend : copier `index.html`, `enspd.js`, `shared.css`, `jssed.html`,
   `jssed.js`, `jssed.css`, `bue.*`, `assets/` dans `public_html/`.
2. Backends : copier le dossier `backend/` dans `public_html/backend/` et, si
   utilisé, `backend-enspd/` dans `public_html/backend-enspd/`.

### 2.2 Créer les bases MySQL
1. cPanel → **MySQL Databases** : créer une base (ex. `cpaneluser_jssed2026`).
2. Créer un **utilisateur MySQL** + mot de passe fort.
3. **Ajouter l'utilisateur à la base** avec **All Privileges**.
4. Répéter pour ENSPD si `backend-enspd/` est déployé (base + utilisateur dédiés).

### 2.3 Importer le schéma (migration initiale)
1. phpMyAdmin → sélectionner la base → onglet **Importer**.
2. Choisir `backend/schema.sql` → **Exécuter**.
3. Vérifier les tables : `submissions`, `registrations`, `contacts`, `admins`,
   `rate_limits`, `audit_log`, **`speakers`**, **`program_sessions`**
   (ces deux dernières sont pré-remplies de données d'exemple JSSED 2026).
4. Le `schema.sql` est **idempotent** (`CREATE TABLE IF NOT EXISTS` + inserts
   conditionnels) : on peut le réimporter sans dupliquer les données.

> **Migrations ultérieures** : pour ajouter une colonne/table, écrire un petit
> script SQL incrémental (ex. `migrations/2026-09-xx_add_xxx.sql`) et l'exécuter
> via phpMyAdmin. Toujours **sauvegarder avant** (section 6).

### 2.4 Configurer `config.php`
1. Copier `backend/config.example.php` → `backend/config.php`.
2. Renseigner : `db_host` (souvent `localhost`), `db_name`, `db_user`,
   `db_pass`, `db_port`.
3. **`env` → `prod`**.
4. **`cors_origins`** → l'origine HTTPS **exacte** du frontend
   (ex. `https://jssed.enspd-up.bj`). Pas de slash final, pas de HTTP.
5. **`cookie_secure` → `true`** (HTTPS requis).
6. `base_url` → URL publique du backend (ex. `https://jssed.enspd-up.bj/backend`).
7. Répéter pour `backend-enspd/config.php` le cas échéant.

Champs de `config.php` :

| Champ | Exemple | Rôle |
|-------|---------|------|
| `db_host` | `localhost` | hôte MySQL |
| `db_name` | `cpaneluser_jssed2026` | base |
| `db_user` / `db_pass` | … | identifiants MySQL |
| `db_port` | `3306` | port |
| `env` | `prod` | masque les erreurs détaillées |
| `cors_origins` | `['https://jssed.enspd-up.bj']` | origines autorisées |
| `session_name` | `JSSED_ADMIN` | nom du cookie admin |
| `session_idle_timeout` | `1800` | déconnexion inactivité (s) |
| `cookie_secure` | `true` | cookie HTTPS only |
| `base_url` | `https://jssed.enspd-up.bj/backend` | URL backend |

### 2.5 Relier le frontend
Dans `jssed.js`, régler `JSSED_CONFIG.apiBase` sur `…/backend/api`
(et la `eventDate` si connue). Laisser vide active le mode hors-ligne.

### 2.6 Créer le premier administrateur
Via SSH / Terminal cPanel, dans `backend/` :
```bash
php bin/create_admin.php  admin@enspd-up.bj  "Direction JSSED"
```
Le script demande le mot de passe (≥ 10 caractères ; **viser ≥ 12**) et le
stocke **haché**. Il refuse de s'exécuter via le web.

### 2.7 HTTPS, redirection et HSTS
1. cPanel → **SSL/TLS Status** → installer/activer Let's Encrypt sur les domaines.
2. Forcer HTTP→HTTPS (cPanel « Force HTTPS Redirect » ou `.htaccess` racine) :
   ```apache
   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```
3. Ajouter HSTS (après avoir confirmé que tout fonctionne en HTTPS), dans le
   `.htaccess` (idéalement racine) :
   ```apache
   <IfModule mod_headers.c>
     Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
     Header always set Permissions-Policy "geolocation=(), camera=(), microphone=()"
   </IfModule>
   ```

### 2.8 Permissions de fichiers
- Dossiers : **750** (ou 755 si l'hébergeur l'exige) ; fichiers : **640/644**.
- `backend/config.php` : **600/640** (lisible seulement par l'utilisateur web).
- `backend/logs/` : inscriptible par PHP, **non listable** (déjà `Options -Indexes`).
- Vérifier que `config.php`, `*.sql`, `src/`, `bin/` renvoient **403** en HTTP.

### 2.9 Réglages PHP (php.ini / `.user.ini`)
```ini
display_errors = Off
log_errors = On
error_log = /home/cpaneluser/php_errors.log
expose_php = Off
session.cookie_httponly = 1
session.cookie_secure = 1
session.cookie_samesite = "Lax"
```

---

## 3. Vérifications post-déploiement (smoke tests)

- [ ] Page d'accueil et `jssed.html` s'affichent en **HTTPS** (cadenas).
- [ ] `GET …/backend/api/program.php` renvoie du JSON `{ok:true,days:[…]}`.
- [ ] `GET …/backend/api/speakers.php` renvoie les intervenants d'exemple.
- [ ] Soumission test d'un formulaire → 200 + référence.
- [ ] 6 soumissions rapides → la 6ᵉ renvoie **429** (rate-limit OK).
- [ ] Connexion admin → tableau de bord ; onglets Intervenants/Programme actifs.
- [ ] `…/backend/config.php`, `…/backend/schema.sql`, `…/backend/src/db.php`
      renvoient **403**.

---

## 4. Surveillance (monitoring)

- **Disponibilité (uptime)** : sonde externe (UptimeRobot, BetterStack, ou cron
  `curl` qui alerte par e-mail) sur la home et sur `…/api/program.php`.
- **Logs d'erreurs** : surveiller `error_log` PHP et les logs Apache
  (`access_log`, `error_log`) via cPanel → « Errors » / « Raw Access ».
- **Sécurité** : sur VPS, **fail2ban** sur les logs Apache + tentatives de login ;
  sur mutualisé, activer **ModSecurity** si proposé par l'hébergeur.
- **Base** : surveiller la taille de `rate_limits` et `audit_log` (purge si gros).
- **Quotas** : surveiller espace disque et quota MySQL de l'hébergement.

---

## 5. Sauvegarde (backup)

**Base de données — dump planifié (cron cPanel)** :
```bash
# Sauvegarde quotidienne à 02:30, rétention 14 jours
30 2 * * * mysqldump -u DBUSER -pDBPASS DBNAME | gzip > \
  /home/cpaneluser/backups/db_$(date +\%F).sql.gz && \
  find /home/cpaneluser/backups -name 'db_*.sql.gz' -mtime +14 -delete
```
**Fichiers** :
```bash
# Sauvegarde hebdo des fichiers (hors caches), rétention 8 semaines
0 3 * * 0 tar czf /home/cpaneluser/backups/files_$(date +\%F).tar.gz \
  -C /home/cpaneluser public_html && \
  find /home/cpaneluser/backups -name 'files_*.tar.gz' -mtime +56 -delete
```
**Bonnes pratiques** :
- Stocker une copie **hors hébergeur** (téléchargement périodique, ou stockage
  objet distant). Ne pas garder l'unique copie sur le même serveur.
- **Chiffrer** les sauvegardes contenant des données personnelles.
- **Tester la restauration** régulièrement (un backup non testé = pas de backup).
- Inclure `config.php` dans une sauvegarde **séparée et sécurisée** (secrets).

---

## 6. Restauration / rollback

**Rollback applicatif** : conserver l'archive de la version précédente du
backend ; en cas de régression, re-téléverser l'ancienne version (déploiement
atomique : téléverser dans `backend_new/` puis renommer).

**Restauration base** :
```bash
gunzip < /home/cpaneluser/backups/db_2026-09-15.sql.gz | \
  mysql -u DBUSER -pDBPASS DBNAME
```
**Procédure recommandée avant toute migration** : (1) `mysqldump` complet,
(2) appliquer la migration, (3) smoke tests, (4) en cas d'échec, restaurer le
dump et revenir à la version de code précédente.

---

## 7. Recommandations d'hébergement (Bénin / Afrique francophone)

| Hébergeur | Type | Pourquoi |
|-----------|------|----------|
| **o2switch** (FR) | Mutualisé illimité | Excellent rapport qualité/prix, cPanel, PHP 8, Let's Encrypt, support FR réactif. Idéal pour ce projet. |
| **LWS** (FR) | Mutualisé / VPS | Offres francophones, cPanel/Plesk, bon pour budgets serrés. |
| **Hostinger** | Mutualisé / VPS | Bon marché, panneau simple, datacenters proches (Europe). |
| **OVHcloud** (FR) | Mutualisé / VPS / dédié | Large gamme, montée en VPS facile, présence FR forte. |
| **VPS (OVH / Hetzner / Contabo)** | VPS | Pour montée en charge ou besoins avancés (PHP-FPM + OPcache + MariaDB + fail2ban + Nginx/Apache). |

**Latence Bénin** : privilégier un datacenter **Europe de l'Ouest** (Paris) pour
un bon compromis latence/coût ; activer la compression (gzip/brotli) et le cache
des fichiers statiques pour les connexions lentes.

**Variante VPS (résumé)** : Ubuntu LTS + Apache/Nginx + PHP-FPM 8 (OPcache) +
MariaDB + Certbot (HTTPS auto) + UFW + fail2ban ; déploiement par `git pull` ou
rsync ; mêmes étapes de config/migration ci-dessus.
