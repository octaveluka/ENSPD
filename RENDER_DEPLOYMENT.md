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

## Partie 2 — Backend PHP (Web Service)

### Prérequis

Le backend requiert PHP 8.2+ et MySQL 8.0+.  
Render ne supporte pas PHP nativement → utiliser **Docker** ou un hébergeur PHP dédié (OVH, PlanetHoster, Infomaniak).

**Alternative recommandée pour le backend :** utiliser **Railway** ou un hébergeur mutualisé cPanel avec PHP pour le backend, et Render uniquement pour le frontend statique.

### Si Docker sur Render

Créer un `Dockerfile` dans `backend-enspd/` :

```dockerfile
FROM php:8.2-apache
RUN docker-php-ext-install pdo pdo_mysql mysqli
COPY . /var/www/html/
RUN chmod -R 755 /var/www/html
EXPOSE 80
```

---

## Partie 3 — Base de données MySQL

Render propose un service **PostgreSQL** natif mais **pas MySQL**.  
Options recommandées :
- **PlanetScale** (MySQL compatible, plan gratuit)
- **Clever Cloud** (MySQL, datacenter Europe/Afrique)
- **Aiven** (MySQL managé)
- **Railway** (MySQL, simple à configurer)

### Schéma

Exécuter le fichier `backend-enspd/schema.sql` après création de la base.

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

## Fichier `render.yaml` (Infrastructure as Code)

Placer à la racine du dépôt :

```yaml
services:
  # Frontend (Web Service Python — sert les 3 SPAs + proxy /api/chat)
  - type: web
    name: enspd-frontend
    env: python
    buildCommand: ""
    startCommand: "python3 server.py"
    envVars:
      - key: DELFA_API_URL
        value: https://delfaapiai.vercel.app/ai/copilot

  # Backend PHP (si Docker)
  - type: web
    name: enspd-backend
    env: docker
    dockerfilePath: ./backend-enspd/Dockerfile
    plan: starter
    envVars:
      - key: DB_HOST
        sync: false
      - key: DB_NAME
        value: enspd
      - key: DB_USER
        sync: false
      - key: DB_PASS
        sync: false
      - key: ENV
        value: prod
      - key: COOKIE_SECURE
        value: "true"
      - key: SESSION_NAME
        value: ENSPD_ADMIN
      - key: SESSION_IDLE_TIMEOUT
        value: "1800"
      - key: SESSION_SECRET
        sync: false
      - key: BASE_URL
        sync: false
      - key: CORS_ORIGINS
        sync: false
```

---

## Checklist avant mise en ligne

### Frontend
- [ ] URL du backend renseignée dans `enspd.js` → `ENSPD_CONFIG.apiBase`
- [ ] Les 3 sites testés : `index.html`, `bue.html`, `jssed.html`
- [ ] Photos présentes dans `assets/`
- [ ] Logo `assets/logos/Logo_ENSPD.jpg` présent
- [ ] Liens sociaux (Facebook, LinkedIn) vérifiés dans le footer

### Backend
- [ ] Variables d'environnement définies sur Render
- [ ] Base de données créée et `schema.sql` exécuté
- [ ] CORS configuré avec l'URL exacte du frontend
- [ ] Mot de passe admin créé via `backend-enspd/bin/create_admin.php`
- [ ] Photo du Directeur uploadée via l'interface admin
- [ ] `COOKIE_SECURE=true` en production (HTTPS)

### Sécurité
- [ ] `SESSION_SECRET` fort et aléatoire (min. 32 caractères)
- [ ] Mot de passe DB fort (min. 16 caractères, alphanumériqu + spéciaux)
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
