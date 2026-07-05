---
name: Gallery tab routing and image extensions
description: How the 3 site galleries route/render, and a recurring extension-mismatch bug class
---

## Routing
- ENSPD (`index.html`/`enspd.js`): gallery is a real nav tab (`data-p="galerie"`); `nav()` calls `renderGal()`; image data lives in `D.galerie` (enspd.js).
- BUE (`bue.html`/`bue.js`): gallery data lives in `B.galerie`; rendered via `renderBueGaleriePage()` / filtered via `filterBueGal()`.
- JSSED (`jssed.html`/`jssed.js`): gallery rendered via `renderGallery()`.

## Recurring bug: file extension mismatches
Several asset files under `assets/galerie/**` have inconsistent-case or non-`.jpg` extensions (e.g. `.JPG`, `.jpeg`) even though most references assume `.jpg`. This has caused real broken-image bugs — e.g. `bue.js`'s `B.galerie['Rentrée Solennelle']` entries pointed to `rentree_*.jpg` for files that were actually `.jpeg`/`.JPG` on disk, because that section duplicates ENSPD's `assets/galerie/enspd/` photos with copy-pasted-and-guessed extensions.

**Why:** Copy-pasting gallery entries across the three sites' JS files (they intentionally cross-reference each other's asset folders sometimes, e.g. BUE showing ENSPD event photos) easily drifts from the real filenames when extensions aren't verified.

**How to apply:** Before adding/editing any gallery entry (`D.galerie`, `B.galerie`, or JSSED gallery data) that references an image path, run `ls` on the target `assets/galerie/...` folder (or a script diffing referenced paths against `fs.existsSync`) to confirm the exact extension/case — never assume `.jpg`.
