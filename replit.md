# ENSPD — Site Officiel

Site web officiel de l'**École Nationale de Statistique, de Planification et de Démographie** — Université de Parakou, Bénin.

Développé par **DJOROD_CODING** · Phases 1–6 · Dernière mise à jour : Mai 2026

---

## Structure

3 SPAs (Single Page Applications) 100 % vanilla (HTML + CSS + JS, aucune dépendance) :

| Fichier | Site |
|---|---|
| `index.html` | Site ENSPD principal (10 pages) |
| `bue.html` | Bureau des Unions Étudiantes |
| `jssed.html` | Journée Statistique Suivi-Évaluation Démographie |

### Backends PHP

Il y a deux dossiers backend dans le dépôt :

- `backend/` — backend original (admin, API, formulaire de contact, upload photo)
- `backend-enspd/` — version refactorisée/alternative du backend

Les deux ont la même structure (`admin/`, `api/`, `src/`, `schema.sql`, `config.example.php`). Clarifier lequel est canonique avant tout déploiement. Ces backends nécessitent un serveur Apache/PHP séparé et ne sont **pas** servis par le workflow Replit actuel.

---

## Déploiement Render (prêt à l'emploi)

- `render.yaml` (racine) — Blueprint Render : crée automatiquement le frontend (Web Service Python) et le backend (`backend-enspd/Dockerfile`, Web Service Docker), avec toutes les variables d'environnement pré-remplies. Déploiement en un clic via **New +** → **Blueprint**.
- `backend-enspd/Dockerfile` + `backend-enspd/docker/entrypoint.sh` — image tout-en-un PHP 8.2/Apache **+ MySQL embarqué** : aucune base de données externe à créer. Au premier démarrage : init MySQL, création DB/utilisateur, import de `schema.sql`, création d'un compte admin par défaut (`admin@enspd.bj` / `EnspdAdmin2026!` — à changer immédiatement). Testé de bout en bout (build + run + requêtes HTTP).
- ⚠️ Sans **Render Disk** monté sur `/var/lib/mysql` (déjà déclaré dans `render.yaml`, nécessite le plan Starter+), les données MySQL sont perdues à chaque redéploiement — voir `RENDER_DEPLOYMENT.md`.
- Voir `RENDER_DEPLOYMENT.md` (guide complet) et `render-env-variables.txt` (liste des variables) pour le détail.

---

## Lancer le projet (frontend)

```bash
python3 -m http.server 5000
```

Workflow configuré : **Start application** — sert les fichiers statiques sur le port 5000.  
Accès aux 3 sites : `/`, `/bue.html`, `/jssed.html`

> Le workflow sert uniquement le frontend statique. Les endpoints PHP (admin, contact, upload) nécessitent un hébergement Apache/PHP dédié.

---

## Assets

Les dossiers `assets/` contiennent déjà les images principales :

- `assets/campus/` — photos du bâtiment et du campus
- `assets/galerie/bue/` et `assets/galerie/enspd/` — photos d'événements
- `assets/logos/` — logos ENSPD et BUE

Pour ajouter d'autres photos, respecter les noms de fichiers référencés dans `enspd.js` (objet `D.galerie`).

---

## Variables d'environnement

- `SESSION_SECRET` — disponible pour le backend PHP.

---

## User preferences

_Aucune préférence enregistrée pour l'instant._
