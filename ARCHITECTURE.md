# Architecture technique — ENSPD Site

Document destiné aux développeurs qui reprennent ou étendent le projet.

---

## 1. Architecture SPA (Single Page Application)

### Principe

L'ensemble du site tient dans **un seul fichier HTML** (`index.html`). La navigation ne recharge jamais la page : seules les sections sont affichées/masquées via les classes CSS `.page` et `.page.act`.

```
Toutes les "pages" sont des <div class="page" id="p-xxx"> empilées dans le DOM.
Une seule a la classe "act" à la fois → visible à l'écran.
```

### Fonction de routage

```javascript
// enspd.js
function nav(page) {
  // 1. Retire "act" de toutes les pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('act'));
  // 2. Ajoute "act" sur la page ciblée
  document.getElementById('p-' + page)?.classList.add('act');
  // 3. Met à jour l'état actif des liens navbar
  document.querySelectorAll('[data-p]').forEach(a =>
    a.classList.toggle('act', a.dataset.p === page));
  // 4. Cas spécial : galerie → ouvre bue.html dans un nouvel onglet
  if (page === 'galerie') { window.open('bue.html', '_blank'); return; }
  // 5. Cas spécial : admin → re-render le dashboard
  if (page === 'admin') renderAdminPage();
}
```

### Liens de navigation

Tous les éléments de navigation utilisent `data-p="nom_de_page"` :

```html
<a href="#" data-p="formations">Formations</a>
```

Un écouteur global dans `DOMContentLoaded` intercepte ces clics et appelle `nav()`.

---

## 2. IDs HTML critiques — NE JAMAIS SUPPRIMER

Ces IDs sont utilisés directement par le JavaScript. Les supprimer casse le site.

| ID | Usage |
|---|---|
| `#admin-bar` | Barre admin (affichée/masquée selon connexion) |
| `#navbar` | Classe `scrolled` ajoutée au scroll |
| `#nav-links` | Menu burger (classe `open`) |
| `#burger` | Bouton menu mobile |
| `#dark-btn` | Basculer thème sombre/clair |
| `#nav-auth` | Zone connexion/profil desktop |
| `#nav-mobile-auth` | Zone connexion mobile |
| `#nav-admin-link` | Lien admin (affiché uniquement si admin) |
| `#p-accueil` … `#p-legal` | Toutes les pages SPA |
| `#stats-band` | Déclenche l'animation countup |
| `#why-grid` | Grille "Pourquoi l'ENSPD" (rendue par JS) |
| `#form-apercu` | Aperçu formations accueil (rendu par JS) |
| `#dir-avatar` | Photo/placeholder Directeur (accueil) |
| `#modal` | Overlay modal principal |
| `#modal-box` | Boîte modale (classe `xl` pour grand format) |
| `#toasts` | Zone notifications toast |
| `#btt` | Bouton retour en haut |
| `#cookie-banner` | Bandeau cookies |
| `#welcome-overlay` | Modal de bienvenue (première visite) |
| `#actus-home` | Actualités homepage (3 cartes) |
| `#actus-list` | Liste actualités page Actualités |
| `#events-list` | Liste événements page Agenda |
| `#temo-slider` | Slider témoignages |
| `#temo-dots` | Points de navigation témoignages |

---

## 3. Design System (shared.css)

### Tokens CSS (variables racine)

```css
/* Couleurs marque ENSPD */
--vt       : #2EAA38   /* vert principal */
--mn       : #1B1E6E   /* marine */
--or       : #E8960A   /* or/orange */

/* Alias sémantiques */
--enspd-navy  : var(--mn)
--enspd-green : var(--vt)
--enspd-gold  : var(--or)

/* Échelle de gris */
--slate-50 … --slate-900

/* Thème clair/sombre via data-theme="dark" sur <html> */
--bg   : fond principal
--bg2  : fond secondaire
--txt  : texte principal
--txt2 : texte secondaire
--txt3 : texte atténué
--brd  : bordures
```

### Typographie

```css
--f  : 'Inter', sans-serif          /* corps de texte */
--fs : 'Instrument Serif', serif    /* titres display */
--fm : 'JetBrains Mono', monospace  /* code / mono */
```

