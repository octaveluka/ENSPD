'use strict';
/* ==========================================================================
   BUE-ENSPD — JavaScript v7 · DJOROD_CODING
   ─────────────────────────────────────────────────────────────────────────
   SÉCURITÉ  : PBKDF2-SHA256 (Web Crypto API), rate-limiting, session
               signée HMAC, CSRF token, sanitisation XSS, verrouillage
               compte, validation email/password robuste, expiration auto.
   COOKIES   : Consentement RGPD, préférences thème/langue, session.
   ADMIN BUE : Contrôle total — actualités, événements, galerie,
               ressources, utilisateurs, forum, photo président,
               bandeau annonce, paramètres, changement mdp admin.
   FORUM     : Lecture libre · Participation membres connectés uniquement.
   ÉVÉNEMENTS: Inscription membres · Création/suppression admins seulement.
   ========================================================================== */

/* ══════════════════════════════════════════════════════════════════════════
   0. CONSTANTES
   ══════════════════════════════════════════════════════════════════════════ */
  /* ── TRADUCTIONS BUE ── */
const BUE_LANG = {
  fr: {
    nav_home:'Accueil', nav_bureau:'Le Bureau', nav_cristal:'CRISTAL',
    nav_events:'Événements', nav_forum:'Forum', nav_res:'Ressources',
    nav_gallery:'Galerie', nav_contact:'Contact',
    hero_eyebrow:'Bureau d\'Union d\'Entité · 1er Bureau élu · ENSPD Parakou',
    hero_title:'Ensemble, bâtissons l\'ENSPD de demain',
    hero_desc:'"Le courage, la force, le respect, le travail de groupe et le leadership sont des principes qui vous permettront de réussir ici à l\'ENSPD."',
    hero_author:'— DJOSSOU Rodrigue, Président du BUE',
    btn_events:'Voir les événements', btn_forum:'Rejoindre le forum',
    btn_login:'Connexion', btn_register:'S\'inscrire',
    topbar:'🎓 BUE-ENSPD — Bureau d\'Union des Étudiants · Année académique 2025-2026',
  },
  en: {
    nav_home:'Home', nav_bureau:'Executive Board', nav_cristal:'CRISTAL',
    nav_events:'Events', nav_forum:'Forum', nav_res:'Resources',
    nav_gallery:'Gallery', nav_contact:'Contact',
    hero_eyebrow:'Student Union · 1st Elected Board · ENSPD Parakou',
    hero_title:'Together, let\'s build the ENSPD of tomorrow',
    hero_desc:'"Courage, strength, respect, teamwork and leadership are the principles that will allow you to succeed here at ENSPD."',
    hero_author:'— DJOSSOU Rodrigue, BUE President',
    btn_events:'View events', btn_forum:'Join the forum',
    btn_login:'Login', btn_register:'Sign up',
    topbar:'🎓 BUE-ENSPD — Student Union · Academic Year 2025-2026',
  }
};
let _bueLang = 'fr';

function setBueLang(l) {
  _bueLang = l;
  const t = BUE_LANG[l];
  /* Nav links */
  const ps = ['accueil','bureau','cristal','evenements','forum','ressources','galerie','contact'];
  const ks = ['nav_home','nav_bureau','nav_cristal','nav_events','nav_forum','nav_res','nav_gallery','nav_contact'];
  ps.forEach((p,i) => {
    const el = document.querySelector(`[data-p="${p}"]`);
    if (el) el.textContent = t[ks[i]];
  });
  /* Top bar */
  const tb = document.querySelector('.top-bar span');
  if (tb) tb.textContent = t.topbar;
  /* Hero */
  const ey = document.querySelector('.bue-eyebrow');
  if (ey) ey.textContent = t.hero_eyebrow;
  const ht = document.querySelector('.bue-hero-title');
  if (ht) ht.innerHTML = t.hero_title.replace("l'ENSPD", '<em class="bue-accent">l\'ENSPD</em>');
  const hd = document.querySelector('.bue-hero-desc');
  if (hd) hd.innerHTML = `${t.hero_desc}<span class="bue-hero-author">${t.hero_author}</span>`;
  /* Boutons */
  document.querySelector('.btn-login') && (document.querySelector('.btn-login').textContent = t.btn_login);
  document.querySelector('.btn-register') && (document.querySelector('.btn-register').textContent = t.btn_register);
  /* Langue selector */
  document.getElementById('bue-lang-fr')?.classList.toggle('on', l === 'fr');
  document.getElementById('bue-lang-en')?.classList.toggle('on', l === 'en');
  document.documentElement.lang = l;
  localStorage.setItem('enspd-lang', l);
  localStorage.setItem('bue-lang', l);
  Cookies.savePrefs && Cookies.savePrefs();
}

 const APP = {
  NAME          : 'BUE-ENSPD',
  VERSION       : '7.0.0',
  SALT_KEY      : 'bue_enspd_2026_salt_v7',
  SESSION_TTL   : 8 * 3600 * 1000,   // 8 heures
  MAX_ATTEMPTS  : 5,
  LOCK_DURATION : 15 * 60 * 1000,    // 15 minutes
  ADMIN_EMAIL   : 'buePres@enspd.bj',
  ADMIN_ENSPD   : 'admin@enspd.bj',
};

/* ══════════════════════════════════════════════════════════════════════════
   1. CRYPTO (Web Crypto API)
   ══════════════════════════════════════════════════════════════════════════ */
const Crypto = {
  async hash(password, salt = APP.SALT_KEY) {
    const enc  = new TextEncoder();
    const key  = await crypto.subtle.importKey(
      'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: 120000 },
      key, 256
    );
    return Array.from(new Uint8Array(bits))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async hmac(data) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(APP.SALT_KEY + navigator.userAgent.slice(0, 20)),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
    return Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  },

  csrfToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map(b => b.toString(16).padStart(2, '0')).join('');
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   2. SANITISATION (anti-XSS)
   ══════════════════════════════════════════════════════════════════════════ */
const S = {
  esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;').replace(/\//g, '&#x2F;');
  },
  clean(str) { return String(str || '').trim().slice(0, 500); },
  isEmail(e) { return /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,10}$/.test(e); },
  passStrength(p) {
    let s = 0;
    if (p.length >= 8)  s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return Math.min(s, 4);
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   3. COOKIES (RGPD)
   ══════════════════════════════════════════════════════════════════════════ */
const Cookies = {
  get(name) {
    const m = document.cookie.match(
      new RegExp('(?:^|; )' + name.replace(/[.+*?^${}()|[\]\\]/g, '\\$&') + '=([^;]*)')
    );
    return m ? decodeURIComponent(m[1]) : null;
  },
  set(name, value, opts = {}) {
    const days    = opts.days ?? 30;
    const expires = new Date(Date.now() + days * 86400 * 1000).toUTCString();
    const secure  = location.protocol === 'https:' ? ';Secure' : '';
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Strict${secure}`;
  },
  remove(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict`;
  },
  CONSENT_KEY : 'bue_cookie_consent',
  hasConsent()  { return this.get(this.CONSENT_KEY) === 'accepted'; },
  hasRefused()  { return this.get(this.CONSENT_KEY) === 'refused';  },
  acceptAll() {
    this.set(this.CONSENT_KEY, 'accepted', { days: 365 });
    this.savePrefs();
    hideCookieBanner();
    toast('Préférences enregistrées. Merci !', 'ok');
  },
  refuseAll() {
    this.set(this.CONSENT_KEY, 'refused', { days: 365 });
    hideCookieBanner();
    toast('Aucun cookie de suivi déposé.', 'inf');
  },
  resetConsent() { this.remove(this.CONSENT_KEY); showCookieBanner(); },
  savePrefs() {
    this.set('bue_theme', _dark ? 'dark' : 'light', { days: 365 });
    this.set('bue_lang',  _lang,                    { days: 365 });
  },
  loadPrefs() {
    return {
      theme : this.get('bue_theme') ?? 'dark',
      lang  : this.get('bue_lang')  ?? 'fr',
    };
  },
};

/* Bannière cookie — s'affiche immédiatement en bas (opacity, pas transform) */
function showCookieBanner() {
  const banner = document.getElementById('cookie-banner');
  if (banner) { banner.classList.add('show'); return; }
  /* Fallback si pas dans le HTML */
  const el = document.createElement('div');
  el.id = 'cookie-banner';
  el.style.cssText = `position:fixed;bottom:0;left:0;right:0;z-index:1000;
    background:var(--wh,#fff);border-top:2px solid #F0A500;
    box-shadow:0 -4px 24px rgba(0,0,0,.15);padding:14px 20px;
    display:flex;align-items:center;gap:16px;flex-wrap:wrap;
    opacity:0;transition:opacity .3s ease;pointer-events:none`;
  el.innerHTML = `
    <p style="font-size:13.5px;color:var(--txt2,#555);flex:1;margin:0;line-height:1.6">
      <strong style="color:var(--txt,#111)">🍪 Cookies essentiels</strong> —
      Nous utilisons des cookies fonctionnels (thème, langue, session). Aucun tracking.
      <a href="#" onclick="nav('legal');hideCookieBanner();return false"
         style="color:#F0A500;font-weight:600;text-decoration:underline">En savoir plus</a>
    </p>
    <div style="display:flex;gap:8px;flex-shrink:0">
      <button style="padding:7px 14px;border-radius:8px;border:1.5px solid var(--brd,#ddd);
              background:transparent;font-size:13px;font-weight:600;color:var(--txt2,#555);cursor:pointer"
              onclick="Cookies.refuseAll()">Refuser</button>
      <button style="padding:7px 14px;border-radius:8px;border:1.5px solid #3CB944;
              background:#3CB944;font-size:13px;font-weight:600;color:#fff;cursor:pointer"
              onclick="Cookies.acceptAll()">Accepter</button>
    </div>`;
  document.body.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.pointerEvents = 'all';
  }));
}
function hideCookieBanner() {
  const b = document.getElementById('cookie-banner');
  if (b) { b.style.opacity = '0'; b.style.pointerEvents = 'none'; }
}

/* ══════════════════════════════════════════════════════════════════════════
   4. RATE LIMITING
   ══════════════════════════════════════════════════════════════════════════ */
