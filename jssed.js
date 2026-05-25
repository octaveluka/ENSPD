/* =========================================================
   JSSED 2026 — Event Platform JavaScript
   Countdown · Multi-step form · Dashboard · FAQ · Reveal
   ========================================================= */

'use strict';

/* ---- Countdown ---- */
(function initCountdown() {
  const TARGET = new Date('2026-09-01T08:00:00');
  const elJ = document.getElementById('cd-j');
  const elH = document.getElementById('cd-h');
  const elM = document.getElementById('cd-m');
  const elS = document.getElementById('cd-s');
  if (!elJ) return;

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const diff = TARGET - Date.now();
    if (diff <= 0) {
      elJ.textContent = '000';
      elH.textContent = '00';
      elM.textContent = '00';
      elS.textContent = '00';
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    elJ.textContent = String(d).padStart(3, '0');
    elH.textContent = pad(h);
    elM.textContent = pad(m);
    elS.textContent = pad(s);
  }

  tick();
  setInterval(tick, 1000);
})();

/* ---- Burger Menu ---- */
(function initBurger() {
  const btn = document.getElementById('js-burger');
  const nav = document.getElementById('js-mobile-nav');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });

  nav.querySelectorAll('.js-mobile-link').forEach(a => {
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
})();

/* ---- Scroll Reveal ---- */
(function initReveal() {
  const els = document.querySelectorAll('.js-reveal');
  if (!els.length) return;
  if (!window.IntersectionObserver) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => obs.observe(el));
})();

/* ---- Topbar Scroll Effect ---- */
(function initTopbarScroll() {
  const bar = document.getElementById('js-topbar');
  if (!bar) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        if (window.scrollY > 60) {
          bar.style.background = 'rgba(4,5,15,.96)';
        } else {
          bar.style.background = 'rgba(4,5,15,.82)';
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();

/* ---- FAQ Accordion ---- */
const jsfaq = {
  toggle(btn) {
    const item = btn.closest('.js-faq-item');
    const isOpen = item.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
  }
};

/* ---- LocalStorage Helpers ---- */
const store = {
  KEY: 'jssed2026_submissions',
  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || '[]'); }
    catch { return []; }
  },
  set(data) {
    try { localStorage.setItem(this.KEY, JSON.stringify(data)); }
    catch { /* storage full */ }
  },
  add(submission) {
    const list = this.get();
    list.unshift(submission);
    this.set(list);
    return submission;
  }
};

