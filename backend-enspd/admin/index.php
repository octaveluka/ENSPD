<?php
/**
 * Tableau de bord d'administration ENSPD (rendu côté serveur).
 *
 * - Affiche un formulaire de connexion si l'admin n'est pas authentifié.
 * - Une fois connecté : onglets Actualités / Événements / Galerie /
 *   Messages / Paramètres.
 *
 * Toute action de modification passe par les endpoints API
 * (/backend-enspd/api/admin/*) en POST avec jeton CSRF (en-tête
 * X-CSRF-Token). Toutes les sorties sont échappées avec escape().
 *
 * Palette ENSPD : marine #1B1E6E + vert #3CB944 + or #F0A500 (institutionnel).
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
<title>Administration — ENSPD</title>
<style>
  :root{
    --navy:#1B1E6E; --navy-dark:#13164f; --green:#3CB944; --gold:#F0A500;
    --bg:#F9FAFB; --text:#111827; --line:#e5e7eb; --muted:#6b7280;
  }
  *{box-sizing:border-box}
  body{
    margin:0; font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;
    color:var(--text); background:var(--bg); line-height:1.5;
  }
  a{color:var(--navy)}
  header.topbar{
    background:var(--navy); color:#fff; padding:18px 28px;
    display:flex; align-items:center; justify-content:space-between;
    border-bottom:3px solid var(--green);
  }
  header.topbar h1{font-size:18px; margin:0; font-weight:600; letter-spacing:.3px}
  header.topbar .sub{font-size:12px; color:#c5c8ee; margin-top:2px}
  header.topbar .who{font-size:13px; color:#e7e9f7}
  .btn{
    display:inline-block; border:1px solid var(--navy); background:var(--navy);
    color:#fff; padding:8px 14px; border-radius:6px; font-size:13px; cursor:pointer;
    text-decoration:none; font-weight:500;
  }
  .btn:hover{background:var(--navy-dark)}
  .btn.green{background:var(--green); border-color:var(--green); color:#06320c}
  .btn.gold{background:var(--gold); border-color:var(--gold); color:#3d2a00}
  .btn.ghost{background:#fff; color:var(--navy)}
  .btn.sm{padding:5px 10px; font-size:12px}
  .btn.danger{background:#fff; border-color:#b91c1c; color:#b91c1c}
  .wrap{max-width:1180px; margin:0 auto; padding:26px}
  .card{
    background:#fff; border:1px solid var(--line); border-radius:10px;
    padding:24px; box-shadow:0 1px 2px rgba(17,24,39,.04);
  }
  .login-wrap{max-width:380px; margin:8vh auto;}
  .login-wrap h2{margin:0 0 4px; color:var(--navy); font-size:20px}
  .login-wrap p.note{color:var(--muted); font-size:13px; margin:0 0 20px}
  label{display:block; font-size:13px; font-weight:500; margin:14px 0 5px}
  input[type=text],input[type=email],input[type=password],input[type=date],select,textarea{
    width:100%; padding:10px 12px; border:1px solid var(--line); border-radius:6px;
    font-size:14px; font-family:inherit; background:#fff; color:var(--text);
  }
  textarea{min-height:90px; resize:vertical}
  input:focus,select:focus,textarea:focus{outline:none; border-color:var(--green); box-shadow:0 0 0 3px rgba(60,185,68,.15)}
  .msg{font-size:13px; margin-top:12px; min-height:18px}
  .msg.err{color:#b91c1c}
  .msg.ok{color:#2f6b3a}
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
  th{background:#eef0fb; color:var(--navy); font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.4px}
  tr:hover td{background:#fafbff}
  .pill{display:inline-block; padding:2px 9px; border-radius:999px; font-size:11px; font-weight:600; border:1px solid}
  .pill.published,.pill.handled,.pill.upcoming{color:#2f6b3a; border-color:#abd3b3; background:#e9f5ec}
  .pill.draft,.pill.pending{color:#8a6d1a; border-color:#e7d49a; background:#fbf4dd}
  .pill.past{color:#5b6478; border-color:#cbd0db; background:#eef0f4}
  .empty{padding:30px; text-align:center; color:var(--muted)}
  .section-head{display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px}
  .section-head h3{margin:0; color:var(--navy); font-size:16px}
  .footer-note{margin-top:24px; font-size:12px; color:var(--muted); text-align:center}
  .hidden{display:none}
  details summary{cursor:pointer; color:var(--navy); font-size:12px}
  .grid2{display:grid; grid-template-columns:1fr 1fr; gap:14px}
  @media(max-width:640px){.grid2{grid-template-columns:1fr}}
  .modal{position:fixed; inset:0; background:rgba(17,24,39,.45); display:flex; align-items:flex-start; justify-content:center; padding:30px 16px; overflow:auto; z-index:50}
  .modal .box{background:#fff; border-radius:10px; max-width:680px; width:100%; padding:24px}
  .modal h3{margin:0 0 14px; color:var(--navy); font-size:17px}
  .row-actions{display:flex; gap:6px; flex-wrap:wrap}
  .imgrow{display:flex; gap:8px; align-items:center; margin:6px 0; font-size:12px}
  .imgrow img{height:42px; width:42px; object-fit:cover; border-radius:5px; border:1px solid var(--line)}
  .thumb{height:38px; width:38px; object-fit:cover; border-radius:5px; border:1px solid var(--line)}
</style>
</head>
<body>

<?php if (!$isAuthed): ?>
<!-- ===================== ÉCRAN DE CONNEXION ===================== -->
<div class="login-wrap">
  <div class="card">
    <h2>Administration ENSPD</h2>
    <p class="note">Espace réservé. Connexion requise.</p>
    <form id="loginForm" autocomplete="off">
      <label for="email">Adresse email</label>
      <input type="email" id="email" name="email" required>
      <label for="password">Mot de passe</label>
      <input type="password" id="password" name="password" required>
      <div style="margin-top:18px">
        <button type="submit" class="btn green" style="width:100%">Se connecter</button>
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
    <h1>Administration ENSPD</h1>
    <div class="sub">École Nationale de Statistique, de Planification et de Démographie</div>
  </div>
  <div style="text-align:right">
    <div class="who"><?= escape($admin['name']) ?> · <?= escape($admin['email']) ?></div>
    <div style="margin-top:6px"><button class="btn ghost sm" id="logoutBtn">Déconnexion</button></div>
  </div>
</header>

<div class="wrap">
  <nav class="tabs">
    <button data-tab="actualites" class="active">Actualités</button>
    <button data-tab="evenements">Événements</button>
    <button data-tab="galerie">Galerie</button>
    <button data-tab="messages">Messages</button>
    <button data-tab="parametres">Paramètres</button>
  </nav>

  <div id="panel" class="card"><div class="empty">Chargement…</div></div>

  <p class="footer-note">Données personnelles traitées dans le cadre du site institutionnel de l'ENSPD —
     Université de Parakou. Conservation limitée et droit à l'effacement assurés.</p>
</div>

<!-- conteneur de modale -->
<div id="modalRoot"></div>

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

/* ---------- Modale ---------- */
const modalRoot = document.getElementById('modalRoot');
function closeModal(){ modalRoot.innerHTML = ''; }
function openModal(title, bodyHtml){
  modalRoot.innerHTML = '<div class="modal"><div class="box"><h3>'+esc(title)+'</h3>'+bodyHtml+'</div></div>';
  modalRoot.querySelector('.modal').addEventListener('click', (e)=>{ if(e.target.classList.contains('modal')) closeModal(); });
}

