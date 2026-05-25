# ENSPD — Site Officiel

Site web officiel de l'**École Nationale de Statistique, de Planification et de Démographie** — Université de Parakou, Bénin.

> Développé par **DJOROD_CODING** · Phases 1–6 · Dernière mise à jour : Mai 2026

---

## Aperçu

Le projet comprend **3 sites distincts** dans le même dossier :

| Fichier | Site | Description |
|---|---|---|
| `index.html` + `enspd.js` + `shared.css` | **ENSPD** | Site principal institutionnel |
| `bue.html` + `bue.js` + `bue.css` | **BUE-ENSPD** | Bureau des Unions Étudiantes |
| `jssed.html` + `jssed.js` + `jssed.css` | **JSSED** | Journée Statistique Suivi-Évaluation Démographie |

Chaque site est une **SPA (Single Page Application) 100 % vanilla** : HTML + CSS + JS pur, sans framework, sans bundler, sans backend.

---

## Lancer le site

Aucune installation requise. Ouvrir simplement :

```
index.html   → Site ENSPD principal
bue.html     → Site BUE
jssed.html   → Site JSSED
```

dans un navigateur (double-clic ou `file://...`).

Pour éviter les problèmes CORS sur les polices Google Fonts, il est recommandé de servir via un serveur local :

```bash
# Python 3
python3 -m http.server 8080
# Puis ouvrir : http://localhost:8080
```

---

## Arborescence

```
ENSPD_Site/
│
├── index.html          # SPA ENSPD principale (10 pages)
├── enspd.js            # Logique complète du site ENSPD
├── shared.css          # CSS partagé ENSPD + BUE (Design System)
│
├── bue.html            # SPA BUE-ENSPD
├── bue.js              # Logique site BUE
├── bue.css             # CSS spécifique BUE
│
├── jssed.html          # Site JSSED (événement annuel)
├── jssed.js            # Logique site JSSED
├── jssed.css           # CSS spécifique JSSED
│
└── assets/
    ├── campus/         # Photos du bâtiment et campus
    │   ├── batimentENSPD.jpeg      ← hero page accueil
    │   ├── batiment_enspd.jpg      ← fallback hero
    │   ├── batiment-01.jpg
    │   ├── groupe-5.jpg
    │   └── photo_groupe.jpg
    │
    ├── galerie/
    │   ├── enspd/      # Photos événements ENSPD
    │   │   ├── rentree_1775854492374.jpg
    │   │   ├── cours_*.jpg
    │   │   ├── cafe_sci_*.jpg
    │   │   ├── jbe*.jpg
    │   │   └── soutenance*.jpg
    │   └── bue/        # Photos événements BUE / JSSED
    │       └── jssed_*.jpg
    │
    └── logos/
        └── Logo_ENSPD.jpg          ← logo navbar + favicon
```

> **Important :** Les dossiers `assets/` sont présents mais vides dans le dépôt (les photos ne sont pas versionnées). Ajouter les photos selon les chemins ci-dessus.

---

## Ajouter les photos

Le site est entièrement fonctionnel sans photos (placeholders automatiques). Pour ajouter les vraies photos :

1. Copier les images dans les bons dossiers `assets/`
2. Respecter exactement les noms de fichiers référencés dans `enspd.js` (objet `D.galerie`)
3. Formats acceptés : JPG, JPEG, PNG, WebP

### Photo du Directeur (via l'interface admin)

La photo du Directeur ne va **pas** dans `assets/`. Elle est uploadée via l'admin :

1. Se connecter en admin
2. Cliquer sur **📷 Photos** dans la barre admin
3. Choisir une photo (stockée en Base64 dans `localStorage`)

---

## Accès Administrateur

### Première connexion (premier déploiement)

1. Cliquer sur **Connexion** dans la navbar
2. Entrer `admin` comme email (ou `admin@enspd.bj`)
3. Un modal s'ouvre pour **définir le mot de passe** (min. 10 caractères)
4. Le mot de passe est stocké haché sur l'appareil (localStorage)

> **Note :** Le mot de passe admin n'est pas codé en dur dans le code source. Il doit être créé au premier démarrage sur chaque appareil/navigateur.

### Fonctionnalités admin

Une fois connecté en admin :

| Action | Accès |
|---|---|
| Publier une actualité | Barre admin → **+ Actualité** |
| Ajouter un événement | Barre admin → **+ Événement** |
| Changer la photo du Directeur | Barre admin → **📷 Photos** |
| Gérer la galerie | Dashboard admin → **🖼 Galerie** |
| Gérer les utilisateurs | Dashboard admin → **👥 Utilisateurs** |
| Modifier l'annonce top bar | Barre admin → **📢 Annonce** |
| Changer le mot de passe | Dashboard admin → **🔑 Changer mdp** |

### Compte BUE admin (site bue.html)

Même principe : premier login avec `admin` crée le mot de passe. Indépendant du compte ENSPD.

---

## Contenu modifiable sans admin

Le contenu structurel du site est défini dans l'objet `D` au début de `enspd.js` :

