/* =========================================================
   JSSED — Plateforme scientifique ENSPD / Univ. de Parakou
   Thème clair/sombre · Compte à rebours · Formulaire sécurisé
   Tableau de bord · FAQ · Sections dynamiques
   ========================================================= */
'use strict';

/* =========================================================
   CONFIGURATION  (à ajuster lors du déploiement)
   ---------------------------------------------------------
   - apiBase : URL du backend PHP. Laisser '' pour le mode
     « hors-ligne » (le formulaire bascule alors sur l'envoi
     par email + sauvegarde locale).
     Exemple en production : 'backend/api' ou '/backend/api'.
   - eventDate : date officielle des journées au format ISO
     ('2026-09-08T08:00:00'). Laisser null tant qu'elle n'est
     pas connue : le compte à rebours reste en attente.
   ========================================================= */
const JSSED_CONFIG = {
  apiBase: 'backend/api',      // backend JSSED (dossier backend/) — repli email si indisponible
  eventDate: '2026-09-15T08:00:00', // ouverture des JSSED — 15 au 18 septembre 2026
  registrationOpen: true,      // passer à false pour fermer les soumissions/inscriptions
  email: 'jssed.enspd.up.2026@gmail.com'
};

/* ---------- Utilitaires ---------- */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const pad = (n, l = 2) => String(n).padStart(l, '0');
const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* =========================================================
   THÈME CLAIR / SOMBRE
   ========================================================= */
const jsTheme = {
  KEY: 'jssed-theme',
  set(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(this.KEY, t); } catch (e) {}
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#07182F' : '#0A2342');
  },
  toggle() {
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    this.set(cur === 'dark' ? 'light' : 'dark');
  },
  init() {
    const btn = $('#js-theme-toggle');
    if (btn) btn.addEventListener('click', () => this.toggle());
  }
};

/* =========================================================
   COMPTE À REBOURS  (édition en cours)
   ========================================================= */
const jsCountdown = {
  init() {
    const target = JSSED_CONFIG.eventDate ? new Date(JSSED_CONFIG.eventDate) : null;
    const valid = target && !isNaN(target) && target.getTime() > Date.now();

    const main = $('#js-countdown');
    const tba  = $('#js-countdown-tba');
    const mini = $('#js-ed-mini');
    const miniTba = $('#js-ed-tba');
    const heroDate = $('#js-hero-date');

    if (!valid) {
      // Date inconnue : on garde l'état « à venir »
      if (main) main.hidden = true;
      if (tba) tba.style.display = '';
      if (mini) mini.hidden = true;
      if (miniTba) miniTba.style.display = '';
      return;
    }

    if (main) main.hidden = false;
    if (tba) tba.style.display = 'none';
    if (mini) mini.hidden = false;
    if (miniTba) miniTba.style.display = 'none';
    if (heroDate) {
      heroDate.textContent = 'Du 15 au 18 septembre 2026';
    }

    const els = {
      j: $('#cd-j'), h: $('#cd-h'), m: $('#cd-m'), s: $('#cd-s'),
      ej: $('#ecd-j'), eh: $('#ecd-h'), em: $('#ecd-m')
    };

    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) { this.zero(els); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (els.j) els.j.textContent = pad(d, 3);
      if (els.h) els.h.textContent = pad(h);
      if (els.m) els.m.textContent = pad(m);
      if (els.s) els.s.textContent = pad(s);
      if (els.ej) els.ej.textContent = d;
      if (els.eh) els.eh.textContent = pad(h);
      if (els.em) els.em.textContent = pad(m);
    };
    tick();
    setInterval(tick, 1000);
  },
  zero(els) {
    ['j', 'h', 'm', 's'].forEach(k => { if (els[k]) els[k].textContent = els[k].id === 'cd-j' ? '000' : '00'; });
    if (els.ej) els.ej.textContent = '0';
    if (els.eh) els.eh.textContent = '00';
    if (els.em) els.em.textContent = '00';
  }
};

/* =========================================================
   MENU MOBILE + TOPBAR + REVEAL
   ========================================================= */
function initBurger() {
  const btn = $('#js-burger');
  const nav = $('#js-mobile-nav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  $$('.js-mobile-link', nav).forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }));
}

function initTopbarScroll() {
  const bar = $('#js-topbar');
  if (!bar) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      bar.classList.toggle('scrolled', window.scrollY > 40);
      ticking = false;
    });
    ticking = true;
  }, { passive: true });
}

function initReveal() {
  const els = $$('.js-reveal');
  if (!els.length) return;
  if (!window.IntersectionObserver) { els.forEach(el => el.classList.add('visible')); return; }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => obs.observe(el));
}

/* =========================================================
   DONNÉES DYNAMIQUES
   ========================================================= */