/* ---------- Onglets ---------- */
let current = 'actualites';
document.querySelectorAll('nav.tabs button').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('nav.tabs button').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    current = b.dataset.tab;
    render();
  });
});

const panel = document.getElementById('panel');

function render(){
  if (current === 'actualites') return renderActualites();
  if (current === 'evenements') return renderEvenements();
  if (current === 'galerie')    return renderGalerie();
  if (current === 'messages')   return renderMessages();
  if (current === 'parametres') return renderParametres();
}

/* ================= ACTUALITÉS ================= */
async function renderActualites(){
  panel.innerHTML = '<div class="empty">Chargement…</div>';
  const d = await api('/actualites.php');
  const items = d.items || [];
  let html = '<div class="section-head"><h3>Actualités ('+items.length+')</h3>'
    + '<button class="btn green sm" id="newActu">Nouvelle actualité</button></div>';
  if (!items.length){ panel.innerHTML = html + '<div class="empty">Aucune actualité.</div>'; bindActu(); return; }
  html += '<table><thead><tr><th>Date</th><th>Titre</th><th>Catégorie</th><th>Photos</th><th>Statut</th><th>Action</th></tr></thead><tbody>';
  for (const a of items){
    html += '<tr><td>'+esc(a.date_pub||'')+'</td>'
      + '<td><strong>'+esc(a.titre)+'</strong><br><span style="color:#6b7280">'+esc(a.slug||'')+'</span></td>'
      + '<td>'+esc(a.categorie||'')+'</td>'
      + '<td>'+((a.images&&a.images.length)||0)+'</td>'
      + '<td>'+(a.statut==='published'?'<span class="pill published">publié</span>':'<span class="pill draft">brouillon</span>')+'</td>'
      + '<td class="row-actions"><button class="btn ghost sm editActu" data-id="'+esc(a.id)+'">Modifier</button>'
      + '<button class="btn ghost sm imgsActu" data-id="'+esc(a.id)+'">Photos</button>'
      + '<button class="btn danger sm delActu" data-id="'+esc(a.id)+'">Supprimer</button></td></tr>';
  }
  html += '</tbody></table>';
  panel.innerHTML = html;
  window.__actu = items;
  bindActu();
}

