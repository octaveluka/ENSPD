# Guide de déploiement ENSPD sur Render

> Dernière mise à jour : Juillet 2026  
> Auteur : DJOROD_CODING

---

## Architecture à déployer

| Service | Type Render | Dossier | Port |
|---|---|---|---|
| Frontend (3 SPAs + proxy IA) | **Web Service** (Python) | `/` (racine) | `$PORT` (fourni par Render) |
| Backend PHP | **Web Service** (Docker) | `backend-enspd/` | 10000 |

> **Note :** Clarifier lequel de `backend/` ou `backend-enspd/` est le dossier canonique avant de commencer. Ce guide utilise `backend-enspd/` (version refactorisée).

> ⚠️ **Important** : le frontend n'est **PAS** un simple site statique. Il est
> servi par `server.py` (Python), qui sert les fichiers HTML/CSS/JS **et**
> proxifie `/api/chat` vers l'API Delfa AI côté serveur (pour éviter les
> erreurs CORS du chatbot). Un déploiement en **Static Site** Render romprait
> silencieusement le chatbot IA — il faut impérativement utiliser un
> **Web Service** exécutant `python3 server.py`.

---

## Partie 1 — Frontend (Web Service Python)

### Étapes

1. **Connecter le dépôt GitHub** à Render.
2. Créer un service **Web Service** (pas Static Site).
3. Configuration :
   - **Environment** : `Python 3`
   - **Build Command** : _(laisser vide — aucune dépendance à installer, `server.py` n'utilise que la librairie standard)_
   - **Start Command** : `python3 server.py`
   - **Root Directory** : _(laisser vide — racine du dépôt)_
4. **Variables d'environnement** (Dashboard → Environment) :
   - `PORT` est fourni automatiquement par Render — ne pas le redéfinir manuellement (le code lit déjà `PORT` depuis l'environnement, avec repli sur `5000` en local).
   - `DELFA_API_URL` (optionnel) : ne définir que si vous changez de fournisseur d'API IA. Valeur par défaut : `https://delfaapiai.vercel.app/ai/copilot`.
5. **Headers de sécurité** : `server.py` étant un serveur Python personnalisé (pas un CDN statique Render), les en-têtes de sécurité (CSP, X-Frame-Options...) doivent être ajoutés directement dans `server.py` (méthode `send_header`) plutôt que via `render.yaml` → `headers:` (cette directive ne s'applique qu'aux services de type `static`).
6. **URL du frontend** : sera de la forme `https://enspd.onrender.com` — noter cette URL pour configurer le CORS backend.

---

## Partie 2 — Backend PHP (Web Service Docker, tout-en-un)

### ✅ Aucune base de données externe à configurer

`backend-enspd/Dockerfile` est **prêt à l'emploi** : l'image embarque
**son propre serveur MySQL** en plus de PHP/Apache. Au premier démarrage
du conteneur, le script `docker/entrypoint.sh` :

1. initialise MySQL (si le volume est vide) ;
2. crée la base `DB_NAME` et l'utilisateur `DB_USER`/`DB_PASS` (à partir
   des variables d'environnement, `DB_HOST=localhost`) ;
3. importe `schema.sql` (idempotent — `CREATE TABLE IF NOT EXISTS`) ;
4. crée un compte admin par défaut si la table `admins` est vide :
   **`admin@enspd.bj` / `EnspdAdmin2026!`** (⚠️ à changer immédiatement
   après la première connexion, depuis le tableau de bord) ;
5. démarre Apache sur le port `$PORT` fourni par Render.

Ce Dockerfile a été **testé de bout en bout localement** (build + run +
requêtes HTTP sur `/api/settings.php` et `/admin/`) et fonctionne tel
quel.

### Étapes sur Render

1. **New +** → **Web Service** → connecter le dépôt.
2. **Environment** : `Docker`.
3. **Root Directory** : `backend-enspd`.
4. **Dockerfile Path** : `backend-enspd/Dockerfile` (ou laissez Render le
   détecter automatiquement dans le dossier racine choisi).
5. **Plan** : **Free** (aucune carte bancaire requise).
6. Ajouter les variables d'environnement (section suivante).

### ⚠️ Plan gratuit : ce que ça implique concrètement

Le plan gratuit Render fonctionne très bien pour ce projet, avec deux
particularités à connaître (pas de mauvaise surprise) :

1. **Pas de disque persistant.** Sur le plan gratuit, on ne peut pas
   attacher de "Disk" à `/var/lib/mysql`. Résultat : les données créées
   depuis l'interface admin (actualités, événements, photos de galerie,
   messages de contact, mot de passe admin changé...) sont
   **réinitialisées à chaque redéploiement** du service backend (nouveau
   commit poussé, ou redémarrage manuel). Le compte admin par défaut
   (`admin@enspd.bj` / `EnspdAdmin2026!`) et le schéma sont recréés
   automatiquement à chaque fois — donc le site ne casse jamais, mais le
   contenu ajouté entre-temps ne survit pas à un redéploiement.
   → Si un jour le contenu doit être permanent, il suffira de passer au
   plan **Starter** (7 $/mois) et de réactiver le disque (voir section
   "Disk" commentée dans `render.yaml`).
2. **Mise en veille après inactivité.** Un service gratuit s'endort après
   15 minutes sans requête, et met ~30-50 secondes à se "réveiller" au
   premier visiteur suivant. Normal sur ce plan, pas un bug.

---

## Variables d'environnement

### Comment les définir sur Render

Dashboard → Service → **Environment** → Add Environment Variable

> 📄 La liste complète, prête à copier-coller (avec valeurs d'exemple), est
> disponible dans **`render-env-variables.txt`** à la racine du dépôt.
> Ces variables sont lues en **priorité absolue** par `backend*/src/db.php`
> (fonction `getenv()`) : si elles sont définies, `config.php` n'est même
> plus nécessaire sur le serveur de production — seul un `config.php` de
> secours (non commité) est requis en local si vous ne voulez pas utiliser
> de variables d'environnement en développement.

### 1. Base de données MySQL

| Variable | Valeur par défaut | Description |
|---|---|---|
| `DB_HOST` | `localhost` | Hôte MySQL (ex: `mysql.railway.app`) |
| `DB_NAME` | `enspd` | Nom de la base de données |
| `DB_USER` | `enspd_user` | Utilisateur MySQL |
| `DB_PASS` | _(à définir)_ | ⚠️ Mot de passe fort obligatoire |
| `DB_PORT` | `3306` | Port MySQL |

### 2. Environnement d'exécution

| Variable | Valeur par défaut | Description |
|---|---|---|
| `ENV` | `prod` | Mode : `prod` ou `dev` |

### 3. Configuration CORS

| Variable | Valeur par défaut | Description |
|---|---|---|
| `CORS_ORIGINS` | `https://enspd.onrender.com` | URL exacte du frontend Render |

> ⚠️ Mettre l'URL réelle de votre frontend Render (ex: `https://enspd-site.onrender.com`).

### 4. Sessions d'administration

| Variable | Valeur par défaut | Description |
|---|---|---|
| `SESSION_NAME` | `ENSPD_ADMIN` | Nom du cookie de session |
| `SESSION_SECRET` | _(utiliser le secret Replit)_ | Secret de signature de session |
| `SESSION_IDLE_TIMEOUT` | `1800` | Délai inactivité en secondes (30 min) |
| `COOKIE_SECURE` | `true` | HTTPS uniquement (`true` en prod) |

### 5. URL de base

| Variable | Valeur par défaut | Description |
|---|---|---|
| `BASE_URL` | `https://enspd-parakou.bj/backend-enspd` | URL publique du backend |

> En production sur Render : `https://enspd-backend.onrender.com`

### 6. API IA (optionnel)

| Variable | Valeur | Description |
|---|---|---|
| `DELFA_API_URL` | `https://delfaapiai.vercel.app/ai/copilot` | URL de l'API IA chatbot |

---

## Fichier `render.yaml` (Infrastructure as Code — déploiement en un clic)

Un fichier `render.yaml` est **déjà présent à la racine du dépôt**, avec
les deux services préconfigurés (frontend Python + backend Docker
tout-en-un avec disque persistant pour MySQL). Pour l'utiliser :

1. Sur Render : **New +** → **Blueprint**.
2. Connecter ce dépôt GitHub.
3. Render détecte `render.yaml` et propose de créer les 2 services
   automatiquement, avec toutes les variables d'environnement déjà
   renseignées.
4. Cliquer **Apply** — c'est tout.

> ⚠️ Le fichier contient déjà `DB_PASS=CHANGEZ_MOI` (placeholder) et le
> vrai `SESSION_SECRET` fourni lors de la configuration initiale. Ces
> valeurs sont commitées dans le dépôt : ce n'est pas une pratique de
> sécurité idéale (n'importe qui ayant accès au code source les voit),
> mais cela permet un déploiement en un clic comme demandé. **Avant la
> mise en ligne réelle**, changez au minimum `DB_PASS` pour un mot de
> passe fort, directement dans le Dashboard Render (Environment) — cela
> ne nécessite pas de modifier le code.

---

## Checklist avant mise en ligne

### Frontend
- [ ] URL du backend renseignée dans `enspd.js` → `ENSPD_CONFIG.apiBase`
- [ ] Les 3 sites testés : `index.html`, `bue.html`, `jssed.html`
- [ ] Photos présentes dans `assets/`
- [ ] Logo `assets/logos/Logo_ENSPD.jpg` présent
- [ ] Liens sociaux (Facebook, LinkedIn) vérifiés dans le footer

### Backend
- [x] Variables d'environnement définies (déjà dans `render.yaml`)
- [x] Base de données + schéma créés automatiquement au démarrage du conteneur
- [ ] `CORS_ORIGINS` mis à jour avec l'URL réelle du frontend si différente
- [x] Compte admin par défaut créé automatiquement (`admin@enspd.bj` / `EnspdAdmin2026!`)
- [ ] **Changer le mot de passe admin par défaut dès la première connexion**
- [ ] Photo du Directeur uploadée via l'interface admin
- [ ] `COOKIE_SECURE=true` en production (HTTPS) — déjà configuré
- [x] Plan **Free** choisi (pas de carte bancaire) — sachant que le contenu admin repart à zéro à chaque redéploiement (voir "Plan gratuit" ci-dessus)

### Sécurité
- [ ] Remplacer `DB_PASS=CHANGEZ_MOI` par un mot de passe fort (min. 16 caractères) dans le Dashboard Render
- [ ] `SESSION_SECRET` régénéré si le dépôt a été rendu public (celui commité dans `render.yaml` a été partagé lors de la configuration)
- [ ] Headers de sécurité vérifiés via https://securityheaders.com
- [ ] HTTPS actif (Render le gère automatiquement)

---

## Connexion frontend ↔ backend

Dans `enspd.js`, modifier la ligne 8 :

```javascript
// Avant (mode statique, pas de backend) :
const ENSPD_CONFIG = { apiBase: '' };

// Après (avec backend Render) :
const ENSPD_CONFIG = { apiBase: 'https://enspd-backend.onrender.com' };
```

---

## Support

- Documentation Render : https://render.com/docs
- Backend ENSPD : voir `backend-enspd/README.md`
- Contact développeur : rodriguedjossou93@gmail.com
