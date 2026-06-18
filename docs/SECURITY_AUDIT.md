# Audit de sécurité — Plateforme JSSED / ENSPD

**Périmètre** : backends `backend/` (JSSED 2026) et `backend-enspd/` (ENSPD),
frontend statique, hébergement mutualisé Apache + MySQL.
**Méthode** : revue de code manuelle des fichiers PHP, des en-têtes (`.htaccess`,
`src/cors.php`) et de la configuration ; analyse par catégorie d'attaque.
**Statut global** : posture **solide pour un mutualisé**. Les protections de
base sont implémentées dans le code. Les points résiduels relèvent surtout de la
**configuration de déploiement** (HTTPS, CORS, headers Apache) et de quelques
durcissements recommandés (voir `docs/VULNERABILITIES.md`).

---

## 1. Modèle de menace

| Actif | Menace principale |
|-------|-------------------|
| Données personnelles (participants : nom, e-mail, téléphone, institution) | Exfiltration (injection, IDOR), divulgation |
| Comptes administrateurs | Force brute, vol de session, CSRF |
| Intégrité des contenus (soumissions, programme, intervenants) | Modification non autorisée |
| Disponibilité du service | Abus / spam de formulaires, déni de service applicatif |

**Acteurs** : robots de spam, attaquants opportunistes (scanners automatisés),
attaquant ciblé cherchant les données ou l'accès admin.
**Surfaces** : endpoints publics `api/*.php` (GET/POST), endpoints admin
`api/admin/*.php`, tableau de bord `admin/index.php`, fichiers statiques.

---

## 2. Analyse par catégorie d'attaque

### 2.1 Injection SQL
- **Statut : Mitigé (fort).**
- **Mitigation** : toute la couche d'accès passe par `src/db.php`, qui crée un
  PDO avec `PDO::ATTR_EMULATE_PREPARES => false` (vraies requêtes préparées) et
  `ERRMODE_EXCEPTION`. **Toutes** les requêtes des endpoints utilisent des
  marqueurs nommés (`:param`) et `execute([...])` / `bindValue()` — voir
  `api/submit.php`, `api/admin/submissions.php`, `api/admin/speakers.php`,
  `api/admin/program.php`. Les fragments dynamiques (filtres `WHERE`) sont
  construits à partir de **listes blanches** (statuts, types) et jamais à partir
  d'entrées brutes.
- **Risque résiduel** : faible. Toute évolution doit conserver la règle « jamais
  de concaténation de variable utilisateur dans le SQL ».

### 2.2 XSS (Cross-Site Scripting)
- **Statut : Mitigé.**
- **Mitigation** : côté admin rendu serveur, toute valeur issue de la base est
  passée par `escape()` (`htmlspecialchars(ENT_QUOTES|ENT_SUBSTITUTE, UTF-8)`,
  défini dans `src/helpers.php`). Côté JS du tableau de bord, une fonction
  `esc()` échappe `& < > " '` avant insertion via `innerHTML`. Les endpoints
  publics renvoient du **JSON** (`Content-Type: application/json`,
  `X-Content-Type-Options: nosniff`), pas du HTML. Une **CSP** est posée par
  `.htaccess` (`default-src 'self'`, `frame-ancestors 'none'`).
- **Risque résiduel** : la CSP admin autorise `'unsafe-inline'` (styles/scripts
  internes au dashboard). Acceptable car pas d'entrée tierce injectée dans le
  document admin, mais à resserrer si l'on externalise les scripts.

### 2.3 CSRF (Cross-Site Request Forgery)
- **Statut : Mitigé (fort) sur l'admin.**
- **Mitigation** : jeton CSRF par session (`csrf_token()`), vérifié par
  `csrf_check()` sur **chaque POST admin** (`submissions`, `registrations`,
  `contacts`, `speakers`, `program`, `delete_participant`, `logout`). Le jeton
  est transmis via l'en-tête `X-CSRF-Token` et comparé en temps constant
  (`hash_equals`). Cookie de session en `SameSite=Lax`. Régénération du jeton à
  la connexion (`unset($_SESSION['csrf'])`).
- **Risque résiduel** : faible. Les endpoints **publics** (submit/register/
  contact) ne portent pas de CSRF par conception (formulaires anonymes) ; ils
  sont protégés par honeypot + rate-limit + consentement.

### 2.4 Clickjacking
- **Statut : Mitigé.**
- **Mitigation** : `X-Frame-Options: DENY` posé à la fois par `src/cors.php` et
  par `.htaccess`, plus `frame-ancestors 'none'` dans la CSP. Le tableau de bord
  est en `noindex, nofollow`.
- **Risque résiduel** : négligeable (sous réserve que `mod_headers` soit actif).

### 2.5 Upload de fichiers
- **Statut : Non applicable (par conception) / Recommandation.**
- **Analyse** : la plateforme **n'expose aucun endpoint d'upload**. Le champ
  `photo` des intervenants stocke une **chaîne** (URL/chemin VARCHAR(255)), pas
  un fichier téléversé. Surface d'attaque d'upload donc **nulle** aujourd'hui.
- **Risque résiduel** : si un upload est ajouté plus tard (photos, PDF de
  résumés), appliquer : validation MIME réelle, extension en liste blanche,
  stockage hors web-root, renommage aléatoire, taille limitée, `.htaccess`
  interdisant l'exécution PHP dans le dossier d'upload.

### 2.6 Force brute (authentification)
- **Statut : Mitigé.**
- **Mitigation** : `api/admin/login.php` applique `rate_limit_check($ip,'login',
  5, 900)` → 5 tentatives / 15 min / IP (HTTP 429 au-delà). Mots de passe
  stockés via `password_hash` (bcrypt) et vérifiés via `password_verify`
  (comparaison à temps constant). Réponses d'erreur génériques (« Identifiants
  invalides ») pour ne pas distinguer e-mail inconnu / mot de passe faux.