function actuForm(a){
  a = a || {};
  return '<form id="actuForm">'
    + '<input type="hidden" id="af_id" value="'+esc(a.id||'')+'">'
    + '<label>Titre *</label><input type="text" id="af_titre" value="'+esc(a.titre||'')+'" required>'
    + '<div class="grid2"><div><label>Catégorie</label><input type="text" id="af_categorie" value="'+esc(a.categorie||'')+'"></div>'
    + '<div><label>Date de publication</label><input type="date" id="af_date" value="'+esc(a.date_pub||'')+'"></div></div>'
    + '<label>Slug (laisser vide pour auto)</label><input type="text" id="af_slug" value="'+esc(a.slug||'')+'">'
    + '<label>Image principale (URL)</label><input type="text" id="af_image" value="'+esc(a.image||'')+'">'
    + '<label>Résumé</label><textarea id="af_resume">'+esc(a.resume||'')+'</textarea>'
    + '<label>Contenu</label><textarea id="af_contenu" style="min-height:150px">'+esc(a.contenu||'')+'</textarea>'
    + '<label>Statut</label><select id="af_statut">'
    + '<option value="published"'+(a.statut==='published'?' selected':'')+'>Publié</option>'
    + '<option value="draft"'+(a.statut==='draft'?' selected':'')+'>Brouillon</option></select>'
    + '<div style="margin-top:16px;display:flex;gap:8px"><button type="submit" class="btn green">Enregistrer</button>'
    + '<button type="button" class="btn ghost" onclick="closeModal()">Annuler</button></div>'
    + '<div class="msg" id="af_msg"></div></form>';
}

function bindActu(){
  document.getElementById('newActu')?.addEventListener('click', ()=>{ openModal('Nouvelle actualité', actuForm()); bindActuForm(); });
  panel.querySelectorAll('.editActu').forEach(b=>b.addEventListener('click', ()=>{
    const a = (window.__actu||[]).find(x=>String(x.id)===b.dataset.id);
    openModal('Modifier l\'actualité', actuForm(a)); bindActuForm();
  }));
  panel.querySelectorAll('.delActu').forEach(b=>b.addEventListener('click', async ()=>{
    if(!confirm('Supprimer définitivement cette actualité (et ses photos) ?')) return;
    await api('/actualites.php', {method:'POST', body: JSON.stringify({op:'delete', id:Number(b.dataset.id)})});
    renderActualites();
  }));
  panel.querySelectorAll('.imgsActu').forEach(b=>b.addEventListener('click', ()=>{
    const a = (window.__actu||[]).find(x=>String(x.id)===b.dataset.id);
    openImagesModal(a);
  }));
}

