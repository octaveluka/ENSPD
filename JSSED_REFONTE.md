# JSSED — Refonte de la plateforme (frontend + backend)

Refonte complète de la partie **JSSED** (Journées Scientifiques de la Statistique,
de l'Évaluation et de la Démographie — ENSPD, Université de Parakou). Ce document
résume ce qui a changé et comment mettre en ligne.

## Ce qui a changé

### Design
- **Nouvelle identité « bleu marine + or académique »** — sobre, institutionnelle,
  aérée. Suppression du thème « cosmique » (étoiles, halos, dégradés violet/indigo
  type LLM) et de **tous les stickers / émojis** (remplacés par des icônes au trait).
- **Thème clair + sombre commutable** (bouton dans la barre du haut, préférence
  mémorisée, respect du réglage système au premier chargement).
- Mise en page plus respirante (espacements, cartes, typographie titre serif
  *Spectral* + corps *Inter*).
- **Fichiers découplés** : `jssed.html` ne dépend plus de `shared.css`. La partie
  JSSED est désormais autonome (sa propre feuille de style et ses polices).

### Contenu & structure
- **Édition 2025 (1ʳᵉ)** : présentée comme **terminée / archivée**, avec KPIs et une
  **galerie d'emplacements photos** prêts à recevoir les vraies images (placeholders
  « à ajouter » tant que les fichiers ne sont pas présents).
- **Édition 2026 (2ᵉ)** : édition active mise en avant, avec **compte à rebours
  configurable** (en attente tant que la date officielle n'est pas saisie).
- Contenu fidèle à l'appel à communications 2025 (3 ateliers, formats, tarifs FCFA,
  paiement Trésor Public, dates clés indicatives, FAQ, comité, partenaires).
- **Section « Confidentialité & conditions »** ajoutée (mentions légales / RGPD).

### Formulaire & sécurité
- Formulaire de soumission **multi-étapes renforcé** : validation par champ avec
  messages d'erreur, compteur de mots (≤ 300), contrôle des mots-clés (3 à 5),
  consentement RGPD obligatoire, **champ piège anti-spam (honeypot)**.
- **Backend PHP 8 + MySQL** (dossier `backend/`) : enregistrement en base via
  requêtes préparées (PDO), **limitation de débit par IP**, honeypot côté serveur,
  **espace d'administration** sécurisé (mots de passe hachés, sessions sécurisées,
  protection CSRF), export CSV, et **effacement RGPD** des données d'un participant.
- Le frontend fonctionne **avec ou sans backend** : si `apiBase` est vide ou le
  serveur indisponible, le formulaire bascule automatiquement sur l'envoi par email
  + sauvegarde locale (aucune perte de données).

## Fichiers livrés

| Fichier | Rôle |
|---|---|
| `jssed.html` | Page JSSED (refondue, sans émoji, thème clair/sombre) |
| `jssed.css` | Feuille de style autonome (palette navy + or, responsive) |
| `jssed.js` | Logique : thème, compte à rebours, formulaire, tableau de bord |
| `backend/` | API PHP + base MySQL + admin (voir `backend/README.md`) |

## Réglages au déploiement (`jssed.js`, tout en haut)

```js
const JSSED_CONFIG = {
  apiBase: '',        // '' = mode hors-ligne ; sinon 'https://…/backend/api'
  eventDate: null,    // null tant que la date est inconnue ; sinon '2026-09-08T08:00:00'
  email: 'jssed.enspd.up.2025@gmail.com'
};
```

- Renseigner **`eventDate`** dès que la date officielle est connue → le compte à
  rebours démarre tout seul.
- Renseigner **`apiBase`** après avoir déployé le backend → les soumissions sont
  enregistrées en base. Guide complet : **`backend/README.md`**.

## Photos

Déposer les images dans `assets/galerie/bue/` (galerie 2025) et
`assets/logos/Logo_ENSPD.jpg` (logo). Les emplacements vides affichent un
placeholder propre tant que la photo n'est pas ajoutée — modifiable dans
`jssed.js` (objet `JSSED_DATA.gallery`).