const RateLimit = {
  _key(email) { return `bue_rl_${email.replace(/[^a-z0-9]/gi,'_')}`; },
  check(email) {
    const raw = localStorage.getItem(this._key(email));
    if (!raw) return { ok: true };
    const d = JSON.parse(raw);
    if (d.locked && Date.now() < d.lockedUntil) {
      const mins = Math.ceil((d.lockedUntil - Date.now()) / 60000);
      return { ok: false, msg: `Compte verrouillé. Réessayez dans ${mins} min.` };
    }
    if (d.locked && Date.now() >= d.lockedUntil) {
      localStorage.removeItem(this._key(email)); return { ok: true };
    }
    return { ok: true };
  },
  record(email, success) {
    if (success) { localStorage.removeItem(this._key(email)); return; }
    const raw = localStorage.getItem(this._key(email));
    const d   = raw ? JSON.parse(raw) : { attempts: 0 };
    d.attempts++;
    d.lastAttempt = Date.now();
    if (d.attempts >= APP.MAX_ATTEMPTS) {
      d.locked = true;
      d.lockedUntil = Date.now() + APP.LOCK_DURATION;
      toast(`⛔ Compte verrouillé 15 min après ${APP.MAX_ATTEMPTS} tentatives.`, 'err');
    }
    localStorage.setItem(this._key(email), JSON.stringify(d));
  },
  remaining(email) {
    const raw = localStorage.getItem(this._key(email));
    if (!raw) return APP.MAX_ATTEMPTS;
    return Math.max(0, APP.MAX_ATTEMPTS - (JSON.parse(raw).attempts || 0));
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   5. SESSION SIGNÉE HMAC
   ══════════════════════════════════════════════════════════════════════════ */
const Session = {
  KEY: 'bue_session_v7',
  async save(user) {
    const payload = { user, iat: Date.now(), exp: Date.now() + APP.SESSION_TTL };
    const json    = JSON.stringify(payload);
    const sig     = await Crypto.hmac(json);
    localStorage.setItem(this.KEY, JSON.stringify({ data: json, sig }));
    Cookies.set('bue_sess', sig.slice(0, 16), { days: 1 });
  },
  async load() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw) return null;
    try {
      const { data, sig } = JSON.parse(raw);
      if (sig !== await Crypto.hmac(data)) { this.destroy(); return null; }
      const payload = JSON.parse(data);
      if (Date.now() > payload.exp) { this.destroy(); return null; }
      return payload.user;
    } catch { this.destroy(); return null; }
  },
  destroy() {
    localStorage.removeItem(this.KEY);
    Cookies.remove('bue_sess');
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   6. AUTH BUE
   ══════════════════════════════════════════════════════════════════════════ */
const BUE_AUTH = {
  _users()        { try { return JSON.parse(localStorage.getItem('enspd_users7') || '[]'); } catch { return []; } },
  _saveUsers(arr) { localStorage.setItem('enspd_users7', JSON.stringify(arr)); },

  /* Plus aucun mot de passe codé en dur : null tant que le déployeur
     n'a pas configuré le mot de passe admin au premier accès */
  _adminHash() { return localStorage.getItem('bue_admin_hash_v7'); },

  async login(emailRaw, pass) {
    const email = S.clean(emailRaw).toLowerCase();
    if (!email || !pass) return { err: 'Remplissez tous les champs.' };
    const rl = RateLimit.check(email);
    if (!rl.ok) return { err: rl.msg };

    /* Admin BUE */
    if (['buepres@enspd.bj', 'bueadmin', 'rodrigue', 'buepres'].includes(email)) {
      const stored = this._adminHash();
      if (!stored) return { setup: 'bue' };
      if (await Crypto.hash(pass) === stored) {
        RateLimit.record(email, true);
        return { ok: true, user: { nom: 'Rodrigue (BUE)', email: APP.ADMIN_EMAIL,
          role: 'bue_admin', init: 'R', isAdmin: true } };
      }
      RateLimit.record(email, false);
      return { err: `Mot de passe incorrect. ${RateLimit.remaining(email)} tentative(s) restante(s).` };
    }

    /* Admin ENSPD */
    if (['admin@enspd.bj', 'admin'].includes(email)) {
      const EKEY = 'enspd_admin_hash_v7';
      const estored = localStorage.getItem(EKEY);
      if (!estored) return { setup: 'enspd' };
      if (await Crypto.hash(pass) === estored) {
        RateLimit.record(email, true);
        return { ok: true, user: { nom: 'Admin ENSPD', email: APP.ADMIN_ENSPD,
          role: 'enspd_admin', init: 'A', isAdmin: true } };
      }
      RateLimit.record(email, false);
      return { err: 'Identifiants admin incorrects.' };
    }

    /* Étudiant / Visiteur */
    if (!S.isEmail(email)) return { err: 'Format email invalide.' };
    const users = this._users();
    const u     = users.find(x => x.email === email);
    if (!u) { RateLimit.record(email, false); return { err: 'Aucun compte avec cet email.' }; }
    if (await Crypto.hash(pass) !== u.hash) {
      RateLimit.record(email, false);
      return { err: `Mot de passe incorrect. ${RateLimit.remaining(email)} tentative(s) restante(s).` };
    }
    RateLimit.record(email, true);
    return { ok: true, user: {
      nom: u.nom, email: u.email, role: u.role,
      init: u.nom[0]?.toUpperCase() || 'U', filiere: u.filiere || '', isAdmin: false,
    }};
  },

  async register(data) {
    const nom    = S.clean(data.nom);
    const email  = S.clean(data.email).toLowerCase();
    const pass   = data.pass || '';
    const pass2  = data.pass2 || '';
    const role   = ['etudiant', 'visiteur'].includes(data.role) ? data.role : 'visiteur';
    const filiere= S.clean(data.filiere || '');

    if (!nom || nom.length < 2)   return { err: 'Nom trop court (min 2 caractères).' };
    if (!S.isEmail(email))         return { err: 'Adresse email invalide.' };
    if (pass.length < 8)           return { err: 'Mot de passe trop court (min 8 caractères).' };
    if (S.passStrength(pass) < 2)  return { err: 'Mot de passe faible. Ajoutez chiffres + majuscules.' };
    if (pass !== pass2)            return { err: 'Les mots de passe ne correspondent pas.' };

    const users = this._users();
    if (users.some(u => u.email === email)) return { err: 'Cet email est déjà utilisé.' };

    users.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      nom, email, hash: await Crypto.hash(pass), role, filiere,
      createdAt: new Date().toISOString(),
    });
    this._saveUsers(users);
    return { ok: true, user: { nom, email, role, init: nom[0]?.toUpperCase() || 'U', isAdmin: false } };
  },

  logout() {
    Session.destroy();
    _currentUser = null;
    updateBueNavAuth();
    renderBueAdminBar();
    toast('Déconnecté.', 'inf');
  },

  isAdmin()    { return _currentUser?.isAdmin === true || ['bue_admin','enspd_admin'].includes(_currentUser?.role); },
  isLoggedIn() { return !!_currentUser; },
};

/* ══════════════════════════════════════════════════════════════════════════
   7. ÉTAT GLOBAL
   ══════════════════════════════════════════════════════════════════════════ */
let _currentUser = null;
let _dark        = false;
let _lang        = 'fr';
let _csrfToken   = Crypto.csrfToken();

/* ══════════════════════════════════════════════════════════════════════════
   8. THÈME
   ══════════════════════════════════════════════════════════════════════════ */
function toggleDark() {
  _dark = !_dark;
  document.documentElement.dataset.theme = _dark ? 'dark' : '';
  const btn = document.getElementById('dark-btn');
  if (btn) btn.textContent = _dark ? '☀️' : '🌙';
  localStorage.setItem('bue-theme', _dark ? 'dark' : '');
  Cookies.savePrefs();
}
function initTheme() {
  const prefs = Cookies.loadPrefs();
  const saved = localStorage.getItem('bue-theme') ?? prefs.theme;
  _dark = (saved === 'dark');
  document.documentElement.dataset.theme = _dark ? 'dark' : '';
  const btn = document.getElementById('dark-btn');
  if (btn) btn.textContent = _dark ? '☀️' : '🌙';
}

/* ══════════════════════════════════════════════════════════════════════════
   9. ROUTEUR SPA
   ══════════════════════════════════════════════════════════════════════════ */
function nav(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('act'));
  document.querySelectorAll('[data-p]').forEach(a => a.classList.toggle('act', a.dataset.p === page));
  const el = document.getElementById('p-' + page);
  if (el) el.classList.add('act');
  document.getElementById('nav-links')?.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(initAnim, 100);
  if (page === 'galerie')    renderBueGaleriePage();
  if (page === 'forum')      updateForumBanner();
  if (page === 'bue-admin')  renderBueAdminPage();
}

/* ══════════════════════════════════════════════════════════════════════════
   10. TOAST
   ══════════════════════════════════════════════════════════════════════════ */