- **Risque résiduel** : le rate-limit est **par IP** ; un attaquant disposant de
  nombreuses IP pourrait le contourner partiellement. Recommandation : ajouter
  un verrouillage par compte et/ou un facteur 2FA pour les admins (voir
  VULNERABILITIES).

### 2.7 Fixation / vol de session
- **Statut : Mitigé.**
- **Mitigation** : `session_regenerate_id(true)` après connexion réussie
  (`login.php`). Cookies de session `httponly`, `secure` (si `cookie_secure` =
  true), `SameSite=Lax`, nom de cookie personnalisé (`JSSED_ADMIN`, pas
  `PHPSESSID`). Expiration par **inactivité** (`session_idle_timeout`, 30 min)
  vérifiée dans `require_admin()`. Déconnexion propre (`admin_logout()` détruit
  session + cookie).
- **Risque résiduel** : faible, conditionné à HTTPS + `cookie_secure = true` en
  prod (à valider au déploiement).

### 2.8 IDOR (Insecure Direct Object Reference)
- **Statut : Mitigé.**
- **Mitigation** : tous les endpoints admin appellent `require_admin()` avant
  toute opération ; il n'existe pas d'endpoint public retournant des données
  individuelles par identifiant arbitraire. Les endpoints publics `speakers.php`
  / `program.php` ne renvoient que des **données publiques** (programme,
  intervenants), jamais de données personnelles de participants. Les soumissions
  / inscriptions ne sont **jamais** exposées publiquement par référence.
- **Risque résiduel** : faible. Veiller à ne jamais créer d'endpoint public
  « consulter ma soumission par ref » sans authentification/jeton signé.

### 2.9 Divulgation d'informations
- **Statut : Mitigé (sous condition de config).**
- **Mitigation** : en `env = prod`, les messages d'erreur SQL détaillés sont
  masqués (`src/db.php` renvoie un message générique ; le détail n'apparaît
  qu'en `env = dev`). Les endpoints capturent les exceptions et répondent
  `{ok:false,error:"server"}` sans stack trace. `.htaccess` **interdit** l'accès
  HTTP à `config.php`, `*.example.php`, `*.local.php`, `*.sql`, `*.md`, `*.log`,
  `*.ini`, et **désactive l'autoindex** (`Options -Indexes`). Les dossiers
  `src/` et `bin/` ont leur propre `.htaccess` « tout interdire ».
- **Risque résiduel** : dépend de la mise en prod (`env=prod`, `display_errors`
  off côté serveur). À vérifier (voir checklist).

### 2.10 Sécurité du transport (TLS)
- **Statut : Recommandation (dépend de l'hébergeur).**
- **Mitigation** : `cookie_secure` activable ; CORS restreint aux origines
  HTTPS ; `Referrer-Policy: strict-origin-when-cross-origin`. Le code est prêt
  pour HTTPS.
- **Risque résiduel** : HTTPS et redirection HTTP→HTTPS + **HSTS** doivent être
  configurés au déploiement (Let's Encrypt + `.htaccess`/cPanel). Voir
  `docs/DEPLOYMENT.md` et `docs/VULNERABILITIES.md`.

### 2.11 Abus / spam des formulaires
- **Statut : Mitigé.**
- **Mitigation** : **honeypot** (`is_spam_honeypot()` — champ caché `website`)
  renvoyant une fausse réussite sans rien écrire ; **rate-limiting** par IP sur
  submit/register/contact (5 / 10 min) ; **consentement** obligatoire.
- **Risque résiduel** : spam distribué massif → envisager un challenge léger
  (question simple) ou un service anti-bot sans cookies tiers si besoin.

### 2.12 CORS
- **Statut : Mitigé (à configurer).**
- **Mitigation** : `src/cors.php` n'autorise que les origines listées dans
  `config.php` (`cors_origins`), avec `Vary: Origin` et préflight contrôlé ;
  origine inconnue → pas d'en-tête CORS (le navigateur bloque la lecture), et
  `OPTIONS` non autorisé renvoie 403. Pas de wildcard `*` avec credentials.
- **Risque résiduel** : si `cors_origins` est laissé trop large ou contient une
  origine HTTP en prod, exposition élargie. À verrouiller au déploiement.

---

## 3. Checklist de durcissement (déploiement / exploitation)

- [ ] HTTPS actif + redirection HTTP→HTTPS + **HSTS** (`Strict-Transport-Security`).
- [ ] `config.php` : `env = prod`, `cookie_secure = true`.
- [ ] `cors_origins` limité aux domaines réels en **HTTPS** uniquement.
- [ ] `display_errors = Off` et `log_errors = On` côté serveur (php.ini / `.user.ini`).
- [ ] Vérifier que `config.php`, `*.sql`, `src/`, `bin/` sont **inaccessibles** en HTTP.
- [ ] `mod_headers` actif (les en-têtes de sécurité s'appliquent réellement).
- [ ] Mot de passe admin fort (≥ 12 caractères recommandé) via `bin/create_admin.php`.
- [ ] Ajouter les en-têtes manquants : **HSTS**, **Permissions-Policy** (voir VULNERABILITIES).
- [ ] Sauvegardes chiffrées et testées (DB + fichiers) — voir DEPLOYMENT.
- [ ] Surveillance des logs d'accès/erreurs ; envisager fail2ban (VPS).
- [ ] Purge/anonymisation des données personnelles après l'événement (RGPD).
- [ ] (Recommandé) 2FA admin et verrouillage par compte en plus du rate-limit IP.