function bindActuForm(){
  document.getElementById('actuForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const msg = document.getElementById('af_msg'); msg.className='msg'; msg.textContent='Enregistrement…';
    const payload = {
      op:'save',
      id: Number(document.getElementById('af_id').value)||0,
      titre: document.getElementById('af_titre').value,
      slug: document.getElementById('af_slug').value,
      categorie: document.getElementById('af_categorie').value,
      date_pub: document.getElementById('af_date').value,
      image: document.getElementById('af_image').value,
      resume: document.getElementById('af_resume').value,
      contenu: document.getElementById('af_contenu').value,
      statut: document.getElementById('af_statut').value
    };
    const d = await api('/actualites.php', {method:'POST', body: JSON.stringify(payload)});
    if(d.ok){ closeModal(); renderActualites(); }
    else { msg.className='msg err'; msg.textContent = (d.fields?Object.values(d.fields)[0]:'') || d.message || 'Échec.'; }
  });
}

function openImagesModal(a){
  let html = '<p style="color:#6b7280;font-size:13px">Plusieurs photos peuvent être associées à cette actualité.</p>';
  html += '<div id="imgList">';
  (a.images||[]).forEach(img=>{
    html += '<div class="imgrow"><img src="'+esc(img.url)+'" alt=""><span style="flex:1">'+esc(img.legende||img.url)+'</span>'
      + '<button class="btn danger sm rmImg" data-id="'+esc(img.id)+'">Retirer</button></div>';
  });
  if(!(a.images||[]).length){ html += '<p class="empty" style="padding:12px">Aucune photo.</p>'; }
  html += '</div><hr style="border:none;border-top:1px solid #e5e7eb;margin:14px 0">';
  html += '<label>Ajouter une photo (URL) *</label><input type="text" id="ai_url">'
    + '<label>Légende</label><input type="text" id="ai_legende">'
    + '<div style="margin-top:14px;display:flex;gap:8px"><button class="btn green" id="addImgBtn">Ajouter la photo</button>'
    + '<button class="btn ghost" onclick="closeModal()">Fermer</button></div><div class="msg" id="ai_msg"></div>';
  openModal('Photos — '+(a.titre||''), html);
  document.getElementById('addImgBtn').addEventListener('click', async ()=>{
    const msg=document.getElementById('ai_msg'); msg.className='msg'; msg.textContent='Ajout…';
    const d = await api('/actualites.php', {method:'POST', body: JSON.stringify({op:'add_image', actualite_id:a.id, url:document.getElementById('ai_url').value, legende:document.getElementById('ai_legende').value})});
    if(d.ok){ const fresh = await api('/actualites.php?id='+a.id); openImagesModal(fresh.item); await renderActualites(); }
    else { msg.className='msg err'; msg.textContent=(d.fields?Object.values(d.fields)[0]:'')||d.message||'Échec.'; }
  });
  modalRoot.querySelectorAll('.rmImg').forEach(b=>b.addEventListener('click', async ()=>{
    await api('/actualites.php', {method:'POST', body: JSON.stringify({op:'remove_image', image_id:Number(b.dataset.id)})});
    const fresh = await api('/actualites.php?id='+a.id); openImagesModal(fresh.item); await renderActualites();
  }));
}

/* ================= ÉVÉNEMENTS ================= */
async function renderEvenements(){
  panel.innerHTML = '<div class="empty">Chargement…</div>';
  const d = await api('/evenements.php');
  const items = d.items || [];
  let html = '<div class="section-head"><h3>Événements ('+items.length+')</h3>'
    + '<button class="btn green sm" id="newEv">Nouvel événement</button></div>';
  if (!items.length){ panel.innerHTML = html + '<div class="empty">Aucun événement.</div>'; bindEv(); return; }
  html += '<table><thead><tr><th>Date</th><th>Titre</th><th>Type</th><th>Lieu</th><th>Statut</th><th>Action</th></tr></thead><tbody>';
  for (const e of items){
    html += '<tr><td>'+esc(e.date_event||'')+' '+esc(e.heure||'')+'</td>'
      + '<td><strong>'+esc(e.titre)+'</strong></td><td>'+esc(e.type||'')+'</td><td>'+esc(e.lieu||'')+'</td>'
      + '<td>'+(e.statut==='upcoming'?'<span class="pill upcoming">à venir</span>':'<span class="pill past">passé</span>')+'</td>'
      + '<td class="row-actions"><button class="btn ghost sm editEv" data-id="'+esc(e.id)+'">Modifier</button>'
      + '<button class="btn danger sm delEv" data-id="'+esc(e.id)+'">Supprimer</button></td></tr>';
  }
  html += '</tbody></table>';
  panel.innerHTML = html; window.__ev = items; bindEv();
}