function toast(msg, type = 'ok') {
  const c = document.getElementById('toasts');
  if (!c) return;
  const el = document.createElement('div');
  el.className = `toast t-${type}`;
  const ico = { ok: '✓', err: '✕', warn: '⚠', inf: 'ℹ' }[type] || 'ℹ';
  el.innerHTML = `<span style="font-size:16px;flex-shrink:0">${ico}</span><span>${S.esc(msg)}</span>`;
  c.appendChild(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
  setTimeout(() => { el.classList.remove('on'); setTimeout(() => el.remove(), 380); }, 4000);
}

/* ══════════════════════════════════════════════════════════════════════════
   11. MODAL
   ══════════════════════════════════════════════════════════════════════════ */
function openModal(titre, html, xl = false) {
  const mb = document.getElementById('modal-box');
  if (mb) { mb.style.maxWidth = xl ? '820px' : '580px'; }
  document.getElementById('m-titre').textContent = titre;
  document.getElementById('m-body').innerHTML    = html;
  document.getElementById('modal').classList.add('on');
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  document.getElementById('modal')?.classList.remove('on');
  document.body.style.overflow = '';
}

/* ══════════════════════════════════════════════════════════════════════════
   12. HELPERS UI (toggle password + barre de force)
   ══════════════════════════════════════════════════════════════════════════ */
function togglePassVis(inputId, eyeId) {
  const inp = document.getElementById(inputId);
  const eye = document.getElementById(eyeId);
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
  if (eye)  eye.textContent = inp.type === 'password' ? '👁️' : '🙈';
}

function showPassStrength(inputId, barId, lblId) {
  const p      = document.getElementById(inputId)?.value || '';
  const str    = S.passStrength(p);
  const colors = ['', '#DC3545', '#E8960A', '#2EAA38', '#186020'];
  const labels = ['', 'Très faible', 'Faible', 'Bon', 'Fort'];
  const bar    = document.getElementById(barId);
  const lbl    = document.getElementById(lblId);
  if (bar) { bar.style.width = (str * 25) + '%'; bar.style.background = colors[str] || ''; }
  if (lbl) { lbl.textContent = p ? `— ${labels[str] || ''}` : ''; lbl.style.color = colors[str] || ''; }
}

/* ══════════════════════════════════════════════════════════════════════════
   13. AUTH MODAL — connexion / inscription
   ══════════════════════════════════════════════════════════════════════════ */
function openBueAuthModal(tab = 'login') {
  _csrfToken = Crypto.csrfToken();
  openModal(tab === 'login' ? 'Connexion BUE' : 'Créer un compte', `
    <input type="hidden" id="csrf-tok" value="${_csrfToken}">
    <div class="auth-tabs">
      <button class="auth-tab ${tab==='login'?'on':''}" onclick="bueSwTab('login')">Connexion</button>
      <button class="auth-tab ${tab==='register'?'on':''}" onclick="bueSwTab('register')">Inscription</button>
    </div>

    <!-- LOGIN -->
    <div class="auth-panel ${tab==='login'?'on':''}" id="bpanel-login">
      <div class="alert a-mn mb16" style="font-size:12.5px">
        <span>💡</span>
        <div>Un compte ENSPD ? Mêmes identifiants ici.</div>
      </div>
      <div class="fg">
        <label>Email ou identifiant</label>
        <input id="bl-email" type="email" class="fi" placeholder="votre@email.com" autocomplete="email">
      </div>
      <div class="fg">
        <label>Mot de passe</label>
        <div style="position:relative">
          <input id="bl-pass" type="password" class="fi" placeholder="••••••••"
                 autocomplete="current-password" style="padding-right:44px">
          <button type="button" onclick="togglePassVis('bl-pass','bl-eye')"
                  style="position:absolute;right:12px;top:50%;transform:translateY(-50%);
                         background:none;border:none;cursor:pointer;font-size:18px;color:var(--txt3)">
            <span id="bl-eye">👁️</span>
          </button>
        </div>
      </div>
      <div id="bl-err" style="display:none;background:var(--er-l,#FFEBEE);color:var(--er,#E53935);
           border-radius:8px;padding:10px 14px;font-size:13px;border-left:4px solid var(--er,#E53935);
           margin-bottom:12px"></div>
      <button class="btn b-vt b-full" style="padding:12px" onclick="doBueLogin()">Se connecter</button>
      <p style="text-align:center;font-size:13px;color:var(--txt3);margin-top:14px">
        Pas de compte ?
        <a onclick="bueSwTab('register')" style="color:var(--mn);font-weight:600;cursor:pointer">S'inscrire</a>
      </p>
    </div>

    <!-- INSCRIPTION -->
    <div class="auth-panel ${tab==='register'?'on':''}" id="bpanel-register">
      <div class="auth-role-grid">
        <div class="role-card on" data-role="etudiant" onclick="bueSelRole(this)">
          <div class="role-ico">🎓</div><div class="role-lbl">Étudiant(e)</div>
        </div>
        <div class="role-card" data-role="visiteur" onclick="bueSelRole(this)">
          <div class="role-ico">👀</div><div class="role-lbl">Visiteur</div>
        </div>
      </div>
      <div class="fg"><label>Nom complet *</label>
        <input id="br-nom" type="text" class="fi" placeholder="Prénom NOM"></div>
      <div class="fg"><label>Email *</label>
        <input id="br-email" type="email" class="fi" placeholder="votre@email.com"></div>
      <div class="fg" id="br-fil-wrap"><label>Filière</label>
        <select id="br-filiere" class="fs">
          <option value="">— Sélectionner —</option>
          <option>Licence SA</option><option>Licence PSE</option>
          <option>Master SSD</option><option>Master SAAV</option>
          <option>Master SESA</option><option>Master SE-MP</option><option>Master SILPD</option>
        </select></div>
      <div class="fg">
        <label>Mot de passe *
          <span id="bstr-lbl" style="font-size:11px;font-weight:400;margin-left:6px"></span>
        </label>
        <div style="position:relative">
          <input id="br-pass" type="password" class="fi" placeholder="Min. 8 car. + majuscule + chiffre"
                 style="padding-right:44px"
                 oninput="showPassStrength('br-pass','bstr-bar','bstr-lbl')">
          <button type="button" onclick="togglePassVis('br-pass','br-eye1')"
                  style="position:absolute;right:12px;top:50%;transform:translateY(-50%);
                         background:none;border:none;cursor:pointer;font-size:18px;color:var(--txt3)">
            <span id="br-eye1">👁️</span>
          </button>
        </div>
        <div style="height:4px;border-radius:2px;background:var(--bg3,#e9e9e9);margin-top:5px;overflow:hidden">
          <div id="bstr-bar" style="height:100%;border-radius:2px;width:0;transition:width .3s,background .3s"></div>
        </div>
      </div>
      <div class="fg">
        <label>Confirmer *</label>
        <div style="position:relative">
          <input id="br-pass2" type="password" class="fi" placeholder="Répétez le mot de passe"
                 style="padding-right:44px">
          <button type="button" onclick="togglePassVis('br-pass2','br-eye2')"
                  style="position:absolute;right:12px;top:50%;transform:translateY(-50%);
                         background:none;border:none;cursor:pointer;font-size:18px;color:var(--txt3)">
            <span id="br-eye2">👁️</span>
          </button>
        </div>
      </div>
      <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:14px">
        <input type="checkbox" id="br-cgu" style="cursor:pointer;margin-top:2px;width:16px;height:16px">
        <label for="br-cgu" style="font-size:13px;color:var(--txt2);cursor:pointer;line-height:1.5">
          J'accepte les <a href="#" onclick="nav('legal');closeModal();return false"
          style="color:var(--mn,#1B1E6E);font-weight:600">conditions d'utilisation</a>
        </label>
      </div>
      <div id="br-err" style="display:none;background:var(--er-l,#FFEBEE);color:var(--er,#E53935);
           border-radius:8px;padding:10px 14px;font-size:13px;border-left:4px solid var(--er,#E53935);
           margin-bottom:12px"></div>
      <button class="btn b-vt b-full" style="padding:12px" onclick="doBueRegister()">Créer mon compte</button>
    </div>`);
}

function bueSwTab(t) {
  document.querySelectorAll('.auth-tab').forEach((b,i) => b.classList.toggle('on', i === (t==='login'?0:1)));
  ['login','register'].forEach(x => document.getElementById('bpanel-'+x)?.classList.toggle('on', x===t));
  const h2 = document.querySelector('#modal-box .modal-head h2, #modal .modal-head h2');
  if (h2) h2.textContent = t === 'login' ? 'Connexion BUE' : 'Créer un compte';
}

function bueSelRole(el) {
  document.querySelectorAll('.role-card').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  const fw = document.getElementById('br-fil-wrap');
  if (fw) fw.style.display = el.dataset.role === 'etudiant' ? 'flex' : 'none';
}

async function doBueLogin() {
  const email = document.getElementById('bl-email')?.value || '';
  const pass  = document.getElementById('bl-pass')?.value  || '';
  const csrf  = document.getElementById('csrf-tok')?.value;
  const errEl = document.getElementById('bl-err');
  const showE = m => { errEl.textContent = m; errEl.style.display = 'block'; };

  if (csrf !== _csrfToken) { showE('Erreur de session. Rafraîchissez la page.'); return; }
  if (!email || !pass)     { showE('Remplissez tous les champs.'); return; }

  const btn = document.querySelector('#bpanel-login .btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Connexion…'; }

  const res = await BUE_AUTH.login(email, pass);
  if (btn) { btn.disabled = false; btn.textContent = 'Se connecter'; }

  if (res.setup) { bueOpenAdminSetup(res.setup); return; }
  if (res.err) { showE(res.err); return; }

  _currentUser = res.user;
  await Session.save(_currentUser);
  closeModal();
  updateBueNavAuth();
  renderBueAdminBar();
  updateForumBanner();
  toast(`Bienvenue, ${_currentUser.nom.split(' ')[0]} !`, 'ok');
  _applyAdminButtons();
}

async function doBueRegister() {
  const nom    = document.getElementById('br-nom')?.value    || '';
  const email  = document.getElementById('br-email')?.value  || '';
  const pass   = document.getElementById('br-pass')?.value   || '';
  const pass2  = document.getElementById('br-pass2')?.value  || '';
  const role   = document.querySelector('.role-card.on')?.dataset.role || 'visiteur';
  const filiere= document.getElementById('br-filiere')?.value || '';
  const cgu    = document.getElementById('br-cgu')?.checked;
  const csrf   = document.getElementById('csrf-tok')?.value;
  const errEl  = document.getElementById('br-err');
  const showE  = m => { errEl.textContent = m; errEl.style.display = 'block'; };

  if (csrf !== _csrfToken) { showE('Erreur de session.'); return; }
  if (!cgu) { showE("Acceptez les conditions d'utilisation."); return; }

  const res = await BUE_AUTH.register({ nom, email, pass, pass2, role, filiere });
  if (res.err) { showE(res.err); return; }

  _currentUser = res.user;
  await Session.save(_currentUser);
  closeModal();
  updateBueNavAuth();
  updateForumBanner();
  toast(`Compte créé ! Bienvenue, ${_currentUser.nom.split(' ')[0]} 🎉`, 'ok');
}

/* ══════════════════════════════════════════════════════════════════════════
   14. NAV AUTH + BARRE ADMIN
   ══════════════════════════════════════════════════════════════════════════ */
function updateBueNavAuth() {
  const el = document.getElementById('bue-nav-auth');
  if (!el) return;
  const u = _currentUser;
  if (u) {
    const labels  = { bue_admin:'Admin BUE', enspd_admin:'Admin ENSPD', etudiant:'Étudiant(e)', visiteur:'Visiteur' };
    const classes = { bue_admin:'role-admin', enspd_admin:'role-admin', etudiant:'role-etudiant', visiteur:'role-visiteur' };
    el.innerHTML = `
      <div class="nav-user" id="bue-nuser" onclick="this.classList.toggle('open')">
        <div class="nav-avatar">${u.init}</div>
        <span>${u.nom.split(' ')[0]}</span>
        <span class="role-badge ${classes[u.role]||'role-visiteur'}">${labels[u.role]||''}</span>
        <div class="nav-user-menu">
          ${u.isAdmin ? `<a href="#" onclick="nav('bue-admin');document.getElementById('bue-nuser').classList.remove('open')">🛠 Dashboard Admin</a>` : ''}
          <a href="#" onclick="nav('forum');document.getElementById('bue-nuser').classList.remove('open')">💬 Forum</a>
          <a href="#" onclick="nav('galerie');document.getElementById('bue-nuser').classList.remove('open')">🖼 Galerie</a>
          <div class="divider-line"></div>
          <button class="logout" onclick="BUE_AUTH.logout()">↩ Déconnexion</button>
        </div>
      </div>`;
  } else {
    el.innerHTML = `
      <button class="btn-login"    onclick="openBueAuthModal('login')">Connexion</button>
      <button class="btn-register" onclick="openBueAuthModal('register')">S'inscrire</button>`;
  }
}

function renderBueAdminBar() {
  const bar = document.getElementById('bue-admin-bar');
  if (!bar) return;
  if (BUE_AUTH.isAdmin()) {
    bar.className = 'admin-bar show';
    bar.innerHTML = `
      <strong>⚙️ Admin BUE</strong>
      <span class="admin-sep"></span>
      <button class="admin-action" onclick="nav('bue-admin')">Dashboard</button>
      <button class="admin-action" onclick="bueOpenPublishActu()">+ Actualité</button>
      <button class="admin-action" onclick="bueOpenAddEvent()">+ Événement</button>
      <button class="admin-action" onclick="bueOpenAddRes()">+ Ressource</button>
      <button class="admin-action" onclick="bueOpenGalAdmin()">🖼 Galerie</button>
      <button class="admin-action" onclick="bueOpenPresPhotoModal()">📷 Photo Président</button>
      <button class="admin-action" onclick="bueOpenUsersModal()">👥 Utilisateurs</button>
      <button class="admin-action" onclick="bueOpenSiteParams()">⚙️ Paramètres</button>
      <button class="admin-action" style="margin-left:auto" onclick="BUE_AUTH.logout()">Déconnexion</button>`;
  } else {
    bar.className = 'admin-bar';
  }
}



function applyPresPhoto(src) {
  const av = document.getElementById('bue-pres-avatar');
  if (!av) return;
  if (src) {
    av.style.fontSize = '0';
    av.style.padding = '0';
    av.innerHTML = `<img src="${src}" alt="Président"
      style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block">`;
  } else {
    av.innerHTML = 'DR';
    av.style.fontSize = '';
    av.style.padding = '';
  }
}



/* ══════════════════════════════════════════════════════════════════════════
   15. DASHBOARD ADMIN — CONTRÔLE TOTAL
   ══════════════════════════════════════════════════════════════════════════ */
function renderBueAdminPage() {
  const el = document.getElementById('p-bue-admin');
  if (!el) return;
  if (!BUE_AUTH.isAdmin()) {
    el.innerHTML = `<div class="pg-hero"><div class="wi wrap">
      <h1>Accès refusé</h1><p>Identifiants administrateur requis.</p>
    </div></div>`;
    return;
  }
  const users    = BUE_AUTH._users();
  const galTotal = Object.values(B.galerie).reduce((s,v) => s+v.length, 0);

  el.innerHTML = `
  <div style="background:linear-gradient(135deg,#0D0F40,#1B1E6E);padding:clamp(32px,5vw,56px) clamp(16px,5vw,60px)">
    <div style="max-width:1180px;margin:0 auto">
      <div style="font-size:12px;color:rgba(255,255,255,.45);margin-bottom:8px">Accueil / Administration BUE</div>
      <h1 style="font-family:var(--fs);font-size:clamp(22px,3vw,36px);color:#fff;margin-bottom:6px">
        Dashboard Admin — BUE-ENSPD</h1>
      <p style="font-size:14px;color:rgba(255,255,255,.65)">
        Contrôle total : publications, galerie, utilisateurs, événements, ressources, paramètres.</p>
    </div>
  </div>
  <section style="padding:clamp(28px,5vw,56px) clamp(16px,5vw,60px);background:var(--bg)">
    <div style="max-width:1180px;margin:0 auto">

      <!-- KPIs -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;margin-bottom:32px">
        ${[
          { n:B.actus.length,     l:'Actualités',    c:'#2EAA38' },
          { n:B.evenements.length, l:'Événements',   c:'#F0A500' },
          { n:B.ressources.length, l:'Ressources',   c:'#1B1E6E' },
          { n:galTotal,            l:'Photos',        c:'#6B21A8' },
          { n:users.length,        l:'Comptes',       c:'#C0392B' },
          { n:B.forum.fils.length, l:'Sujets forum', c:'#186020' },
        ].map(k => `
          <div style="background:var(--wh);border:1px solid var(--brd);border-top:3px solid ${k.c};
               border-radius:12px;padding:20px;text-align:center;transition:.2s" class="anim">
            <div style="font-size:32px;font-weight:800;color:${k.c};line-height:1">${k.n}</div>
            <div style="font-size:12px;color:var(--txt3);margin-top:5px;font-weight:600;text-transform:uppercase;letter-spacing:.5px">${k.l}</div>
          </div>`).join('')}
      </div>

      <!-- Actions rapides -->
      <h3 style="font-size:15px;font-weight:700;margin-bottom:14px;color:var(--txt)">Actions rapides</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:36px">
        <button class="btn b-vt b-sm"  onclick="bueOpenPublishActu()">📝 Publier actualité</button>
        <button class="btn b-mn b-sm"  onclick="bueOpenAddEvent()">📅 Ajouter événement</button>
        <button class="btn b-or b-sm"  onclick="bueOpenAddRes()">📄 Ajouter ressource</button>
        <button class="btn b-gh b-sm"  onclick="bueOpenGalAdmin()">🖼 Gérer galerie</button>
        <button class="btn b-gh b-sm"  onclick="bueOpenPresPhotoModal()">📷 Photo Président</button>
        <button class="btn b-gh b-sm"  onclick="bueOpenUsersModal()">👥 Utilisateurs</button>
        <button class="btn b-gh b-sm"  onclick="bueOpenForumAdmin()">💬 Modérer forum</button>
        <button class="btn b-gh b-sm"  onclick="bueOpenTopBarModal()">📢 Bandeau annonce</button>
        <button class="btn b-gh b-sm"  onclick="bueOpenSiteParams()">⚙️ Paramètres</button>
        <button class="btn b-gh b-sm"  onclick="bueOpenResetAdmin()">🔑 Changer mdp</button>
      </div>

      <!-- Tableau 2 colonnes -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
        <!-- Actualités -->
        <div class="card cp">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
            <h3 style="font-size:15px;font-weight:700;color:var(--txt)">Actualités (${B.actus.length})</h3>
            <button class="btn b-vt b-sm" onclick="bueOpenPublishActu()">+ Ajouter</button>
          </div>
          ${B.actus.slice(0,5).map(a => `
            <div style="display:flex;justify-content:space-between;align-items:center;
                        padding:8px 0;border-bottom:1px solid var(--brd);gap:8px">
              <span style="font-size:13px;flex:1;overflow:hidden;text-overflow:ellipsis;
                           white-space:nowrap;color:var(--txt)">
                ${S.esc(a.titre.substring(0,40))}…
              </span>
              <div style="display:flex;gap:5px;flex-shrink:0">
                <span class="badge bv" style="font-size:10px">${S.esc(a.cat)}</span>
                <button class="btn b-er b-sm" style="padding:2px 7px;font-size:11px"
                        onclick="bueDelActu(${a.id})">✕</button>
              </div>
            </div>`).join('')}
        </div>

        <!-- Utilisateurs -->
        <div class="card cp">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
            <h3 style="font-size:15px;font-weight:700;color:var(--txt)">Utilisateurs (${users.length})</h3>
            <button class="btn b-gh b-sm" onclick="bueOpenUsersModal()">Tout voir</button>
          </div>
          ${users.length ? users.slice(0,5).map(u => `
            <div style="display:flex;justify-content:space-between;align-items:center;
                        padding:8px 0;border-bottom:1px solid var(--brd)">
              <div>
                <div style="font-size:13px;font-weight:600;color:var(--txt)">${S.esc(u.nom)}</div>
                <div style="font-size:11px;color:var(--txt3)">${S.esc(u.email)}</div>
              </div>
              <span class="badge ${u.role==='etudiant'?'bv':'bgr'}">${u.role}</span>
            </div>`).join('')
          : '<p style="font-size:13px;color:var(--txt3)">Aucun compte inscrit.</p>'}
        </div>
      </div>

    </div>
  </section>`;
  initAnim();
}

/* ══════════════════════════════════════════════════════════════════════════
   16. ADMIN : OPÉRATIONS
   ══════════════════════════════════════════════════════════════════════════ */

/* ── Actualités ──────────────────────────────────────────────── */
function bueOpenPublishActu() {
  if (!BUE_AUTH.isAdmin()) { toast('Réservé aux administrateurs.', 'err'); return; }
  openModal('Publier une actualité BUE', `
    <div class="fg"><label>Titre *</label>
      <input class="fi" type="text" id="bpub-t" placeholder="Titre de l'actualité"></div>
    <div class="fg"><label>Catégorie</label>
      <select class="fs" id="bpub-c">
        <option>Intégration</option><option>JSSED</option><option>Sport</option>
        <option>Social</option><option>Culture</option><option>Solidarité</option>
        <option>Annonce</option><option>Académique</option>
      </select></div>
    <div class="fg"><label>Image (chemin assets/ — optionnel)</label>
      <input class="fi" type="text" id="bpub-img" placeholder="assets/galerie/bue/photo.jpg"></div>
    <div class="fg"><label>Contenu complet *</label>
      <textarea class="ft" id="bpub-x" placeholder="Rédigez l'actualité en détail…" style="min-height:160px"></textarea></div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn b-vt" onclick="buePubActu()">✓ Publier</button>
      <button class="btn b-gh" onclick="closeModal()">Annuler</button>
    </div>`);
}
function buePubActu() {
  const t   = S.clean(document.getElementById('bpub-t')?.value);
  const x   = S.clean(document.getElementById('bpub-x')?.value);
  const cat = document.getElementById('bpub-c')?.value || 'Annonce';
  const img = S.clean(document.getElementById('bpub-img')?.value);
  if (!t || !x) { toast('Titre et contenu requis.', 'err'); return; }
  const m = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'][new Date().getMonth()];
  B.actus.unshift({ id: Date.now(), cat, date: m + ' ' + new Date().getFullYear(), img, titre: t, texte: x });
  closeModal();
  renderBueActusHome();
  renderBueAdminPage();
  toast('Actualité publiée !', 'ok');
}
function bueDelActu(id) {
  if (!BUE_AUTH.isAdmin()) return;
  if (!confirm('Supprimer cette actualité ?')) return;
  const i = B.actus.findIndex(a => a.id === id);
  if (i >= 0) { B.actus.splice(i, 1); renderBueActusHome(); renderBueAdminPage(); toast('Supprimée.', 'ok'); }
}

/* ── Événements (admins uniquement pour créer/supprimer) ──────── */
function bueOpenAddEvent() {
  if (!BUE_AUTH.isAdmin()) { 
    toast('Seuls les administrateurs peuvent créer des événements.', 'err'); 
    return; 
  }
  
  openModal('Ajouter un événement', `
    <div class="fg"><label>Titre *</label>
      <input class="fi" type="text" id="bev-t" placeholder="Titre de l'événement"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
      <div class="fg"><label>Jour</label>
        <input class="fi" id="bev-j" placeholder="15"></div>
      <div class="fg"><label>Mois</label>
        <input class="fi" id="bev-m" placeholder="Sep"></div>
      <div class="fg"><label>Heure</label>
        <input class="fi" id="bev-h" placeholder="09h00"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="fg"><label>Type</label>
        <select class="fs" id="bev-type">
          <option>BUE</option><option>Signature</option><option>Académique</option>
          <option>Social</option><option>Intégration</option><option>Solidarité</option><option>Sport</option>
        </select></div>
      <div class="fg"><label>Lieu *</label>
        <input class="fi" id="bev-l" placeholder="Amphi ENSPD, Parakou"></div>
    </div>
    <div class="fg"><label>Description *</label>
      <textarea class="ft" id="bev-d" placeholder="Description courte…" style="min-height:90px"></textarea></div>
    <div class="fg"><label>Détails complémentaires</label>
      <textarea class="ft" id="bev-dt" placeholder="Programme, modalités…" style="min-height:70px"></textarea></div>
    
    <div class="fg"><label>Date de clôture des inscriptions (optionnel)</label>
      <input class="fi" type="datetime-local" id="bev-cloture"></div>
    <div class="fg"><label>Capacité max (optionnel, 0 = illimité)</label>
      <input class="fi" type="number" id="bev-max" placeholder="0" min="0"></div>

    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn b-vt" onclick="bueAddEvent()">✓ Ajouter</button>
      <button class="btn b-gh" onclick="closeModal()">Annuler</button>
    </div>`);
}
function ajouterEvenementAdmin() { bueOpenAddEvent(); }
function bueAddEvent() {
  const t  = S.clean(document.getElementById('bev-t')?.value);
  const d  = S.clean(document.getElementById('bev-d')?.value);
  const l  = S.clean(document.getElementById('bev-l')?.value);
  const dt = S.clean(document.getElementById('bev-dt')?.value);
  if (!t || !d || !l) { toast('Titre, description et lieu requis.', 'err'); return; }
  B.evenements.unshift({
    id: Date.now(),
    j: S.clean(document.getElementById('bev-j')?.value) || '?',
    m: S.clean(document.getElementById('bev-m')?.value) || '?',
    titre: t, type: document.getElementById('bev-type')?.value || 'BUE',
    heure: S.clean(document.getElementById('bev-h')?.value) || '09h00',
    lieu: l, desc: d, detail: dt, inscrit: false,
    inscrits: [], dateCloture: document.getElementById('bev-cloture')?.value || null, maxInscrits: parseInt(document.getElementById('bev-max')?.value) || 0,
  });
  closeModal();
  renderBueEventsHome();
  renderBueEventsList();
  renderBueAdminPage();
  toast('Événement ajouté !', 'ok');
}
function bueDelEvent(id) {
  if (!BUE_AUTH.isAdmin()) return;
  if (!confirm('Supprimer cet événement ?')) return;
  const i = B.evenements.findIndex(x => x.id === id);
  if (i >= 0) { B.evenements.splice(i, 1); renderBueEventsList(); renderBueEventsHome(); renderBueAdminPage(); toast('Événement supprimé.', 'ok'); }
}

/* ── Ressources ──────────────────────────────────────────────── */
function bueOpenAddRes() {
  if (!BUE_AUTH.isAdmin()) { toast('Réservé aux administrateurs.', 'err'); return; }
  openModal('Ajouter une ressource', `
    <div class="fg"><label>Titre *</label>
      <input class="fi" type="text" id="bres-t" placeholder="Ex: Emploi du temps L1 S1 2025-2026"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="fg"><label>Catégorie</label>
        <select class="fs" id="bres-cat">
          <option>EDT</option><option>Administratif</option><option>Pédagogie</option>
        </select></div>
      <div class="fg"><label>Type</label>
        <select class="fs" id="bres-type">
          <option>PDF</option><option>Word</option><option>Excel</option><option>Lien</option>
        </select></div>
    </div>
    <div class="fg"><label>Lien / URL (optionnel)</label>
      <input class="fi" type="text" id="bres-url" placeholder="https://... ou assets/..."></div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn b-vt" onclick="bueAddRes()">✓ Ajouter</button>
      <button class="btn b-gh" onclick="closeModal()">Annuler</button>
    </div>`);
}
function ajouterRessourceAdmin() { bueOpenAddRes(); }
function bueAddRes() {
  const t   = S.clean(document.getElementById('bres-t')?.value);
  const cat = document.getElementById('bres-cat')?.value || 'EDT';
  const typ = document.getElementById('bres-type')?.value || 'PDF';
  const url = S.clean(document.getElementById('bres-url')?.value);
  if (!t) { toast('Titre requis.', 'err'); return; }
  const id = Date.now();
  B.ressources.unshift({ id, t, type: typ, cat, url });
  closeModal();
  renderRes();
  renderBueAdminPage();
  toast('Ressource ajoutée !', 'ok');
}
function bueDelRes(id) {
  if (!BUE_AUTH.isAdmin()) return;
  const i = B.ressources.findIndex(r => r.id === id);
  if (i >= 0) { B.ressources.splice(i, 1); renderRes(); renderBueAdminPage(); toast('Supprimée.', 'ok'); }
}

/* ── Photo Président ─────────────────────────────────────────── */
function bueOpenPresPhotoModal() {
  if (!BUE_AUTH.isAdmin()) { toast('Réservé aux administrateurs.', 'err'); return; }
  const stored = localStorage.getItem('bue_pres_photo');
  openModal('Photo du Président', `
    <div style="display:flex;align-items:center;gap:20px;margin-bottom:20px">
      <div id="pres-preview" style="width:90px;height:90px;border-radius:50%;overflow:hidden;
            border:3px solid var(--brd);flex-shrink:0;background:var(--bg2);
            display:flex;align-items:center;justify-content:center;font-size:30px">
        ${stored ? `<img src="${stored}" style="width:100%;height:100%;object-fit:cover">` : '👤'}
      </div>
      <div>
        <p style="font-size:13px;color:var(--txt3);margin-bottom:10px">
          Format : JPG, PNG, WEBP · Taille max : 2 Mo · Recommandé : 300×300px
        </p>
        <label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;
                      font-size:13px;font-weight:600;padding:8px 16px;border-radius:8px;
                      border:1.5px solid var(--vt);color:var(--vt);transition:.2s"
               onmouseover="this.style.background='var(--vt)';this.style.color='#fff'"
               onmouseout="this.style.background='';this.style.color='var(--vt)'">
          📤 Choisir une photo
          <input type="file" accept="image/jpeg,image/png,image/webp"
                 style="display:none" onchange="uploadPresPhoto(this)">
        </label>
        ${stored ? `<button class="btn b-er b-sm" style="margin-left:8px"
                      onclick="localStorage.removeItem('bue_pres_photo');
                               applyPresPhoto(null);
                               closeModal();toast('Photo supprimée.','ok')">✕ Supprimer</button>` : ''}
      </div>
    </div>
    <button class="btn b-gh b-sm" onclick="closeModal()">Fermer</button>`);
}
function uploadPresPhoto(input) {
  if (!input.files[0]) return;
  const file = input.files[0];
  if (file.size > 5 * 1024 * 1024) { toast('Photo trop lourde (max 5 Mo).', 'err'); return; }
  const reader = new FileReader();
  reader.onload = e => { openCropModal(e.target.result, 'pres'); };
  reader.readAsDataURL(file);
}

/* Crop modal — carré centré */
function openCropModal(src, target) {
  openModal('Recadrer la photo', `
    <p style="font-size:13px;color:var(--txt3);margin-bottom:14px">
      Faites glisser pour recadrer • Format carré recommandé
    </p>
    <div style="position:relative;overflow:hidden;border-radius:10px;
                background:#000;text-align:center;margin-bottom:14px">
      <img id="crop-src" src="${src}"
           style="max-width:100%;max-height:60vh;display:block;margin:0 auto;
                  object-fit:contain;border-radius:8px">
    </div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn b-vt" onclick="applyCrop('${target}')">✓ Valider</button>
      <button class="btn b-gh" onclick="closeModal()">Annuler</button>
    </div>`);
}

/* Applique l'image telle quelle (crop basique centré) */
function applyCrop(target) {
  const img = document.getElementById('crop-src');
  if (!img || !img.src) return;
  const canvas = document.createElement('canvas');
  const size = Math.min(img.naturalWidth, img.naturalHeight);
  canvas.width  = 300;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  const ox = (img.naturalWidth  - size) / 2;
  const oy = (img.naturalHeight - size) / 2;
  ctx.drawImage(img, ox, oy, size, size, 0, 0, 300, 300);
  const dataUrl = canvas.toDataURL('image/jpeg', .88);
  if (target === 'pres') {
    localStorage.setItem('bue_pres_photo', dataUrl);
    applyPresPhoto(dataUrl);
    toast('Photo du Président mise à jour !', 'ok');
  }
  closeModal();
}

/* ── Galerie ─────────────────────────────────────────────────── */
function bueOpenGalAdmin() {
  if (!BUE_AUTH.isAdmin()) return;
  openModal('Gestion de la galerie', `
    <h4 style="font-size:14px;font-weight:700;margin-bottom:14px">Ajouter une photo</h4>
    <div class="fg"><label>Catégorie</label>
      <select class="fs" id="bgal-cat-sel"
              onchange="document.getElementById('bgal-new-cat-wrap').style.display=this.value==='__new__'?'flex':'none'">
        ${Object.keys(B.galerie).map(c => `<option>${c}</option>`).join('')}
        <option value="__new__">+ Nouvelle catégorie…</option>
      </select></div>
    <div class="fg" id="bgal-new-cat-wrap" style="display:none"><label>Nom de la catégorie</label>
      <input class="fi" id="bgal-new-cat" placeholder="Ex: Conférences"></div>
    <div class="fg"><label>Chemin *</label>
      <input class="fi" id="bgal-src" placeholder="assets/galerie/bue/photo.jpg"></div>
    <div class="fg"><label>Titre *</label>
      <input class="fi" id="bgal-t" placeholder="Ex: Séance JSSED"></div>
    <div class="fg"><label>Événement / Contexte</label>
      <input class="fi" id="bgal-ev" placeholder="Ex: JSSED 2025"></div>
    <button class="btn b-vt" onclick="bueAddGalPhoto()">✓ Ajouter la photo</button>
    <hr style="margin:18px 0;border-color:var(--brd)">
    <h4 style="font-size:14px;font-weight:700;margin-bottom:12px">Photos actuelles</h4>
    <div style="max-height:260px;overflow-y:auto">
      ${Object.entries(B.galerie).map(([cat,imgs]) => `
        <div style="margin-bottom:14px">
          <div style="font-size:12px;font-weight:700;color:var(--txt3);text-transform:uppercase;
                      letter-spacing:.5px;margin-bottom:6px">${S.esc(cat)} (${imgs.length})</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${imgs.map((g,i) => `
              <div style="position:relative;width:64px">
                <img src="${S.esc(g.src)}"
                     style="width:64px;height:50px;object-fit:cover;border-radius:6px;
                            border:1px solid var(--brd);display:block"
                     onerror="this.style.opacity='.2'">
                <button onclick="bueDelGalPhoto('${S.esc(cat)}',${i})"
                        style="position:absolute;top:-5px;right:-5px;width:18px;height:18px;
                               border-radius:50%;background:var(--er);color:#fff;
                               border:none;cursor:pointer;font-size:10px;
                               display:flex;align-items:center;justify-content:center">✕</button>
              </div>`).join('')}
          </div>
        </div>`).join('')}
    </div>
    <button class="btn b-gh b-sm" style="margin-top:14px" onclick="closeModal()">Fermer</button>`, true);
}
function bueAddGalPhoto() {
  const sel = document.getElementById('bgal-cat-sel')?.value;
  const cat = sel === '__new__' ? S.clean(document.getElementById('bgal-new-cat')?.value) : sel;
  const src = S.clean(document.getElementById('bgal-src')?.value);
  const t   = S.clean(document.getElementById('bgal-t')?.value);
  const ev  = S.clean(document.getElementById('bgal-ev')?.value);
  if (!cat || !src || !t) { toast('Catégorie, chemin et titre requis.', 'err'); return; }
  if (!B.galerie[cat]) B.galerie[cat] = [];
  B.galerie[cat].push({ src, titre: t, ev: ev || cat });
  toast(`Photo ajoutée dans "${cat}" !`, 'ok');
  bueOpenGalAdmin();
}
function bueDelGalPhoto(cat, idx) {
  if (!BUE_AUTH.isAdmin()) return;
  B.galerie[cat]?.splice(idx, 1);
  if (!B.galerie[cat]?.length) delete B.galerie[cat];
  renderBueGaleriePage();
  bueOpenGalAdmin();
}

/* ── Utilisateurs ────────────────────────────────────────────── */
function bueOpenUsersModal() {
  if (!BUE_AUTH.isAdmin()) return;
  const users = BUE_AUTH._users();
  openModal('Gestion des utilisateurs', `
    <p style="font-size:13px;color:var(--txt3);margin-bottom:14px">${users.length} compte(s) enregistré(s)</p>
    ${users.length ? `<div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:12.5px">
        <thead><tr style="background:var(--bg2)">
          <th style="padding:9px 10px;text-align:left;border:1px solid var(--brd);color:var(--txt)">Nom</th>
          <th style="padding:9px 10px;text-align:left;border:1px solid var(--brd);color:var(--txt)">Email</th>
          <th style="padding:9px 10px;text-align:left;border:1px solid var(--brd);color:var(--txt)">Rôle</th>
          <th style="padding:9px 10px;text-align:left;border:1px solid var(--brd);color:var(--txt)">Filière</th>
          <th style="padding:9px 10px;text-align:center;border:1px solid var(--brd);color:var(--txt)">Action</th>
        </tr></thead>
        <tbody>
          ${users.map((u,i) => `
            <tr style="${i%2===1?'background:var(--bg2)':''}">
              <td style="padding:8px 10px;border:1px solid var(--brd);font-weight:600;color:var(--txt)">${S.esc(u.nom)}</td>
              <td style="padding:8px 10px;border:1px solid var(--brd);color:var(--txt2)">${S.esc(u.email)}</td>
              <td style="padding:8px 10px;border:1px solid var(--brd)"><span class="badge ${u.role==='etudiant'?'bv':'bgr'}">${u.role}</span></td>
              <td style="padding:8px 10px;border:1px solid var(--brd);color:var(--txt3)">${S.esc(u.filiere||'—')}</td>
              <td style="padding:8px 10px;border:1px solid var(--brd);text-align:center">
                <button class="btn b-er b-sm" style="padding:3px 8px;font-size:11px"
                        onclick="bueDelUser('${S.esc(u.email)}')">✕</button>
              </td>
            </tr>`).join('')}
        </tbody>
      </table></div>
      <div style="margin-top:14px;display:flex;gap:8px">
        <button class="btn b-er b-sm"
                onclick="if(confirm('Supprimer TOUS les comptes ?')){
                  localStorage.removeItem('enspd_users7');
                  closeModal();toast('Tous les comptes supprimés.','ok');}">🗑 Tout supprimer</button>
        <button class="btn b-gh b-sm" onclick="closeModal()">Fermer</button>
      </div>` : `<p style="font-size:13px;color:var(--txt3);padding:16px 0">Aucun compte inscrit.</p>
      <button class="btn b-gh b-sm" onclick="closeModal()">Fermer</button>`}`, true);
}
function bueDelUser(email) {
  if (!BUE_AUTH.isAdmin()) return;
  const users = BUE_AUTH._users().filter(u => u.email !== email);
  BUE_AUTH._saveUsers(users);
  toast('Compte supprimé.', 'ok');
  bueOpenUsersModal();
}

/* ── Forum modération ────────────────────────────────────────── */
function bueOpenForumAdmin() {
  if (!BUE_AUTH.isAdmin()) return;
  openModal('Modération du forum', `
    <p style="font-size:13px;color:var(--txt3);margin-bottom:14px">${B.forum.fils.length} sujets</p>
    ${B.forum.fils.map(f => `
      <div style="display:flex;justify-content:space-between;align-items:center;
                  padding:9px 0;border-bottom:1px solid var(--brd);gap:8px">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--txt)">${S.esc(f.titre.substring(0,50))}${f.titre.length>50?'…':''}</div>
          <div style="font-size:11px;color:var(--txt3)">${S.esc(f.cat)} · ${S.esc(f.auteur)} · ${S.esc(f.date)}</div>
        </div>
        <button class="btn b-er b-sm" style="padding:3px 8px;font-size:11px"
                onclick="bueDelFil(${f.id})">✕</button>
      </div>`).join('')}
    <button class="btn b-gh b-sm" style="margin-top:14px" onclick="closeModal()">Fermer</button>`);
}
function bueDelFil(id) {
  if (!BUE_AUTH.isAdmin()) return;
  const i = B.forum.fils.findIndex(f => f.id === id);
  if (i >= 0) { B.forum.fils.splice(i, 1); renderFils(); bueOpenForumAdmin(); toast('Sujet supprimé.', 'ok'); }
}

/* ── Bandeau annonce ─────────────────────────────────────────── */
function bueOpenTopBarModal() {
  if (!BUE_AUTH.isAdmin()) return;
  const cur = document.querySelector('.top-bar-content')?.textContent?.trim() || '';
  openModal("Modifier le bandeau d'annonce", `
    <div class="fg"><label>Texte du bandeau</label>
      <textarea class="ft" id="bann-txt" style="min-height:80px">${S.esc(cur)}</textarea></div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn b-vt" onclick="
        const t = document.getElementById('bann-txt')?.value.trim();
        if(t){ const el = document.querySelector('.top-bar-content,.top-bar span');
               if(el) el.textContent = t;
               toast('Bandeau mis à jour !','ok'); closeModal(); }">✓ Mettre à jour</button>
      <button class="btn b-gh" onclick="closeModal()">Annuler</button>
    </div>`);
}

/* ── Paramètres généraux ─────────────────────────────────────── */
function bueOpenSiteParams() {
  if (!BUE_AUTH.isAdmin()) return;
  const galTotal = Object.values(B.galerie).reduce((s,v) => s+v.length, 0);
  openModal('Paramètres du site BUE', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:22px">
      ${[
        { n:B.actus.length,      l:'Actualités',    c:'#2EAA38' },
        { n:B.evenements.length, l:'Événements',    c:'#F0A500' },
        { n:galTotal,            l:'Photos galerie', c:'#6B21A8' },
        { n:BUE_AUTH._users().length, l:'Comptes',  c:'#C0392B' },
      ].map(k => `
        <div style="padding:16px;border-radius:10px;background:var(--bg2);border:1px solid var(--brd);text-align:center">
          <div style="font-size:26px;font-weight:800;color:${k.c}">${k.n}</div>
          <div style="font-size:12px;color:var(--txt3);margin-top:4px">${k.l}</div>
        </div>`).join('')}
    </div>
    <h4 style="font-size:14px;font-weight:700;margin-bottom:10px">Actions</h4>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${[
        ['📝','Publier une actualité','bueOpenPublishActu()'],
        
        ['📅','Ajouter un événement','bueOpenAddEvent()'],
        ['📄','Ajouter une ressource','bueOpenAddRes()'],
        ['🖼','Gérer la galerie','bueOpenGalAdmin()'],
        ['👥','Gérer les utilisateurs','bueOpenUsersModal()'],
        ['📷','Photo du Président','bueOpenPresPhotoModal()'],
        ['📢','Modifier le bandeau','bueOpenTopBarModal()'],
        ['💬','Modérer le forum','bueOpenForumAdmin()'],
        ['🔑','Changer le mot de passe admin','bueOpenResetAdmin()'],
        ['🍪','Réinitialiser les cookies','Cookies.resetConsent();closeModal()'],
      ].map(([ico,lbl,fn]) => `
        <button class="btn b-gh b-sm" style="justify-content:flex-start;gap:10px"
                onclick="${fn};this.closest('.modal-overlay, [id=modal]') && true">
          ${ico} ${lbl}
        </button>`).join('')}
    </div>
    <button class="btn b-gh b-sm" style="margin-top:16px" onclick="closeModal()">Fermer</button>`, true);
}

/* ── Changer mot de passe admin ──────────────────────────────── */
function bueOpenResetAdmin() {
  if (!BUE_AUTH.isAdmin()) return;
  openModal('Changer le mot de passe admin', `
    <div class="fg"><label>Mot de passe actuel *</label>
      <div style="position:relative">
        <input id="rp-old" type="password" class="fi" placeholder="Mot de passe actuel" style="padding-right:44px">
        <button type="button" onclick="togglePassVis('rp-old','rp-old-eye')"
                style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:18px;color:var(--txt3)">
          <span id="rp-old-eye">👁️</span></button>
      </div></div>
    <div class="fg">
      <label>Nouveau mot de passe *
        <span id="rp-str-lbl" style="font-size:11px;font-weight:400;margin-left:6px"></span>
      </label>
      <div style="position:relative">
        <input id="rp-new" type="password" class="fi" placeholder="Min. 10 car."
               style="padding-right:44px"
               oninput="showPassStrength('rp-new','rp-str-bar','rp-str-lbl')">
        <button type="button" onclick="togglePassVis('rp-new','rp-new-eye')"
                style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:18px;color:var(--txt3)">
          <span id="rp-new-eye">👁️</span></button>
      </div>
      <div style="height:4px;border-radius:2px;background:var(--bg3);margin-top:5px;overflow:hidden">
        <div id="rp-str-bar" style="height:100%;border-radius:2px;width:0;transition:width .3s,background .3s"></div>
      </div>
    </div>
    <div class="fg"><label>Confirmer *</label>
      <div style="position:relative">
        <input id="rp-new2" type="password" class="fi" placeholder="Répétez" style="padding-right:44px">
        <button type="button" onclick="togglePassVis('rp-new2','rp-new2-eye')"
                style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:18px;color:var(--txt3)">
          <span id="rp-new2-eye">👁️</span></button>
      </div></div>
    <div id="rp-err" style="display:none;background:var(--er-l);color:var(--er);
         border-radius:8px;padding:10px 14px;font-size:13px;border-left:4px solid var(--er);
         margin-bottom:12px"></div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn b-vt" onclick="bueDoResetPass()">✓ Mettre à jour</button>
      <button class="btn b-gh" onclick="closeModal()">Annuler</button>
    </div>`);
}
/* PREMIÈRE CONFIGURATION ADMIN — aucun mot de passe codé en dur.
   Le déployeur définit le sien au premier accès (stocké haché PBKDF2). */
function bueOpenAdminSetup(which) {
  const label = which === 'enspd' ? 'Administrateur ENSPD' : 'Administrateur BUE';
  openModal(`Configuration — ${label}`, `
    <div class="alert a-or mb16"><span>🔐</span>
      <div>Aucun mot de passe ${S.esc(label)} n'est défini. Choisissez-en un
      maintenant — il sera stocké haché (PBKDF2-SHA256) sur cet appareil.
      À faire dès le déploiement du site.</div></div>
    <input type="hidden" id="as-which" value="${which === 'enspd' ? 'enspd' : 'bue'}">
    <div class="fg"><label>Nouveau mot de passe (min. 10 caractères)</label>
      <input class="fi" type="password" id="as-p1" autocomplete="new-password"></div>
    <div class="fg"><label>Confirmez le mot de passe</label>
      <input class="fi" type="password" id="as-p2" autocomplete="new-password"></div>
    <div id="as-err" class="alert a-er" style="display:none;margin-bottom:12px"></div>
    <div style="display:flex;gap:8px">
      <button class="btn b-vt" onclick="bueSaveAdminSetup()">Définir le mot de passe</button>
      <button class="btn b-gh" onclick="closeModal()">Annuler</button>
    </div>`);
}
async function bueSaveAdminSetup() {
  const which = document.getElementById('as-which')?.value === 'enspd' ? 'enspd' : 'bue';
  const p1 = document.getElementById('as-p1')?.value || '';
  const p2 = document.getElementById('as-p2')?.value || '';
  const er = document.getElementById('as-err');
  const showE = m => { er.textContent = m; er.style.display = 'block'; };
  if (p1.length < 10) { showE('Mot de passe trop court (min. 10 caractères).'); return; }
  if (S.passStrength(p1) < 3) { showE('Mot de passe faible. Ajoutez symboles + chiffres + majuscules.'); return; }
  if (p1 !== p2) { showE('Les mots de passe ne correspondent pas.'); return; }
  const KEY = which === 'enspd' ? 'enspd_admin_hash_v7' : 'bue_admin_hash_v7';
  localStorage.setItem(KEY, await Crypto.hash(p1));
  closeModal();
  toast('Mot de passe administrateur configuré. Connectez-vous.', 'ok');
  openBueAuthModal('login');
}
async function bueDoResetPass() {
  const old  = document.getElementById('rp-old')?.value  || '';
  const n    = document.getElementById('rp-new')?.value  || '';
  const n2   = document.getElementById('rp-new2')?.value || '';
  const errEl= document.getElementById('rp-err');
  const showE= m => { errEl.textContent = m; errEl.style.display = 'block'; };
  const stored = localStorage.getItem('bue_admin_hash_v7');
  if (!stored || await Crypto.hash(old) !== stored) { showE('Mot de passe actuel incorrect.'); return; }
  if (n.length < 10)      { showE('Nouveau mot de passe trop court (min 10 car.).'); return; }
  if (S.passStrength(n) < 3) { showE('Mot de passe faible. Ajoutez symboles + chiffres + majuscules.'); return; }
  if (n !== n2)            { showE('Les mots de passe ne correspondent pas.'); return; }
  localStorage.setItem('bue_admin_hash_v7', await Crypto.hash(n));
  closeModal();
  toast('Mot de passe admin mis à jour !', 'ok');
}

/* ── Boutons admin conditionnels ─────────────────────────────── */
function _applyAdminButtons() {
  const isAdmin = BUE_AUTH.isAdmin();
  const addEventBtn = document.getElementById('btn-add-event');
  if (addEventBtn) addEventBtn.hidden = !isAdmin;
  const addResBtn = document.getElementById('btn-add-res');
  if (addResBtn) addResBtn.hidden = !isAdmin;
  const presPhotoUpload = document.getElementById('pres-photo-upload');
  if (presPhotoUpload) presPhotoUpload.style.display = isAdmin ? 'block' : 'none';
}

/* Garantit qu'un hash admin existe — no-op si déjà configuré */
BUE_AUTH._ensureAdminHash = async function() { /* défini au premier login */ };

/* ══════════════════════════════════════════════════════════════════════════
   17. ANIMATIONS
   ══════════════════════════════════════════════════════════════════════════ */
const animObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vis'); animObs.unobserve(e.target); } });
}, { threshold: 0.1 });
function initAnim() {
  document.querySelectorAll('.anim:not(.vis)').forEach(el => animObs.observe(el));
}