const JSSED_DATA = {
  comite: [
    { nom: 'Comité scientifique', role: 'Présidence', affil: 'ENSPD — Univ. de Parakou', ini: 'CS' },
    { nom: 'Collaboration EDSAE', role: 'Co-organisation', affil: 'École Doctorale Sc. Agronomiques & de l\'Eau', ini: 'ED' },
    { nom: 'Atelier 1', role: 'Démographie & environnement', affil: 'ENSPD / EDSAE', ini: 'A1' },
    { nom: 'Atelier 2', role: 'Données & méthodes', affil: 'ENSPD', ini: 'A2' },
    { nom: 'Atelier 3', role: 'Évaluation & politiques', affil: 'ENSPD', ini: 'A3' },
    { nom: 'Secrétariat scientifique', role: 'Secrétariat', affil: 'ENSPD — Univ. de Parakou', ini: 'SS' }
  ],
  // Actualités / annonces — modifiable ici (les plus récentes en premier)
  news: [
    { date: 'Mai 2026', tag: 'Appel', title: 'Appel à communications ouvert', text: 'La soumission des résumés est ouverte jusqu\'au 15 août 2026, en français ou en anglais, sur les trois ateliers thématiques.' },
    { date: '2026', tag: 'Hommage', title: 'Édition dédiée au Pr. Mouftaou AMADOU SANNI', text: 'La 2ᵉ édition rend hommage au premier Directeur de l\'ENSPD, admis à la retraite en octobre 2025.' },
    { date: '2026', tag: 'Inscription', title: 'Frais & modalités de paiement', text: 'Paiement en ligne via le Trésor Public du Bénin (eQuittance). Tarifs préférentiels avant le 30 août 2026.' }
  ],
  // Documents téléchargeables — mettre status:'available' + href réel quand disponible
  docs: [
    { name: 'Appel à communications', desc: 'Document officiel de l\'appel (PDF)', status: 'soon', href: '' },
    { name: 'Gabarit de résumé', desc: 'Modèle Word — Arial 12 pt, interligne 1,5', status: 'soon', href: '' },
    { name: 'Guide de participation', desc: 'Informations détaillées (PDF)', status: 'soon', href: '' },
    { name: 'Programme 2026', desc: 'Programme détaillé des journées', status: 'soon', href: '' }
  ],
  partners: [
    { nom: 'ENSPD', sub: 'École Nat. de Statistique, Planification & Démographie' },
    { nom: 'Université de Parakou', sub: 'UP — Bénin' },
    { nom: 'EDSAE', sub: 'École Doctorale des Sciences Agronomiques et de l\'Eau' },
    { nom: 'INStaD', sub: 'Institut National de la Statistique' },
    { nom: 'Annales de l\'UP', sub: 'Publication scientifique' },
    { nom: 'Partenaires institutionnels', sub: 'Soutiens de l\'événement' }
  ],
  gallery: [
    { caption: 'Séance plénière', img: 'assets/galerie/bue/jssed_1775853364124.jpg' },
    { caption: 'Atelier scientifique', img: 'assets/galerie/bue/jssed_1775853366762.jpg' },
    { caption: 'Présentations', img: 'assets/galerie/bue/jssed_1775853368864.jpg' },
    { caption: 'Réseautage', img: null },
    { caption: 'Remise de distinctions', img: null },
    { caption: 'Cérémonie de clôture', img: null }
  ],
  timeline: [
    { date: '15 mai 2026', title: 'Ouverture des soumissions', desc: 'Début de la soumission des résumés pour les trois ateliers.', badge: { t: 'Ouvert', c: 'open' }, cls: 'current' },
    { date: '15 juin 2026', title: '1er rappel', desc: 'Premier rappel aux auteurs.', badge: null, cls: '' },
    { date: '15 juillet 2026', title: '2ème rappel', desc: 'Second rappel aux auteurs.', badge: null, cls: '' },
    { date: '15 août 2026', title: 'Clôture des soumissions', desc: 'Date limite de dépôt des résumés (300 mots maximum).', badge: { t: 'À ne pas manquer', c: 'warn' }, cls: '' },
    { date: '20 août 2026', title: 'Réponses & ouverture des inscriptions', desc: 'Notifications aux auteurs et début des inscriptions.', badge: null, cls: '' },
    { date: '10 septembre 2026', title: 'Dépôt des posters', desc: 'Dépôt des communications affichées / posters.', badge: null, cls: '' },
    { date: '15 au 18 septembre 2026', title: 'Tenue des JSSED 2026', desc: 'Hommage, conférences-débats, communications, posters et expositions — Université de Parakou.', badge: { t: 'Événement', c: 'key' }, cls: 'key' }
  ],
  faq: [
    { q: 'Qui peut soumettre une communication ?', a: 'Tout chercheur, enseignant-chercheur, étudiant en Master ou Doctorat, et professionnel des domaines de la statistique, de l\'évaluation ou de la démographie. Les communications interdisciplinaires sont les bienvenues.' },
    { q: 'Quelles langues sont acceptées ?', a: 'Les communications peuvent être soumises et présentées en français ou en anglais.' },
    { q: 'Combien de communications peut-on soumettre ?', a: 'Un auteur peut soumettre au maximum deux communications, dont une seule en tant qu\'auteur principal. Les co-auteurs ne sont pas limités.' },
    { q: 'Comment les communications sont-elles évaluées ?', a: 'Chaque résumé est évalué en double aveugle par au moins deux membres du comité scientifique : originalité, rigueur méthodologique, pertinence thématique et qualité de rédaction.' },
    { q: 'Où sont publiés les actes ?', a: 'Les meilleures communications sont publiées dans les séries spécialisées des Annales de l\'Université de Parakou. Un livre des résumés est distribué à tous les participants.' },
    { q: 'Peut-on assister sans présenter ?', a: 'Oui, la participation comme auditeur est possible au tarif correspondant à votre statut, avec accès à tous les ateliers et activités de réseautage.' },
    { q: 'Comment mes données sont-elles protégées ?', a: 'Vos données ne servent qu\'à l\'organisation de l\'événement, sont transmises de façon sécurisée et ne sont jamais cédées à des tiers. Vous pouvez demander leur suppression à tout moment.' }
  ],
  // Conférenciers / sessions clés (modifiable ; gérable via le backend une fois branché)
  speakers: [
    { nom: 'Hommage', role: 'Session plénière', affil: 'Pr. Mouftaou AMADOU SANNI — premier Directeur de l\'ENSPD', ini: 'MA' },
    { nom: 'Conférence inaugurale', role: 'Keynote', affil: 'Intervenant invité — à confirmer', ini: 'CI' },
    { nom: 'Conférence finale', role: 'Keynote', affil: 'Intervenant invité — à confirmer', ini: 'CF' }
  ],
  // Programme prévisionnel (15–18 septembre 2026)
  program: [
    { jour: 'Mardi 15 septembre 2026', items: [
      { h: '09:00 – 10:30', tag: 'Plénière', t: 'Cérémonie d\'ouverture & hommage au Pr. Mouftaou AMADOU SANNI', meta: 'Session plénière d\'hommage' },
      { h: '11:00 – 12:30', tag: 'Conférence', t: 'Conférence inaugurale', meta: 'Thème principal des journées' }
    ]},
    { jour: 'Mercredi 16 septembre 2026', items: [
      { h: '09:00 – 12:30', tag: 'Atelier', t: 'Atelier 1 — Dynamiques démographiques & transformations socio-environnementales', meta: 'Communications orales' },
      { h: '14:00 – 17:00', tag: 'Posters', t: 'Session de présentation des posters', meta: '' }
    ]},
    { jour: 'Jeudi 17 septembre 2026', items: [
      { h: '09:00 – 12:30', tag: 'Atelier', t: 'Atelier 2 — Données, méthodes statistiques & innovations', meta: 'Communications orales' },
      { h: '14:00 – 17:00', tag: 'Atelier', t: 'Atelier 3 — Évaluation des politiques publiques & pilotage du développement', meta: 'Communications orales' }
    ]},
    { jour: 'Vendredi 18 septembre 2026', items: [
      { h: '09:00 – 11:00', tag: 'Exposition', t: 'Expositions & démonstrations d\'outils', meta: '' },
      { h: '11:30 – 13:00', tag: 'Plénière', t: 'Conférence finale & cérémonie de clôture', meta: 'Capitalisation des acquis' }
    ]}
  ]
};