/* ---- Multi-step Form ---- */
const jsform = {
  current: 1,
  total: 5,
  data: {},

  next(fromStep) {
    if (!this.validate(fromStep)) return;
    this.collectStep(fromStep);
    this.saveProgress();
    if (fromStep === 4) this.renderSummary();
    this.goTo(fromStep + 1);
  },

  prev(fromStep) {
    this.collectStep(fromStep);
    this.saveProgress();
    this.goTo(fromStep - 1);
  },

  goTo(step) {
    if (step < 1 || step > this.total) return;
    document.querySelectorAll('.js-form-step').forEach(el => el.classList.remove('active'));
    const target = document.getElementById('step-' + step);
    if (target) target.classList.add('active');

    document.querySelectorAll('.js-step-dot').forEach((dot, i) => {
      dot.classList.remove('active', 'done');
      dot.setAttribute('aria-selected', 'false');
      if (i + 1 < step) dot.classList.add('done');
      if (i + 1 === step) { dot.classList.add('active'); dot.setAttribute('aria-selected', 'true'); }
    });

    this.current = step;
    target && target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  validate(step) {
    const step_el = document.getElementById('step-' + step);
    if (!step_el) return true;
    const required = step_el.querySelectorAll('[required]');
    let valid = true;
    required.forEach(field => {
      field.style.borderColor = '';
      if (field.type === 'radio') {
        const group = step_el.querySelectorAll(`[name="${field.name}"]`);
        const checked = Array.from(group).some(r => r.checked);
        if (!checked) {
          valid = false;
          group.forEach(r => { if (r.nextElementSibling) r.nextElementSibling.style.borderColor = '#F43F5E'; });
        }
      } else if (!field.value.trim()) {
        valid = false;
        field.style.borderColor = '#F43F5E';
      } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
        valid = false;
        field.style.borderColor = '#F43F5E';
      }
    });
    if (!valid) {
      const firstInvalid = step_el.querySelector('[required][style*="#F43F5E"]');
      if (firstInvalid) firstInvalid.focus();
    }
    return valid;
  },

  collectStep(step) {
    const step_el = document.getElementById('step-' + step);
    if (!step_el) return;
    step_el.querySelectorAll('input, select, textarea').forEach(field => {
      if (!field.name) return;
      if (field.type === 'radio') {
        if (field.checked) this.data[field.name] = field.value;
      } else if (field.type === 'checkbox') {
        this.data[field.name] = field.checked;
      } else {
        this.data[field.name] = field.value;
      }
    });
    if (step === 3) this.data.coauthors = this.collectCoauthors();
  },

  collectCoauthors() {
    const items = document.querySelectorAll('.js-coauth-item');
    return Array.from(items).map(item => ({
      prenom:      item.querySelector('[data-field="coauth-prenom"]')?.value || '',
      nom:         item.querySelector('[data-field="coauth-nom"]')?.value || '',
      institution: item.querySelector('[data-field="coauth-inst"]')?.value || ''
    })).filter(c => c.prenom || c.nom);
  },

  addCoauth() {
    const list = document.getElementById('js-coauth-list');
    if (!list) return;
    const idx = list.children.length;
    const item = document.createElement('div');
    item.className = 'js-coauth-item';
    item.innerHTML = `
      <div class="js-field-group" style="grid-column:1/-1;margin-bottom:0;">
        <label class="js-label" style="margin-bottom:6px;">Co-auteur ${idx + 1}</label>
      </div>
      <input class="js-input" type="text" placeholder="Prénom" data-field="coauth-prenom">
      <input class="js-input" type="text" placeholder="Nom" data-field="coauth-nom">
      <input class="js-input" type="text" placeholder="Institution" data-field="coauth-inst">
      <button type="button" class="js-coauth-remove" onclick="jsform.removeCoauth(this)" aria-label="Supprimer">✕</button>
    `;
    list.appendChild(item);
  },

  removeCoauth(btn) {
    btn.closest('.js-coauth-item').remove();
  },

  countWords(el) {
    const words = el.value.trim() ? el.value.trim().split(/\s+/).length : 0;
    const counter = document.getElementById('resume-counter');
    if (!counter) return;
    counter.textContent = `${words} / 300 mots`;
    counter.className = 'js-char-counter';
    if (words > 300) counter.classList.add('over');
    else if (words > 270) counter.classList.add('warn');
  },

  saveProgress() {
    try {
      sessionStorage.setItem('jssed_draft', JSON.stringify(this.data));
    } catch { /* ignore */ }
  },

  renderSummary() {
    const card = document.getElementById('js-summary-card');
    if (!card) return;
    const atelierNames = { '1': 'Statistique & Informatique décisionnelle', '2': 'Évaluation, Suivi-évaluation & IA', '3': 'Démographie & Intelligence Artificielle' };
    const formatNames  = { oral: 'Communication orale', poster: 'Poster scientifique' };
    const d = this.data;
    card.innerHTML = `
      <h3 class="js-form-section-title" style="margin-bottom:20px;">Récapitulatif de votre soumission</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;">
        <div><div class="js-label" style="margin-bottom:2px;">Format</div><div style="font-size:14px;color:var(--js-txt);">${formatNames[d.format] || d.format || '—'}</div></div>
        <div><div class="js-label" style="margin-bottom:2px;">Atelier</div><div style="font-size:14px;color:var(--js-txt);">Atelier ${d.atelier} — ${atelierNames[d.atelier] || '—'}</div></div>
        <div><div class="js-label" style="margin-bottom:2px;">Auteur principal</div><div style="font-size:14px;color:var(--js-txt);">${d.prenom || ''} ${d.nom || ''}</div></div>
        <div><div class="js-label" style="margin-bottom:2px;">Institution</div><div style="font-size:14px;color:var(--js-txt);">${d.institution || '—'}</div></div>
        <div><div class="js-label" style="margin-bottom:2px;">Email</div><div style="font-size:14px;color:var(--js-txt);">${d.email || '—'}</div></div>
        <div><div class="js-label" style="margin-bottom:2px;">Statut</div><div style="font-size:14px;color:var(--js-txt);">${d.statut || '—'}</div></div>
      </div>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--js-brd);">
        <div class="js-label" style="margin-bottom:6px;">Titre</div>
        <div style="font-size:15px;font-weight:700;color:var(--js-txt);line-height:1.4;">${d.titre || '—'}</div>
      </div>
      <div style="margin-top:12px;">
        <div class="js-label" style="margin-bottom:6px;">Mots-clés</div>
        <div style="font-size:13px;color:var(--js-txt2);">${d.keywords || '—'}</div>
      </div>
      ${(d.coauthors && d.coauthors.length) ? `
      <div style="margin-top:12px;">
        <div class="js-label" style="margin-bottom:6px;">Co-auteurs</div>
        <div style="font-size:13px;color:var(--js-txt2);">${d.coauthors.map(c => `${c.prenom} ${c.nom}${c.institution ? ' ('+c.institution+')' : ''}`).join(', ')}</div>
      </div>` : ''}
    `;
  },

  generateRef() {
    const ts = Date.now().toString(36).toUpperCase();
    const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
    return `JSSED2026-${ts}-${rnd}`;
  },

  goToDashboard() {
    document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
    renderDashboard();
  },

  reset() {
    this.data = {};
    this.current = 1;
    document.getElementById('js-form')?.reset();
    document.getElementById('js-coauth-list').innerHTML = '';
    document.getElementById('js-success').style.display = 'none';
    document.getElementById('js-form').style.display = '';
    this.goTo(1);
  }
};

