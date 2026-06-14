# Backend ENSPD — Guide de déploiement

Backend **PHP 8 + MySQL** pour le site institutionnel de l'**École Nationale de
Statistique, de Planification et de Démographie (ENSPD)** — **Université de
Parakou (Bénin)**.

Ce backend permet à l'administration de gérer le contenu du site (actualités,
événements, galerie, paramètres) **côté serveur** une fois le site hébergé sur un
domaine. Le site statique frontend (`index.html` / `shared.css` / `enspd.js`) peut
ensuite **lire ce contenu en direct** via des endpoints JSON en lecture seule.

Aucune dépendance externe : PHP pur + PDO (pas de Composer, pas de framework).
Conçu pour un hébergement mutualisé bon marché (cPanel / Apache + MySQL,
déploiement par FTP).

> Ce backend est **indépendant** du backend `backend/` (plateforme JSSED). Il
> reprend la même architecture et le même niveau de sécurité.

---

## 1. Prérequis

- Un hébergement avec **PHP 8.0 ou plus** et **MySQL / MariaDB**.
- Accès à **phpMyAdmin** (fourni par la plupart des cPanel).
- Un accès **FTP** (ou le gestionnaire de fichiers cPanel) pour téléverser les fichiers.
- Idéalement **HTTPS** activé sur le domaine (certificat Let's Encrypt gratuit dans cPanel).
- Pour créer le premier administrateur : un accès **SSH** ou le « Terminal » de cPanel
  (pour lancer une commande `php`).

---

## 2. Téléverser les fichiers

Copiez tout le dossier `backend-enspd/` dans votre hébergement, par exemple sous
`public_html/backend-enspd/`. L'URL publique du backend sera alors par exemple :

```
https://votre-domaine.bj/backend-enspd
```

Structure :

```
backend-enspd/
├── .htaccess              # sécurité Apache (en-têtes, blocages d'accès)
├── .gitignore
├── README.md
├── schema.sql             # structure de la base de données
├── config.example.php     # modèle de configuration (à copier)
├── config.php             # VOTRE configuration (à créer, NON versionnée)
├── admin/
│   └── index.php          # tableau de bord d'administration
├── api/
│   ├── actualites.php     # GET public : actualités publiées (+ images)
│   ├── evenements.php     # GET public : événements (à venir / passés)
│   ├── galerie.php        # GET public : galerie groupée par catégorie
│   ├── settings.php       # GET public : paramètres (annonce, directeur…)
│   ├── contact.php        # POST public : formulaire de contact
│   └── admin/             # API d'administration (session + CSRF)
│       ├── login.php  logout.php  me.php
│       ├── actualites.php  evenements.php  galerie.php
│       ├── contacts.php  settings.php  export.php
├── bin/
│   └── create_admin.php   # script CLI de création d'administrateur
├── src/
│   ├── db.php             # connexion PDO
│   ├── helpers.php        # validation, CSRF, rate-limit, etc.
│   └── cors.php           # en-têtes CORS et sécurité
└── logs/
```

Les dossiers `src/`, `bin/` et `logs/` sont **inaccessibles depuis le web**
(protégés par `.htaccess`). Seuls `api/` et `admin/` doivent être joignables.

---

## 3. Créer la base de données et importer le schéma

1. Dans **cPanel → Bases de données MySQL** :
   - créez une base, par ex. `moncpanel_enspd` ;
   - créez un utilisateur MySQL avec un mot de passe fort ;
   - **ajoutez l'utilisateur à la base** avec **tous les privilèges**.
2. Ouvrez **phpMyAdmin**, sélectionnez la base à gauche.
3. Onglet **Importer** → **Choisir un fichier** → sélectionnez `backend-enspd/schema.sql`
   → bouton **Importer / Exécuter**.
4. Vous devez voir apparaître les tables : `actualites`, `actualite_images`,
   `evenements`, `galerie`, `contacts`, `settings`, `admins`, `rate_limits`,
   `audit_log`.

---

## 4. Configurer (`config.php`)

1. **Copiez** `config.example.php` en `config.php` (même dossier `backend-enspd/`).
2. Ouvrez `config.php` et remplissez :
   - `db_host` (souvent `localhost`), `db_name`, `db_user`, `db_pass` ;
   - `env` → `prod` en production ;
   - `cors_origins` → l'origine **exacte** de votre site frontend
     (ex. `https://votre-domaine.bj`). Si frontend et backend sont sur le **même
     domaine**, vous pouvez laisser le tableau vide ;
   - `cookie_secure` → `true` si vous êtes en HTTPS (recommandé) ;
   - `base_url` → l'URL publique du dossier backend (ex. `https://votre-domaine.bj/backend-enspd`).

> `config.php` contient vos secrets : il est **ignoré par Git** et **bloqué en accès
> web** par `.htaccess`. Ne le partagez jamais.

---

## 5. Créer le premier administrateur

Via **SSH** ou le **Terminal cPanel**, placez-vous dans le dossier `backend-enspd/` :

```bash
php bin/create_admin.php  admin@enspd.bj  "Direction ENSPD"
```

Le script demande (et confirme) le mot de passe, puis l'enregistre **haché**
(`password_hash`). Mot de passe : **10 caractères minimum**.

Vous pouvez préciser un rôle `editor` :

```bash
php bin/create_admin.php  redac@enspd.bj  "Rédaction"  editor
```

> Le script **refuse de s'exécuter via le web** : il ne fonctionne qu'en ligne de
> commande. Si vous n'avez aucun accès CLI, contactez votre hébergeur ou exécutez
> la commande depuis un poste local connecté à la même base.

Connectez-vous ensuite au tableau de bord :

```
https://votre-domaine.bj/backend-enspd/admin/
```

---

## 6. Tableau de bord d'administration

- **Actualités** : création / modification / suppression, brouillon ou publié,
  **gestion de plusieurs photos** par actualité (ajout / retrait).
- **Événements** : agenda (à venir / passés), création / modification / suppression.
- **Galerie** : ajout / modification / suppression de photos, classement par
  catégorie et par position.
- **Messages** : liste des messages de contact, marquage « traité », suppression
  (droit à l'effacement), export CSV.
- **Paramètres** : annonce de la barre supérieure, nom / texte / photo du directeur.

Sécurité de l'espace admin : sessions `httponly` + `SameSite=Lax`, régénération
de l'identifiant de session à la connexion, expiration par inactivité
(30 min par défaut), et **protection CSRF** sur toutes les actions de modification.

---

## 7. Relier le frontend (lecture du contenu en direct)

Le site statique peut récupérer le contenu géré depuis l'admin en appelant les
endpoints **publics en lecture seule** (GET, JSON). Exemple en JavaScript :

```js
const ENSPD_API = 'https://votre-domaine.bj/backend-enspd/api';

const r = await fetch(ENSPD_API + '/actualites.php');
const data = await r.json();
if (data.ok) {
  data.items.forEach(a => { /* afficher a.titre, a.resume, a.images[]… */ });
}
```

### Formes JSON retournées par les endpoints publics

**`GET /api/actualites.php`** (liste) :

```json
{
  "ok": true,
  "count": 2,
  "items": [
    {
      "id": 1, "titre": "...", "slug": "...", "categorie": "...",
      "resume": "...", "contenu": "...", "image": "...",
      "date_pub": "2026-06-01", "statut": "published",
      "created_at": "...", "updated_at": "...",
      "images": [
        { "id": 5, "url": "...", "legende": "...", "position": 0 }
      ]
    }
  ]
}
```

`GET /api/actualites.php?id=1` (ou `?slug=...`) renvoie `{ "ok":true, "item": { ... } }`.
Seules les actualités au statut `published` sont exposées.

**`GET /api/evenements.php`** :

```json
{
  "ok": true, "count": 3,
  "upcoming": [ { "id": 1, "titre": "...", "date_event": "2026-09-01", "heure": "...", "lieu": "...", "description": "...", "image": "...", "statut": "upcoming" } ],
  "past":     [ { "id": 2, "titre": "...", "statut": "past" } ],
  "items":    [ ... ]
}
```

On peut filtrer : `?statut=upcoming` ou `?statut=past` (renvoie alors `items`).

**`GET /api/galerie.php`** :

```json
{
  "ok": true, "count": 4,
  "groups": {
    "Vie étudiante": [ { "id": 1, "src": "...", "titre": "...", "contexte": "...", "position": 0 } ],
    "Cérémonies":    [ { "id": 2, "src": "...", "...": "..." } ]
  },
  "items": [ ... ]
}
```

**`GET /api/settings.php`** (liste blanche de clés publiques) :

```json
{
  "ok": true,
  "settings": {
    "annonce": "Rentrée le 1er octobre",
    "directeur_nom": "...",
    "directeur_texte": "...",
    "directeur_photo": "..."
  }
}
```

**`POST /api/contact.php`** — corps JSON :

```json
{ "nom": "...", "email": "...", "sujet": "...", "message": "...", "consent": true, "website": "" }
```

Le champ `website` est un **piège (honeypot)** : il doit rester vide (voir § 9).
Le champ `consent` (RGPD) doit être `true`.

### Contrat de réponse de l'API

| Cas | Code HTTP | Corps JSON |
|-----|-----------|------------|
| Succès | 200 | `{"ok":true, ...}` |
| Erreur de validation | 422 | `{"ok":false,"error":"validation","fields":{"email":"Email invalide"}}` |
| Trop de tentatives | 429 | `{"ok":false,"error":"rate_limit","message":"..."}` |
| Authentification requise (admin) | 401 | `{"ok":false,"error":"auth"}` |
| Jeton CSRF invalide (admin) | 403 | `{"ok":false,"error":"csrf"}` |

---

## 8. CORS et même domaine

- Si le frontend et le backend sont sur le **même domaine** (recommandé), laissez
  `cors_origins` vide : les requêtes same-origin passent toujours.
- Si le frontend est sur un **autre domaine**, ajoutez son origine exacte dans
  `cors_origins`. Les requêtes admin nécessitent les cookies (`credentials`),
  donc le navigateur impose une origine explicitement autorisée.

---

## 9. Limitation de débit et honeypot

**Limitation de débit (rate limiting).** Chaque endpoint sensible enregistre les
tentatives par IP dans la table `rate_limits`. Au-delà du seuil, l'API répond
**HTTP 429**. Seuils par défaut :

| Action | Limite |
|--------|--------|
| `contact` | 5 / 10 minutes / IP |
| `login` (connexion admin) | 5 / 15 minutes / IP |

Les anciennes entrées sont nettoyées automatiquement à chaque vérification.

**Honeypot.** Le formulaire de contact contient un champ caché `website` qui doit
rester **vide**. Les robots le remplissent souvent. Si le champ est rempli, le
serveur renvoie une **fausse réussite** (`ok:true`) **sans rien enregistrer**.

---

## 10. Checklist de sécurité (à vérifier après déploiement)

- [ ] `config.php` créé, rempli, **inaccessible** en HTTP (testez `…/backend-enspd/config.php`).
- [ ] `…/backend-enspd/src/db.php` et `…/backend-enspd/bin/create_admin.php` **inaccessibles** en HTTP.
- [ ] `…/backend-enspd/schema.sql` **inaccessible** en HTTP.
- [ ] HTTPS actif ; `cookie_secure` = `true`.
- [ ] `cors_origins` limité à votre (vos) domaine(s) réel(s).
- [ ] Premier admin créé avec un mot de passe fort (≥ 10 caractères).
- [ ] `env` = `prod` (les messages d'erreur détaillés sont masqués).
- [ ] Module Apache `mod_headers` actif (en-têtes de sécurité appliqués).

Mesures intégrées : PDO + requêtes préparées (emulation désactivée), mots de
passe hachés (`password_hash`), sessions sécurisées avec régénération d'ID et
expiration par inactivité, jetons **CSRF** sur chaque POST admin, validation et
limites de longueur côté serveur sur chaque champ, validation d'email,
limitation de débit par IP, honeypot, en-têtes de sécurité + CSP, blocage d'accès
aux dossiers/fichiers internes, échappement HTML systématique (`htmlspecialchars`).

---

## 11. Données personnelles et RGPD

Le formulaire de contact collecte des **données personnelles** (nom, email,
message). Mesures intégrées :

- **Consentement explicite** requis (`consent`) sur le formulaire public, avec
  enregistrement de l'**horodatage** et de l'**adresse IP** comme preuve
  (`ip` / `created_at`).
- **Droit à l'effacement** : un administrateur peut supprimer définitivement un
  message depuis l'onglet **Messages**. L'action est **journalisée** dans
  `audit_log` (sans conserver le contenu effacé).
- **Minimisation et conservation limitée** : ne conservez les messages que le
  temps nécessaire, puis purgez-les.
- **Sécurité d'accès** : tout l'espace admin est protégé par mot de passe haché,
  session sécurisée et protection CSRF.

Pensez à publier sur le site une **note de confidentialité** indiquant la finalité
du traitement, le responsable (ENSPD / Université de Parakou), la durée de
conservation et les modalités d'exercice des droits (accès, rectification,
effacement).