const SVG = {
  building: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 21V9h3a1 1 0 0 1 1 1v11M8 8h2M8 12h2M8 16h2"/></svg>',
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L19 6h0a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="12.5" r="3.2"/></svg>',
  doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>'
};

function renderSpeakers() {
  const el = $('#js-speakers-grid'); if (!el) return;
  el.innerHTML = JSSED_DATA.speakers.map(s => `
    <article class="js-speaker">
      <div class="js-speaker-photo">${s.photo ? `<img src="${escapeHtml(s.photo)}" alt="${escapeHtml(s.nom)}" style="width:100%;height:100%;border-radius:50%;object-fit:cover">` : escapeHtml(s.ini || '')}</div>
      <div class="js-speaker-name">${escapeHtml(s.nom)}</div>
      <div class="js-speaker-role">${escapeHtml(s.role)}</div>
      <div class="js-speaker-affil">${escapeHtml(s.affil)}</div>
      ${s.bio ? `<div class="js-speaker-bio">${escapeHtml(s.bio)}</div>` : ''}
    </article>`).join('');
}

function renderProgram() {
  const el = $('#js-prog'); if (!el) return;
  el.innerHTML = JSSED_DATA.program.map(d => `
    <div class="js-prog-day">
      <div class="js-prog-day-h">${escapeHtml(d.jour)}</div>
      ${d.items.map(it => `
        <div class="js-prog-row">
          <div class="js-prog-time">${escapeHtml(it.h)}</div>
          <div>
            ${it.tag ? `<span class="js-prog-tag">${escapeHtml(it.tag)}</span>` : ''}
            <div class="js-prog-title">${escapeHtml(it.t)}</div>
            ${it.meta ? `<div class="js-prog-meta">${escapeHtml(it.meta)}</div>` : ''}
          </div>
        </div>`).join('')}
    </div>`).join('');
}

function renderNews() {
  const el = $('#js-news-grid'); if (!el) return;
  el.innerHTML = JSSED_DATA.news.map(n => `
    <article class="js-news-card">
      <div class="js-news-head">
        <span class="js-news-tag">${escapeHtml(n.tag)}</span>
        <span class="js-news-date">${escapeHtml(n.date)}</span>
      </div>
      <h3 class="js-news-title">${escapeHtml(n.title)}</h3>
      <p class="js-news-text">${escapeHtml(n.text)}</p>
    </article>`).join('');
}

