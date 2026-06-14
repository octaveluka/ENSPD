<?php
/**
 * Tableau de bord d'administration JSSED 2026 (rendu côté serveur).
 *
 * - Affiche un formulaire de connexion si l'admin n'est pas authentifié.
 * - Une fois connecté : onglets Soumissions / Inscriptions / Contacts,
 *   changement de statut, export CSV, et effacement RGPD.
 *
 * Toute action de modification passe par les endpoints API
 * (/backend/api/admin/*) en POST avec jeton CSRF (en-tête X-CSRF-Token).
 * Toutes les sorties sont échappées avec escape().
 *
 * Palette : marine noble + or académique (institutionnel, sobre).
 */

declare(strict_types=1);

require_once __DIR__ . '/../src/helpers.php';

start_admin_session();

$cfg     = config();
$baseUrl = rtrim((string) ($cfg['base_url'] ?? ''), '/');
$apiBase = $baseUrl !== '' ? $baseUrl . '/api/admin' : '../api/admin';

$isAuthed = false;
$admin    = null;
$idle     = (int) ($cfg['session_idle_timeout'] ?? 1800);
if (!empty($_SESSION['admin_id'])) {
    $last = (int) ($_SESSION['last_activity'] ?? 0);
    if ($last === 0 || (time() - $last) <= $idle) {
        $_SESSION['last_activity'] = time();
        $isAuthed = true;
        $admin = [
            'name'  => (string) ($_SESSION['admin_name'] ?? ''),
            'email' => (string) ($_SESSION['admin_email'] ?? ''),
            'role'  => (string) ($_SESSION['admin_role'] ?? 'admin'),
        ];
    }
}