/* ══════════════════════════════════════════════════════════════════════════
   18. LIGHTBOX
   ══════════════════════════════════════════════════════════════════════════ */
let _lbImages = [], _lbIdx = 0;
function openLightbox(images, idx) {
  _lbImages = images; _lbIdx = idx;
  updateLightbox();
  document.getElementById('lightbox')?.classList.add('on');
  document.body.style.overflow = 'hidden';
}
function updateLightbox() {
  const img = _lbImages[_lbIdx];
  const lb  = document.getElementById('lb-img');
  const cap = document.getElementById('lb-caption');
  const dl  = document.getElementById('lb-dl-btn');
  const cnt = document.getElementById('lb-counter');
  if (lb)  lb.src = img.src;
  if (cap) cap.textContent = img.titre + (img.ev ? ' — ' + img.ev : '');
  if (dl)  { dl.href = img.src; dl.download = img.titre.replace(/\s+/g, '_') + '.jpg'; }
  if (cnt) cnt.textContent = (_lbIdx + 1) + ' / ' + _lbImages.length;
}
function lbNav(dir) { _lbIdx = (_lbIdx + dir + _lbImages.length) % _lbImages.length; updateLightbox(); }
function closeLightbox() {
  document.getElementById('lightbox')?.classList.remove('on');
  document.body.style.overflow = '';
}