function renderDocs() {
  const el = $('#js-docs-list'); if (!el) return;
  el.innerHTML = JSSED_DATA.docs.map(d => {
    const isLink = d.status === 'available' && d.href;
    const tag = isLink ? 'a' : 'div';
    const attrs = isLink ? ` href="${escapeHtml(d.href)}" download` : '';
    const status = isLink
      ? '<span class="js-doc-status available">Disponible</span>'
      : '<span class="js-doc-status soon">Bientôt</span>';
    return `<${tag} class="js-doc-item"${attrs}>
      <span class="js-doc-icon" aria-hidden="true">${SVG.doc}</span>
      <span class="js-doc-body">
        <span class="js-doc-name">${escapeHtml(d.name)}</span>
        <span class="js-doc-desc">${escapeHtml(d.desc)}</span>
      </span>
      ${status}
    </${tag}>`;
  }).join('');
}

function renderComite() {
  const el = $('#js-sc-grid'); if (!el) return;
  el.innerHTML = JSSED_DATA.comite.map(m => `
    <div class="js-sc-card js-reveal" role="listitem">
      <div class="js-sc-avatar">${escapeHtml(m.ini)}</div>
      <div class="js-sc-body">
        <div class="js-sc-nom">${escapeHtml(m.nom)}</div>
        <div class="js-sc-role">${escapeHtml(m.role)}</div>
        <div class="js-sc-affil">${escapeHtml(m.affil)}</div>
      </div>
    </div>`).join('');
}

function renderPartners() {
  const el = $('#js-partners-grid'); if (!el) return;
  el.innerHTML = JSSED_DATA.partners.map(p => `
    <div class="js-partner-chip" role="listitem">
      <span class="js-pc-icon" aria-hidden="true">${SVG.building}</span>
      <div>
        <div class="js-pc-nom">${escapeHtml(p.nom)}</div>
        <div class="js-pc-sub">${escapeHtml(p.sub)}</div>
      </div>
    </div>`).join('');
}

function renderGallery() {
  const el = $('#js-arch-gallery'); if (!el) return;
  el.innerHTML = JSSED_DATA.gallery.map(g => {
    if (g.img) {
      return `<div class="js-arch-photo-wrap js-reveal">
        <img src="${escapeHtml(g.img)}" alt="JSSED 2025 — ${escapeHtml(g.caption)}" class="js-arch-photo" loading="lazy"
             onerror="this.style.display='none'">
        <div class="js-arch-photo-placeholder" aria-hidden="true">${SVG.camera}<span class="js-arch-ph-label">${escapeHtml(g.caption)}</span></div>
        <div class="js-arch-photo-caption">${escapeHtml(g.caption)}</div>
      </div>`;
    }
    return `<div class="js-arch-photo-wrap js-arch-photo-wrap--empty js-reveal">
      <div class="js-arch-photo-placeholder" aria-hidden="true">${SVG.camera}<span class="js-arch-ph-label">${escapeHtml(g.caption)} · à ajouter</span></div>
      <div class="js-arch-photo-caption">${escapeHtml(g.caption)}</div>
    </div>`;
  }).join('');
}

function renderTimeline() {
  const el = $('#js-timeline'); if (!el) return;
  el.innerHTML = JSSED_DATA.timeline.map((t, i) => `
    <div class="js-tl-item js-reveal ${t.cls}">
      <div class="js-tl-date">${escapeHtml(t.date)}</div>
      <div class="js-tl-title">${escapeHtml(t.title)}</div>
      <div class="js-tl-desc">${escapeHtml(t.desc)}</div>
      ${t.badge ? `<span class="js-tl-badge ${t.badge.c}">${escapeHtml(t.badge.t)}</span>` : ''}
    </div>`).join('');
}

function renderFaq() {
  const el = $('#js-faq-list'); if (!el) return;
  el.innerHTML = JSSED_DATA.faq.map(f => `
    <div class="js-faq-item" role="listitem">
      <button class="js-faq-q" aria-expanded="false">${escapeHtml(f.q)}<span class="js-faq-icon" aria-hidden="true"></span></button>
      <div class="js-faq-a"><div>${escapeHtml(f.a)}</div></div>
    </div>`).join('');
  $$('.js-faq-q', el).forEach(btn => btn.addEventListener('click', () => {
    const item = btn.closest('.js-faq-item');
    const open = item.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  }));
}

/* =========================================================
   STOCKAGE LOCAL (suivi des soumissions sur l'appareil)
   ========================================================= */
const store = {
  KEY: 'jssed_submissions_v2',
  get() { try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); } catch { return []; } },
  set(d) { try { localStorage.setItem(this.KEY, JSON.stringify(d)); } catch {} },
  add(s) { const l = this.get(); l.unshift(s); this.set(l); return s; }
};

/* =========================================================
   FORMULAIRE DE SOUMISSION (multi-étapes, validation)
   ========================================================= */