function evForm(e){
  e = e || {};
  return '<form id="evForm"><input type="hidden" id="ef_id" value="'+esc(e.id||'')+'">'
    + '<label>Titre *</label><input type="text" id="ef_titre" value="'+esc(e.titre||'')+'" required>'
    + '<div class="grid2"><div><label>Type</label><input type="text" id="ef_type" value="'+esc(e.type||'')+'"></div>'
    + '<div><label>Lieu</label><input type="text" id="ef_lieu" value="'+esc(e.lieu||'')+'"></div></div>'
    + '<div class="grid2"><div><label>Date</label><input type="date" id="ef_date" value="'+esc(e.date_event||'')+'"></div>'
    + '<div><label>Heure</label><input type="text" id="ef_heure" value="'+esc(e.heure||'')+'"></div></div>'
    + '<label>Image (URL)</label><input type="text" id="ef_image" value="'+esc(e.image||'')+'">'
    + '<label>Description</label><textarea id="ef_desc">'+esc(e.description||'')+'</textarea>'
    + '<label>Statut</label><select id="ef_statut"><option value="upcoming"'+(e.statut==='upcoming'?' selected':'')+'>À venir</option>'
    + '<option value="past"'+(e.statut==='past'?' selected':'')+'>Passé</option></select>'
    + '<div style="margin-top:16px;display:flex;gap:8px"><button type="submit" class="btn green">Enregistrer</button>'
    + '<button type="button" class="btn ghost" onclick="closeModal()">Annuler</button></div><div class="msg" id="ef_msg"></div></form>';
}

function bindEv(){
  document.getElementById('newEv')?.addEventListener('click', ()=>{ openModal('Nouvel événement', evForm()); bindEvForm(); });
  panel.querySelectorAll('.editEv').forEach(b=>b.addEventListener('click', ()=>{
    const e=(window.__ev||[]).find(x=>String(x.id)===b.dataset.id); openModal('Modifier l\'événement', evForm(e)); bindEvForm();
  }));
  panel.querySelectorAll('.delEv').forEach(b=>b.addEventListener('click', async ()=>{
    if(!confirm('Supprimer cet événement ?')) return;
    await api('/evenements.php', {method:'POST', body: JSON.stringify({op:'delete', id:Number(b.dataset.id)})});
    renderEvenements();
  }));
}
function bindEvForm(){
  document.getElementById('evForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const msg=document.getElementById('ef_msg'); msg.className='msg'; msg.textContent='Enregistrement…';
    const payload={ op:'save', id:Number(document.getElementById('ef_id').value)||0,
      titre:document.getElementById('ef_titre').value, type:document.getElementById('ef_type').value,
      lieu:document.getElementById('ef_lieu').value, date_event:document.getElementById('ef_date').value,
      heure:document.getElementById('ef_heure').value, image:document.getElementById('ef_image').value,
      description:document.getElementById('ef_desc').value, statut:document.getElementById('ef_statut').value };
    const d = await api('/evenements.php', {method:'POST', body: JSON.stringify(payload)});
    if(d.ok){ closeModal(); renderEvenements(); }
    else { msg.className='msg err'; msg.textContent=(d.fields?Object.values(d.fields)[0]:'')||d.message||'Échec.'; }
  });
}

