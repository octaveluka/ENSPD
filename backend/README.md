# Backend JSSED 2026 — Guide de déploiement

Backend **PHP 8 + MySQL** pour la plateforme d'inscription et de soumission des
**Journées Scientifiques de la Statistique, de l'Évaluation et de la Démographie (JSSED 2026)**,
organisées par l'**ENSPD — Université de Parakou (Bénin)**.

Ce backend s'associe au site statique frontend (`jssed.html` / `jssed.css` / `jssed.js`)
qui lui envoie des données en JSON. Aucune dépendance externe : PHP pur + PDO
(pas de Composer, pas de framework). Conçu pour un hébergement mutualisé bon marché
(cPanel / Apache + MySQL, déploiement par FTP).

---

## 1. Prérequis

- Un hébergement avec **PHP 8.0 ou plus** et **MySQL / MariaDB**.
- Accès à **phpMyAdmin** (fourni par la plupart des cPanel).
- Un accès **FTP** (ou le gestionnaire de fichiers cPanel) pour téléverser les fichiers.
- Idéalement **HTTPS** activé sur le domaine (certificat Let's Encrypt gratuit dans cPanel).
- Pour créer le premier administrateur : un accès **SSH** ou la fonction
  « Terminal » de cPanel (pour lancer une commande `php`). À défaut, voir la section 6.

---

## 2. Téléverser les fichiers

Copiez tout le dossier `backend/` dans votre hébergement, par exemple sous
`public_html/backend/`. L'URL publique du backend sera alors par exemple :

```
https://votre-domaine.bj/backend
```

Structure :

```
backend/
├── .htaccess              # sécurité Apache (en-têtes, blocages d'accès)
├── .gitignore
├── README.md
├── schema.sql             # structure de la base de données
├── config.example.php     # modèle de configuration (à copier)
├── config.php             # VOTRE configuration (à créer, NON versionnée)
├── admin/
│   └── index.php          # tableau de bord d'administration
├── api/
│   ├── submit.php         # soumission de communication / poster
│   ├── register.php       # inscription
│   ├── contact.php        # formulaire de contact
│   ├── speakers.php       # liste publique des intervenants (GET)
│   ├── program.php        # programme public groupé par jour (GET)
│   └── admin/             # API d'administration (session + CSRF)
│       ├── login.php  logout.php  me.php
│       ├── submissions.php  registrations.php  contacts.php
│       ├── speakers.php  program.php   # CRUD (op: save/delete/reorder)
│       ├── delete_participant.php  export.php
├── bin/
│   └── create_admin.php   # script CLI de création d'administrateur
├── src/
│   ├── db.php             # connexion PDO
│   ├── helpers.php        # validation, CSRF, rate-limit, etc.
│   └── cors.php           # en-têtes CORS et sécurité
└── logs/
```

Les dossiers `src/` et `bin/` sont **inaccessibles depuis le web** (protégés par
`.htaccess`). Seuls `api/` et `admin/` doivent être joignables.

---

## 3. Créer la base de données et importer le schéma

1. Dans **cPanel → Bases de données MySQL** :
   - créez une base, par ex. `moncpanel_jssed2026` ;
   - créez un utilisateur MySQL avec un mot de passe fort ;
   - **ajoutez l'utilisateur à la base** avec **tous les privilèges**.
2. Ouvrez **phpMyAdmin**, sélectionnez la base à gauche.
3. Onglet **Importer** → **Choisir un fichier** → sélectionnez `backend/schema.sql`
   → bouton **Importer / Exécuter**.
4. Vous devez voir apparaître les tables : `submissions`, `registrations`,
   `contacts`, `admins`, `rate_limits`, `audit_log`, `speakers`,
   `program_sessions` (ces deux dernières sont créées et **pré-remplies**
   avec quelques exemples par le `schema.sql`).

---

## 4. Configurer (`config.php`)

1. **Copiez** `config.example.php` en `config.php` (même dossier `backend/`).
2. Ouvrez `config.php` et remplissez :
   - `db_host` (souvent `localhost`), `db_name`, `db_user`, `db_pass` ;
   - `env` → `prod` en production ;
   - `cors_origins` → l'origine **exacte** de votre site frontend
     (ex. `https://votre-domaine.bj`). Si frontend et backend sont sur le **même
     domaine**, vous pouvez laisser le tableau vide ;
   - `cookie_secure` → `true` si vous êtes en HTTPS (recommandé) ;
   - `base_url` → l'URL publique du dossier backend (ex. `https://votre-domaine.bj/backend`).

> `config.php` contient vos secrets : il est **ignoré par Git** et **bloqué en accès
> web** par `.htaccess`. Ne le partagez jamais.

---

## 5. Relier le frontend

Dans le fichier **`jssed.js`** (à la racine du site), réglez l'objet de
configuration `JSSED_CONFIG` situé tout en haut du fichier :

```js
const JSSED_CONFIG = {
  apiBase: 'https://votre-domaine.bj/backend/api', // URL déployée du backend
  eventDate: null,        // ex. '2026-09-08T08:00:00' dès que la date est connue
  email: 'jssed.enspd.up.2025@gmail.com'
};
```

- **`apiBase`** : laissez `''` pour le mode hors-ligne (le formulaire bascule alors
  sur l'envoi par email + sauvegarde locale). Renseignez l'URL `…/backend/api`
  une fois le backend déployé pour activer l'enregistrement en base.
- **`eventDate`** : laissez `null` tant que la date officielle n'est pas connue
  (le compte à rebours reste en attente). Renseignez la date ISO dès qu'elle est
  fixée pour lancer automatiquement le compte à rebours.

Les formulaires postent ensuite en JSON vers :

- `POST {apiBase}/submit.php`   — soumission de communication / poster
- `POST {apiBase}/register.php` — inscription
- `POST {apiBase}/contact.php`  — contact

Chaque formulaire doit inclure :
- un champ **`consent`** (case à cocher RGPD) à `true` ;
- un champ **piège caché `website`** (honeypot), laissé vide (voir section 8).

### Contrat de réponse de l'API

| Cas | Code HTTP | Corps JSON |
|-----|-----------|------------|
| Succès | 200 | `{"ok":true,"ref":"JSSED2026-AB12CD","message":"..."}` |
| Erreur de validation | 422 | `{"ok":false,"error":"validation","fields":{"email":"Email invalide"}}` |
| Trop de tentatives | 429 | `{"ok":false,"error":"rate_limit","message":"..."}` |
| Authentification requise (admin) | 401 | `{"ok":false,"error":"auth"}` |

---

## 6. Créer le premier administrateur

Via **SSH** ou le **Terminal cPanel**, placez-vous dans le dossier `backend/` :

```bash
php bin/create_admin.php  admin@enspd.bj  "Direction JSSED"
```

Le script demande (et confirme) le mot de passe, puis l'enregistre **haché**
(`password_hash`). Mot de passe : **10 caractères minimum**.

> Le script **refuse de s'exécuter via le web** : il ne fonctionne qu'en ligne de
> commande. Si vous n'avez aucun accès CLI, contactez votre hébergeur ou exécutez
> la commande depuis un poste local connecté à la même base.

Connectez-vous ensuite au tableau de bord :

```
https://votre-domaine.bj/backend/admin/
```

---

## 7. Tableau de bord d'administration

- **Soumissions** : liste, lecture des résumés, changement de décision
  (`pending`, `accepted`, `revision`, `rejected`), export CSV.
- **Inscriptions** : liste, statut de paiement (`unpaid`, `pending`, `paid`),
  export CSV.
- **Contacts** : liste des messages, marquage « traité », export CSV.
- **Effacement RGPD** : suppression définitive des données d'un participant
  par email ou référence.

Sécurité de l'espace admin : sessions `httponly` + `SameSite=Lax`, régénération
de l'identifiant de session à la connexion, expiration par inactivité
(30 min par défaut), et **protection CSRF** sur toutes les actions de modification.

---

## 8. Comment fonctionnent la limitation de débit et le honeypot

**Limitation de débit (rate limiting).** Chaque endpoint public enregistre les
tentatives par IP dans la table `rate_limits`. Au-delà du seuil, l'API répond
**HTTP 429**. Seuils par défaut :

| Action | Limite |
|--------|--------|
| `submit` (soumission) | 5 / 10 minutes / IP |
| `register` (inscription) | 5 / 10 minutes / IP |
| `contact` | 5 / 10 minutes / IP |
| `login` (connexion admin) | 5 / 15 minutes / IP |

Les anciennes entrées sont nettoyées automatiquement à chaque vérification.

**Honeypot.** Chaque formulaire contient un champ caché `website` qui doit rester
**vide**. Les robots le remplissent souvent automatiquement. Si le champ est rempli,
le serveur renvoie une **fausse réussite** (`ok:true`) **sans rien enregistrer** :
le robot croit avoir réussi et n'insiste pas.

---

## 9. Checklist de sécurité (à vérifier après déploiement)

- [ ] `config.php` créé, rempli, **inaccessible** en HTTP (testez l'URL `…/backend/config.php` → doit être bloquée).
- [ ] `…/backend/src/db.php` et `…/backend/bin/create_admin.php` **inaccessibles** en HTTP.
- [ ] `…/backend/schema.sql` **inaccessible** en HTTP.
- [ ] HTTPS actif ; `cookie_secure` = `true`.
- [ ] `cors_origins` limité à votre (vos) domaine(s) réel(s).
- [ ] Premier admin créé avec un mot de passe fort (≥ 10 caractères).
- [ ] `env` = `prod` (les messages d'erreur détaillés sont masqués).
- [ ] Module Apache `mod_headers` actif (en-têtes de sécurité appliqués).

---

## 10. Données personnelles et RGPD

Cette plateforme collecte des **données personnelles** (nom, email, téléphone,
institution, etc.). Mesures intégrées :

- **Consentement explicite** requis (`consent`) sur chaque formulaire public, avec
  enregistrement de l'**horodatage** et de l'**adresse IP** comme preuve de
  consentement (`consent_ip` / `created_at`).
- **Droit à l'effacement** : un administrateur peut supprimer définitivement les
  données d'un participant (par email ou référence) depuis le tableau de bord.
  L'action est **journalisée** dans `audit_log` **sans conserver les données
  effacées** (seul un identifiant haché est consigné, pour la traçabilité).
- **Minimisation et conservation limitée** : ne conservez les données que le temps
  nécessaire à l'organisation de l'événement et à ses suites administratives, puis
  supprimez-les (vous pouvez purger les tables après l'événement).
- **Sécurité d'accès** : tout l'espace admin est protégé par mot de passe haché,
  session sécurisée et protection CSRF.

Pensez à publier sur le site une **note de confidentialité** indiquant la finalité
du traitement, le responsable (ENSPD / Université de Parakou), la durée de
conservation et les modalités d'exercice des droits (accès, rectification,
effacement).

---

## 11. Intervenants et Programme (Speakers & Program)

Deux modules complètent la plateforme : la **gestion des intervenants**
(keynotes, invités, panel) et la **gestion du programme** (déroulé des sessions).
Le frontend lit ces données via deux endpoints publics en **lecture seule**,
et l'administration les gère depuis les onglets **Intervenants** et **Programme**.

### 11.1 Tables ajoutées

**`speakers`** — intervenants.

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | INT UNSIGNED AI | clé primaire |
| `nom` | VARCHAR(160) | requis |
| `titre` | VARCHAR(160) | fonction / titre |
| `affiliation` | VARCHAR(200) | institution |
| `pays` | VARCHAR(80) | |
| `bio` | TEXT | biographie |
| `photo` | VARCHAR(255) | URL ou chemin |
| `type` | VARCHAR(20) | `keynote` \| `invited` \| `panel` (défaut `invited`) |
| `ordre` | INT | ordre d'affichage croissant (défaut 0) |
| `created_at` / `updated_at` | DATETIME | horodatage |

Index : `(ordre, nom)` et `(type)`.

**`program_sessions`** — sessions du programme.

| Colonne | Type | Notes |
|---------|------|-------|
| `id` | INT UNSIGNED AI | clé primaire |
| `jour` | DATE | requis (AAAA-MM-JJ) |
| `heure_debut` / `heure_fin` | VARCHAR(10) | format `HH:MM`, optionnels |
| `titre` | VARCHAR(255) | requis |
| `type` | VARCHAR(20) | `pleniere` \| `conference` \| `atelier` \| `poster` \| `pause` \| `hommage` \| `autre` |
| `salle` | VARCHAR(120) | optionnel |
| `atelier` | TINYINT NULL | 1 à 3, ou NULL |
| `speaker_id` | INT NULL | **lien « mou » vers `speakers.id`** |
| `description` | TEXT | optionnel |
| `ordre` | INT | ordre d'affichage (défaut 0) |
| `created_at` | DATETIME | |

Index : `(jour, ordre)`.

> **Choix de conception — `speaker_id` sans clé étrangère dure.**
> La colonne `speaker_id` est un simple `INT` nullable **sans** contrainte
> `FOREIGN KEY`. Objectif : pouvoir supprimer un intervenant sans être bloqué
> par une contrainte référentielle. À la suppression d'un intervenant, l'API
> admin (`speakers.php`, op `delete`) **délie** automatiquement les sessions
> concernées (`UPDATE program_sessions SET speaker_id = NULL`). Les endpoints
> de lecture utilisent un `LEFT JOIN`, donc une session orpheline reste
> affichée, simplement sans nom d'intervenant. L'intégrité est donc gérée
> **applicativement**, pas par le moteur.

### 11.2 Endpoints publics (lecture seule, GET)

**`GET {apiBase}/speakers.php`** — liste des intervenants.
Paramètre optionnel `?type=keynote|invited|panel`. Tri : `ordre`, puis `nom`.

```json
{
  "ok": true,
  "count": 3,
  "items": [
    {
      "id": 1,
      "nom": "Pr. Mouftaou AMADOU SANNI",
      "titre": "Professeur de démographie",
      "affiliation": "ENSPD — Université de Parakou",
      "pays": "Bénin",
      "bio": "…",
      "photo": null,
      "type": "keynote",
      "ordre": 1
    }
  ]
}
```

**`GET {apiBase}/program.php`** — programme groupé par jour.
Chaque session est jointe au nom de l'intervenant (`speaker_nom`) si `speaker_id`
est renseigné. Tri : `jour`, `ordre`, `heure_debut`.

```json
{
  "ok": true,
  "count": 9,
  "days": [
    {
      "jour": "2026-09-15",
      "sessions": [
        {
          "id": 1,
          "jour": "2026-09-15",
          "heure_debut": "09:00",
          "heure_fin": "10:00",
          "titre": "Cérémonie d'ouverture et conférence inaugurale",
          "type": "pleniere",
          "salle": "Amphithéâtre principal",
          "atelier": null,
          "speaker_id": null,
          "speaker_nom": null,
          "description": "…",
          "ordre": 1
        }
      ]
    }
  ]
}
```

### 11.3 Endpoints d'administration (session + CSRF)

Mêmes garanties que les autres endpoints admin : `require_admin()`, jeton CSRF
(`X-CSRF-Token`) obligatoire sur tout POST, requêtes préparées, journalisation
`audit_log`. Les opérations sont sélectionnées par un champ **`op`**.

**`{apiBase}/admin/speakers.php`**

| Méthode | Corps | Effet |
|---------|-------|-------|
| `GET` | — | liste complète |
| `POST` | `{op:"save", id?, nom, titre, affiliation, pays, bio, photo, type, ordre}` | crée (`id` absent/0) ou met à jour (`id` > 0) |
| `POST` | `{op:"delete", id}` | supprime + délie les sessions liées |
| `POST` | `{op:"reorder", order:[id1,id2,…]}` | réordonne (`ordre` = position) |

**`{apiBase}/admin/program.php`**

| Méthode | Corps | Effet |
|---------|-------|-------|
| `GET` | — | liste complète (avec `speaker_nom`) |
| `POST` | `{op:"save", id?, jour, heure_debut, heure_fin, titre, type, salle, atelier, speaker_id, description, ordre}` | crée ou met à jour |
| `POST` | `{op:"delete", id}` | supprime une session |
| `POST` | `{op:"reorder", order:[id1,id2,…]}` | réordonne |

Validation côté serveur (listes blanches `type`, format `jour` = `AAAA-MM-JJ`,
heures `HH:MM`, `atelier` ∈ {1,2,3} ou nul, existence de `speaker_id`).
Réponses : `200 {ok:true,…}`, `422 {ok:false,error:"validation",fields:{…}}`,
`401 auth`, `403 csrf`.

### 11.4 Tableau de bord

Les onglets **Intervenants** et **Programme** offrent : tableau de la liste,
formulaire d'ajout/édition (le même formulaire bascule en mode édition au clic
sur « Modifier »), et suppression confirmée. Toutes les sorties sont échappées
(`esc()` côté JS, `escape()` côté PHP). Palette institutionnelle marine + accent
vert pour les actions d'enregistrement.