```
D.filieres     → 8 filières (Licence SA, PSE, Masters, Doctorat)
D.actualites   → Actualités (titre, texte, catégorie, image)
D.events       → Événements (date, lieu, type, description)
D.galerie      → Photos galerie par catégorie
D.temos        → Témoignages d'anciens étudiants
D.admin        → Équipe administrative (Direction + services)
D.labos        → Laboratoires de recherche (LaReSPD, ODeSPoL)
D.partners     → Partenaires de recherche
D.steps        → Étapes paiement droits universitaires
D.cond         → Conditions d'accès par niveau
D.docs         → Documents officiels disponibles
D.debouches    → Secteurs d'emploi des diplômés
```

Pour modifier le contenu permanent : éditer directement ces tableaux dans `enspd.js`.

---

## Traductions (FR / EN)

Le site est bilingue. Toutes les chaînes sont dans l'objet `LANG` en tête de `enspd.js` :

```javascript
const LANG = {
  fr: { cle: 'Texte français', ... },
  en: { cle: 'English text',  ... }
};
```

Pour ajouter ou corriger une traduction :
1. Trouver la clé dans le HTML : `data-i18n="nom_de_la_cle"`
2. Ajouter/modifier la valeur dans `LANG.fr` et `LANG.en`

Les pages `bue.html` et `jssed.html` utilisent un système impératif (`setBueLang()`) — les traductions sont dans `bue.js`.

---

## Clés localStorage

| Clé | Site | Contenu |
|---|---|---|
| `enspd-theme` | ENSPD | `'dark'` ou `''` |
| `enspd-lang` | ENSPD + BUE | `'fr'` ou `'en'` (partagée entre les deux sites) |
| `enspd_u7` | ENSPD | Session utilisateur connecté (JSON, expire 24h) |
| `enspd_users7` | ENSPD | Comptes inscrits (JSON array) |
| `enspd_admin_hash_v1` | ENSPD | Hash du mot de passe admin |
| `enspd_photo_dir` | ENSPD | Photo Directeur en Base64 |
| `enspd_rl` | ENSPD | Rate limiting tentatives de connexion |
| `enspd_welcomed` | ENSPD | `'1'` si modal bienvenue déjà vu |
| `enspd_cookies` | ENSPD | `'accepted'` ou `'rejected'` |
| `bue_admin_hash_v7` | BUE | Hash mot de passe admin BUE |
| `bue_session_v7` | BUE | Session BUE admin |
| `bue_pres_photo` | BUE | Photo Président BUE en Base64 |
| `bue_theme` | BUE | Thème site BUE |

> Pour réinitialiser complètement un site : ouvrir la console navigateur → `localStorage.clear()`.

---

## Déploiement

Le site est **statique** : aucun serveur, aucune base de données nécessaire. Il peut être déposé directement sur :

- Un hébergement mutualisé (FTP)
- GitHub Pages
- Netlify / Vercel (glisser-déposer le dossier)
- Serveur Apache/Nginx (copier le dossier)

**Checklist avant mise en ligne :**
- [ ] Photos ajoutées dans `assets/`
- [ ] Logo `assets/logos/Logo_ENSPD.jpg` présent
- [ ] Connexion admin faite sur le serveur pour définir le mot de passe
- [ ] Photo du Directeur uploadée via l'interface admin
- [ ] Tester les 3 sites (`index.html`, `bue.html`, `jssed.html`)
- [ ] Vérifier que les liens sociaux (Facebook, LinkedIn) sont corrects dans le footer

---

## Pages du site ENSPD

| ID de page | Route | Description |
|---|---|---|
| `#p-accueil` | `nav('accueil')` | Accueil (hero, stats, formations, actualités, témoignages) |
| `#p-ecole` | `nav('ecole')` | L'École (historique, mission, administration) |
| `#p-formations` | `nav('formations')` | 8 filières LMD avec programmes complets |
| `#p-admissions` | `nav('admissions')` | Conditions, paiement, documents officiels |
| `#p-actualites` | `nav('actualites')` | Actualités filtrables par catégorie |
| `#p-recherche` | `nav('recherche')` | LaReSPD, ODeSPoL, partenaires |
| `#p-evenements` | `nav('evenements')` | Agenda ENSPD |
| `#p-contact` | `nav('contact')` | Formulaire de contact + infos pratiques |
| `#p-admin` | `nav('admin')` | Dashboard administrateur (accès restreint) |
| `#p-legal` | `nav('legal')` | Mentions légales & confidentialité |
| Galerie | `nav('galerie')` | Ouvre `bue.html` dans un nouvel onglet |

---

## Stack technique

- **HTML5** sémantique avec ARIA
- **CSS3** vanilla (Design System avec variables CSS)
- **JavaScript ES2020** strict mode, aucune dépendance
- **Google Fonts** : Inter (corps), Instrument Serif (titres), JetBrains Mono (code/mono)
- **Stockage** : localStorage uniquement (pas de backend, pas de cookie de tracking)

---

## Auteur

Développé par **DJOROD_CODING** pour l'ENSPD — Université de Parakou, Bénin.

Contact : rodriguedjossou93@gmail.com