/* ══════════════════════════════════════════════════════════════════════════
   19. DONNÉES BUE
   ══════════════════════════════════════════════════════════════════════════ */
const B = {
  actus: [
    { id:1, cat:'Intégration', date:'Oct 2025',
      img:'assets/galerie/bue/rencontre_l1_1775854235975.jpg',
      titre:"Séance d'intégration des L1 — Amphithéâtre principal",
      texte:`La 1ère séance d'intégration des nouveaux étudiants s'est tenue le 25 octobre 2025, animée par Mlle Belvida VIGAN. Le Président DJOSSOU Rodrigue a rappelé les valeurs fondamentales de l'ENSPD.

Au programme :
• Présentation du BUE et de ses missions
• Mot d'accueil du Directeur Prof. Épiphane SODJINOU
• Présentation du règlement académique et de la vie associative
• Questions-Réponses avec les étudiants de L2 et L3
• Promenade sur le campus de l'Université de Parakou` },
    { id:2, cat:'JSSED', date:'Sep 2025',
      img:'assets/galerie/bue/jssed_1775853364124.jpg',
      titre:"JSSED 1ère édition — Un succès retentissant",
      texte:`La première édition du JSSED (Journée de la Statistique, du Suivi-Évaluation et de la Démographie) a réuni plus de 200 participants.

Points forts :
• Conférences d'experts en statistiques et démographie
• Ateliers ODK et KoboToolbox animés par des enseignants
• Concours inter-étudiants d'analyse de données
• Networking avec les anciens diplômés de l'ENSPD
• Remise de prix aux meilleurs projets étudiants

2ème édition prévue en septembre 2026 — site dédié en cours.` },
    { id:3, cat:'Sport', date:'Avr 2026',
      img:'assets/galerie/bue/match_1775857051781.jpg',
      titre:"Tournoi inter-filières 2025-2026",
      texte:`Le 1er tournoi de football inter-filières a mobilisé toutes les promotions de l'ENSPD.

Résultats :
🥇 Équipe Licence SA — Champions !
🥈 Équipe Master SSD
🥉 Équipe Licence PSE

Merci à tous les participants pour cet esprit sportif exemplaire et cette belle cohésion.` },
    { id:4, cat:'Social', date:'Avr 2026', img:'assets/galerie/bue/picnic1.jpg',
      titre:"Picnic solidaire BUE-ENSPD",
      texte:`Le BUE a organisé un grand picnic de cohésion réunissant tous les étudiants de l'ENSPD. Au programme : jeux, partage, musique et échanges dans la bonne humeur.` },
    { id:5, cat:'Culture', date:'Fév 2026', img:'assets/galerie/bue/eloquence_1775853247917.jpg',
      titre:"Nuit de l'Éloquence 2026",
      texte:`La Nuit de l'Éloquence a réuni les talents de l'ENSPD autour de discours, poésie et prise de parole. Un événement valorisant les soft skills essentiels à nos futurs métiers de statisticiens et planificateurs.` },
    { id:6, cat:'Solidarité', date:'Jan 2026', img:'assets/galerie/bue/orphelinat_1775854711912.jpg',
      titre:"Don à l'orphelinat — L'ENSPD s'engage",
      texte:`Le BUE a organisé une collecte et un don au profit d'un orphelinat de Parakou. Un bel exemple de l'engagement citoyen et de la solidarité communautaire des étudiants de l'ENSPD.` },
  ],

  evenements: [
    { id:1, j:'15', m:'Avr', titre:"Assemblée Générale — Bilan mi-mandat BUE", type:'BUE',
      heure:'09h00', lieu:'Amphi principal ENSPD',
      desc:"Bilan à mi-mandat du bureau BUE. Point sur les projets réalisés et à venir.",
      detail:"Présence obligatoire pour les délégués. Programme disponible auprès du BUE.", inscrit:false, inscrits:[] },
    { id:2, j:'Sep', m:'2026', titre:"JSSED — 2ème édition", type:'Signature',
      heure:'08h00', lieu:'Campus ENSPD',
      desc:"La 2ème édition du JSSED : conférences, ateliers, concours et networking.",
      detail:"Ouvert aux étudiants, professionnels et partenaires. Site dédié bientôt disponible.", inscrit:false, inscrits:[] },
    { id:3, j:'01', m:'Déc', titre:"4ème Rentrée Solennelle ENSPD", type:'Académique',
      heure:'09h00', lieu:'Amphi B, Université de Parakou',
      desc:"Cérémonie officielle de lancement de l'année académique 2026-2027.",
      detail:"Présence obligatoire pour tous les étudiants. Allocutions du Recteur et du Directeur de l'ENSPD.", inscrit:false, inscrits:[] },
    { id:4, j:'Mai', m:'2026', titre:"Gala de fin d'année — Promotion 2026", type:'Social',
      heure:'18h00', lieu:'Campus Université de Parakou',
      desc:"Soirée de gala BUE : remise des prix d'excellence, animations, buffet. Cotisation : 2 000 FCFA.",
      detail:"Tenue de soirée recommandée. Inscription obligatoire avant le 1er mai.", inscrit:false, inscrits:[] },
    { id:5, j:'Oct', m:'2026', titre:"Octobre Rose — Sensibilisation santé", type:'Solidarité',
      heure:'09h00', lieu:'Campus ENSPD',
      desc:"Campagne de sensibilisation au cancer du sein. Dépistage, ateliers et marche solidaire.",
      detail:"En partenariat avec des professionnels de santé. Entrée libre.", inscrit:false, inscrits:[] },
    { id:6, j:'25', m:'Oct', titre:"Séance d'intégration L1 2026-2027", type:'Intégration',
      heure:'14h00', lieu:'Amphi principal ENSPD',
      desc:"Accueil des nouveaux étudiants de Licence 1. Présentation BUE, CRISTAL et campus.",
      detail:"Animé par le bureau BUE 2026-2027. Présence fortement recommandée.", inscrit:false, inscrits:[] },
  ],

  cristal: [
    { sigle:'SSF', titre:'Section Science Fondamentale', ico:'🔢', membres:'25+', active:true,
      desc:'Renforcement des bases théoriques : mathématiques, probabilités, statistiques fondamentales. Sessions hebdomadaires de révisions collectives.' },
    { sigle:'SI', titre:'Section Informatique', ico:'💻', membres:'38+', active:true,
      desc:"Programmation R, Python, STATA, SPSS, Excel avancé. Ateliers pratiques, projets collectifs et compétitions internes de Data Analysis." },
    { sigle:'SADP', titre:'Section Art & Développement Personnel', ico:'🎭', membres:'20+', active:true,
      desc:"Développement des soft skills, leadership, prise de parole. Nuit de l'Éloquence organisée chaque année." },
    { sigle:'SCA', titre:'Section Club Anglais', ico:'🌍', membres:'30+', active:true,
      desc:"Apprentissage de l'anglais académique et professionnel pour statisticiens. Sessions hebdomadaires, débats et rédaction scientifique." },
    { sigle:'ETS', titre:'Section Études & Travaux Statistiques', ico:'📊', membres:'—', active:false,
      desc:"Réalisation d'études statistiques appliquées et enquêtes de terrain. Section en cours de démarrage — lancement prévu prochainement." },
  ],

  ressources: [
    { id:101, t:"Emploi du temps L1 — Sem 1&2 (2025-2026)", type:'PDF', cat:'EDT', url:'' },
    { id:102, t:"Emploi du temps L2 — Sem 3&4 (2025-2026)", type:'PDF', cat:'EDT', url:'' },
    { id:103, t:"Emploi du temps L3 — Sem 5&6 (2025-2026)", type:'PDF', cat:'EDT', url:'' },
    { id:104, t:"Emplois du temps Masters (2025-2026)",       type:'PDF', cat:'EDT', url:'' },
    { id:105, t:"Calendrier académique complet 2025-2026",    type:'PDF', cat:'EDT', url:'' },
    { id:201, t:"Modèle — Demande d'attestation d'inscription", type:'Word', cat:'Administratif', url:'' },
    { id:202, t:"Modèle — Demande de relevé de notes",        type:'Word', cat:'Administratif', url:'' },
    { id:203, t:"Modèle — Demande de mise en stage",          type:'Word', cat:'Administratif', url:'' },
    { id:301, t:"Glossaire LMD — Termes essentiels",          type:'PDF', cat:'Pédagogie', url:'' },
    { id:302, t:"Guide de rédaction du mémoire ENSPD",        type:'PDF', cat:'Pédagogie', url:'' },
    { id:303, t:"Règlement pédagogique de l'ENSPD",           type:'PDF', cat:'Pédagogie', url:'' },
  ],

  forum: {
    cats: [
      { ico:'📚', titre:'Cours & Révisions',     nb:12 },
      { ico:'💼', titre:'Stages & Emplois',       nb:8  },
      { ico:'💻', titre:'Logiciels & Outils',     nb:24 },
      { ico:'📋', titre:'Administration',         nb:6  },
      { ico:'🎉', titre:'Vie étudiante',          nb:15 },
      { ico:'🌍', titre:'Bourses & Opportunités', nb:9  },
    ],
    fils: [
      { id:1, titre:'Comment installer R et RStudio sur Windows 11 ?', cat:'Logiciels & Outils',
        auteur:'Moussa K.', date:'Il y a 2h', rep:7, vues:134, pin:true },
      { id:2, titre:"Conseils pour l'examen de Statistique Mathématique L2", cat:'Cours & Révisions',
        auteur:'Aminata D.', date:'Il y a 5h', rep:12, vues:289 },
      { id:3, titre:'[OFFRE] Stage INSAE Cotonou — 3 mois', cat:'Stages & Emplois',
        auteur:'Admin BUE', date:'Hier', rep:3, vues:201, pin:true },
      { id:4, titre:'Bourse Pan African University — date limite 30 mai', cat:'Bourses & Opportunités',
        auteur:'Jédida M.', date:'Il y a 2j', rep:5, vues:312 },
      { id:5, titre:"Partage supports — cours Démographie L2 Sem 3", cat:'Cours & Révisions',
        auteur:'Robert Y.', date:'Il y a 3j', rep:4, vues:95 },
    ],
  },

  galerie: {
    'JSSED': [
      { src:'assets/galerie/bue/jssed_1775853364124.jpg', titre:'JSSED 1ère édition', ev:'Septembre 2025' },
      { src:'assets/galerie/bue/jssed_1775853366762.jpg', titre:'JSSED — Ateliers', ev:'Septembre 2025' },
      { src:'assets/galerie/bue/jssed_1775853368864.jpg', titre:'JSSED — Conférences', ev:'Septembre 2025' },
    ],
    'Intégration L1': [
      { src:'assets/galerie/bue/rencontre_l1_1775854224120.jpg', titre:'Séance intégration L1', ev:'Octobre 2025' },
      { src:'assets/galerie/bue/rencontre_l1_1775854230345.jpg', titre:'Présentation BUE', ev:'Oct 2025' },
      { src:'assets/galerie/bue/rencontre_l1_1775854235975.jpg', titre:'Échanges avec les L1', ev:'Oct 2025' },
      { src:'assets/galerie/bue/rencontre_l1_1775854240321.jpg', titre:'Questions-Réponses', ev:'Oct 2025' },
    ],
    'Activités sportives': [
      { src:'assets/galerie/bue/match_1775857049490.jpg', titre:'Match inter-licence', ev:'Tournoi 2025-2026' },
      { src:'assets/galerie/bue/match_1775857051781.jpg', titre:'Match inter-licence', ev:'Tournoi 2025-2026' },
      { src:'assets/galerie/bue/match_1775857058821.jpg', titre:'Match inter-licence', ev:'Tournoi 2025-2026' },
      { src:'assets/galerie/bue/match_1775857060723.jpg', titre:'Finale inter-licence', ev:'Tournoi 2025-2026' },
    ],
    'Vie sociale': [
      { src:'assets/galerie/bue/picnic1.jpg', titre:'Picnic BUE', ev:'Avril 2026' },
      { src:'assets/galerie/bue/picnic2.jpg', titre:'Picnic solidaire', ev:'Avril 2026' },
      { src:'assets/galerie/bue/picnic3.jpg', titre:'Cohésion BUE', ev:'Avril 2026' },
      { src:'assets/galerie/bue/after_partiels1.jpg', titre:'After Partiels', ev:'2025-2026' },
      { src:'assets/galerie/bue/after_partiels2.jpg', titre:'After Partiels', ev:'2025-2026' },
    ],
    "Nuit de l'Éloquence": [
      { src:'assets/galerie/bue/eloquence_1775853247917.jpg', titre:"Nuit de l'Éloquence", ev:'2025-2026' },
      { src:'assets/galerie/bue/eloquence_1775853253142.jpg', titre:"Nuit de l'Éloquence", ev:'2025-2026' },
      { src:'assets/galerie/bue/eloquence_1775853254788.jpg', titre:"Nuit de l'Éloquence", ev:'2025-2026' },
    ],
    'Solidarité': [
      { src:'assets/galerie/bue/orphelinat_1775854711912.jpg', titre:'Don orphelinat', ev:'Jan 2026' },
      { src:'assets/galerie/bue/orphelinat_1775854715212.jpg', titre:'Don orphelinat', ev:'Jan 2026' },
      { src:'assets/galerie/bue/octobre_rose_1775854379782.jpg', titre:'Octobre Rose', ev:'Oct 2025' },
      { src:'assets/galerie/bue/octobre_rose_1775854383015.jpg', titre:'Octobre Rose', ev:'Oct 2025' },
    ],
    'Formation Anglais': [
      { src:'assets/galerie/bue/anglais1.jpg', titre:'Formation Anglais', ev:'Club Anglais CRISTAL' },
      { src:'assets/galerie/bue/anglais2.jpg', titre:'Formation Anglais', ev:'Club Anglais CRISTAL' },
      { src:'assets/galerie/bue/anglais3.jpg', titre:'Formation Anglais', ev:'Club Anglais CRISTAL' },
    ],
    'Rentrée Solennelle': [
      { src:'assets/galerie/enspd/rentree_1775854492374.jpg', titre:'Rentrée Solennelle', ev:'3ème éd. — Déc 2025' },
      { src:'assets/galerie/enspd/rentree_1775854494083.jpg', titre:'Rentrée Solennelle', ev:'3ème éd. — Déc 2025' },
      { src:'assets/galerie/enspd/rentree_1775854499589.jpg', titre:'Rentrée Solennelle', ev:'3ème éd. — Déc 2025' },
    ],
  },
};

