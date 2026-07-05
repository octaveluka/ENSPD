# SEO & Accessibilité — JSSED / ENSPD

Domaine canonique de référence : **`https://jssed.enspd-up.bj/`** (page JSSED) ;
site institutionnel ENSPD sur son propre domaine/chemin. Adapter les URL ci-
dessous au domaine réellement déployé.

---

## 1. Référencement (SEO)

### 1.1 Checklist

- [x] **Langue** : `<html lang="fr">` (présent).
- [x] **Titre** unique et descriptif par page (`<title>` présent sur `jssed.html`).
- [x] **Meta description** (~150–160 caractères, présente).
- [x] **Open Graph** (`og:title`, `og:description`, `og:type`, `og:locale=fr_BJ`).
- [x] **Twitter Card** (`summary_large_image`).
- [x] **Canonical** (`<link rel="canonical">`).
- [x] **`sitemap.xml`** publié à la racine (index.html, jssed.html, bue.html).
- [x] **`robots.txt`** publié à la racine (bloque `/backend*/admin/` et `/backend*/api/`).
- [x] **JSON-LD `Event`** pour JSSED 2026 (présent dans `jssed.html`).
- [x] **`theme-color`** défini (`#0A2342`).
- [ ] **Image Open Graph** : fournir `og:image` (1200×630, < 300 Ko) — ex.
      `assets/logos/jssed-og.jpg` — et l'ajouter aux balises OG/Twitter.
- [ ] **Performance** : compression gzip/brotli, cache long sur statiques,
      images optimisées (WebP/AVIF), `loading="lazy"` sur images hors écran,
      polices auto-hébergées avec `font-display: swap`.
- [ ] **URLs propres** et stables ; éviter les paramètres inutiles.
- [ ] **Données structurées** validées via le test des résultats enrichis Google.

### 1.2 JSON-LD — Event (à insérer dans le `<head>` de `jssed.html`)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "JSSED 2026 — Journées Scientifiques de la Statistique, de l'Évaluation et de la Démographie",
  "description": "Dynamiques démographiques et socio-environnementales en Afrique subsaharienne : statistique, évaluation et démographie au service du développement durable.",
  "startDate": "2026-09-15T09:00:00+01:00",
  "endDate": "2026-09-18T13:00:00+01:00",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "inLanguage": "fr",
  "image": ["https://jssed.enspd-up.bj/assets/logos/jssed-og.jpg"],
  "location": {
    "@type": "Place",
    "name": "ENSPD — Université de Parakou",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Parakou",
      "addressCountry": "BJ"
    }
  },
  "organizer": {
    "@type": "Organization",
    "name": "ENSPD — Université de Parakou",
    "url": "https://jssed.enspd-up.bj/"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://jssed.enspd-up.bj/#inscription",
    "availability": "https://schema.org/InStock",
    "category": "registration"
  }
}
</script>
```

### 1.3 `sitemap.xml` (à placer à la racine du site)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://jssed.enspd-up.bj/</loc>
    <lastmod>2026-06-18</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://jssed.enspd-up.bj/jssed.html</loc>
    <lastmod>2026-06-18</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://jssed.enspd-up.bj/index.html</loc>
    <lastmod>2026-06-18</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://jssed.enspd-up.bj/bue.html</loc>
    <lastmod>2026-06-18</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```

### 1.4 `robots.txt` (à placer à la racine du site)

```
User-agent: *
Allow: /

# Ne pas indexer l'espace d'administration ni l'API
Disallow: /backend/admin/
Disallow: /backend/api/
Disallow: /backend-enspd/admin/
Disallow: /backend-enspd/api/

Sitemap: https://jssed.enspd-up.bj/sitemap.xml
```

> Le tableau de bord admin émet déjà `<meta name="robots" content="noindex,
> nofollow">` ; le `robots.txt` ajoute une couche de prévention côté crawl.

---

## 2. Accessibilité (WCAG 2.1 AA)

### 2.1 Contraste des couleurs (palette marine + vert)

La charte utilise un **marine** profond et un **vert** académique. Cibles WCAG AA :
**4.5:1** pour le texte courant, **3:1** pour le grand texte / éléments UI.

| Premier plan / fond | Usage | Recommandation |
|---------------------|-------|----------------|
| Texte foncé (#1A2238) sur ivoire (#F7F5EF) | corps de texte | Contraste très élevé ✅ |
| Blanc (#FFFFFF) sur marine (#16294D / #0A2342) | en-têtes, boutons | Contraste élevé ✅ |
| Blanc sur vert (#2f6b3a) | boutons d'action | ✅ (≈ 4.5:1+) — **vérifier** la nuance finale |
| Texte « muted » (#5b6478) sur ivoire | légendes | Proche du seuil — réserver aux **textes secondaires**, pas aux infos essentielles |
| Or (#C49A2E) comme **texte** sur clair | à éviter pour le texte | Utiliser l'or en **accent/bordure**, pas pour du texte fin |

> Action : valider chaque couple texte/fond avec un vérificateur de contraste
> (WebAIM Contrast Checker). Ne jamais transmettre une information **par la
> couleur seule** (ajouter libellé/icône/texte).

### 2.2 Checklist d'accessibilité

- [x] **HTML sémantique** : `header`, `nav`, `main`, `section`, `footer`,
      titres hiérarchisés (`h1`→`h2`→`h3`) sans saut de niveau.
- [ ] **Texte alternatif** : `alt` pertinent sur toutes les images de contenu ;
      `alt=""` pour les images purement décoratives.
- [ ] **Navigation clavier** : tous les éléments interactifs atteignables au
      `Tab`, dans un ordre logique ; pas de piège au clavier.
- [ ] **États de focus visibles** : conserver/renforcer un `outline` net (ne pas
      faire `outline:none` sans alternative). Le backend admin met déjà un
      `box-shadow` de focus sur les champs — appliquer le même principe au front.
- [ ] **ARIA** : `aria-label` sur les boutons icône ; `aria-current="page"` sur
      l'onglet/lien actif ; `role`/`aria-live` pour les messages de statut des
      formulaires (succès/erreur annoncés aux lecteurs d'écran).
- [ ] **Formulaires** : chaque champ a un `<label>` associé (`for`/`id`) ;
      messages d'erreur reliés via `aria-describedby` ; champs requis indiqués
      autrement que par la seule couleur.
- [ ] **Lien d'évitement** « Aller au contenu principal » en début de page.
- [ ] **Cibles tactiles** ≥ 44×44 px (boutons/menus mobiles).
- [ ] **Mouvement réduit** : respecter la préférence utilisateur :
      ```css
      @media (prefers-reduced-motion: reduce){
        *{ animation-duration:0.001ms !important; animation-iteration-count:1 !important;
           transition-duration:0.001ms !important; scroll-behavior:auto !important; }
      }
      ```
- [ ] **Zoom** : la page reste utilisable à 200 % sans perte de contenu ;
      `meta viewport` sans `maximum-scale`/`user-scalable=no`.
- [ ] **Langue** correcte (`lang="fr"`) ; titres de page explicites.
- [ ] **Compte à rebours / animations** : ne pas clignoter > 3 fois/s.

### 2.3 Tests recommandés

- Audit **Lighthouse** (onglets SEO, Accessibility, Performance) ≥ 90.
- Lecteur d'écran : **NVDA** (Windows) ou **VoiceOver** (macOS/iOS).
- Navigation **100 % clavier** sans souris sur les parcours clés
  (menu, soumission, inscription, contact).
- Vérificateur de contraste sur la palette finale marine/vert/or.