$csrf = $isAuthed ? csrf_token() : '';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Administration — JSSED 2026</title>
<style>
  :root{
    --navy:#16294D; --navy-dark:#0E1726; --gold:#C49A2E;
    --ivory:#F7F5EF; --text:#1A2238; --line:#e3ddd0; --muted:#5b6478;
  }
  *{box-sizing:border-box}
  body{
    margin:0; font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;
    color:var(--text); background:var(--ivory); line-height:1.5;
  }
  a{color:var(--navy)}
  header.topbar{
    background:var(--navy); color:#fff; padding:18px 28px;
    display:flex; align-items:center; justify-content:space-between;
    border-bottom:3px solid var(--gold);
  }
  header.topbar h1{font-size:18px; margin:0; font-weight:600; letter-spacing:.3px}
  header.topbar .sub{font-size:12px; color:#c7cfe0; margin-top:2px}
  header.topbar .who{font-size:13px; color:#e7ebf3}
  .btn{
    display:inline-block; border:1px solid var(--navy); background:var(--navy);
    color:#fff; padding:8px 14px; border-radius:6px; font-size:13px; cursor:pointer;
    text-decoration:none; font-weight:500;
  }
  .btn:hover{background:var(--navy-dark)}
  .btn.gold{background:var(--gold); border-color:var(--gold); color:#26210f}
  .btn.ghost{background:#fff; color:var(--navy)}
  .btn.sm{padding:5px 10px; font-size:12px}
  .btn.danger{background:#fff; border-color:#9b2c2c; color:#9b2c2c}
  .wrap{max-width:1180px; margin:0 auto; padding:26px}
  .card{
    background:#fff; border:1px solid var(--line); border-radius:10px;
    padding:24px; box-shadow:0 1px 2px rgba(16,23,38,.04);
  }
  /* Connexion */
  .login-wrap{max-width:380px; margin:8vh auto;}
  .login-wrap h2{margin:0 0 4px; color:var(--navy); font-size:20px}
  .login-wrap p.note{color:var(--muted); font-size:13px; margin:0 0 20px}
  label{display:block; font-size:13px; font-weight:500; margin:14px 0 5px}
  input[type=text],input[type=email],input[type=password],select{
    width:100%; padding:10px 12px; border:1px solid var(--line); border-radius:6px;
    font-size:14px; font-family:inherit; background:#fff; color:var(--text);
  }
  input:focus,select:focus{outline:none; border-color:var(--gold); box-shadow:0 0 0 3px rgba(196,154,46,.15)}
  .msg{font-size:13px; margin-top:12px; min-height:18px}
  .msg.err{color:#9b2c2c}
  .msg.ok{color:#2f6b3a}
  /* Onglets */
  nav.tabs{display:flex; gap:6px; margin:0 0 18px; flex-wrap:wrap}
  nav.tabs button{
    border:1px solid var(--line); background:#fff; color:var(--navy);
    padding:9px 16px; border-radius:7px; cursor:pointer; font-size:14px; font-weight:500;
  }
  nav.tabs button.active{background:var(--navy); color:#fff; border-color:var(--navy)}
  .toolbar{display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin-bottom:14px}
  .toolbar input,.toolbar select{width:auto; min-width:150px}
  table{width:100%; border-collapse:collapse; font-size:13px; background:#fff}
  th,td{text-align:left; padding:9px 10px; border-bottom:1px solid var(--line); vertical-align:top}
  th{background:#f0ece1; color:var(--navy); font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.4px}
  tr:hover td{background:#faf8f2}
  .pill{display:inline-block; padding:2px 9px; border-radius:999px; font-size:11px; font-weight:600; border:1px solid}
  .pill.pending{color:#8a6d1a; border-color:#e2cf90; background:#fbf4dd}
  .pill.accepted,.pill.paid{color:#2f6b3a; border-color:#abd3b3; background:#e9f5ec}
  .pill.revision,.pill.pendingpay{color:#8a4d1a; border-color:#e2b890; background:#fbeedd}
  .pill.rejected,.pill.unpaid{color:#9b2c2c; border-color:#e0a3a3; background:#f8e8e8}
  .empty{padding:30px; text-align:center; color:var(--muted)}
  .section-head{display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px}
  .section-head h3{margin:0; color:var(--navy); font-size:16px}
  .rgpd{margin-top:26px; border:1px solid #e0c2c2; background:#fdf6f6; border-radius:10px; padding:18px}
  .rgpd h4{margin:0 0 6px; color:#9b2c2c; font-size:14px}
  .rgpd p{margin:0 0 12px; font-size:13px; color:var(--muted)}
  .rgpd .row{display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end}
  .footer-note{margin-top:24px; font-size:12px; color:var(--muted); text-align:center}
  .hidden{display:none}
  details summary{cursor:pointer; color:var(--navy); font-size:12px}
</style>
</head>
<body>

<?php if (!$isAuthed): ?>
<!-- ===================== ÉCRAN DE CONNEXION ===================== -->
<div class="login-wrap">
  <div class="card">
    <h2>Administration JSSED 2026</h2>
    <p class="note">Espace réservé. Connexion requise.</p>
    <form id="loginForm" autocomplete="off">
      <label for="email">Adresse email</label>
      <input type="email" id="email" name="email" required>
      <label for="password">Mot de passe</label>
      <input type="password" id="password" name="password" required>
      <div style="margin-top:18px">
        <button type="submit" class="btn gold" style="width:100%">Se connecter</button>
      </div>
      <div class="msg" id="loginMsg"></div>
    </form>
  </div>
  <p class="footer-note">École Nationale de Statistique, de Planification et de Démographie — Université de Parakou</p>
</div>

<script>
const API = <?= json_encode($apiBase) ?>;
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = document.getElementById('loginMsg');
  msg.className = 'msg'; msg.textContent = 'Connexion…';
  try {
    const r = await fetch(API + '/login.php', {
      method:'POST', credentials:'same-origin',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
      })
    });
    const d = await r.json();
    if (d.ok) { location.reload(); }
    else if (d.error === 'rate_limit') { msg.className='msg err'; msg.textContent = d.message || 'Trop de tentatives.'; }
    else { msg.className='msg err'; msg.textContent = d.message || 'Identifiants invalides.'; }
  } catch (err) { msg.className='msg err'; msg.textContent = 'Erreur réseau.'; }
});
</script>

<?php else: ?>
<!-- ===================== TABLEAU DE BORD ===================== -->
<header class="topbar">
  <div>
    <h1>Administration JSSED 2026</h1>
    <div class="sub">Journées Scientifiques de la Statistique, de l'Évaluation et de la Démographie</div>
  </div>
  <div style="text-align:right">
    <div class="who"><?= escape($admin['name']) ?> · <?= escape($admin['email']) ?></div>
    <div style="margin-top:6px"><button class="btn ghost sm" id="logoutBtn">Déconnexion</button></div>
  </div>
</header>

<div class="wrap">
  <nav class="tabs">
    <button data-tab="submissions" class="active">Soumissions</button>
    <button data-tab="registrations">Inscriptions</button>
    <button data-tab="contacts">Contacts</button>
  </nav>

  <div id="panel" class="card"><div class="empty">Chargement…</div></div>

  <!-- ===== Effacement RGPD ===== -->
  <div class="rgpd">
    <h4>Effacement de données (RGPD — droit à l'effacement)</h4>
    <p>Supprime définitivement les données d'un participant (soumissions, inscriptions, messages)
       à partir de son email ou d'une référence. Action irréversible et journalisée.</p>
    <div class="row">
      <div>
        <label for="rgpdEmail">Email du participant</label>
        <input type="email" id="rgpdEmail" placeholder="participant@exemple.org">
      </div>
      <div>
        <label for="rgpdRef">ou Référence</label>
        <input type="text" id="rgpdRef" placeholder="JSSED2026-AB12CD">
      </div>
      <button class="btn danger" id="rgpdBtn">Effacer les données</button>
    </div>
    <div class="msg" id="rgpdMsg"></div>
  </div>

  <p class="footer-note">Données personnelles traitées dans le cadre de l'organisation des JSSED 2026.
     Conservation limitée à la durée de l'événement et de ses suites administratives.</p>
</div>

<script>
const API  = <?= json_encode($apiBase) ?>;
const CSRF = <?= json_encode($csrf) ?>;

function esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => (
  {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

async function api(path, opts = {}) {
  opts.credentials = 'same-origin';
  opts.headers = Object.assign({'Content-Type':'application/json','X-CSRF-Token':CSRF}, opts.headers||{});
  const r = await fetch(API + path, opts);
  if (r.status === 401) { location.reload(); throw new Error('auth'); }
  return r.json();
}

/* ---------- Onglets ---------- */
let current = 'submissions';
document.querySelectorAll('nav.tabs button').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('nav.tabs button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    current = b.dataset.tab;
    render();
  });
});

const panel = document.getElementById('panel');

function pill(value, map){
  const cls = map[value] || '';
  return '<span class="pill '+cls+'">'+esc(value)+'</span>';
}

/* ---------- Soumissions ---------- */
async function render(){
  if (current === 'submissions')      return renderSubmissions();
  if (current === 'registrations')    return renderRegistrations();
  if (current === 'contacts')         return renderContacts();
}

async function renderSubmissions(){
  panel.innerHTML = '<div class="empty">Chargement…</div>';
  const d = await api('/submissions.php');
  const items = d.items || [];
  let html = '<div class="section-head"><h3>Soumissions ('+items.length+')</h3>'
    + '<a class="btn ghost sm" href="'+API+'/export.php?type=submissions">Exporter CSV</a></div>';
  if (!items.length){ panel.innerHTML = html + '<div class="empty">Aucune soumission.</div>'; return; }
  html += '<table><thead><tr><th>Réf.</th><th>Auteur</th><th>Atelier</th><th>Format</th><th>Titre</th><th>Statut</th><th>Action</th></tr></thead><tbody>';
  const statusMap = {pending:'pending', accepted:'accepted', revision:'revision', rejected:'rejected'};
  for (const s of items){
    html += '<tr><td><strong>'+esc(s.ref)+'</strong><br><span style="color:#5b6478">'+esc(s.email)+'</span></td>'
      + '<td>'+esc(s.prenom)+' '+esc(s.nom)+'<br><span style="color:#5b6478">'+esc(s.institution||'')+'</span></td>'
      + '<td>'+esc(s.atelier)+'</td><td>'+esc(s.format)+'</td>'
      + '<td>'+esc(s.titre)+'<details><summary>résumé</summary><div style="max-width:380px">'+esc(s.resume)+'</div></details></td>'
      + '<td>'+pill(s.status, statusMap)+'</td>'
      + '<td><select data-ref="'+esc(s.ref)+'" class="subStatus">'
        + ['pending','accepted','revision','rejected'].map(v =>
            '<option value="'+v+'"'+(v===s.status?' selected':'')+'>'+v+'</option>').join('')
      + '</select></td></tr>';
  }
  html += '</tbody></table>';
  panel.innerHTML = html;
  panel.querySelectorAll('.subStatus').forEach(sel => {
    sel.addEventListener('change', async () => {
      await api('/submissions.php', {method:'POST', body: JSON.stringify({ref: sel.dataset.ref, status: sel.value})});
      renderSubmissions();
    });
  });
}

/* ---------- Inscriptions ---------- */
async function renderRegistrations(){
  panel.innerHTML = '<div class="empty">Chargement…</div>';
  const d = await api('/registrations.php');
  const items = d.items || [];
  let html = '<div class="section-head"><h3>Inscriptions ('+items.length+')</h3>'
    + '<a class="btn ghost sm" href="'+API+'/export.php?type=registrations">Exporter CSV</a></div>';
  if (!items.length){ panel.innerHTML = html + '<div class="empty">Aucune inscription.</div>'; return; }
  html += '<table><thead><tr><th>Réf.</th><th>Type</th><th>Participant</th><th>Institution</th><th>Paiement</th><th>Action</th></tr></thead><tbody>';
  const payMap = {paid:'paid', pending:'pendingpay', unpaid:'unpaid'};
  for (const s of items){
    html += '<tr><td><strong>'+esc(s.ref)+'</strong><br><span style="color:#5b6478">'+esc(s.email)+'</span></td>'
      + '<td>'+esc(s.type)+'</td><td>'+esc(s.prenom)+' '+esc(s.nom)+'</td>'
      + '<td>'+esc(s.institution||'')+'</td><td>'+pill(s.payment_status, payMap)+'</td>'
      + '<td><select data-ref="'+esc(s.ref)+'" class="payStatus">'
        + ['unpaid','pending','paid'].map(v =>
            '<option value="'+v+'"'+(v===s.payment_status?' selected':'')+'>'+v+'</option>').join('')
      + '</select></td></tr>';
  }
  html += '</tbody></table>';
  panel.innerHTML = html;
  panel.querySelectorAll('.payStatus').forEach(sel => {
    sel.addEventListener('change', async () => {
      await api('/registrations.php', {method:'POST', body: JSON.stringify({ref: sel.dataset.ref, payment_status: sel.value})});
      renderRegistrations();
    });
  });
}

/* ---------- Contacts ---------- */
async function renderContacts(){
  panel.innerHTML = '<div class="empty">Chargement…</div>';
  const d = await api('/contacts.php');
  const items = d.items || [];
  let html = '<div class="section-head"><h3>Messages de contact ('+items.length+')</h3>'
    + '<a class="btn ghost sm" href="'+API+'/export.php?type=contacts">Exporter CSV</a></div>';
  if (!items.length){ panel.innerHTML = html + '<div class="empty">Aucun message.</div>'; return; }
  html += '<table><thead><tr><th>Date</th><th>Expéditeur</th><th>Sujet</th><th>Message</th><th>État</th><th>Action</th></tr></thead><tbody>';
  for (const c of items){
    html += '<tr><td>'+esc(c.created_at)+'</td>'
      + '<td>'+esc(c.nom)+'<br><span style="color:#5b6478">'+esc(c.email)+'</span></td>'
      + '<td>'+esc(c.sujet||'')+'</td>'
      + '<td><div style="max-width:340px">'+esc(c.message)+'</div></td>'
      + '<td>'+(Number(c.handled) ? '<span class="pill accepted">traité</span>' : '<span class="pill pending">à traiter</span>')+'</td>'
      + '<td><button class="btn ghost sm toggleHandled" data-id="'+esc(c.id)+'" data-h="'+(Number(c.handled)?0:1)+'">'
        + (Number(c.handled) ? 'Rouvrir' : 'Marquer traité') + '</button></td></tr>';
  }
  html += '</tbody></table>';
  panel.innerHTML = html;
  panel.querySelectorAll('.toggleHandled').forEach(btn => {
    btn.addEventListener('click', async () => {
      await api('/contacts.php', {method:'POST', body: JSON.stringify({id: Number(btn.dataset.id), handled: Number(btn.dataset.h)})});
      renderContacts();
    });
  });
}

/* ---------- RGPD ---------- */
document.getElementById('rgpdBtn').addEventListener('click', async () => {
  const email = document.getElementById('rgpdEmail').value.trim();
  const ref   = document.getElementById('rgpdRef').value.trim();
  const msg   = document.getElementById('rgpdMsg');
  if (!email && !ref){ msg.className='msg err'; msg.textContent='Indiquez un email ou une référence.'; return; }
  if (!confirm('Confirmer l\'effacement définitif des données de ce participant ?')) return;
  msg.className='msg'; msg.textContent='Traitement…';
  const d = await api('/delete_participant.php', {method:'POST', body: JSON.stringify({email, ref})});
  if (d.ok){ msg.className='msg ok'; msg.textContent = d.message; document.getElementById('rgpdEmail').value=''; document.getElementById('rgpdRef').value=''; render(); }
  else { msg.className='msg err'; msg.textContent = d.message || 'Échec de l\'effacement.'; }
});

/* ---------- Déconnexion ---------- */
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await api('/logout.php', {method:'POST'});
  location.reload();
});

render();
</script>
<?php endif; ?>
</body>
</html>