/* ================= GALERIE ================= */
async function renderGalerie(){
  panel.innerHTML = '<div class="empty">Chargement…</div>';
  const d = await api('/galerie.php');
  const items = d.items || [];
  let html = '<div class="section-head"><h3>Galerie ('+items.length+')</h3>'
    + '<button class="btn green sm" id="newPic">Ajouter une photo</button></div>';
  if (!items.length){ panel.innerHTML = html + '<div class="empty">Aucune photo.</div>'; bindGal(); return; }
  html += '<table><thead><tr><th>Aperçu</th><th>Catégorie</th><th>Titre</th><th>Position</th><th>Action</th></tr></thead><tbody>';
  for (const g of items){
    html += '<tr><td><img class="thumb" src="'+esc(g.src)+'" alt=""></td>'
      + '<td>'+esc(g.categorie||'')+'</td><td>'+esc(g.titre||'')+'<br><span style="color:#6b7280">'+esc(g.contexte||'')+'</span></td>'
      + '<td>'+esc(g.position)+'</td>'
      + '<td class="row-actions"><button class="btn ghost sm editPic" data-id="'+esc(g.id)+'">Modifier</button>'
      + '<button class="btn danger sm delPic" data-id="'+esc(g.id)+'">Supprimer</button></td></tr>';
  }
  html += '</tbody></table>';
  panel.innerHTML = html; window.__gal = items; bindGal();
}
function picForm(g){
  g = g || {};
  return '<form id="picForm"><input type="hidden" id="pf_id" value="'+esc(g.id||'')+'">'
    + (g.id ? '' : '<label>Source de l\'image (URL) *</label><input type="text" id="pf_src" value="'+esc(g.src||'')+'">')
    + '<div class="grid2"><div><label>Catégorie</label><input type="text" id="pf_cat" value="'+esc(g.categorie||'')+'"></div>'
    + '<div><label>Position</label><input type="text" id="pf_pos" value="'+esc(g.position||0)+'"></div></div>'
    + '<label>Titre</label><input type="text" id="pf_titre" value="'+esc(g.titre||'')+'">'
    + '<label>Contexte</label><input type="text" id="pf_ctx" value="'+esc(g.contexte||'')+'">'
    + '<div style="margin-top:16px;display:flex;gap:8px"><button type="submit" class="btn green">Enregistrer</button>'
    + '<button type="button" class="btn ghost" onclick="closeModal()">Annuler</button></div><div class="msg" id="pf_msg"></div></form>';
}
function bindGal(){
  document.getElementById('newPic')?.addEventListener('click', ()=>{ openModal('Ajouter une photo', picForm()); bindPicForm(false); });
  panel.querySelectorAll('.editPic').forEach(b=>b.addEventListener('click', ()=>{
    const g=(window.__gal||[]).find(x=>String(x.id)===b.dataset.id); openModal('Modifier la photo', picForm(g)); bindPicForm(true);
  }));
  panel.querySelectorAll('.delPic').forEach(b=>b.addEventListener('click', async ()=>{
    if(!confirm('Supprimer cette photo ?')) return;
    await api('/galerie.php', {method:'POST', body: JSON.stringify({op:'delete', id:Number(b.dataset.id)})});
    renderGalerie();
  }));
}
function bindPicForm(isEdit){
  document.getElementById('picForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const msg=document.getElementById('pf_msg'); msg.className='msg'; msg.textContent='Enregistrement…';
    const base={ id:Number(document.getElementById('pf_id').value)||0,
      categorie:document.getElementById('pf_cat').value, titre:document.getElementById('pf_titre').value,
      contexte:document.getElementById('pf_ctx').value, position:Number(document.getElementById('pf_pos').value)||0 };
    let payload;
    if(isEdit){ payload=Object.assign({op:'update'}, base); }
    else { payload=Object.assign({op:'add', src:document.getElementById('pf_src').value}, base); delete payload.id; }
    const d = await api('/galerie.php', {method:'POST', body: JSON.stringify(payload)});
    if(d.ok){ closeModal(); renderGalerie(); }
    else { msg.className='msg err'; msg.textContent=(d.fields?Object.values(d.fields)[0]:'')||d.message||'Échec.'; }
  });
}

