# Guide de déploiement ENSPD sur Render

> Dernière mise à jour : Juillet 2026  
> Auteur : DJOROD_CODING

---

## Architecture à déployer

| Service | Type Render | Dossier | Port |
|---|---|---|---|
| Frontend statique | **Static Site** | `/` (racine) | — |
| Backend PHP | **Web Service** (Docker) | `backend-enspd/` | 10000 |

> **Note :** Clarifier lequel de `backend/` ou `backend-enspd/` est le dossier canonique avant de commencer. Ce guide utilise `backend-enspd/` (version refactorisée).

---

## Partie 1 — Frontend (Static Site)

### Étapes

1. **Connecter le dépôt GitHub** à Render.
2. Créer un service **Static Site**.
3. Configuration :
   - **Build Command** : _(laisser vide — aucun build nécessaire)_
   - **Publish Directory** : `/` _(racine du dépôt)_
   - **Root Directory** : _(laisser vide)_
4. **Headers personnalisés** (dans `render.yaml` ou dashboard) :

```yaml
headers:
  - path: /*
    name: X-Frame-Options
    value: DENY
  - path: /*
    name: X-Content-Type-Options
    value: nosniff
  - path: /*
    name: Referrer-Policy
    value: strict-origin-when-cross-origin
  - path: /*
    name: Content-Security-Policy
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://delfaapiai.vercel.app;"
```

5. **URL du frontend** : sera de la forme `https://enspd.onrender.com` — noter cette URL pour configurer le CORS backend.

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
  # Frontend statique
  - type: web
    name: enspd-frontend
    env: static
    buildCommand: ""
    staticPublishPath: .
    headers:
      - path: /*
        name: X-Frame-Options
        value: DENY
      - path: /*
        name: X-Content-Type-Options
        value: nosniff
      - path: /*
        name: Referrer-Policy
        value: strict-origin-when-cross-origin
    routes:
      - type: rewrite
        source: /*
        destination: /index.html

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