### Classes utilitaires principales

```
.btn .b-vt .b-mn .b-or .b-gh .b-sec .b-er   → variantes de boutons
.b-sm .b-lg .b-full                            → tailles de boutons
.card .cp                                      → cartes
.badge .bv .bmn .bor .bgr                     → badges colorés
.anim .vis                                     → animations entrée (IntersectionObserver)
.d1 .d2 .d3                                    → délais d'animation (100ms, 200ms, 300ms)
.sec .sec-s                                    → sections pleine largeur
.bg-w .bg-bg .bg-dk                            → arrière-plans section
.wrap .wi                                      → conteneurs centrés (1200px / full)
.g2 .g3 .g4 .ga                               → grilles responsive
.ph .ph-ico .ph-txt                            → placeholders images
.alert .a-vt .a-mn .a-or .a-er               → alertes colorées
.stag                                          → étiquette catégorie (petit badge vert)
```

### Règle CSS : jamais de `!important`

Toutes les surcharges se font par spécificité CSS normale ou variables CSS.

---

## 4. Données — Objet `D` (enspd.js)

Toutes les données du site sont dans l'objet global `D`. Pas de base de données, pas d'API.

```javascript
const D = {
  filieres : [...],   // 8 formations (id, sigle, niveau, programme, débouchés...)
  actualites: [...],  // articles (id, cat, date, img, titre, texte)
  temos     : [...],  // témoignages (init, nom, promo, texte)
  events    : [...],  // événements (j, m, titre, type, heure, lieu, desc, detail)
  galerie   : {       // photos par catégorie (objet, pas tableau)
    'Campus': [{src, titre, ev}, ...],
    'Rentrée Solennelle': [...],
    ...
  },
  admin     : [...],  // équipe direction + services
  labos     : [...],  // laboratoires de recherche
  partners  : [...],  // partenaires (noms)
  steps     : [...],  // étapes paiement droits
  cond      : [...],  // conditions d'accès
  docs      : [...],  // documents officiels
  debouches : [...],  // secteurs d'emploi
  why       : [...],  // arguments "Pourquoi l'ENSPD" (avec clés LANG)
};
```

> `D.galerie` est un **objet** (pas un tableau). Pour compter le total de photos :
> `Object.values(D.galerie).reduce((s, a) => s + a.length, 0)`

### Modifier le contenu permanent

Éditer directement les tableaux dans `enspd.js`. Les données admin-ajoutées (actualités, événements) ne persistent pas au rechargement — elles sont remises à l'état initial de `D` à chaque chargement de page.

---

## 5. Système d'authentification

### Utilisateurs standards (étudiants, enseignants, visiteurs)

- Stockés dans `localStorage('enspd_users7')` (JSON array)
- Mot de passe haché avec `hashP()` (hash djb2 simple)
- Session dans `localStorage('enspd_u7')` (expire après 24h)

### Administrateur ENSPD

- Email : `admin` ou `admin@enspd.bj`
- Hash : `hashP('enspd::' + motdepasse)` stocké dans `localStorage('enspd_admin_hash_v1')`
- Aucun mot de passe codé en dur dans le source
- Premier accès → modal de configuration du mot de passe

### Administrateur BUE

- Même principe, clé : `localStorage('bue_admin_hash_v7')`
- Hash : PBKDF2-SHA256 via Web Crypto API (plus robuste que ENSPD)

### Rate limiting

- 5 tentatives maximum par email en 5 minutes
- Persisté dans `localStorage('enspd_rl')`
- Appliqué AVANT la vérification admin (couvre le path admin)

---

## 6. Système i18n (traductions)

### ENSPD (index.html / enspd.js)

Basé sur l'attribut HTML `data-i18n` :

```html
<h1 data-i18n="events_h1">Agenda ENSPD</h1>
```

La fonction `setLang(l)` parcourt tous les éléments `[data-i18n]` et injecte `LANG[l][key]`.

```javascript
// Ajouter une nouvelle chaîne traduite :
const LANG = {
  fr: { ma_cle: 'Mon texte français' },
  en: { ma_cle: 'My English text'   },
};
// Dans le HTML :
// <span data-i18n="ma_cle">Mon texte français</span>
```