/* ================= MESSAGES ================= */
async function renderMessages(){
  panel.innerHTML = '<div class="empty">Chargement…</div>';
  const d = await api('/contacts.php');
  const items = d.items || [];
  let html = '<div class="section-head"><h3>Messages de contact ('+items.length+')</h3>'
    + '<a class="btn ghost sm" href="'+API+'/export.php?type=contacts">Exporter CSV</a></div>';
  if (!items.length){ panel.innerHTML = html + '<div class="empty">Aucun message.</div>'; return; }
  html += '<table><thead><tr><th>Date</th><th>Expéditeur</th><th>Sujet</th><th>Message</th><th>État</th><th>Action</th></tr></thead><tbody>';
  for (const c of items){
    html += '<tr><td>'+esc(c.created_at)+'</td>'
      + '<td>'+esc(c.nom)+'<br><span style="color:#6b7280">'+esc(c.email)+'</span></td>'
      + '<td>'+esc(c.sujet||'')+'</td>'
      + '<td><div style="max-width:320px">'+esc(c.message)+'</div></td>'
      + '<td>'+(Number(c.handled)?'<span class="pill handled">traité</span>':'<span class="pill pending">à traiter</span>')+'</td>'
      + '<td class="row-actions"><button class="btn ghost sm toggleHandled" data-id="'+esc(c.id)+'" data-h="'+(Number(c.handled)?0:1)+'">'
      + (Number(c.handled)?'Rouvrir':'Marquer traité')+'</button>'
      + '<button class="btn danger sm delMsg" data-id="'+esc(c.id)+'">Supprimer</button></td></tr>';
  }
  html += '</tbody></table>';
  panel.innerHTML = html;
  panel.querySelectorAll('.toggleHandled').forEach(btn=>btn.addEventListener('click', async ()=>{
    await api('/contacts.php', {method:'POST', body: JSON.stringify({op:'handle', id:Number(btn.dataset.id), handled:Number(btn.dataset.h)})});
    renderMessages();
  }));
  panel.querySelectorAll('.delMsg').forEach(btn=>btn.addEventListener('click', async ()=>{
    if(!confirm('Supprimer définitivement ce message (RGPD) ?')) return;
    await api('/contacts.php', {method:'POST', body: JSON.stringify({op:'delete', id:Number(btn.dataset.id)})});
    renderMessages();
  }));
}

/* ================= PARAMÈTRES ================= */
async function renderParametres(){
  panel.innerHTML = '<div class="empty">Chargement…</div>';
  const d = await api('/settings.php');
  const s = d.settings || {};
  let html = '<div class="section-head"><h3>Paramètres du site</h3></div><form id="setForm">'
    + '<label>Annonce (barre supérieure)</label><textarea id="s_annonce">'+esc(s.annonce||'')+'</textarea>'
    + '<div class="grid2"><div><label>Nom du directeur</label><input type="text" id="s_dnom" value="'+esc(s.directeur_nom||'')+'"></div>'
    + '<div><label>Photo du directeur (URL/chemin)</label><input type="text" id="s_dphoto" value="'+esc(s.directeur_photo||'')+'"></div></div>'
    + '<label>Mot / texte du directeur</label><textarea id="s_dtexte" style="min-height:160px">'+esc(s.directeur_texte||'')+'</textarea>'
    + '<div style="margin-top:16px"><button type="submit" class="btn green">Enregistrer</button></div>'
    + '<div class="msg" id="s_msg"></div></form>';
  panel.innerHTML = html;
  document.getElementById('setForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const msg=document.getElementById('s_msg'); msg.className='msg'; msg.textContent='Enregistrement…';
    const payload={ settings:{ annonce:document.getElementById('s_annonce').value,
      directeur_nom:document.getElementById('s_dnom').value, directeur_photo:document.getElementById('s_dphoto').value,
      directeur_texte:document.getElementById('s_dtexte').value }};
    const r = await api('/settings.php', {method:'POST', body: JSON.stringify(payload)});
    if(r.ok){ msg.className='msg ok'; msg.textContent='Paramètres enregistrés.'; }
    else { msg.className='msg err'; msg.textContent=r.message||'Échec.'; }
  });
}

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