/* ══════════════════════════════════════════════════════════════════════════
   20. RENDERS
   ══════════════════════════════════════════════════════════════════════════ */

function renderBueActusHome() {
  const el = document.getElementById('bue-actus-home');
  if (!el) return;
  el.innerHTML = B.actus.slice(0, 3).map((a, i) => bueAcCard(a, i)).join('');
  initAnim();
}
function bueAcCard(a, i) {
  return `<div class="card ac-card anim d${(i%3)+1}" onclick="showBueActu(${a.id})">
    <div class="ac-img">
      ${a.img
        ? `<img src="${S.esc(a.img)}" alt="${S.esc(a.titre)}" loading="lazy"
                onerror="this.parentElement.innerHTML='<div class=\\'ph\\'style=\\'height:195px\\'><div class=\\'ph-ico\\'>📰</div></div>'">`
        : `<div class="ph" style="height:195px"><div class="ph-ico">📰</div><span style="font-size:12px">${S.esc(a.cat)}</span></div>`}
    </div>
    <div class="ac-body">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span class="badge bmn" style="font-size:11px">${S.esc(a.cat)}</span>
        <span style="font-size:11px;color:var(--txt3)">📅 ${S.esc(a.date)}</span>
      </div>
      <h3>${S.esc(a.titre)}</h3>
      <p>${S.esc(a.texte.split('\n')[0].substring(0, 90))}…</p>
      <div class="ac-foot"><span></span>
        <span style="color:var(--mn);font-weight:600;font-size:13px">Lire en entier →</span>
      </div>
    </div>
  </div>`;
}
function showBueActu(id) {
  const a = B.actus.find(x => x.id === id);
  if (!a) return;
  openModal(a.titre, `
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
      <span class="badge bmn">${S.esc(a.cat)}</span>
      <span class="badge bgr">📅 ${S.esc(a.date)}</span>
    </div>
    ${a.img ? `
      <div style="border-radius:12px;overflow:hidden;margin-bottom:20px;max-height:340px">
        <img src="${S.esc(a.img)}" alt="${S.esc(a.titre)}"
             style="width:100%;height:340px;object-fit:cover;display:block"
             onerror="this.parentElement.style.display='none'">
      </div>` : ''}
    <div style="font-size:15.5px;line-height:2;color:var(--txt2);
                white-space:pre-line;padding-bottom:8px">
      ${S.esc(a.texte)}
    </div>
    <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--brd);
                display:flex;gap:8px;flex-wrap:wrap">
      ${BUE_AUTH.isAdmin() ? `
        <button class="btn b-er b-sm"
                onclick="bueDelActu(${a.id});closeModal()">✕ Supprimer</button>` : ''}
      <button class="btn b-gh b-sm" onclick="closeModal()">Fermer</button>
    </div>`, true);
}