const jsform = {
  current: 1, total: 5, data: {}, submitting: false,

  next(from) {
    if (!this.validateStep(from)) return;
    this.collect(from);
    this.saveDraft();
    if (from === 4) this.renderSummary();
    this.goTo(from + 1);
  },
  prev(from) { this.collect(from); this.saveDraft(); this.goTo(from - 1); },

  goTo(step) {
    if (step < 1 || step > this.total) return;
    $$('.js-form-step').forEach(el => el.classList.remove('active'));
    const t = $('#step-' + step);
    if (t) t.classList.add('active');
    $$('.js-step-dot').forEach((dot, i) => {
      dot.classList.remove('active', 'done');
      dot.setAttribute('aria-selected', 'false');
      if (i + 1 < step) dot.classList.add('done');
      if (i + 1 === step) { dot.classList.add('active'); dot.setAttribute('aria-selected', 'true'); }
    });
    const cur = $('#step-current'); if (cur) cur.textContent = step;
    this.current = step;
    this.hideAlert();
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  showError(name, msg) {
    const box = document.querySelector(`.js-field-error[data-for="${name}"]`);
    if (box) { if (msg) box.textContent = msg; box.classList.add('show'); }
    const field = document.querySelector(`[name="${name}"]`);
    if (field && field.classList) field.classList.add('is-invalid');
  },
  clearErrors(stepEl) {
    $$('.js-field-error', stepEl).forEach(b => b.classList.remove('show'));
    $$('.is-invalid', stepEl).forEach(f => f.classList.remove('is-invalid'));
  },

  validateStep(step) {
    const stepEl = $('#step-' + step);
    if (!stepEl) return true;
    this.clearErrors(stepEl);
    let valid = true, firstBad = null;

    stepEl.querySelectorAll('[required]').forEach(field => {
      let bad = false;
      if (field.type === 'radio') {
        const group = stepEl.querySelectorAll(`[name="${field.name}"]`);
        if (!Array.from(group).some(r => r.checked)) bad = true;
      } else if (!field.value.trim()) {
        bad = true;
      } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(field.value.trim())) {
        bad = true; this.showError(field.name, 'Adresse email invalide.');
      }
      if (bad) { valid = false; this.showError(field.name); if (!firstBad) firstBad = field; }
    });

    // Règle spécifique : résumé ≤ 300 mots
    if (step === 4) {
      const r = $('#resume');
      if (r && this.wordCount(r.value) > 300) {
        valid = false; this.showError('resume', 'Le résumé dépasse 300 mots.');
        if (!firstBad) firstBad = r;
      }
      const kw = $('#keywords');
      if (kw && kw.value.trim()) {
        const n = kw.value.split(',').map(s => s.trim()).filter(Boolean).length;
        if (n < 3 || n > 5) { valid = false; this.showError('keywords', 'Indiquez entre 3 et 5 mots-clés séparés par des virgules.'); if (!firstBad) firstBad = kw; }
      }
    }

    if (!valid) {
      this.showAlert('Veuillez corriger les champs indiqués avant de continuer.');
      if (firstBad && firstBad.focus) firstBad.focus();
    }
    return valid;
  },

  collect(step) {
    const stepEl = $('#step-' + step);
    if (!stepEl) return;
    stepEl.querySelectorAll('input, select, textarea').forEach(f => {
      if (!f.name || f.name === 'website') return;
      if (f.type === 'radio') { if (f.checked) this.data[f.name] = f.value; }
      else if (f.type === 'checkbox') { this.data[f.name] = f.checked; }
      else { this.data[f.name] = f.value.trim(); }
    });
    if (step === 3) this.data.coauthors = this.collectCoauthors();
  },

  collectCoauthors() {
    return $$('.js-coauth-item').map(item => ({
      prenom: item.querySelector('[data-field="coauth-prenom"]')?.value.trim() || '',
      nom: item.querySelector('[data-field="coauth-nom"]')?.value.trim() || '',
      institution: item.querySelector('[data-field="coauth-inst"]')?.value.trim() || ''
    })).filter(c => c.prenom || c.nom);
  },

  addCoauth() {
    const list = $('#js-coauth-list'); if (!list) return;
    const idx = list.children.length + 1;
    const item = document.createElement('div');
    item.className = 'js-coauth-item';
    item.innerHTML = `
      <input class="js-input" type="text" placeholder="Prénom" data-field="coauth-prenom" maxlength="80" aria-label="Prénom co-auteur ${idx}">
      <input class="js-input" type="text" placeholder="Nom" data-field="coauth-nom" maxlength="80" aria-label="Nom co-auteur ${idx}">
      <input class="js-input" type="text" placeholder="Institution" data-field="coauth-inst" maxlength="120" aria-label="Institution co-auteur ${idx}">
      <button type="button" class="js-coauth-remove" onclick="jsform.removeCoauth(this)" aria-label="Supprimer le co-auteur">×</button>`;
    list.appendChild(item);
  },
  removeCoauth(btn) { btn.closest('.js-coauth-item')?.remove(); },

  wordCount(v) { return v.trim() ? v.trim().split(/\s+/).length : 0; },
  countWords(el) {
    const w = this.wordCount(el.value);
    const c = $('#resume-counter'); if (!c) return;
    c.textContent = `${w} / 300 mots`;
    c.className = 'js-char-counter' + (w > 300 ? ' over' : w > 270 ? ' warn' : '');
  },

  saveDraft() { try { sessionStorage.setItem('jssed_draft', JSON.stringify(this.data)); } catch {} },

  showAlert(msg, type = 'err') {
    const a = $('#js-form-alert'); if (!a) return;
    a.textContent = msg; a.className = `js-form-alert ${type} show`;
  },
  hideAlert() { const a = $('#js-form-alert'); if (a) a.classList.remove('show'); },

  renderSummary() {
    const card = $('#js-summary-card'); if (!card) return;
    const ateliers = { '1': 'Statistique & Informatique décisionnelle', '2': 'Évaluation, Suivi-évaluation & IA', '3': 'Démographie & Intelligence Artificielle' };
    const formats = { oral: 'Communication orale', poster: 'Poster scientifique' };
    const d = this.data;
    const row = (l, v) => `<div><div class="js-label" style="margin-bottom:2px;">${l}</div><div style="font-size:14px;color:var(--text);">${escapeHtml(v) || '—'}</div></div>`;
    card.innerHTML = `
      <h3 class="js-form-section-title" style="margin-bottom:18px;">Récapitulatif</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px 24px;">
        ${row('Format', formats[d.format] || d.format)}
        ${row('Atelier', d.atelier ? `Atelier ${d.atelier} — ${ateliers[d.atelier] || ''}` : '')}
        ${row('Auteur principal', `${d.prenom || ''} ${d.nom || ''}`.trim())}
        ${row('Institution', d.institution)}
        ${row('Email', d.email)}
        ${row('Statut', d.statut)}
      </div>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);">
        <div class="js-label" style="margin-bottom:6px;">Titre</div>
        <div style="font-size:15px;font-weight:600;color:var(--text);line-height:1.4;">${escapeHtml(d.titre) || '—'}</div>
      </div>
      <div style="margin-top:12px;"><div class="js-label" style="margin-bottom:6px;">Mots-clés</div><div style="font-size:13px;color:var(--text-2);">${escapeHtml(d.keywords) || '—'}</div></div>
      ${(d.coauthors && d.coauthors.length) ? `<div style="margin-top:12px;"><div class="js-label" style="margin-bottom:6px;">Co-auteurs</div><div style="font-size:13px;color:var(--text-2);">${d.coauthors.map(c => escapeHtml(`${c.prenom} ${c.nom}${c.institution ? ' (' + c.institution + ')' : ''}`)).join(', ')}</div></div>` : ''}
    `;
  },

  genRef() {
    return `JSSED2026-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  },

  async submit() {
    if (this.submitting) return;
    // Anti-spam : honeypot
    const hp = $('#js-hp');
    if (hp && hp.value) { this.showSuccess(this.genRef()); return; }

    const cgu = $('#cgu');
    if (!cgu || !cgu.checked) { this.showAlert('Veuillez accepter les conditions et la politique de confidentialité.'); cgu?.focus(); return; }

    this.collect(5);
    this.data.consent = true;
    this.submitting = true;
    const btn = $('#btn-submit');
    if (btn) { btn.disabled = true; btn.textContent = 'Envoi en cours…'; }

    let ref = null, sent = false;
    if (JSSED_CONFIG.apiBase) {
      try {
        const res = await fetch(`${JSSED_CONFIG.apiBase}/submit.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.data)
        });
        const out = await res.json().catch(() => ({}));
        if (res.ok && out.ok) { ref = out.ref; sent = true; }
        else if (res.status === 422 && out.fields) {
          this.handleServerErrors(out.fields);
          this.resetBtn(btn); this.submitting = false; return;
        } else if (res.status === 429) {
          this.showAlert('Trop de tentatives. Merci de réessayer dans quelques minutes.');
          this.resetBtn(btn); this.submitting = false; return;
        }
      } catch (e) { /* réseau indisponible → bascule hors-ligne */ }
    }

    if (!sent) {
      // Mode hors-ligne : envoi par email + sauvegarde locale
      ref = this.genRef();
      this.openMailto(ref);
    }

    this.data.ref = ref;
    this.data.submittedAt = new Date().toISOString();
    store.add({ ...this.data });
    try { sessionStorage.removeItem('jssed_draft'); } catch {}
    this.showSuccess(ref);
    renderDashboard();
    this.submitting = false;
  },

  handleServerErrors(fields) {
    this.goTo(this.firstStepWithError(fields));
    Object.entries(fields).forEach(([k, msg]) => this.showError(k, msg));
    this.showAlert('Veuillez corriger les champs signalés.');
  },
  firstStepWithError(fields) {
    const map = { format: 1, atelier: 1, langue: 1, prenom: 2, nom: 2, email: 2, statut: 2, institution: 2, pays: 2, titre: 4, resume: 4, keywords: 4 };
    let min = 5;
    Object.keys(fields).forEach(k => { if (map[k] && map[k] < min) min = map[k]; });
    return min;
  },
  resetBtn(btn) { if (btn) { btn.disabled = false; btn.textContent = 'Envoyer la soumission'; } },

  openMailto(ref) {
    const d = this.data;
    const subject = encodeURIComponent(`JSSED – ${d.format === 'poster' ? 'Poster' : 'Communication orale'} – Atelier N°${d.atelier} – ${d.nom || ''}`);
    const body = encodeURIComponent(
      `Réf : ${ref}\n\nAuteur : ${d.prenom || ''} ${d.nom || ''}\nEmail : ${d.email || ''}\nTéléphone : ${d.tel || ''}\nStatut : ${d.statut || ''}\nInstitution : ${d.institution || ''}\nPays : ${d.pays || ''}\n\nAtelier : ${d.atelier}\nFormat : ${d.format}\nLangue : ${d.langue}\nTitre : ${d.titre || ''}\nMots-clés : ${d.keywords || ''}\nFinancement : ${d.financement || ''}\n\nRésumé :\n${d.resume || ''}\n\nCo-auteurs :\n${(d.coauthors || []).map(c => `- ${c.prenom} ${c.nom} (${c.institution})`).join('\n')}`
    );
    window.location.href = `mailto:${JSSED_CONFIG.email}?subject=${subject}&body=${body}`;
  },

  showSuccess(ref) {
    const form = $('#js-form'); if (form) form.style.display = 'none';
    const ok = $('#js-success');
    if (ok) {
      ok.style.display = '';
      const code = $('#js-ref-code'); if (code) code.textContent = ref;
      ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  goToDashboard() { $('#dashboard')?.scrollIntoView({ behavior: 'smooth' }); renderDashboard(); },

  reset() {
    this.data = {}; this.current = 1; this.submitting = false;
    const form = $('#js-form'); if (form) { form.reset(); form.style.display = ''; }
    const list = $('#js-coauth-list'); if (list) list.innerHTML = '';
    const ok = $('#js-success'); if (ok) ok.style.display = 'none';
    this.resetBtn($('#btn-submit'));
    this.countWords($('#resume') || { value: '' });
    this.goTo(1);
  }
};

function initFormSubmit() {
  const form = $('#js-form'); if (!form) return;
  form.addEventListener('submit', (e) => { e.preventDefault(); jsform.submit(); });
}

/* =========================================================
   TABLEAU DE BORD PARTICIPANT
   ========================================================= */
function renderDashboard() {
  const list = $('#js-submissions-list');
  const empty = $('#js-dash-empty');
  if (!list || !empty) return;
  const subs = store.get();
  if (!subs.length) { empty.style.display = ''; list.innerHTML = ''; return; }
  empty.style.display = 'none';
  const ateliers = { '1': 'Atelier 1 — Statistique', '2': 'Atelier 2 — Évaluation', '3': 'Atelier 3 — Démographie' };
  const formats = { oral: 'Oral', poster: 'Poster' };
  list.innerHTML = subs.map(s => {
    const date = s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
    return `<div class="js-submission-card">
      <div class="js-sub-head">
        <div>
          <div class="js-sub-title">${escapeHtml(s.titre) || '(Sans titre)'}</div>
          <div class="js-sub-meta">${escapeHtml(`${s.prenom || ''} ${s.nom || ''}`)} · ${escapeHtml(ateliers[s.atelier] || 'Atelier ' + s.atelier)} · ${escapeHtml(formats[s.format] || s.format)}</div>
        </div>
        <span class="js-dash-status pending">En attente</span>
      </div>
      <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center;">
        <span style="font-family:var(--fm);font-size:12px;color:var(--text-3);">${escapeHtml(s.ref || '')}</span>
        <span style="font-size:12px;color:var(--text-3);">Soumis le ${date}</span>
      </div>
    </div>`;
  }).join('');
}

function restoreDraft() {
  try {
    const draft = sessionStorage.getItem('jssed_draft');
    if (!draft) return;
    const data = JSON.parse(draft);
    if (!data || typeof data !== 'object') return;
    jsform.data = data;
    Object.entries(data).forEach(([k, v]) => {
      const el = document.querySelector(`[name="${k}"]`);
      if (!el) return;
      if (el.type === 'radio') { const t = document.querySelector(`[name="${k}"][value="${v}"]`); if (t) t.checked = true; }
      else if (el.type === 'checkbox') { el.checked = Boolean(v); }
      else { el.value = v; }
    });
    const r = $('#resume'); if (r) jsform.countWords(r);
  } catch {}
}

/* =========================================================
   BANDEAU COOKIES
   ========================================================= */
const jsCookie = {
  KEY: 'jssed_cookie_ack',
  init() {
    const bar = $('#js-cookie'); if (!bar) return;
    let ack = false; try { ack = localStorage.getItem(this.KEY) === '1'; } catch {}
    if (!ack) setTimeout(() => bar.classList.add('show'), 900);
  },
  accept() { try { localStorage.setItem(this.KEY, '1'); } catch {} $('#js-cookie')?.classList.remove('show'); }
};

const jsReg = {
  init() {
    const f = $('#js-reg'); if (!f) return;
    if (!JSSED_CONFIG.registrationOpen) {
      f.style.display = 'none';
      const w = $('#inscription-form');
      if (w) w.insertAdjacentHTML('afterbegin', '<div class="js-reg-closed" style="max-width:760px;margin:0 auto 12px;">Les inscriptions ne sont pas encore ouvertes. Revenez bientôt.</div>');
      return;
    }
    f.addEventListener('submit', (e) => { e.preventDefault(); this.submit(); });
  },
  showErr(name, msg) {
    const b = document.querySelector(`#js-reg .js-field-error[data-for="${name}"]`);
    if (b) { if (msg) b.textContent = msg; b.classList.add('show'); }
    const el = document.querySelector(`#js-reg [name="${name}"]`); if (el && el.classList) el.classList.add('is-invalid');
  },
  alert(msg) { const a = $('#js-reg-alert'); if (a) { a.textContent = msg; a.classList.add('show'); } },
  clear() {
    $$('#js-reg .js-field-error').forEach(b => b.classList.remove('show'));
    $$('#js-reg .is-invalid').forEach(e => e.classList.remove('is-invalid'));
    const a = $('#js-reg-alert'); if (a) a.classList.remove('show');
  },
  genRef() { return `INS2026-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,4).toUpperCase()}`; },
  resetBtn(b) { if (b) { b.disabled = false; b.textContent = 'Valider mon inscription'; } },
  async submit() {
    const f = $('#js-reg'); if (!f) return;
    this.clear();
    const hp = $('#js-reg-hp'); if (hp && hp.value) { this.success(this.genRef()); return; }
    const data = {};
    f.querySelectorAll('input, select').forEach(el => {
      if (!el.name || el.name === 'website') return;
      data[el.name] = el.type === 'checkbox' ? el.checked : el.value.trim();
    });
    let ok = true, first = null;
    ['type','prenom','nom','email','pays'].forEach(n => { if (!data[n]) { ok = false; this.showErr(n); if (!first) first = n; } });
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) { ok = false; this.showErr('email','Email invalide.'); if (!first) first = 'email'; }
    if (!data.consent) { ok = false; this.alert('Veuillez accepter la politique de confidentialité.'); }
    if (!ok) { if (first) { const el = document.querySelector(`#js-reg [name="${first}"]`); if (el && el.focus) el.focus(); } else this.alert('Veuillez corriger les champs indiqués.'); return; }
    const btn = $('#js-reg-submit'); if (btn) { btn.disabled = true; btn.textContent = 'Envoi en cours…'; }
    let ref = null, sent = false;
    if (JSSED_CONFIG.apiBase) {
      try {
        const res = await fetch(`${JSSED_CONFIG.apiBase}/register.php`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) });
        const out = await res.json().catch(() => ({}));
        if (res.ok && out.ok) { ref = out.ref; sent = true; }
        else if (res.status === 422 && out.fields) { Object.entries(out.fields).forEach(([k,m]) => this.showErr(k,m)); this.alert('Veuillez corriger les champs signalés.'); this.resetBtn(btn); return; }
        else if (res.status === 429) { this.alert('Trop de tentatives. Réessayez dans quelques minutes.'); this.resetBtn(btn); return; }
      } catch (e) { /* repli hors-ligne */ }
    }
    if (!sent) { ref = this.genRef(); this.mailto(data, ref); }
    this.success(ref);
  },
  mailto(d, ref) {
    const subject = encodeURIComponent(`JSSED 2026 – Inscription – ${d.nom || ''}`);
    const body = encodeURIComponent(`Réf : ${ref}\nCatégorie : ${d.type}\nNom : ${d.prenom || ''} ${d.nom || ''}\nEmail : ${d.email || ''}\nTéléphone : ${d.tel || ''}\nInstitution : ${d.institution || ''}\nPays : ${d.pays || ''}`);
    window.location.href = `mailto:${JSSED_CONFIG.email}?subject=${subject}&body=${body}`;
  },
  success(ref) {
    const f = $('#js-reg'); if (f) f.style.display = 'none';
    const s = $('#js-reg-success'); if (s) { s.style.display = ''; const r = $('#js-reg-ref'); if (r) r.textContent = ref; s.scrollIntoView({ behavior:'smooth', block:'center' }); }
  }
};