/* ---- Form Submit ---- */
(function initFormSubmit() {
  const form = document.getElementById('js-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const cgu = document.getElementById('cgu');
    if (!cgu || !cgu.checked) {
      cgu.style.outline = '2px solid #F43F5E';
      cgu.focus();
      return;
    }

    jsform.collectStep(5);
    const ref = jsform.generateRef();
    jsform.data.ref = ref;
    jsform.data.submittedAt = new Date().toISOString();

    store.add({ ...jsform.data });

    const subject = encodeURIComponent(`JSSED2026 – ${jsform.data.format === 'poster' ? 'Poster' : 'Communication orale'} – Atelier N°${jsform.data.atelier} – ${jsform.data.nom || ''}`);
    const body = encodeURIComponent(
      `Réf: ${ref}\n\nAuteur: ${jsform.data.prenom || ''} ${jsform.data.nom || ''}\nEmail: ${jsform.data.email || ''}\nInstitution: ${jsform.data.institution || ''}\nStatut: ${jsform.data.statut || ''}\n\nAtelier: ${jsform.data.atelier}\nFormat: ${jsform.data.format}\nTitre: ${jsform.data.titre || ''}\n\nMots-clés: ${jsform.data.keywords || ''}\n\nRésumé:\n${jsform.data.resume || ''}`
    );

    window.location.href = `mailto:jssed.enspd.up.2025@gmail.com?subject=${subject}&body=${body}`;

    form.style.display = 'none';
    const success = document.getElementById('js-success');
    if (success) {
      success.style.display = '';
      document.getElementById('js-ref-code').textContent = ref;
      success.scrollIntoView({ behavior: 'smooth' });
    }

    sessionStorage.removeItem('jssed_draft');
    renderDashboard();
  });
})();

/* ---- Dashboard Render ---- */
function renderDashboard() {
  const list = document.getElementById('js-submissions-list');
  const empty = document.getElementById('js-dash-empty');
  if (!list || !empty) return;

  const submissions = store.get();

  if (!submissions.length) {
    empty.style.display = '';
    list.innerHTML = '';
    return;
  }

  empty.style.display = 'none';
  const atelierNames = { '1': 'Atelier 1 — Statistique', '2': 'Atelier 2 — Évaluation', '3': 'Atelier 3 — Démographie' };
  const formatNames  = { oral: '🎤 Oral', poster: '🖼️ Poster' };

  list.innerHTML = submissions.map(sub => {
    const date = sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
    return `
      <div class="js-submission-card">
        <div class="js-sub-head">
          <div>
            <div class="js-sub-title">${sub.titre || '(Sans titre)'}</div>
            <div class="js-sub-meta">${sub.prenom || ''} ${sub.nom || ''} · ${atelierNames[sub.atelier] || 'Atelier ' + sub.atelier} · ${formatNames[sub.format] || sub.format}</div>
          </div>
          <span class="js-dash-status pending">⏳ En attente</span>
        </div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:center;">
          <span style="font-family:var(--fm);font-size:12px;color:var(--js-txt3);">${sub.ref || ''}</span>
          <span style="font-size:12px;color:var(--js-txt3);">Soumis le ${date}</span>
        </div>
      </div>
    `;
  }).join('');
}