Préférence de langue stockée dans `localStorage('enspd-lang')`.

### BUE (bue.html / bue.js)

Système impératif — `setBueLang()` met à jour les textes directement par sélecteur.
Clé de langue partagée avec ENSPD : `localStorage('enspd-lang')`.

### JSSED (jssed.html / jssed.js)

Traduction non encore implémentée (todo).

---

## 7. Sécurité — Points importants

### XSS

Toutes les données utilisateur passent par `S.esc()` avant d'être injectées dans `innerHTML` :

```javascript
const S = {
  esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
};
```

**Règle** : ne jamais utiliser `innerHTML = userInput` directement. Toujours passer par `S.esc()` ou utiliser `textContent`.

### Données dans LANG et D

`LANG` et `D` sont des constantes développeur (pas de l'input utilisateur). L'utilisation de `innerHTML` avec ces données est acceptable.

---

## 8. Fonctions render principales

Chaque section de la SPA est rendue par une fonction dédiée :

| Fonction | Rend | Appelée |
|---|---|---|
| `renderFormApercu()` | 4 cartes formations (accueil) | Init |
| `renderWhy()` | Grille "Pourquoi l'ENSPD" | Init + setLang() |
| `renderTemos()` | Slider témoignages | Init |
| `renderActusHome()` | 3 actualités homepage | Init + publish/delete |
| `renderActus(cat)` | Liste actualités filtrée | Init + filtre |
| `renderEvents()` | Liste événements | Init + add/delete |
| `renderFil(filtre)` | Grille filières | Init + filtre |
| `renderDebouches()` | Débouchés | Init |
| `renderAdmin()` | Section direction (page L'École) | Init |
| `renderAdminPage()` | Dashboard admin | nav('admin') |
| `renderLabos()` | Laboratoires de recherche | Init |
| `renderCond()` | Conditions d'accès | Init |
| `renderSteps()` | Étapes paiement | Init |
| `renderDocs()` | Documents officiels | Init |
| `renderGal(cat)` | Galerie photos (BUE) | Init + filtre catégorie |
| `renderLegal()` | Page mentions légales | Init |

---

## 9. Modals

Toutes les modals utilisent le système central :

```javascript
openModal(titre, htmlBody, estXL = false)
closeModal()
```

Le second argument est du HTML pur (construit en JS). Les modals XL (`estXL = true`) sont plus larges pour afficher les contenus longs (filières, actualités).

---

## 10. Historique des phases de développement

| Phase | Contenu |
|---|---|
| **Phase 1** | Stabilisation CSS, responsive navbar (breakpoint 1100px), overflow fix, chemins images, defer scripts |
| **Phase 2** | Design System v1.0 — migration polices (Inter + Instrument Serif), tokens CSS, font-synthesis |
| **Phase 3** | Hardening XSS — `S.esc()` partout, index-based events (ex `onclick="showEvent(${i})"`) |
| **Phase 4** | Sécurité admin — suppression mots de passe codés en dur, setup modal premier lancement, rate limiting persisté |
| **Phase 5** | i18n — clé `enspd-lang` unifiée ENSPD ↔ BUE, `html[lang]` mis à jour dans bue.js |
| **Phase 6** | Complétion — 120+ clés LANG manquantes, 9 fonctions manquantes (welcome/cookie/admin), renderLegal(), fix D.galerie.length, fix AUTH._users |

---

## 11. Points restants / Améliorations futures

- [ ] **jssed.html** — refonte visuelle pour aligner avec le Design System ENSPD
- [ ] **bue.html / jssed.html** — implémentation complète EN (actuellement partiellement FR)
- [ ] **Persistence des données** — les actualités/événements ajoutés en admin sont perdus au rechargement (localStorage ou petite API nécessaire)
- [ ] **`applyPresPhoto()`** — définie deux fois dans bue.js (lignes 726 et 1146) → nettoyer
- [ ] **Galerie** — intégrer la galerie comme vraie page dans le SPA ENSPD (actuellement, redirige vers bue.html)
- [ ] **Coding Club** — à relier après validation (ne pas toucher pour l'instant)
- [ ] **Backend léger** — pour que les données admin persistent sur tous les appareils