function renderBueEventsHome() {
  const el = document.getElementById('bue-events-home');
  if (!el) return;
  el.innerHTML = B.evenements.slice(0, 3).map(e => bueEvCard(e)).join('');
  initAnim();
}
function renderBueEventsList() {
  const el = document.getElementById('bue-events-list');
  if (!el) return;
  const btn = document.getElementById('btn-add-event');
  if (btn) btn.style.display = BUE_AUTH.isAdmin() ? 'inline-flex' : 'none';
  el.innerHTML = B.evenements.map(e => bueEvCard(e)).join('');
  initAnim();
}
function bueEvCard(e) {
  const cols = { BUE:'#1B1E6E', Signature:'#F0A500', Académique:'#2EAA38',
                 Social:'#8a5e00', Intégration:'#207A2A', Solidarité:'#C0392B', Sport:'#1565C0' };
  const c = cols[e.type] || '#1B1E6E';
  return `
    <div class="ev-item anim" onclick="showBueEvent(${e.id})">
      <div class="ev-dt" style="background:${c}">
        <div class="dd">${S.esc(String(e.j))}</div>
        <div class="dm">${S.esc(String(e.m))}</div>
      </div>
      <div class="ev-info" style="flex:1">
        <h4>${S.esc(e.titre)}</h4>
        <p>${S.esc(e.desc.substring(0, 70))}…</p>
        <div class="ev-meta">
          <span>🕐 ${S.esc(e.heure)}</span>
          <span>📍 ${S.esc(e.lieu.substring(0, 28))}</span>
          <span class="badge" style="background:${c}22;color:${c}">${S.esc(e.type)}</span>
          ${e.inscrits?.length ? `<span class="badge bgr">${e.inscrits.length} inscrit(s)</span>` : ''}
        </div>
      </div>
      <button class="btn b-sm" style="flex-shrink:0;border-color:var(--brd);
              background:${e.inscrit?'var(--vt)':'transparent'};
              color:${e.inscrit?'#fff':'var(--txt2)'}"
              onclick="event.stopPropagation();bueInscrire(${e.id})">
        ${e.inscrit ? '✓ Inscrit' : "S'inscrire"}
      </button>
    </div>`;
}
function showBueEvent(id) {
  const e = B.evenements.find(x => x.id === id);
  if (!e) return;
  const cols = { BUE:'#1B1E6E', Signature:'#F0A500', Académique:'#2EAA38',
                 Social:'#8a5e00', Intégration:'#207A2A', Solidarité:'#C0392B', Sport:'#1565C0' };
  const c = cols[e.type] || '#1B1E6E';
  openModal(e.titre, `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
      <span class="badge" style="background:${c}22;color:${c}">📅 ${S.esc(String(e.j))} ${S.esc(String(e.m))}</span>
      <span class="badge bgr">🕐 ${S.esc(e.heure)}</span>
      <span class="badge bgr">📍 ${S.esc(e.lieu)}</span>
      <span class="badge" style="background:${c}22;color:${c}">${S.esc(e.type)}</span>
      ${e.inscrits?.length ? `<span class="badge bv">${e.inscrits.length} inscrit(s)</span>` : ''}
    </div>
    <p style="font-size:15.5px;line-height:1.9;color:var(--txt2)">${S.esc(e.desc)}</p>
    ${e.detail ? `<p style="font-size:14px;line-height:1.8;color:var(--txt3);margin-top:12px;
        padding-top:12px;border-top:1px solid var(--brd)">${S.esc(e.detail)}</p>` : ''}
    <div style="display:flex;gap:8px;margin-top:18px;flex-wrap:wrap">
      <button class="btn b-vt b-sm"
              onclick="bueInscrire(${e.id});closeModal()">
        ${e.inscrit ? '✓ Déjà inscrit — Annuler' : "S'inscrire"}
      </button>
      ${BUE_AUTH.isAdmin() ? `<button class="btn b-er b-sm"
          onclick="bueDelEvent(${e.id});closeModal()">✕ Supprimer</button>` : ''}
      <button class="btn b-gh b-sm" onclick="closeModal()">Fermer</button>
    </div>`, true);
}
function bueInscrire(id) {
  if (!BUE_AUTH.isLoggedIn()) {
    toast('Connectez-vous pour vous inscrire.', 'inf');
    openBueAuthModal('login');
    return;
  }
  const e = B.evenements.find(x => x.id === id);
  if (!e) return;

  /* ── Vérification date de clôture ── */
  if (e.dateCloture) {
    const cloture = new Date(e.dateCloture);
    const now = new Date();
    if (now > cloture) {
      toast(`Les inscriptions pour "${e.titre.substring(0,30)}…" sont fermées.`, 'warn');
      return;
    }
  }
  /* ── Vérification capacité max ── */
  if (e.maxInscrits && e.inscrits?.length >= e.maxInscrits) {
    toast('Capacité maximale atteinte.', 'warn');
    return;
  }

  e.inscrit = !e.inscrit;
  if (!e.inscrits) e.inscrits = [];
  if (e.inscrit) {
    e.inscrits.push({
      nom: _currentUser.nom,
      email: _currentUser.email,
      at: new Date().toISOString()
    });
  } else {
    e.inscrits = e.inscrits.filter(x => x.email !== _currentUser.email);
  }
  renderBueEventsHome();
  renderBueEventsList();
  toast(e.inscrit
    ? `✓ Inscription confirmée — ${e.titre.substring(0,30)}…`
    : 'Désinscription effectuée.', e.inscrit ? 'ok' : 'inf');
}

function renderCristal() {
  const el = document.getElementById('cristal-list');
  if (!el) return;
  el.innerHTML = B.cristal.map(s => `
    <div class="cristal-sec${s.active ? '' : ' inactive'} anim">
      <div class="cs-header">
        <div class="cs-ico">${s.ico}</div>
        <div>
          <span class="cs-name">${S.esc(s.titre)}</span>
          <span class="cs-short">${S.esc(s.sigle)}</span>
          ${!s.active ? '<span class="cs-badge-inactive">En démarrage</span>' : ''}
        </div>
        <div class="cs-members" style="margin-left:auto">${S.esc(s.membres)} membres</div>
      </div>
      <p>${S.esc(s.desc)}</p>
    </div>`).join('');
  initAnim();
}

function renderRes(cat = '') {
  const el = document.getElementById('res-list');
  if (!el) return;
  const btn = document.getElementById('btn-add-res');
  if (btn) btn.style.display = BUE_AUTH.isAdmin() ? 'inline-flex' : 'none';
  const list = cat ? B.ressources.filter(r => r.cat === cat) : B.ressources;
  const bgs  = { EDT:'var(--mn-l)', Administratif:'var(--vt-l)', Pédagogie:'var(--or-l)' };
  el.innerHTML = list.map(r => `
    <div class="res-item anim">
      <div class="res-ico" style="background:${bgs[r.cat]||'var(--bg2)'}">
        ${r.type==='PDF'?'📄':r.type==='Word'?'📝':r.type==='Excel'?'📊':'🔗'}
      </div>
      <div class="res-info" style="flex:1">
        <h4>${S.esc(r.t)}</h4>
        <p>${S.esc(r.cat)} · ${S.esc(r.type)}</p>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        ${r.url
          ? `<a href="${S.esc(r.url)}" target="_blank" class="btn b-sm"
               style="border-color:var(--mn);color:var(--mn);background:transparent">⬇ Télécharger</a>`
          : `<button class="btn b-sm"
               style="border-color:var(--brd);color:var(--txt3);background:transparent;cursor:default"
               onclick="toast('Disponible bientôt','inf')">⬇ Bientôt</button>`}
        ${BUE_AUTH.isAdmin() ? `<button class="btn b-er b-sm" style="padding:5px 8px"
            onclick="bueDelRes(${r.id})">✕</button>` : ''}
      </div>
    </div>`).join('');
  initAnim();
}
function filterRes(cat, el) {
  document.querySelectorAll('.rf').forEach(b => b.className = 'btn b-gh b-sm rf');
  el.className = 'btn b-vt b-sm rf';
  renderRes(cat);
}

function updateForumBanner() {
  const banner = document.getElementById('forum-auth-banner');
  if (!banner) return;
  banner.style.display = BUE_AUTH.isLoggedIn() ? 'none' : 'flex';
}
function renderForumCats() {
  const el = document.getElementById('forum-cats');
  if (!el) return;
  el.innerHTML = B.forum.cats.map(c => `
    <div class="fc" onclick="filterFils('${S.esc(c.titre)}',this)">
      <div class="fi-ico" style="font-size:26px;margin-bottom:8px">${c.ico}</div>
      <h4>${S.esc(c.titre)}</h4>
      <p>${c.nb} discussions</p>
    </div>`).join('');
}
function renderFils(cat = '') {
  const el = document.getElementById('forum-fils');
  if (!el) return;
  const list = cat ? B.forum.fils.filter(f => f.cat === cat) : B.forum.fils;
  if (!list.length) {
    el.innerHTML = '<p style="text-align:center;color:var(--txt3);padding:32px">Aucun sujet ici.</p>';
    return;
  }
  el.innerHTML = list.map(f => `
    <div class="thread anim" onclick="showFil(${f.id})">
      <div class="th-top">
        <h4>${f.pin ? '📌 ' : ''}${S.esc(f.titre)}</h4>
        <span class="badge bmn" style="font-size:11px;flex-shrink:0">${S.esc(f.cat)}</span>
      </div>
      <div class="th-meta">
        <span>👤 ${S.esc(f.auteur)}</span>
        <span>🕐 ${S.esc(f.date)}</span>
        <span>💬 ${f.rep} réponses</span>
        <span>👁 ${f.vues} vues</span>
      </div>
    </div>`).join('');
}
function filterFils(cat, el) {
  document.querySelectorAll('.fc').forEach(c => c.classList.remove('on'));
  el?.classList.add('on');
  renderFils(cat);
}
function showFil(id) {
  if (!BUE_AUTH.isLoggedIn()) {
    toast('Connectez-vous pour accéder aux discussions.', 'inf');
    openBueAuthModal('login');
    return;
  }
  const f = B.forum.fils.find(x => x.id === id);
  if (!f) return;
  openModal(f.titre, `
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">
      <span class="badge bmn">${S.esc(f.cat)}</span>
      <span class="badge bgr">Par ${S.esc(f.auteur)}</span>
      <span class="badge bgr">${S.esc(f.date)}</span>
      <span class="badge bgr">💬 ${f.rep} · 👁 ${f.vues}</span>
    </div>
    <div class="fg"><label>Votre réponse</label>
      <textarea class="ft" id="reply-txt" placeholder="Partagez votre avis, une ressource…"></textarea></div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn b-vt b-sm" onclick="postReply(${f.id})">Publier</button>
      ${BUE_AUTH.isAdmin() ? `<button class="btn b-er b-sm"
          onclick="bueDelFil(${f.id});closeModal()">✕ Supprimer</button>` : ''}
      <button class="btn b-gh b-sm" onclick="closeModal()">Fermer</button>
    </div>`);
}
function postReply(id) {
  const txt = S.clean(document.getElementById('reply-txt')?.value);
  if (!txt) { toast('Rédigez votre réponse.', 'err'); return; }
  const f = B.forum.fils.find(x => x.id === id);
  if (f) f.rep++;
  closeModal();
  renderFils();
  toast('Réponse publiée !', 'ok');
}
function nouveauSujet() {
  if (!BUE_AUTH.isLoggedIn()) {
    toast('Connectez-vous pour créer un sujet.', 'inf');
    openBueAuthModal('login');
    return;
  }
  openModal('Nouveau sujet', `
    <div class="fg"><label>Titre *</label>
      <input class="fi" type="text" id="suj-t" placeholder="Ex: Comment utiliser ggplot2 ?"></div>
    <div class="fg"><label>Catégorie</label>
      <select class="fs" id="suj-c">
        ${B.forum.cats.map(c => `<option>${S.esc(c.titre)}</option>`).join('')}
      </select></div>
    <div class="fg"><label>Message *</label>
      <textarea class="ft" id="suj-m" placeholder="Décrivez votre question…"></textarea></div>
    <button class="btn b-vt" onclick="pubSujet()">Publier</button>`);
}
function pubSujet() {
  const t   = S.clean(document.getElementById('suj-t')?.value);
  const m   = S.clean(document.getElementById('suj-m')?.value);
  const cat = document.getElementById('suj-c')?.value || 'Cours & Révisions';
  if (!t || !m) { toast('Titre et message requis.', 'err'); return; }
  B.forum.fils.unshift({ id: Date.now(), titre: t, cat, auteur: _currentUser?.nom || 'Anonyme',
    date: "À l'instant", rep: 0, vues: 1 });
  closeModal();
  renderFils();
  toast('Sujet publié !', 'ok');
}

function rejoindreCristal() {
  openModal('Rejoindre le CRISTAL', `
    <p style="font-size:14px;color:var(--txt2);line-height:1.8;margin-bottom:20px">
      Contactez directement le Président du BUE par téléphone, email ou WhatsApp.
      Indiquez votre nom, filière et la section qui vous intéresse.
    </p>
    <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">
      <a href="tel:+22901535817" class="btn b-vt" style="justify-content:center">📞 +229 0153581795</a>
      <a href="mailto:bue.enspd@gmail.com?subject=Demande d'adhésion au CRISTAL"
         class="btn b-mn" style="justify-content:center">✉️ bue.enspd@gmail.com</a>
      <a href="https://wa.me/22901535817?text=Bonjour, je souhaite rejoindre le CRISTAL."
         target="_blank" class="btn b-gh"
         style="justify-content:center;border-color:#25D366;color:#25D366">💬 WhatsApp</a>
    </div>
    <button class="btn b-gh b-sm b-full" onclick="closeModal()">Fermer</button>`);
}

function envoyerBueContact(e) {
  e.preventDefault();
  const nom   = S.clean(document.getElementById('bc-nom')?.value);
  const email = S.clean(document.getElementById('bc-email')?.value);
  const msg   = S.clean(document.getElementById('bc-msg')?.value);
  if (!nom || !email || !msg) { toast('Remplissez tous les champs.', 'err'); return; }
  if (!S.isEmail(email)) { toast('Email invalide.', 'err'); return; }
  toast(`Message envoyé ! Réponse sous 48h, ${nom.split(' ')[0]}.`, 'ok');
  e.target.reset();
}

let _bueGalCat = 'Tout';
function renderBueGaleriePage() {
  const catsEl = document.getElementById('bue-gal-cats');
  const grid   = document.getElementById('gal-bue');
  if (!catsEl || !grid) return;
  const allCats = ['Tout', ...Object.keys(B.galerie)];
  catsEl.innerHTML = allCats.map(c => `
    <button class="gal-cat-btn${c === _bueGalCat ? ' on' : ''}"
            onclick="filterBueGal('${S.esc(c)}',this)">${S.esc(c)}</button>`).join('');
  filterBueGal(_bueGalCat);
}
function filterBueGal(cat, btn) {
  _bueGalCat = cat;
  document.querySelectorAll('#bue-gal-cats .gal-cat-btn').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  const grid = document.getElementById('gal-bue');
  if (!grid) return;
  let images = [];
  if (cat === 'Tout') Object.values(B.galerie).forEach(v => images.push(...v));
  else images = B.galerie[cat] || [];
  grid.innerHTML = images.map((g, i) => `
    <div class="gal-item" onclick="openLightbox(getBueGalImages(),${i})">
      <img src="${S.esc(g.src)}" alt="${S.esc(g.titre)}" loading="lazy"
           onerror="this.parentElement.innerHTML='<div class=\\'ph\\'><div class=\\'ph-ico\\'>📷</div><span>${S.esc(g.titre)}</span></div>'">
      <div class="gal-ov">
        <span>${S.esc(g.titre)}</span>
        <small>${S.esc(g.ev)}</small>
      </div>
    </div>`).join('');
}
function getBueGalImages() {
  if (_bueGalCat === 'Tout') {
    let all = []; Object.values(B.galerie).forEach(v => all.push(...v)); return all;
  }
  return B.galerie[_bueGalCat] || [];
}

/* ══════════════════════════════════════════════════════════════════════════
   21. INIT
   ══════════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {

  /* Thème */
  initTheme();
/* Restaurer la langue — clé unifiée avec le site ENSPD (enspd-lang),
   repli sur l'ancienne clé bue-lang pour les utilisateurs existants */
const savedLang = localStorage.getItem('enspd-lang')
  || localStorage.getItem('bue-lang') || 'fr';
if (savedLang !== 'fr') setBueLang(savedLang); else document.documentElement.lang = 'fr';

  /* Session */
  _currentUser = await Session.load();
  updateBueNavAuth();
  renderBueAdminBar();

  /* Routing */
  document.querySelectorAll('[data-p]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); nav(el.dataset.p); });
  });

  /* Modal — fermer sur clic overlay */
  document.getElementById('modal')?.addEventListener('click', e => {
    if (e.target.id === 'modal') closeModal();
  });

  /* Clavier */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeModal(); closeLightbox(); }
    const lb = document.getElementById('lightbox');
    if (lb?.classList.contains('on')) {
      if (e.key === 'ArrowRight') lbNav(1);
      if (e.key === 'ArrowLeft')  lbNav(-1);
    }
  });

  /* Burger mobile */
  document.getElementById('burger')?.addEventListener('click', () => {
    document.getElementById('nav-links')?.classList.toggle('open');
  });
  document.addEventListener('click', e => {
    const nl = document.getElementById('nav-links');
    const bg = document.getElementById('burger');
    if (nl?.classList.contains('open') && !nl.contains(e.target) && !bg?.contains(e.target))
      nl.classList.remove('open');
  });

  /* Scroll */
  const btt = document.getElementById('btt');
  window.addEventListener('scroll', () => {
    document.getElementById('navbar')?.classList.toggle('scrolled', scrollY > 20);
    btt?.classList.toggle('on', scrollY > 320);
  }, { passive: true });
  btt?.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  /* Photo Président depuis localStorage */
  const presPhoto = localStorage.getItem('bue_pres_photo');
  if (presPhoto) applyPresPhoto(presPhoto);
  

  /* Boutons admin conditionnels */
  _applyAdminButtons();

  /* Renders */
  renderBueActusHome();
  renderBueEventsHome();
  renderBueEventsList();
  renderCristal();
  renderRes();
  renderForumCats();
  renderFils();
  updateForumBanner();

  /* Page initiale */
  nav('accueil');

  /* Bootstrap hash admin */
  await BUE_AUTH._ensureAdminHash();

  /* Cookie banner — délai très court pour ne pas bloquer l'affichage */
  if (!Cookies.hasConsent() && !Cookies.hasRefused()) {
    setTimeout(showCookieBanner, 800);
  }
});