/* ---- Restore Draft ---- */
(function restoreDraft() {
  try {
    const draft = sessionStorage.getItem('jssed_draft');
    if (!draft) return;
    const data = JSON.parse(draft);
    if (!data || typeof data !== 'object') return;
    jsform.data = data;
    Object.entries(data).forEach(([key, val]) => {
      const el = document.querySelector(`[name="${key}"]`);
      if (!el) return;
      if (el.type === 'radio') {
        const target = document.querySelector(`[name="${key}"][value="${val}"]`);
        if (target) target.checked = true;
      } else if (el.type === 'checkbox') {
        el.checked = Boolean(val);
      } else {
        el.value = val;
      }
    });
  } catch { /* ignore */ }
})();

/* ---- Init on DOM Ready ---- */
document.addEventListener('DOMContentLoaded', () => {
  renderDashboard();
  renderJssedComite();
  renderJssedPartners();
});

/* ---- JSSED Comité & Partenaires Data + Renders ---- */
const JSSED_DATA = {
  comite: [
    { nom: 'Prof. Épiphane SODJINOU', role: 'Président', affil: 'ENSPD — Univ. de Parakou', initiales: 'ES' },
    { nom: 'Dr. Honorat OROU BATA', role: 'Membre', affil: 'ENSPD — Univ. de Parakou', initiales: 'HOB' },
    { nom: 'Dr. Gildas KPADONOU', role: 'Membre', affil: 'ENSPD — Univ. de Parakou', initiales: 'GK' },
    { nom: 'Prof. Simplice DOSSOU-GBÉTÉ', role: 'Membre', affil: 'Université de Pau, France', initiales: 'SDG' },
    { nom: 'Dr. Alphonse GBAGUIDI', role: 'Membre', affil: 'INSAE — Bénin', initiales: 'AG' },
    { nom: 'Dr. Thierry DOSSOU', role: 'Secrétaire', affil: 'ENSPD — Univ. de Parakou', initiales: 'TD' },
  ],
  partners: [
    { nom: 'ENSPD', sub: 'École Nationale de Statistique', icon: '🏛️' },
    { nom: 'Univ. Parakou', sub: 'Université de Parakou', icon: '🎓' },
    { nom: 'INSAE', sub: 'Institut National de la Statistique', icon: '📊' },
    { nom: 'BUE-ENSPD', sub: 'Bureau d\'Union des Étudiants', icon: '🤝' },
    { nom: 'CRISTAL', sub: 'Collectif de Recherche ENSPD', icon: '🔬' },
    { nom: 'LaReSPD', sub: 'Laboratoire de Recherche', icon: '📚' },
  ],
};

function renderJssedComite() {
  const el = document.getElementById('js-sc-grid');
  if (!el) return;
  el.innerHTML = JSSED_DATA.comite.map(m => `
    <div class="js-sc-card js-reveal" role="listitem">
      <div class="js-sc-avatar">${m.initiales}</div>
      <div class="js-sc-body">
        <div class="js-sc-nom">${m.nom}</div>
        <div class="js-sc-role">${m.role}</div>
        <div class="js-sc-affil">${m.affil}</div>
      </div>
    </div>`).join('');
}

function renderJssedPartners() {
  const el = document.getElementById('js-partners-grid');
  if (!el) return;
  el.innerHTML = JSSED_DATA.partners.map(p => `
    <div class="js-partner-chip" role="listitem">
      <span class="js-pc-icon" aria-hidden="true">${p.icon}</span>
      <div>
        <div class="js-pc-nom">${p.nom}</div>
        <div class="js-pc-sub">${p.sub}</div>
      </div>
    </div>`).join('');
}

/* ---- Mini-countdown édition 2026 (carte navigateur) ---- */
(function initEditionCountdown() {
  var TARGET = new Date('2026-09-01T08:00:00');
  var elJ = document.getElementById('ecd-j');
  var elH = document.getElementById('ecd-h');
  var elM = document.getElementById('ecd-m');
  if (!elJ || !elH || !elM) return;

  function pad2(n) { return String(n).padStart(2, '0'); }

  function tickMini() {
    var diff = TARGET - Date.now();
    if (diff <= 0) {
      elJ.textContent = '0';
      elH.textContent = '00';
      elM.textContent = '00';
      return;
    }
    var d = Math.floor(diff / 86400000);
    var h = Math.floor((diff % 86400000) / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    elJ.textContent = d;
    elH.textContent = pad2(h);
    elM.textContent = pad2(m);
  }

  tickMini();
  setInterval(tickMini, 60000);
})();