/* =========================================================
   ARCHIVE 2025 — déverrouillage au clic
   ========================================================= */
const jssedArchive = {
  init() {
    const body = $('#js-archive-body');
    const btn = $('#js-archive-reveal');
    if (!body || !btn) return;
    btn.addEventListener('click', () => {
      body.hidden = false;
      btn.style.display = 'none';
      body.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
};

/* =========================================================
   ÉTAT DES INSCRIPTIONS (ouvertes / fermées)
   ========================================================= */
function applyRegistrationState() {
  if (JSSED_CONFIG.registrationOpen) return;
  // Fermé : on désactive la soumission et on informe
  const form = $('#js-form');
  const closed = $('#js-reg-closed');
  if (closed) closed.style.display = '';
  if (form) form.style.display = 'none';
  $$('.js-steps-header').forEach(el => el.style.display = 'none');
}

/* =========================================================
   INITIALISATION
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  jssedArchive.init();
  applyRegistrationState();
  jsTheme.init();
  renderDocs();
  renderSpeakers();
  renderProgram();
  renderPartners();
  jsReg.init();
  renderGallery();
  renderTimeline();
  renderFaq();
  initBurger();
  initTopbarScroll();
  jsCountdown.init();
  initFormSubmit();
  restoreDraft();
  renderDashboard();
  jsCookie.init();
  initReveal();
  const y = $('#js-year'); if (y) y.textContent = new Date().getFullYear();
});
