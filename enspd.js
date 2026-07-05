'use strict';
/* ── Configuration backend ENSPD (optionnel) ───────────────────────────
   Laisser apiBase='' = fonctionnement actuel (contenu géré en local).
   Renseigner l'URL du backend pour lire le contenu en base, ex :
   ENSPD_CONFIG.apiBase = 'backend-enspd/api';
   Les fonctions ENSPD_API.* sont fournies et prêtes à l'emploi (voir
   backend-enspd/README.md). Branchement laissé opt-in pour la stabilité. */
const ENSPD_CONFIG = { apiBase: '' };
const ENSPD_API = {
  async get(path){ if(!ENSPD_CONFIG.apiBase) return null; try{ const r=await fetch(ENSPD_CONFIG.apiBase+'/'+path); if(!r.ok) return null; return await r.json(); }catch(e){ return null; } },
  actualites(){ return this.get('actualites.php'); },
  evenements(){ return this.get('evenements.php'); },
  galerie(){ return this.get('galerie.php'); },
  settings(){ return this.get('settings.php'); },
  async contact(data){ if(!ENSPD_CONFIG.apiBase) return null; try{ const r=await fetch(ENSPD_CONFIG.apiBase+'/contact.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}); return await r.json(); }catch(e){ return null; } }
};
/* ================================================================
   ENSPD — JS v7 · DJOROD_CODING
   ================================================================ */

/* ── TRADUCTIONS ─────────────────────────────────────────── */
const LANG = {
  fr:{
    topbar_txt:'Concours ENSPD 2026-2027 — <strong>MESRS/DEC</strong> — Bac C ou D · Mention assez-bien requis',
    topbar_link:'Informations →', nav_univ:'Université de Parakou — Bénin',
    nav_home:'Accueil', nav_school:"A propos", nav_prog:'Formations', nav_adm:'Admissions',
    nav_research:'Recherche', nav_news:'Actualités', nav_events:' Vie Etudiante',
    nav_gallery:'Galerie', nav_contact:'Contact',
    btn_login:'Connexion', btn_register:"S'inscrire", btn_send:'Envoyer',
    hero_l1:'Former les experts', hero_l2:'qui pilotent', hero_l3:'le développement',
    hero_desc:"L'ENSPD est l'une des plus grandes écoles supérieures spécialisées en statistique, planification et démographie au Bénin. Nous formons des cadres capables de relever les défis du développement national et africain.",
    btn_adm:'Infos Concours 2026', btn_prog:'Nos formations →',
    ss1:'Étudiants 2024-25', ss2:'Formations LMD', ss3:'Laboratoires actifs', ss4:'Masters spécialisés',
    badge_t:'Excellence académique', badge_s:'Licence · Master · Doctorat',
    why_tag:"Pourquoi l'ENSPD ?", why_t:'Une école au service du développement',
    w1t:'Formation terrain', w1d:'Enquêtes réelles, stages INSAE, ministères et communes.',
    w2t:'Outils numériques', w2d:'R, Python, STATA, SPSS dans tous les cursus.',
    w3t:'Partenariats internationaux', w3d:'INSAE, Université Laval, Pan African University.',
    w4t:'Référence au Bénin', w4d:"L'ENSPD est l'une des plus grandes écoles spécialisées en statistique, planification et démographie au Bénin.",
    w5t:'Accès aux grandes écoles', w5d:'Nos diplômés intègrent ENSAE, ENSEA, ISSEA.',
    w6t:'Débouchés assurés', w6d:'Ministères, ONG, banques, agences ONU.',
    prog_tag:'Offres de formation', prog_t:'Choisissez votre parcours',
    prog_all:'Voir toutes les formations →',
    dir_tag:'Mot du Directeur',
    dir_q:"\"Chers étudiants, chers visiteurs, bienvenue sur le site officiel de l'ENSPD. Notre école forme des cadres compétents capables de piloter les projets de développement par la donnée et l'analyse. Ensemble, faisons de l'ENSPD un lieu d'excellence, d'éthique et d'impact pour le développement durable de notre continent.\"",
    dir_name:'Prof. Épiphane SODJINOU', dir_role:'Directeur · Ph.D. Économie Agricole, Univ. Copenhague',
    dir_more:'En savoir plus →',
    ev_tag:'Événements phares', ev_t:'Deux rendez-vous incontournables',
    jssed_ed:'2ème édition · Sep 2026',
    jssed_full:"Journées Scientifiques de la Statistique, de l'Évaluation et de la Démographie",
    jssed_desc:"Événement phare réunissant étudiants, enseignants, professionnels et partenaires.",
    news_tag:'Actualités', news_t:'Dernières nouvelles', news_all:'Toutes →',
    temo_tag:'Témoignages', temo_t:"Ils ont réussi depuis l'ENSPD",
    contact_h1:"Contactez l'ENSPD", contact_sub:'Notre équipe répond sous 48h ouvrables.',
    form_title:'Envoyer un message', info_title:'Informations pratiques',
    prog_h1:'Offres de formation', prog_h_sub:'Système LMD — 8 formations. Cliquez pour voir le programme.',
    adm_h1:"Intégrer l'ENSPD", sch_h1:"L'ENSPD en quelques mots",
    /* — Pages secondaires & navigation — */
    skip_link:'Aller au contenu principal', bc_home:'Accueil',
    pt_school_bc:"L'École", sch_h_sub:"Établissement public de formation, de recherche et d'appui au développement.",
    sch_hist:'Historique', sch_hist_t:'Une réponse au besoin de développement',
    hist_2012_lbl:'Juin 2012', hist_2012_d:"Création par arrêté ministériel n°256/MESRS — Campus Tchaourou, sous le parrainage du Pr. François Adébayo Abiola.",
    hist_2014_lbl:'Décembre 2014', hist_2014_d:"Création du LaReSPD par arrêté rectoral N°2335-2014/R-UP/VR-AARU.",
    hist_2016_lbl:'Novembre 2016', hist_2016_d:"Délocalisation vers le campus principal de l'Université de Parakou.",
    hist_today_lbl:'2016 — Aujourd\'hui', hist_today_d:"Création ODeSPoL, ouverture des Masters, rayonnement sous-régional croissant.",
    sch_mission:'Mission', sch_mission_d:"Établissement Public d'Enseignement, de Formation, de Recherche et d'appui au développement. L'une des 9 UFR de l'Université de Parakou. Deux Départements. 4 personnels ATS.",
    sch_vision:'Vision', sch_vision_d:"Devenir une école de référence nationale et sous-régionale en statistique, démographie et planification du développement.",
    sch_boys:'Garçons 2024-25', sch_girls:'Filles 2024-25',
    sch_org:'Organisation', sch_org_t:'Administration &amp; Services', sch_org_sub:"Structure organisée autour de la Direction et de 4 services opérationnels.",
    dir_role_long:"Directeur de l'ENSPD · Professeur · Ph.D. Économie Agricole, Université de Copenhague",
    dir_quote_long:"\"C'est avec une vive satisfaction que je vous présente l'ENSPD. Conçue pour accompagner chaque étudiant dans son parcours académique, l'ENSPD a pour mission de former des cadres compétents en statistique, planification, suivi-évaluation et démographie. Notre engagement : la rigueur, l'intégrité intellectuelle et la solidarité entre pairs. Ensemble, faisons de l'ENSPD un lieu d'excellence et d'impact pour le développement durable de notre pays.\"",
    rentree_t:'Rentrée Solennelle ENSPD',
    rentree_desc:"La 3ème édition (1er Déc 2025) était placée sous le thème <em>«L'IA au service de l'enseignement supérieur»</em>. La 4ème édition est prévue en décembre 2026.",
    en_savoir_plus:'En savoir plus', btn_dedicated:'Site dédié →',
    pt_form_bc:'Formations',
    prog_lmd:"<strong>Système LMD</strong> — 1 crédit = 20-25h · Licence = 6 semestres = 180 crédits · Master = 4 semestres = 120 crédits · Doctorat = 6 semestres = 180 crédits · Validation UE : note ≥ 12/20",
    prog_filt_all:'Tout (8)', prog_filt_lic:'Licence (2)', prog_filt_mas:'Master (5)', prog_filt_doc:'Doctorat (1)',
    deb_tag:'Débouchés', deb_t:'Où travaillent nos diplômés ?',
    pt_adm_bc:'Admissions', adm_sub:"Conditions d'entrée, paiement et documents officiels.",
    adm_alert_t:'Le concours est organisé par le MESRS',
    adm_alert_d:"L'admission à l'ENSPD se fait par concours organisé par le <strong>Ministère de l'Enseignement Supérieur (MESRS)</strong> via la Direction des Examens et Concours (DEC). Inscriptions sur <strong>apresmonbac.bj</strong>. L'ENSPD ne gère pas directement les inscriptions.",
    adm_cond:"Conditions d'accès", adm_pay:'Paiement des droits universitaires',
    adm_pay_sub:'Les droits se paient via la plateforme officielle du Trésor Public du Bénin.',
    adm_pay_info:"Plateforme : <strong>paiement.tresorbenin.bj</strong> · Compte ENSPD : <strong>01001 000001048692 20</strong> (BJ66 0010 0100 0001 0486 9220) · MTN / Moov / Carte bancaire",
    res_docs:'Demandes de documents officiels', res_docs_sub:"Toute demande est adressée manuscritement au Directeur, accompagnée des pièces requises.",
    pt_rec_bc:'Recherche', rec_h1:'Recherche &amp; Laboratoires', rec_sub:'Deux laboratoires actifs au service du développement local.', rec_partners:'Partenariats de recherche',
    pt_news_bc:'Actualités', news_h1:'Actualités ENSPD', news_sub:'Concours, soutenances, partenariats et événements.',
    nf_all:'Tout', nf_concours:'Concours', nf_event:'Événements', nf_jssed:'JSSED', nf_part:'Partenariats', nf_research:'Recherche', nf_innov:'Innovation',
    pt_agd_bc:'Agenda', events_h1:'Agenda ENSPD', events_sub:'JSSED, Rentrée solennelle, Portes Ouvertes.', events_next:'Prochains événements',
    pt_ctc_bc:'Contact',
    form_name:'Nom complet *', form_email:'Email *', form_subject:'Objet', form_msg:'Message *',
    info_addr:'Adresse', info_addr_v:'Université de Parakou, Bénin',
    info_email:'Email', info_up:"Université de Parakou", info_hours:'Horaires', info_hours_v:"Lun–Ven : 08h00–17h00<br>Scolarité : 08h–12h / 15h–17h<br>Fermé weekends &amp; jours fériés",
    btn_visit_bue:'Visiter le site BUE →',
    pt_legal_bc:'Mentions légales', legal_h1:'Mentions légales &amp; Confidentialité', legal_sub:'Informations légales, politique de confidentialité et gestion des cookies.',
    foot_desc:"École Nationale de Statistique, de Planification et de Démographie — Université de Parakou, Bénin. Fondée en 2012.",
    foot_h_school:"L'École", foot_about:'À propos', foot_dir:'Mot du Directeur', foot_labs:'Laboratoires', foot_agenda:'Agenda',
    foot_h_form:'Formation', foot_all_fil:'Toutes les filières', foot_pay:'Paiement droits', foot_apresbac:'Après mon Bac BJ',
    foot_h_links:'Liens utiles', foot_legal:'Mentions légales', foot_priv:'Politique de confidentialité', foot_cookies:'Gestion des cookies',
    foot_create:'Créer un compte', foot_copy:'© 2026 ENSPD — Université de Parakou, Bénin · Tous droits réservés',
    wel_t:"Bienvenue sur le site officiel de l'ENSPD",
    wel_sub:"École Nationale de Statistique, de Planification et de Démographie — Université de Parakou, Bénin",
    wel_visitor:'Visiteur', wel_visitor_d:'Parcourir librement le site',
    wel_create:'Créer un compte', wel_create_d:'Étudiant, enseignant, partenaire',
    wel_skip:'Continuer sans compte →',
    cookie_t:'Ce site utilise des cookies',
    cookie_d:' — Nous utilisons des cookies fonctionnels pour mémoriser vos préférences (thème, langue, connexion). Aucun cookie publicitaire ou de tracking.',
    cookie_more:'En savoir plus', cookie_reject:'Refuser', cookie_accept:'Accepter',
    btt_title:'Retour en haut',
    qa_concours:'Concours 2026-2027', qa_concours_s:'Conditions & inscriptions',
    qa_resultats:'Résultats & Actualités', qa_resultats_s:'Concours, examens, annonces',
    qa_formations:'8 Formations LMD', qa_formations_s:'Licence · Master · Doctorat',
    qa_contact:'Scolarité & Contact', qa_contact_s:'Lun–Ven · 08h–17h',
    part_tag:'Partenariats', part_t:'Nos partenaires institutionnels',
    faq_tag:'FAQ', faq_t:'Questions fréquentes sur les admissions',
    pub_tag:'Publications', pub_t:'Travaux scientifiques récents',
  },
  en:{
    topbar_txt:'ENSPD Entrance Exam 2026-2027 — <strong>MESRS/DEC</strong> — Bac C or D required',
    topbar_link:'Learn more →', nav_univ:'University of Parakou — Benin',
    nav_home:'Home', nav_school:'School', nav_prog:'Programs', nav_adm:'Admissions',
    nav_research:'Research', nav_news:'News', nav_events:'Events',
    nav_gallery:'Gallery', nav_contact:'Contact',
    btn_login:'Login', btn_register:'Sign up', btn_send:'Send',
    hero_l1:'Training experts', hero_l2:'who drive', hero_l3:'development',
    hero_desc:"ENSPD is the only higher education school specialized in statistics, planning and demography in Benin, training professionals for national and African development challenges.",
    btn_adm:'Admission Info 2026', btn_prog:'Our programs →',
    ss1:'Students 2024-25', ss2:'LMD Programs', ss3:'Active laboratories', ss4:'Specialized Masters',
    badge_t:'Academic excellence', badge_s:'Bachelor · Master · PhD',
    why_tag:'Why ENSPD?', why_t:'A school serving development',
    w1t:'Field training', w1d:'Real surveys, internships at INSAE, ministries and municipalities.',
    w2t:'Digital tools', w2d:'R, Python, STATA, SPSS integrated in all curricula.',
    w3t:'International partnerships', w3d:'INSAE, Laval University, Pan African University.',
    w4t:'Only in Benin', w4d:'ENSPD is the only school specialized in statistics and demography in Benin.',
    w5t:'Access to top schools', w5d:'Graduates join ENSAE, ENSEA, ISSEA.',
    w6t:'Guaranteed career paths', w6d:'Ministries, NGOs, banks, UN agencies.',
    prog_tag:'Programs', prog_t:'Choose your path',
    prog_sub:'2 Bachelors · 5 Masters · 1 PhD — click a program for the full curriculum.',
    prog_all:'View all programs →',
    dir_tag:"Director's Message",
    dir_q:"\"Dear students, dear visitors, welcome to the official ENSPD website. Our school trains competent professionals capable of driving development through data and analysis. Together, let us make ENSPD a place of excellence, ethics and impact.\"",
    dir_name:'Prof. Épiphane SODJINOU', dir_role:'Director · PhD Agricultural Economics, Univ. Copenhagen',
    dir_more:'Learn more →',
    ev_tag:'Signature events', ev_t:'Two unmissable appointments',
    jssed_ed:'2nd edition · Sep 2026',
    jssed_full:'Scientific Days of Statistics, Evaluation and Demography',
    jssed_desc:'Flagship event bringing together students, teachers, professionals and partners.',
    news_tag:'News', news_t:'Latest updates', news_all:'All news →',
    temo_tag:'Testimonials', temo_t:'They succeeded from ENSPD',
    contact_h1:'Contact ENSPD', contact_sub:'Our team responds within 48 working hours.',
    form_title:'Send a message', info_title:'Practical information',
    prog_h1:'Training programs', prog_h_sub:'LMD system — 8 programs. Click for full details.',
    adm_h1:'Join ENSPD', sch_h1:'ENSPD in brief',
    /* — Secondary pages & navigation — */
    skip_link:'Skip to main content', bc_home:'Home',
    pt_school_bc:'School', sch_h_sub:'Public institution for education, research and development support.',
    sch_hist:'History', sch_hist_t:'A response to development needs',
    hist_2012_lbl:'June 2012', hist_2012_d:"Created by ministerial decree n°256/MESRS — Tchaourou campus, under the patronage of Prof. François Adébayo Abiola.",
    hist_2014_lbl:'December 2014', hist_2014_d:"LaReSPD created by rectoral decree N°2335-2014/R-UP/VR-AARU.",
    hist_2016_lbl:'November 2016', hist_2016_d:"Relocated to the main campus of the University of Parakou.",
    hist_today_lbl:'2016 — Today', hist_today_d:"Creation of ODeSPoL, opening of Masters, growing sub-regional influence.",
    sch_mission:'Mission', sch_mission_d:"Public institution for Education, Training, Research and Development support. One of 9 UFRs at the University of Parakou. Two departments. 4 ATS staff.",
    sch_vision:'Vision', sch_vision_d:"To become a national and sub-regional reference school in statistics, demography and development planning.",
    sch_boys:'Boys 2024-25', sch_girls:'Girls 2024-25',
    sch_org:'Organization', sch_org_t:'Administration &amp; Services', sch_org_sub:'Structure organized around the Directorate and 4 operational services.',
    dir_role_long:"Director of ENSPD · Associate Professor · PhD Agricultural Economics, University of Copenhagen",
    dir_quote_long:"\"It is with great satisfaction that I present ENSPD. Designed to support each student in their academic journey, our mission is to train competent professionals in statistics, planning and demography. Our commitment: rigor, intellectual integrity and peer solidarity. Together, let us make ENSPD a place of excellence and impact for our continent's development.\"",
    rentree_t:'ENSPD Solemn Opening',
    rentree_desc:"The 3rd edition (Dec 1, 2025) was themed <em>«AI in higher education»</em>. The 4th edition is planned for December 2026.",
    en_savoir_plus:'Learn more', btn_dedicated:'Dedicated site →',
    pt_form_bc:'Programs',
    prog_lmd:"<strong>LMD System</strong> — 1 credit = 20-25h · Bachelor = 6 semesters = 180 credits · Master = 4 semesters = 120 credits · PhD = 6 semesters = 180 credits · Validation: grade ≥ 12/20",
    prog_filt_all:'All (8)', prog_filt_lic:'Bachelor (2)', prog_filt_mas:'Master (5)', prog_filt_doc:'PhD (1)',
    deb_tag:'Career paths', deb_t:'Where do our graduates work?',
    pt_adm_bc:'Admissions', adm_sub:'Entry requirements, payment and official documents.',
    adm_alert_t:'The entrance exam is organized by MESRS',
    adm_alert_d:"Admission to ENSPD is through an exam organized by the <strong>Ministry of Higher Education (MESRS)</strong> via the Exams and Competitions Directorate (DEC). Registration at <strong>apresmonbac.bj</strong>. ENSPD does not handle registrations directly.",
    adm_cond:'Entry requirements', adm_pay:'Payment of tuition fees',
    adm_pay_sub:'Fees are paid via the official Benin Public Treasury platform.',
    adm_pay_info:"Platform: <strong>paiement.tresorbenin.bj</strong> · ENSPD account: <strong>01001 000001048692 20</strong> (BJ66 0010 0100 0001 0486 9220) · MTN / Moov / Bank card",
    res_docs:'Official document requests', res_docs_sub:"All requests are addressed in writing to the Director, with required documents.",
    pt_rec_bc:'Research', rec_h1:'Research &amp; Laboratories', rec_sub:'Two active laboratories serving local development.', rec_partners:'Research partnerships',
    pt_news_bc:'News', news_h1:'ENSPD News', news_sub:'Competitions, defenses, partnerships and events.',
    nf_all:'All', nf_concours:'Competitions', nf_event:'Events', nf_jssed:'JSSED', nf_part:'Partnerships', nf_research:'Research', nf_innov:'Innovation',
    pt_agd_bc:'Agenda', events_h1:'ENSPD Agenda', events_sub:'JSSED, Solemn Opening, Open Days.', events_next:'Upcoming events',
    pt_ctc_bc:'Contact',
    form_name:'Full name *', form_email:'Email *', form_subject:'Subject', form_msg:'Message *',
    info_addr:'Address', info_addr_v:'University of Parakou, Benin',
    info_email:'Email', info_up:'University of Parakou', info_hours:'Opening hours', info_hours_v:"Mon–Fri: 08:00–17:00<br>Registrar: 08:00–12:00 / 15:00–17:00<br>Closed weekends &amp; public holidays",
    btn_visit_bue:'Visit BUE website →',
    pt_legal_bc:'Legal', legal_h1:'Legal notices &amp; Privacy', legal_sub:'Legal information, privacy policy and cookie management.',
    foot_desc:'National School of Statistics, Planning and Demography — University of Parakou, Benin. Founded in 2012.',
    foot_h_school:'School', foot_about:'About', foot_dir:"Director's message", foot_labs:'Laboratories', foot_agenda:'Agenda',
    foot_h_form:'Programs', foot_all_fil:'All programs', foot_pay:'Tuition payment', foot_apresbac:'After my Bac BJ',
    foot_h_links:'Useful links', foot_legal:'Legal notices', foot_priv:'Privacy policy', foot_cookies:'Cookie settings',
    foot_create:'Create account', foot_copy:'© 2026 ENSPD — University of Parakou, Benin · All rights reserved',
    wel_t:'Welcome to the official ENSPD website',
    wel_sub:'National School of Statistics, Planning and Demography — University of Parakou, Benin',
    wel_visitor:'Visitor', wel_visitor_d:'Browse the site freely',
    wel_create:'Create account', wel_create_d:'Student, teacher, partner',
    wel_skip:'Continue without account →',
    cookie_t:'This site uses cookies',
    cookie_d:' — We use functional cookies to remember your preferences (theme, language, session). No advertising or tracking cookies.',
    cookie_more:'Learn more', cookie_reject:'Decline', cookie_accept:'Accept',
    btt_title:'Back to top',
    qa_concours:'Entrance Exam 2026-2027', qa_concours_s:'Requirements & registration',
    qa_resultats:'Results & News', qa_resultats_s:'Exams, admissions, announcements',
    qa_formations:'8 LMD Programs', qa_formations_s:'Bachelor · Master · Doctorate',
    qa_contact:'Registrar & Contact', qa_contact_s:'Mon–Fri · 8am–5pm',
    part_tag:'Partnerships', part_t:'Our institutional partners',
    faq_tag:'FAQ', faq_t:'Frequently asked questions about admissions',
    pub_tag:'Publications', pub_t:'Recent scientific works',
  }
};

/* ── DONNÉES ─────────────────────────────────────────────── */
const D = {
  filieres:[
    {id:1,sigle:'SA',niveau:'Licence',duree:'3 ans (Bac+3)',
     nom:'Statistique Appliquée',
     objectif:"Former des Techniciens Supérieurs en Statistique Appliquée capables de collecter, analyser et interpréter des données pour l'aide à la décision. Formation alliant théorie statistique rigoureuse et outils informatiques modernes.",
     admission:"Concours MESRS/DEC — Baccalauréat séries C ou D requis. Mention Assez-Bien minimum. Inscriptions sur apresmonbac.bj.",
     competences:['Collecte et traitement de données','Analyse statistique descriptive et inférentielle','R, Python, STATA, SPSS','Enquêtes et sondages','Aide à la décision par les données'],
     programme:[
       {s:'L1 — Semestres 1&2',ues:['Mathématiques (Analyse, Algèbre)','Statistique descriptive','Probabilités','Informatique (R, Excel)','Démographie générale','Anglais académique']},
       {s:'L2 — Semestres 3&4',ues:['Inférence statistique','Sondage & Échantillonnage','Bases de données','STATA / SPSS','Économétrie de base','Stage terrain 6 semaines']},
       {s:'L3 — Semestres 5&6',ues:['Analyse multivariée','Séries chronologiques','Python pour la data','Statistiques agricoles','Stage professionnel 8 semaines','Mémoire de fin d\'études']},
     ],
     debouches:['Chef service statistique (ministères, communes)','Data Analyst / Statisticien','Gestionnaire bases de données','Grandes écoles sous-régionales (ENSAE, ENSEA, ISSEA)'],
     persp:['Master SSD','Master SAAV','Master SESA','Pan African University']},

    {id:2,sigle:'PSE',niveau:'Licence',duree:'3 ans (Bac+3)',
     nom:'Planification & Suivi-Évaluation',
     objectif:"Former des professionnels capables de planifier des opérations (projets, programmes, politiques) et d'opérationnaliser des dispositifs de suivi-évaluation dans un contexte de développement.",
     admission:"Concours MESRS/DEC — Baccalauréat séries C ou D requis. Mention Assez-Bien minimum.",
     competences:['Planification du développement local','Cadre logique & théorie du changement','Suivi-évaluation de projets','Outils de collecte (ODK, KoboToolbox)','Rapports bailleurs (BM, UE, PNUD)'],
     programme:[
       {s:'L1 — Semestres 1&2',ues:['Introduction à la planification','Économie du développement','Statistiques appliquées','Informatique & bureautique','Gouvernance et décentralisation']},
       {s:'L2 — Semestres 3&4',ues:['Suivi-évaluation de projets','Cadre logique & indicateurs','Méthodes qualitatives','Analyse territoriale','Stage terrain 6 semaines']},
       {s:'L3 — Semestres 5&6',ues:['Évaluation d\'impact','SIG & cartographie','Planification stratégique','Financement du développement','Stage professionnel 8 semaines','Mémoire']},
     ],
     debouches:['Planificateur / Chef planificateur','Expert Suivi-Évaluateur (ONG, ONU)','Chef de projets & programmes','Consultant développement international'],
     persp:['Master SE-MP','Master SILPD','Master SSD','Système des Nations Unies']},

    {id:3,sigle:'SSD',niveau:'Master',duree:'2 ans (Bac+5)',
     nom:'Statistiques Sociales et Démographiques',
     objectif:"Analyser les dynamiques de population et concevoir des politiques sociales éclairées. Formation avancée en démographie, méthodes mixtes et statistiques sociales pour les institutions nationales et internationales.",
     admission:"Étude de dossier — Licence SA, PSE, Économie, Mathématiques ou équivalent. Lettre de motivation requise.",
     competences:['Démographie avancée & projections','Analyse des enquêtes démographiques (EDS, RGPH)','Méthodes mixtes (quantitatives & qualitatives)','Modèles de régression et de survie','Politique sociale et genre'],
     programme:[
       {s:'M1 — Semestres 1&2',ues:['Démographie formelle avancée','Méthodes statistiques avancées','Sociologie de la population','Analyse de survie','Santé de la reproduction']},
       {s:'M2 — Semestres 3&4',ues:['Mémoire de recherche','Stage en institution (INSAE, OMS…)','Politiques sociales & genre','Analyse territoriale avancée','Soutenance']},
     ],
     debouches:['Démographe (INSAE, INS nationaux)','Analyste politique sociale (UNICEF, OMS)','Chercheur universitaire','Expert population (ONU)'],
     persp:['Doctorat LaReSPD','Pan African University','ODSEF Université Laval (Canada)']},

    {id:4,sigle:'SAAV',niveau:'Master',duree:'2 ans (Bac+5)',
     nom:"Statistique Appliquée à l'Agriculture et aux Vivants",
     objectif:"Spécialisation en biostatistique, épidémiologie et statistiques agricoles pour les organismes de santé, agriculture et nutrition.",
     admission:"Étude de dossier — Licence SA, Agronomie, Biologie, Mathématiques ou équivalent.",
     competences:['Biostatistique & plans d\'expériences','Épidémiologie & surveillance sanitaire','R Bioconductor & SAS','Essais cliniques','Nutrition & sécurité alimentaire'],
     programme:[
       {s:'M1 — Semestres 1&2',ues:['Biostatistique avancée','Épidémiologie','Plans d\'expériences','SAS & R avancé','Économie de la santé']},
       {s:'M2 — Semestres 3&4',ues:['Mémoire de recherche','Stage (INSAE, CHU, ONG santé)','Évaluation d\'impact en agriculture','Soutenance']},
     ],
     debouches:['Biostatisticien (CHU, Ministère Santé)','Épidémiologiste (OMS, USAID)','Statisticien agricole (FAO, MAEP)','Chercheur en santé publique'],
     persp:['Doctorat éco-agronomie','Bourse OMS Afrique']},

    {id:5,sigle:'SESA',niveau:'Master',duree:'2 ans (Bac+5)',
     nom:'Statistiques Économiques et Sciences Actuarielles',
     objectif:"Finance quantitative, actuariat et gestion des risques pour les banques, assurances et marchés financiers de la zone UEMOA.",
     admission:"Étude de dossier — Licence SA, Économie, Mathématiques, Finance ou équivalent.",
     competences:['Actuariat vie & non-vie','Gestion des risques financiers','Modèles stochastiques','Python Finance','Normes IFRS & Solvabilité II'],
     programme:[
       {s:'M1 — Semestres 1&2',ues:['Mathématiques financières avancées','Actuariat & assurances','Économétrie financière','Gestion de portefeuille']},
       {s:'M2 — Semestres 3&4',ues:['Mémoire (sujet actuariel)','Stage banque/assurance','Gestion des risques opérationnels','Soutenance']},
     ],
     debouches:['Actuaire (compagnies d\'assurance)','Risk Manager (banques)','Analyste financier','Économiste (BCEAO, FMI)'],
     persp:['Africa Business School UM6P Maroc','Certification CIMA/ACCA']},

    {id:6,sigle:'SE-MP',niveau:'Master',duree:'2 ans (Bac+5)',
     nom:'Suivi-Évaluation et Management des Projets',
     objectif:"Formation avancée pour les professionnels de la gestion de projets, ONG et institutions internationales selon les standards GCP et Logframe.",
     admission:"Étude de dossier — Licence PSE, Économie, Gestion, Sciences Sociales ou équivalent.",
     competences:['Gestion du cycle de projet (GCP)','Cadre logique avancé & TOC','Rapports bailleurs (UE, BM, USAID)','Évaluation d\'impact avec contrefactuel','Management multiculturel'],
     programme:[
       {s:'M1 — Semestres 1&2',ues:['Management stratégique de projets','Évaluation d\'impact avancée','Systèmes d\'information S&E','Leadership & Management']},
       {s:'M2 — Semestres 3&4',ues:['Mémoire professionnel','Stage (ONG, bailleur)','Gestion financière de projets','Soutenance']},
     ],
     debouches:['Expert S&E senior (PNUD, UE, USAID)','Chef de projet ONG internationale','Coordinateur national de programme','Consultant développement international'],
     persp:['Bourse Erasmus+ Afrique','Certification PMD Pro / PMP']},

    {id:7,sigle:'SILPD',niveau:'Master',duree:'2 ans (Bac+5)',
     nom:"Système d'Information Locale et Planification du Développement",
     objectif:"Planification communale, systèmes d'information pour le développement local et la décentralisation au Bénin.",
     admission:"Étude de dossier — Licence PSE, Géographie, Urbanisme, Sciences Sociales ou équivalent.",
     competences:['SIG & cartographie participative','Plans de Développement Communal (PDC)','Décentralisation & gouvernance locale','Bases de données territoriales','Financement du développement local'],
     programme:[
       {s:'M1 — Semestres 1&2',ues:['SIG & cartographie','Gouvernance locale & décentralisation','Planification communale','Finances locales']},
       {s:'M2 — Semestres 3&4',ues:['Mémoire (cas d\'une commune)','Stage mairie / ANPE / préfecture','Développement économique local','Soutenance']},
     ],
     debouches:['Planificateur communal (mairies)','Expert décentralisation (ANPE, MIMAT)','Chargé développement local','Consultant territorial'],
     persp:['Doctorat géographie du développement','Partenariat GIZ / AFD']},

    {id:8,sigle:'DOC',niveau:'Doctorat',duree:'3 ans min. (Bac+8)',
     nom:'Doctorat en Population et Ressources Naturelles',
     objectif:"Formation doctorale rattachée à l'École Doctorale «Agronomie et Eau» de l'Université de Parakou. Vise à former des chercheurs de haut niveau en démographie et statistiques socioéconomiques.",
     admission:"Sur dossier — Master en domaine connexe. Direction : Prof. Épiphane SODJINOU. École Doctorale «Agronomie et Eau» de l'UP.",
     competences:['Recherche scientifique avancée','Rédaction articles peer-reviewed','Méthodologie de recherche','Direction de travaux','Partenariats scientifiques internationaux'],
     programme:[
       {s:'Phase 1 — Années 1-2',ues:['Séminaires de recherche avancée','Revue de littérature approfondie','Collecte de données terrain','Présentation au LaReSPD']},
       {s:'Phase 2 — Année 3+',ues:['Rédaction de la thèse','Publications scientifiques','Conférences internationales','Soutenance devant jury']},
     ],
     debouches:['Enseignant-Chercheur (Universités)','Expert ONU / Banque Mondiale','Chercheur senior (INSAE)','Directeur d\'études INS'],
     persp:['Bourse ACBF','ODSEF Université Laval','Chaire de recherche UEMOA']},
  ],

  actualites:[
    {id:1,cat:'Concours',date:'Avr 2026',img:'',
     titre:"Concours Licence 2026-2027 — Informations MESRS",
     texte:`Le concours d'entrée en Licence à l'ENSPD est organisé par le Ministère de l'Enseignement Supérieur et de la Recherche Scientifique (MESRS) via la Direction des Examens et Concours (DEC).

Conditions d'accès :
• Baccalauréat séries C ou D requis
• Mention Assez-Bien minimum
• Inscription sur la plateforme officielle : apresmonbac.bj

Les candidats sont invités à se rapprocher des services du MESRS pour les modalités précises d'inscription et les dates du concours. L'ENSPD accueille les admis à la rentrée académique suivant les résultats publiés.`},

    {id:2,cat:'Événement',date:'Déc 2025',img:'assets/galerie/enspd/rentree_1775854492374.jpg',
     titre:"3ème Rentrée Solennelle — L'IA au service de l'apprentissage",
     texte:`La 3ème édition de la rentrée solennelle de l'ENSPD s'est tenue le lundi 1er décembre 2025 à l'Amphithéâtre B de l'Université de Parakou. La cérémonie a été présidée par le Professeur Thierry Adoukonou, représentant le Recteur.

En présence du Directeur Prof. Épiphane Sodjinou et du Vice-Recteur chargé de la recherche, cette rentrée était placée sous le thème :

« Intelligence artificielle au service de l'enseignement supérieur : ressources accessibles et pratiques pour soulager l'apprentissage chez les étudiants »

Le Directeur a insisté sur la nécessité d'accompagner les étudiants dans une utilisation responsable et éclairée de l'IA, plutôt que de l'interdire. Plusieurs communications ont été présentées, notamment sur les règlements pédagogiques et le système LMD.`},

    {id:3,cat:'JSSED',date:'Sep 2025',img:'assets/galerie/bue/jssed_1775853364124.jpg',
     titre:"JSSED 1ère édition — Un succès retentissant",
     texte:`La première édition des Journées Scientifiques de la Statistique, de l'Évaluation et de la Démographie (JSSED) a été organisée par l'ENSPD en 2025 à l'Université de Parakou.

Au programme :
• Conférences animées par des professionnels du secteur
• Ateliers pratiques sur les outils de collecte de données
• Concours inter-étudiants d'analyse de données
• Session de networking avec les anciens diplômés

L'événement a mobilisé plus de 200 participants. La 2ème édition est prévue pour septembre 2026.`},

  ],

  temos:[
    {init:'AE',nom:'Ancienne étudiante ENSPD',promo:'Master PAUSTI Kenya — Promo 2016',
     texte:"J'ai étudié à l'ENSPD où j'ai obtenu ma licence en statistique appliquée. La rigueur apprise là-bas m'a ouvert les portes d'une bourse de la Pan African University pour un master à PAUSTI au Kenya. L'ENSPD transforme vraiment les destins."},
    {init:'GM',nom:'Gariya Jédida MOUSSA SOUROKOU',promo:'Master Financial Engineering UM6P Maroc — Promo 2019',
     texte:"Mon socle pour accéder au Financial Engineering, je l'ai construit à l'ENSPD. Les trois années passées ont été exigeantes mais extraordinairement enrichissantes. Je suis aujourd'hui en Master à l'Africa Business School de l'UM6P à Rabat."},
    {init:'DP',nom:'Diplômé en Planification',promo:'Consultant ONG Internationale — Promo 2018',
     texte:"La formation en Planification m'a donné les outils pour accompagner des projets de développement concrets. L'approche pratique de l'ENSPD m'a parfaitement préparé à mes fonctions de consultant pour une agence internationale."},
    {init:'RY',nom:'Ingénieur des Travaux Statistiques',promo:'INSAE Bénin — Promo 2016',
     texte:"Grâce à l'ENSPD, j'ai pu préparer et réussir le concours d'ingénieur des travaux statistiques dès la première tentative. Les bases solides acquises en statistiques et outils informatiques m'ont été indispensables."},
  ],

  admin:[
    {ico:'',titre:'Direction',nom:'Prof. Épiphane SODJINOU',isDir:true,role:"Directeur de l\'ENSPD depuis 2024.",
     desc:'Ph.D. Économie Agricole, Université de Copenhague. '},
    {ico:'',titre:'Secrétariat Général',nom:'',role:'Secrétaire Général(e)',
     desc:'Organisation des activités administratives, coordination des services.'},
    {ico:'',titre:'Secrétariat Administratif',nom:'',role:'Cheffe Division',
     desc:'Réception des courriers, rédaction, gestion documentaire.'},
    {ico:'',titre:'Scolarité & Examens',nom:'',role:'Cheffe Division Scolarité',
     desc:'Organisation des examens, inscriptions, rapports de stages.'},
    {ico:'',titre:'Service Comptable',nom:'',role:'Chef Service Comptable',
     desc:'Comptabilité générale, gestion budgétaire de l\'entité.'},
    {ico:'',titre:'Département de la Statistique Appliquée',nom:'Dr François KOLADJO',role:'Chef de Département',
     desc:"Pilotage pédagogique et scientifique de la filière Statistique Appliquée."},
    {ico:'',titre:'Planification et Suivi-Évaluation',nom:'Dr Georges DJOHY',role:'Chef de Département',
     desc:"Pilotage pédagogique de la filière Planification et Suivi-Évaluation."},
    {ico:'',titre:'Coordination des Masters',nom:'Dr Justin DANSOU',role:'Coordinateur Master',
     desc:"Coordination des programmes de Master de l'ENSPD."},
  ],

  labos:[
    {sigle:'LaReSPD',annee:'2014',
     titre:'Laboratoire de Recherche en Sciences de la Population et du Développement',
     desc:"Recherches sur la dynamique des populations, santé reproductive, scolarisation et dynamiques économiques locales. Partenaires : INSAE, ODSEF Laval (Canada), APSOHA. Arrêté rectoral N°2335-2014.",
     col:'#2EAA38',bg:'#E4F5E6'},
    {sigle:'ODeSPoL',annee:'2016',
     titre:'Observatoire Démographique et Statistique des Populations Locales',
     desc:"Centre de production de données statistiques locales. Interface entre recherche académique et besoins des communes béninoises. Ambition : centre d'excellence sous-régional.",
     col:'#1B1E6E',bg:'#E6E7F5'},
  ],

  partners:['INSAE — Bénin','ODSEF — Univ. Laval (Canada)','APSOHA — Afrique francophone','Pan African University','UEMOA'],

  steps:[
    {n:'01',titre:'Plateforme officielle',desc:'Ouvrir paiement.tresorbenin.bj dans un navigateur'},
    {n:'02',titre:'Rubrique versement',desc:'Cliquer sur « Versement / Dépôt sur compte au Trésor »'},
    {n:'03',titre:'Numéro de compte',desc:'N° : 01001 000001048692 20 — Vérifier intitulé : ENSPD / UP'},
    {n:'04',titre:'Paiement & Quittance',desc:"MTN/Moov ou carte bancaire — Imprimer l'e-quittance obligatoirement"},
  ],

  cond:[
    {titre:'Licence 1ère année',desc:"Concours MESRS/DEC — Baccalauréat séries <strong>C ou D</strong> requis. Mention Assez-Bien minimum. Inscriptions sur apresmonbac.bj.",col:'#2EAA38'},
    {titre:'Master (sur dossier)',desc:"Licence Professionnelle en Statistique, en Planification, en Science Economiques ou de Gestion, en Agronomie, en Mathématiques, en Démographie, en Finance, Maîtrise en Sciences Économiques ou tout autre diplôme reconnu équivalent.",col:'#E8960A'},
    {titre:'Doctorat (sur dossier)',desc:"Master en domaine connexe. École Doctorale «Agronomie et Eau» de l'UP. Direction : Prof. Épiphane SODJINOU.",col:'#1B1E6E'},
  ],

  docs:[
    {t:"Attestation d'inscription",p:"Demande manuscrite · Copie carte étudiant · Quittance 2 000 F · Fiche de renseignement"},
    {t:"Relevé de notes",p:"Demande manuscrite · Copie carte étudiant · Quittance 5 000 F · Fiche de renseignement"},
    {t:"Certificat de scolarité",p:"Demande manuscrite · Copie carte étudiant · Quittance · Fiche de renseignement"},
    {t:"Attestation de succès",p:"Demande manuscrite · Copie carte étudiant · Quittance · Fiche de renseignement · Relevés de notes"},
    {t:"Attestation de diplôme",p:"Demande · Carte étudiant · Quittance · Relevés de notes · 3 copies mémoire · Copie page certification"},
    {t:"Demande de mise en stage",p:"Lettre au Directeur avec lieu et période de stage — Déposer au moins 5 jours avant le départ"},
  ],

  events:[
    {j:'',m:'',titre:'',type:'',heure:'',
     lieu:'',
     desc:'',
     detail:''},
    
  ],

  /* Galerie organisée par catégories */
  galerie:{
    'Campus':[
      {src:'assets/campus/batiment_enspd.jpg',titre:'Bâtiment ENSPD',ev:'Campus UP'},
      {src:'assets/campus/batiment-01.jpg',titre:'Entrée principale',ev:'Campus UP'},
      {src:'assets/campus/batimentENSPD.jpeg',titre:'Façade ENSPD',ev:'Campus UP'},
      {src:'assets/campus/groupe-5.jpg',titre:'Étudiants sur le campus',ev:'Vie étudiante'},
      {src:'assets/campus/photo_groupe.jpg',titre:'Photo de famille',ev:'Séance intégration Oct 2025'},
    ],
    'Rentrée Solennelle':[
      {src:'assets/galerie/enspd/rentree_1775854492374.jpg',titre:'Rentrée solennelle',ev:'3ème édition — Déc 2025'},
      {src:'assets/galerie/enspd/rentree_1775854494083.jpg',titre:'Discours du Directeur',ev:'3ème édition — Déc 2025'},
      {src:'assets/galerie/enspd/rentree_1775854499589.jpg',titre:'Amphi principal',ev:'3ème édition — Déc 2025'},
    ],
    'Soutenances':[
      {src:'assets/galerie/enspd/soutenance1.jpg',titre:'Soutenance de mémoire',ev:'Master ENSPD'},
      {src:'assets/galerie/enspd/soutenance2.jpg',titre:'Présentation mémoire',ev:'Master ENSPD'},
      {src:'assets/galerie/enspd/soutenance3.jpg',titre:'Jury de soutenance',ev:'Master ENSPD'},
      {src:'assets/galerie/enspd/soutenance4.jpg',titre:'Remise de diplôme',ev:'Master ENSPD'},
    ],
    'Cours & TP':[
      {src:'assets/galerie/enspd/cours_1775854350217.jpg',titre:'Cours magistral L1',ev:'Rentrée 2025-2026'},
      {src:'assets/galerie/enspd/cours_1775854359604.jpg',titre:'Cours en salle',ev:'Rentrée 2025-2026'},
      {src:'assets/galerie/enspd/cours_1775854367847.jpg',titre:'TP Informatique',ev:'Rentrée 2025-2026'},
      {src:'assets/galerie/enspd/cours_1775854369084.jpg',titre:'TD en groupe',ev:'Rentrée 2025-2026'},
    ],
    'Café Science':[
      {src:'assets/galerie/enspd/cafe_sci_IMG-20260408-WA0031.jpg',titre:'Café Science',ev:'Avec le Directeur — Avr 2026'},
      {src:'assets/galerie/enspd/cafe_sci_IMG-20260408-WA0032.jpg',titre:'Échanges scientifiques',ev:'Avr 2026'},
      {src:'assets/galerie/enspd/cafe_sci_IMG-20260408-WA0033.jpg',titre:'Networking scientifique',ev:'Avr 2026'},
    ],
    'JBE':[
      {src:'assets/galerie/enspd/jbe1.jpg',titre:'JBE 2025',ev:'Journée Bien-Être'},
      {src:'assets/galerie/enspd/jbe2.jpg',titre:'JBE 2025',ev:'Activités sportives'},
      {src:'assets/galerie/enspd/jbe3.jpg',titre:'JBE 2025',ev:'Cohésion étudiante'},
    ],
    'JSSED':[
      {src:'assets/campus/JSSED_2.jpeg',titre:'JSSED 1ère édition',ev:'Septembre 2025'},
      {src:'assets/galerie/bue/jssed_1775853366762.jpg',titre:'JSSED — Ateliers',ev:'Septembre 2025'},
      {src:'assets/galerie/bue/jssed_1775853368864.jpg',titre:'JSSED — Conférences',ev:'Septembre 2025'},
    ],
  },

  faq: [
    { q: "Qui organise le concours d'entrée à l'ENSPD ?",
      r: "Le concours est organisé par le Ministère de l'Enseignement Supérieur (MESRS) via la Direction des Examens et Concours (DEC). Les inscriptions se font sur apresmonbac.bj. L'ENSPD ne gère pas directement les inscriptions au concours." },
    { q: "Quel Bac est requis pour intégrer l'ENSPD ?",
      r: "Pour la Licence, un Bac C ou D (série scientifique) est requis. Pour les Masters, un diplôme de Licence dans un domaine compatible (statistique, mathématiques, économie, démographie) est nécessaire." },
    { q: "Quand sont publiés les résultats du concours ?",
      r: "Les résultats sont publiés par le MESRS/DEC généralement entre juillet et septembre. Ils sont accessibles sur apresmonbac.bj et affichés à l'ENSPD. L'ENSPD publie également les résultats dans la section Actualités de ce site." },
    { q: "Comment payer les droits universitaires ?",
      r: "Le paiement se fait uniquement via la plateforme officielle paiement.tresorbenin.bj. Compte ENSPD : 01001 000001048692 20. Moyens acceptés : MTN Mobile Money, Moov Money, carte bancaire. Conservez absolument le reçu." },
    { q: "Peut-on déposer une demande de document (attestation, relevé) par email ?",
      r: "Non. Toutes les demandes de documents officiels (attestation d'inscription, relevé de notes, mise en stage) doivent être adressées manuscritement au Directeur de l'ENSPD, accompagnées des pièces justificatives requises, et déposées à la scolarité." },
    { q: "L'ENSPD propose-t-il des bourses ou aides financières ?",
      r: "Des bourses nationales sont accessibles via le MESRS. Des opportunités de bourses internationales (FAO, UNFPA, BAD) sont régulièrement partagées dans la section Actualités du site." },
    { q: "Peut-on travailler après une Licence à l'ENSPD ?",
      r: "Oui. Les diplômés de Licence SA ou PSE peuvent intégrer la fonction publique (INSAE, MAEP, collectivités) ou le secteur privé. La poursuite en Master est fortement conseillée pour évoluer vers des postes de cadre supérieur." },
    { q: "Comment rejoindre le BUE ou le CRISTAL ?",
      r: "Le BUE est le bureau d'union des étudiants, élu démocratiquement. Le CRISTAL est l'association scientifique avec 4 sections (Informatique, Anglais, Art & Dev Personnel, Science Fondamentale). Contactez directement le Bureau d'Union des Étudiants (BUE) ou la coordination de l'association CRISTAL." },
  ],

  publications: [
    { titre: "Analyse des déterminants de la pauvreté multidimensionnelle au Bénin", auteurs: "SODJINOU É., DOSSOU-GBÉTÉ S.", annee: "2024", labo: "LaReSPD", type: "Article", url: "" },
    { titre: "Modélisation de la mortalité infantile dans les zones rurales du nord Bénin", auteurs: "OROU BATA H., KPADONOU G.", annee: "2024", labo: "ODeSPoL", type: "Article", url: "" },
    { titre: "Estimation par sondage des ménages vulnérables — Enquête Borgou 2023", auteurs: "GBAGUIDI A. et al.", annee: "2023", labo: "LaReSPD", type: "Rapport", url: "" },
    { titre: "Urbanisation et structures démographiques au Bénin : tendances 2013–2023", auteurs: "DOSSOU T., SODJINOU É.", annee: "2023", labo: "ODeSPoL", type: "Article", url: "" },
    { titre: "Impact de la numérisation sur les systèmes statistiques nationaux en Afrique subsaharienne", auteurs: "OROU BATA H., KPADONOU G., DOSSOU-GBÉTÉ S.", annee: "2022", labo: "LaReSPD", type: "Article", url: "" },
  ],

  partnerLogos: [
    { nom: "INSAE", full: "Institut National de la Statistique et de l'Analyse Économique", icon: "", color: "#1B1E6E" },
    { nom: "MAEP", full: "Ministère de l'Agriculture, de l'Élevage et de la Pêche", icon: "", color: "#2E7D32" },
    { nom: "FAO", full: "Organisation des Nations Unies pour l'Alimentation et l'Agriculture", icon: "", color: "#3CB944" },
    { nom: "UNFPA", full: "Fonds des Nations Unies pour la Population", icon: "", color: "#00BCD4" },
    { nom: "Univ. Parakou", full: "Université de Parakou", icon: "", color: "#1B1E6E" },
    { nom: "BAD", full: "Banque Africaine de Développement", icon: "", color: "#F0A500" },
    { nom: "PNUD", full: "Programme des Nations Unies pour le Développement", icon: "", color: "#0066CC" },
    { nom: "MESRS", full: "Ministère de l'Enseignement Supérieur et de la Recherche Scientifique", icon: "", color: "#C0392B" },
  ],

  debouches:['Instituts Nationaux de Statistique','Ministères & Directions','Banques & Assurances',
    'ONG & Agences ONU','Universités & Recherche','Cabinets de conseil','Communes & Mairies','Organisations humanitaires'],

  why:[
    {k:'w1t',d:'w1d',ico:''},{k:'w2t',d:'w2d',ico:''},
    {k:'w3t',d:'w3d',ico:''},{k:'w4t',d:'w4d',ico:''},
    {k:'w5t',d:'w5d',ico:''},{k:'w6t',d:'w6d',ico:''},
  ],
};

/* ── ADMIN DATA PERSISTENCE & LOGGING ────────────────────── */
const _adminDataKey = 'enspd_admin_data_v1';
const _adminLogsKey = 'enspd_admin_logs_v1';

function loadAdminData() {
  try {
    const storedData = JSON.parse(localStorage.getItem(_adminDataKey));
    if (storedData) {
      if (storedData.actualites) D.actualites = storedData.actualites;
      if (storedData.events) D.events = storedData.events;
      // Ajoutez d'autres propriétés de D ici si elles deviennent éditables par l'admin et nécessitent une persistance
    }
  } catch (e) {
    console.error("Échec du chargement des données admin depuis localStorage :", e);
  }
}

function saveAdminData() {
  try {
    const dataToStore = {
      actualites: D.actualites,
      events: D.events,
      // Ajoutez d'autres propriétés de D ici
    };
    localStorage.setItem(_adminDataKey, JSON.stringify(dataToStore));
  } catch (e) {
    console.error("Échec de la sauvegarde des données admin dans localStorage :", e);
    toast("Erreur : Espace de stockage local insuffisant pour sauvegarder les données.", "err");
  }
}

const Log = {
  get() { try { return JSON.parse(localStorage.getItem(_adminLogsKey) || '[]'); } catch { return []; } },
  add(action, detail = '') {
    const logs = this.get();
    logs.unshift({ at: Date.now(), action, detail });
    // Gardez seulement les 50 derniers logs pour éviter une utilisation excessive du stockage
    localStorage.setItem(_adminLogsKey, JSON.stringify(logs.slice(0, 50)));
  }
};

/* ── HELPERS : sanitisation & i18n champ ──────────────────── */
const S = {
  esc(str){
    return String(str==null?'':str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;')
      .replace(/'/g,'&#39;');
  },
  clean(str){ return String(str||'').trim().slice(0,500); },
};
function tr(obj,field){
  if(!obj) return '';
  const v = _lang==='en' ? (obj[field+'_en'] ?? obj[field]) : obj[field];
  return v==null ? '' : v;
}

/* ── AUTH ─────────────────────────────────────────────────── */
function hashP(s){let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}return Math.abs(h).toString(36);}
function isEmail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);}
function passStr(p){let s=0;if(p.length>=8)s++;if(/[A-Z]/.test(p))s++;if(/[0-9]/.test(p))s++;if(/[^A-Za-z0-9]/.test(p))s++;return s;}
const loginTry=(()=>{try{return JSON.parse(localStorage.getItem('enspd_rl'))||{};}catch{return{};}})();
function saveRL(){try{localStorage.setItem('enspd_rl',JSON.stringify(loginTry));}catch{}}
function checkRL(e){const n=Date.now();if(!loginTry[e])loginTry[e]=[];loginTry[e]=loginTry[e].filter(t=>n-t<300000);return loginTry[e].length<5;}
function recTry(e){if(!loginTry[e])loginTry[e]=[];loginTry[e].push(Date.now());saveRL();}

const AUTH={
  ADMIN_EMAIL:'admin@enspd.bj',
  _ADMIN_KEY:'enspd_admin_hash_v1',
  hasAdminCredential(){return !!localStorage.getItem(this._ADMIN_KEY);},
  setAdminPassword(pass){localStorage.setItem(this._ADMIN_KEY,hashP('enspd::'+pass));},
  get user(){try{const u=JSON.parse(localStorage.getItem('enspd_u7'));return u?.exp>Date.now()?u:null;}catch{return null;}},
  set user(v){if(v){v.exp=Date.now()+24*3600*1000;localStorage.setItem('enspd_u7',JSON.stringify(v));}else localStorage.removeItem('enspd_u7');},
  getUsers(){try{return JSON.parse(localStorage.getItem('enspd_users7'))||[];}catch{return[];}},
  login(email,pass){
    email=email.toLowerCase().trim();
    if(!checkRL(email))return{err:'Trop de tentatives. Réessayez dans 5 minutes.'};
    if(email==='admin'||email===this.ADMIN_EMAIL){
      if(!this.hasAdminCredential())return{setup:true};
      if(hashP('enspd::'+pass)===localStorage.getItem(this._ADMIN_KEY)){
        return{ok:true,user:{nom:'Administrateur',email:'admin@enspd.bj',role:'admin',init:'A'}};
      }
      Log.add('Tentative de connexion admin échouée', email);
      recTry(email);
      return{err:'Mot de passe admin incorrect.'};
    }
    recTry(email);
    const u=this.getUsers().find(u=>u.email===email&&u.hash===hashP(pass));
    if(!u)return{err:'Email ou mot de passe incorrect.'};
    Log.add('Connexion utilisateur', email);
    return{ok:true,user:{nom:u.nom,email:u.email,role:u.role,init:u.nom[0]?.toUpperCase()||'U',filiere:u.filiere||''}};
  },
  register(data){
    const users=this.getUsers();
    if(users.some(u=>u.email===data.email.toLowerCase()))return{err:'Cet email est déjà utilisé.'};
    if(passStr(data.pass)<2)return{err:'Mot de passe trop faible (ajoutez chiffres et majuscules).'};
    const nu={id:Date.now(),nom:data.nom.trim(),email:data.email.toLowerCase().trim(),
      hash:hashP(data.pass),role:data.role||'visiteur',filiere:data.filiere||'',createdAt:new Date().toISOString()};
    users.push(nu);
    localStorage.setItem('enspd_users7',JSON.stringify(users));
    localStorage.setItem('enspd_users7', JSON.stringify(users));
    Log.add('Nouvelle inscription', nu.email + ' (' + nu.role + ')');
    return{ok:true};
  },
  logout(){this.user=null;updateNavAuth();const ab=document.getElementById('admin-bar');if(ab)ab.className='admin-bar';toast('Déconnecté.','inf');},
  logout(){this.user=null;updateNavAuth();const ab=document.getElementById('admin-bar');if(ab)ab.className='admin-bar';toast('Déconnecté.','inf'); Log.add('Déconnexion');},
  isAdmin(){return this.user?.role==='admin';},
};

/* ── DARK MODE ────────────────────────────────────────────── */
let _dark=false;
function toggleDark(){
  /* Animation de transition */
  const ov=document.getElementById('theme-ov');
  if(ov){ov.style.opacity='.4';setTimeout(()=>{ov.style.opacity='0';},320);}
  _dark=!_dark;
  document.documentElement.dataset.theme=_dark?'dark':'';
  localStorage.setItem('enspd-theme',_dark?'dark':'');
  _syncThemeBtn();
}
function _syncThemeBtn(){
  const btn=document.getElementById('dark-btn');
  if(btn)btn.setAttribute('aria-label',_dark?'Passer en mode clair':'Passer en mode sombre');
}
function initTheme(){
  const s=localStorage.getItem('enspd-theme');
  if(s!==null){_dark=s==='dark';}
  else{_dark=window.matchMedia('(prefers-color-scheme:dark)').matches;}
  document.documentElement.dataset.theme=_dark?'dark':'';
  /* Écoute les changements système si l'utilisateur n'a pas de préférence manuelle */
  window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change',e=>{
    if(localStorage.getItem('enspd-theme')===null){
      _dark=e.matches;
      document.documentElement.dataset.theme=_dark?'dark':'';
      _syncThemeBtn();
    }
  });
}

/* ── LANGUE ──────────────────────────────────────────────── */
let _lang='fr';
function setLang(l){_lang=l;document.getElementById('lang-fr')?.classList.toggle('on',l==='fr');document.getElementById('lang-en')?.classList.toggle('on',l==='en');document.documentElement.lang=l;document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.dataset.i18n;if(LANG[l]?.[k]!==undefined)el.innerHTML=LANG[l][k];});localStorage.setItem('enspd-lang',l);renderWhy();}
function initLang(){setLang(localStorage.getItem('enspd-lang')||'fr');}

/* ── ROUTEUR ─────────────────────────────────────────────── */
function nav(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('act'));
  document.querySelectorAll('[data-p]').forEach(a=>a.classList.toggle('act',a.dataset.p===page));
  const el=document.getElementById('p-'+page);
  if(el)el.classList.add('act');
  document.getElementById('nav-links')?.classList.remove('open');
  window.scrollTo({top:0,behavior:'smooth'});
  setTimeout(initAnim,100);
  if(page==='galerie'){setTimeout(renderGal,60);return;}
  if(page==='admin')renderAdminPage();
}

/* ── TOAST ───────────────────────────────────────────────── */
function toast(msg,type='ok'){
  const c=document.getElementById('toasts');if(!c)return;
  const el=document.createElement('div');
  el.className='toast t-'+type;
  el.innerHTML='<span style="font-size:16px;flex-shrink:0">'+({ok:'✓',err:'✕',warn:'⚠',inf:'ℹ'}[type]||'ℹ')+'</span><span>'+S.esc(msg)+'</span>';
  c.appendChild(el);
  requestAnimationFrame(()=>requestAnimationFrame(()=>el.classList.add('on')));
  setTimeout(()=>{el.classList.remove('on');setTimeout(()=>el.remove(),360);},3800);
}

/* ── MODAL ───────────────────────────────────────────────── */
function openModal(titre,html,xl=false){
  const box=document.getElementById('modal');
  const mb=document.getElementById('modal-box');
  if(mb)xl?mb.classList.add('xl'):mb.classList.remove('xl');
  document.getElementById('m-titre').textContent=titre;
  document.getElementById('m-body').innerHTML=html;
  box.classList.add('on');
  document.body.style.overflow='hidden';
}
function closeModal(){document.getElementById('modal')?.classList.remove('on');document.body.style.overflow='';}

/* ── AUTH MODAL ──────────────────────────────────────────── */
function openAuthModal(tab='login'){
  openModal(tab==='login'?'Connexion':'Créer un compte',`
  <div class="auth-tabs">
    <button class="auth-tab ${tab==='login'?'on':''}" onclick="swTab('login')">Connexion</button>
    <button class="auth-tab ${tab==='register'?'on':''}" onclick="swTab('register')">Inscription</button>
  </div>
  <div class="auth-panel ${tab==='login'?'on':''}" id="panel-login">
    <div class="fg"><label>Email *</label>
      <input id="l-email" type="email" class="fi" placeholder="votre@email.com ou admin" autocomplete="email"></div>
    <div class="fg"><label>Mot de passe *</label>
      <input id="l-pass" type="password" class="fi" placeholder="Votre mot de passe" autocomplete="current-password"></div>
    <div id="l-err" style="display:none;background:var(--er-l);color:var(--er);border-radius:8px;padding:10px 14px;font-size:13px;margin-bottom:12px"></div>
    <button class="btn b-vt b-lg b-full mt8" onclick="doLogin()">Se connecter</button>
    <p style="text-align:center;font-size:13px;color:var(--txt3);margin-top:14px">
      Pas de compte ? <a onclick="swTab('register')" style="color:var(--vt-dd);font-weight:600;cursor:pointer">S'inscrire</a></p>
  </div>
  <div class="auth-panel ${tab==='register'?'on':''}" id="panel-register">
    <div class="auth-role-grid">
      <div class="role-card on" data-role="etudiant" onclick="selRole(this)"><div class="role-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 9l9-5 9 5-9 5-9-5z"/><path d="M7 11v4c0 1 2.2 2 5 2s5-1 5-2v-4M21 9v5"/></svg></div><div class="role-lbl">Étudiant(e)</div></div>
      <div class="role-card" data-role="enseignant" onclick="selRole(this)"><div class="role-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="4" width="18" height="12" rx="1"/><path d="M12 16v4M8 20h8"/></svg></div><div class="role-lbl">Enseignant</div></div>
      <div class="role-card" data-role="visiteur" onclick="selRole(this)"><div class="role-ico"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg></div><div class="role-lbl">Visiteur</div></div>
    </div>
    <div class="fg"><label>Nom complet *</label><input id="r-nom" type="text" class="fi" placeholder="Nom et prénoms"></div>
    <div class="fg"><label>Email *</label><input id="r-email" type="email" class="fi" placeholder="votre@email.com"></div>
    <div class="fg" id="fg-fil"><label>Filière</label>
      <select id="r-fil" class="fs"><option value="">-- Sélectionner --</option>
        <option>Licence SA</option><option>Licence PSE</option>
        <option>Master SSD</option><option>Master SAAV</option>
        <option>Master SESA</option><option>Master SE-MP</option><option>Master SILPD</option>
        <option>Doctorat</option></select></div>
    <div class="fg"><label>Mot de passe * <span id="ps-lbl" style="font-size:11px;font-weight:400;color:var(--txt3)"></span></label>
      <input id="r-pass" type="password" class="fi" placeholder="Min. 8 caractères" oninput="showPS(this.value)">
      <div style="height:3px;border-radius:2px;background:var(--bg2);margin-top:4px;overflow:hidden">
        <div id="ps-fill" style="height:100%;border-radius:2px;transition:width .3s,background .3s;width:0"></div></div></div>
    <div class="fg"><label>Confirmer *</label><input id="r-pass2" type="password" class="fi" placeholder="Répétez le mot de passe"></div>
    <div class="fg" style="flex-direction:row;align-items:center;gap:8px">
      <input type="checkbox" id="r-cgu" style="cursor:pointer;width:16px;height:16px">
      <label for="r-cgu" style="font-size:13px;color:var(--txt2);cursor:pointer">J'accepte les conditions d'utilisation</label></div>
    <div id="r-err" style="display:none;background:var(--er-l);color:var(--er);border-radius:8px;padding:10px 14px;font-size:13px;margin-bottom:12px"></div>
    <button class="btn b-vt b-lg b-full" onclick="doRegister()">Créer mon compte</button>
    <p style="text-align:center;font-size:13px;color:var(--txt3);margin-top:14px">
      Déjà un compte ? <a onclick="swTab('login')" style="color:var(--vt-dd);font-weight:600;cursor:pointer">Se connecter</a></p>
  </div>`);
}
function swTab(t){
  document.querySelectorAll('.auth-tab').forEach((b,i)=>b.classList.toggle('on',i===(t==='login'?0:1)));
  ['login','register'].forEach(x=>document.getElementById('panel-'+x)?.classList.toggle('on',x===t));
  document.querySelector('#modal-box .modal-head h2').textContent=t==='login'?'Connexion':'Créer un compte';
}
function selRole(el){
  document.querySelectorAll('.role-card').forEach(c=>c.classList.remove('on'));el.classList.add('on');
  document.getElementById('fg-fil').style.display=el.dataset.role==='etudiant'?'flex':'none';
}
function showPS(p){const s=passStr(p);const c=['','#DC3545','#E8960A','#2EAA38','#186020'];const l=['','Faible','Moyen','Bon','Fort'];
  document.getElementById('ps-fill').style.width=(s*25)+'%';document.getElementById('ps-fill').style.background=c[s]||'';
  document.getElementById('ps-lbl').textContent=p?'— '+l[s]:'';document.getElementById('ps-lbl').style.color=c[s]||'';}
function doLogin(){
  const email=document.getElementById('l-email')?.value||'';
  const pass=document.getElementById('l-pass')?.value||'';
  const errEl=document.getElementById('l-err');
  if(!email||!pass){errEl.textContent='Remplissez tous les champs.';errEl.style.display='block';return;}
  const res=AUTH.login(email,pass);
  if(res.setup){openAdminSetup();return;}
  if(res.err){errEl.textContent=res.err;errEl.style.display='block';return;}
  AUTH.user=res.user;closeModal();updateNavAuth();
  toast('Bienvenue, '+res.user.nom.split(' ')[0]+' !','ok');
}
/* PREMIÈRE CONFIGURATION — aucun mot de passe admin n'est codé en dur :
   le déployeur définit le sien au premier accès (stocké haché en localStorage) */
function openAdminSetup(){
  openModal('Configuration administrateur',`
    <div class="alert a-or mb16"><span></span>
      <div>Aucun mot de passe administrateur n'est défini. Choisissez-en un
      maintenant — il sera stocké de façon hachée sur cet appareil.
      Faites-le dès le déploiement du site.</div></div>
    <div class="fg"><label>Nouveau mot de passe admin (min. 10 caractères)</label>
      <input class="fi" type="password" id="as-p1" autocomplete="new-password"></div>
    <div class="fg"><label>Confirmez le mot de passe</label>
      <input class="fi" type="password" id="as-p2" autocomplete="new-password"></div>
    <div id="as-err" class="alert a-er" style="display:none;margin-bottom:12px"></div>
    <div style="display:flex;gap:8px">
      <button class="btn b-vt" onclick="saveAdminSetup()">Définir le mot de passe</button>
      <button class="btn b-gh" onclick="closeModal()">Annuler</button>
    </div>`);
}
function saveAdminSetup(){
  const p1=document.getElementById('as-p1')?.value||'';
  const p2=document.getElementById('as-p2')?.value||'';
  const er=document.getElementById('as-err');
  const e=(m)=>{er.textContent=m;er.style.display='block';};
  if(p1.length<10){e('Mot de passe trop court (min. 10 caractères).');return;}
  if(passStr(p1)<3){e('Mot de passe trop faible (ajoutez majuscules, chiffres, symboles).');return;}
  if(p1!==p2){e('Les mots de passe ne correspondent pas.');return;}
  AUTH.setAdminPassword(p1);
  closeModal();
  toast('Mot de passe administrateur configuré. Connectez-vous.','ok');
  openAuthModal('login');
}
function doRegister(){
  const nom=document.getElementById('r-nom')?.value?.trim()||'';
  const email=document.getElementById('r-email')?.value?.trim()||'';
  const pass=document.getElementById('r-pass')?.value||'';
  const pass2=document.getElementById('r-pass2')?.value||'';
  const role=document.querySelector('.role-card.on')?.dataset.role||'visiteur';
  const cgu=document.getElementById('r-cgu')?.checked;
  const errEl=document.getElementById('r-err');
  const e=(m)=>{errEl.textContent=m;errEl.style.display='block';};
  if(!nom||!email||!pass||!pass2){e('Remplissez tous les champs.');return;}
  if(!isEmail(email)){e('Email invalide.');return;}
  if(pass.length<8){e('Mot de passe trop court (min 8 caractères).');return;}
  if(pass!==pass2){e('Les mots de passe ne correspondent pas.');return;}
  if(!cgu){e("Acceptez les conditions d'utilisation.");return;}
  const res=AUTH.register({nom,email,pass,role,filiere:document.getElementById('r-fil')?.value||''});
  if(res.err){e(res.err);return;}
  Log.add('Nouvel utilisateur enregistré', email);
  const lr=AUTH.login(email,pass);if(lr.ok)AUTH.user=lr.user;
  closeModal();updateNavAuth();
  toast('Compte créé ! Bienvenue, '+nom.split(' ')[0]+' !','ok');
}

/* ── NAV AUTH ─────────────────────────────────────────────── */
function updateNavAuth(){
  const el=document.getElementById('nav-auth');if(!el)return;
  const u=AUTH.user;
  if(u){
    const rLabel={admin:'Admin',etudiant:'Étudiant(e)',enseignant:'Enseignant',visiteur:'Visiteur'}[u.role]||'';
    const dirPhoto=localStorage.getItem('enspd_photo_dir');
    el.innerHTML=`<div class="nav-user" id="nav-user-btn" onclick="this.classList.toggle('open')">
      <div class="nav-avatar">${u.role==='admin'&&dirPhoto?`<img src="${S.esc(dirPhoto)}" alt="dir" data-dirimg style="object-position:${dirPos()}">`:S.esc(u.init||'U')}</div>
      <span>${S.esc(u.nom.split(' ')[0])}</span>
      <span style="font-size:9px;color:rgba(255,255,255,.5)">▾</span>
      <div class="nav-user-menu">
        <span class="role-badge role-${u.role}" style="display:block;margin-bottom:8px">${rLabel}</span>
        <div style="height:1px;background:var(--brd);margin:8px 0"></div>
        ${u.role==='admin'?'<a onclick="nav(\'admin\');document.getElementById(\'nav-user-btn\').classList.remove(\'open\')">Administration</a>':''}
        <a onclick="nav('contact');document.getElementById('nav-user-btn').classList.remove('open')">Mon profil</a>
        <button class="logout" onclick="AUTH.logout()">↩ Déconnexion</button>
      </div></div>`;
    renderAdminBar();
  }else{
    el.innerHTML=`<button class="btn-login" onclick="openAuthModal('login')" data-i18n="btn_login">Connexion</button>
      <button class="btn-register" onclick="openAuthModal('register')" data-i18n="btn_register">S'inscrire</button>`;
  }
}
function renderAdminBar(){
  const ab=document.getElementById('admin-bar');if(!ab)return;
  if(AUTH.isAdmin()){
    ab.className='admin-bar show';
    ab.innerHTML=`<strong>Mode Admin</strong>
    <button class="admin-action" onclick="nav('admin')">Dashboard</button>
    <button class="admin-action" onclick="openPubModal()">+ Actualité</button>
    <button class="admin-action" onclick="openPubEvModal()">+ Événement</button>
    <button class="admin-action" onclick="openPhotoModal()"> Photos</button>
    <button class="admin-action" onclick="openUsersModal()"> Utilisateurs</button>
    <button class="admin-action" onclick="openTopBarModal()">Annonce</button>
    <button class="admin-action" style="margin-left:auto" onclick="AUTH.logout()">Déconnexion</button>`;
    var _bae=document.getElementById('btn-add-ev'); if(_bae)_bae.hidden=false;
  }else{
    ab.className='admin-bar';
    var _bae=document.getElementById('btn-add-ev'); if(_bae)_bae.hidden=true;
  }
}

/* ── ADMIN DASHBOARD ──────────────────────────────────────── */
function renderAdminPage(){
  const el=document.getElementById('p-admin');if(!el)return;
  if(!AUTH.isAdmin()){el.innerHTML='<div class="pg-hero"><div class="wi wrap"><div class="bc">Admin</div><h1>Accès refusé</h1><p>Identifiants admin requis.</p></div></div>';return;}
  const users=AUTH.getUsers();
  el.innerHTML=`
  <div class="pg-hero"><div class="wi wrap">
    <div class="bc">Accueil / Administration</div>
    <h1>Tableau de bord</h1>
    <p>Gérez le contenu, les photos, les annonces et les utilisateurs du site ENSPD.</p>
  </div></div>
  <section class="sec bg-bg"><div class="wrap">
    <div class="g4 mb32">
      <div class="card cp" style="border-top:3px solid var(--vt);text-align:center">
        <div style="font-size:32px;font-weight:800;color:var(--vt)">${D.actualites.length}</div><div class="f13 c3">Actualités</div></div>
      <div class="card cp" style="border-top:3px solid var(--mn);text-align:center">
        <div style="font-size:32px;font-weight:800;color:var(--navy-ink)">${users.length}</div><div class="f13 c3">Comptes inscrits</div></div>
      <div class="card cp" style="border-top:3px solid var(--or);text-align:center">
        <div style="font-size:32px;font-weight:800;color:var(--or)">${D.events.length}</div><div class="f13 c3">Événements</div></div>
      <div class="card cp" style="border-top:3px solid #6B21A8;text-align:center">
        <div style="font-size:32px;font-weight:800;color:#6B21A8">${D.filieres.length}</div><div class="f13 c3">Filières</div></div>
    </div>
    <div class="mb28">
      <h3 style="font-size:16px;font-weight:700;margin-bottom:14px;color:var(--txt)">Actions rapides</h3>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn b-vt b-sm" onclick="openPubModal()">+ Publier une actualité</button>
        <button class="btn b-mn b-sm" onclick="openPubEvModal()">+ Ajouter un événement</button>
        <button class="btn b-or b-sm" onclick="openPhotoModal()"> Gérer les photos</button>
        <button class="btn b-gh b-sm" onclick="openUsersModal()"> Gérer les utilisateurs</button>
        <button class="btn b-gh b-sm" onclick="openTopBarModal()"> Modifier l'annonce</button>
        <button class="btn b-gh b-sm" onclick="openGalAdminModal()"> Galerie</button>
        <button class="adm-qa" onclick="openChangePassModal()"><div class="adm-qa-ico"></div><div class="adm-qa-lbl">Changer mdp</div></button>
        <button class="adm-qa" onclick="openLogsModal()"><div class="adm-qa-ico"></div><div class="adm-qa-lbl">Journal logs</div></button>
      </div>
    </div>
    <div class="g2">
    <!-- Deux colonnes -->
    <div class="adm-two-col">
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3 style="font-size:15px;font-weight:700;color:var(--txt)">Actualités publiées</h3>
        <div class="adm-col-head">
          <span class="adm-col-title">Actualités (${D.actualites.length})</span>
          <button class="btn b-vt b-sm" onclick="openPubModal()">+ Ajouter</button>
        </div>
        ${D.actualites.slice(0,6).map(a=>`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--brd);gap:8px">
            <span class="f13" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${a.titre.substring(0,42)}…</span>
            <div style="display:flex;gap:5px;flex-shrink:0">
              <span class="badge bv" style="font-size:11px">${a.cat}</span>
              <button class="btn b-er b-sm" style="padding:3px 8px;font-size:11px" onclick="delActu(${a.id})">✕</button>
            </div>
          </div>`).join('')}
        <div class="adm-panel">
          ${D.actualites.length
            ? D.actualites.slice(0,6).map(a => `
                <div class="adm-row">
                  <div class="adm-row-left">
                    <div class="adm-row-title">
                      ${S.esc(a.titre.substring(0,42))}
                      ${a.titre.length>42?'…':''}
                    </div>
                  </div>
                  <span class="badge bv" style="font-size:10px;flex-shrink:0">
                    ${S.esc(a.cat)}
                  </span>
                  <button class="btn b-er b-sm"
                          style="padding:2px 7px;font-size:11px;flex-shrink:0"
                          onclick="delActu(${a.id})">✕</button>
                </div>`).join('')
            : '<p class="f13 c3 mt8">Aucune actualité publiée.</p>'}
        </div>
      </div>
      <!-- Logs + Utilisateurs -->
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3 style="font-size:15px;font-weight:700;color:var(--txt)">Comptes inscrits (${users.length})</h3>
          <button class="btn b-gh b-sm" onclick="openUsersModal()">Tout voir</button>
        <div class="adm-col-head">
          <span class="adm-col-title">Activité récente</span>
          <button class="btn b-gh b-sm" onclick="openLogsModal()">Tout voir</button>
        </div>
        ${users.length?users.slice(0,6).map(u=>`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid var(--brd)">
            <div><div class="f13 fw6">${u.nom}</div><div class="f12 c3">${u.email}</div></div>
            <span class="badge ${u.role==='etudiant'?'bv':'bgr'}">${u.role}</span>
          </div>`).join(''):'<p class="f13 c3 mt16">Aucun compte inscrit.</p>'}
        <div class="adm-panel">
          ${logs.length
            ? logs.map(l => `
                <div class="adm-row">
                  <div class="adm-row-left">
                    <div class="adm-row-title">${S.esc(l.action)}</div>
                    ${l.detail
                      ? `<div class="adm-row-sub">${S.esc(l.detail.substring(0,32))}</div>`
                      : ''}
                  </div>
                  <span style="font-size:11px;color:var(--txt3);white-space:nowrap;margin-left:8px">
                    ${new Date(l.at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
                  </span>
                </div>`).join('')
            : '<p class="f13 c3 mt8">Aucun log enregistré.</p>'}
          <!-- Résumé utilisateurs -->
          <div class="adm-row" style="border-top:1px solid var(--brd);margin-top:6px;padding-top:10px">
            <span style="font-size:12px;color:var(--txt3)">
              ${users.length
                ? users.length + ' compte(s) inscrit(s)'
                : 'Aucun compte utilisateur inscrit'}
            </span>
            ${users.length
              ? `<button class="btn b-gh b-sm" style="font-size:11px;margin-left:auto"
                         onclick="openUsersModal()">Voir →</button>`
              : ''}
          </div>
        </div>
      </div>
    </div>
  </div></section>`;
}

/* ADMIN — Publier actualité */
function openPubModal(){
  openModal('Publier une actualité',`
    <div class="fg"><label>Titre *</label><input class="fi" type="text" id="pub-t" placeholder="Titre de l'actualité"></div>
    <div class="fg"><label>Catégorie</label>
      <select class="fs" id="pub-c">
        <option>Concours</option><option>Événement</option><option>JSSED</option>
        <option>Partenariat</option><option>Recherche</option><option>Innovation</option><option>Formation</option>
      </select></div>
    <div class="fg"><label>Image (chemin assets/ — optionnel)</label>
      <input class="fi" type="text" id="pub-img" placeholder="assets/galerie/enspd/photo.jpg"></div>
    <div class="fg"><label>Contenu complet *</label>
      <textarea class="ft" id="pub-x" placeholder="Rédigez l'actualité complète. Vous pouvez utiliser des sauts de ligne." style="min-height:180px"></textarea></div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn b-vt" onclick="publishActu()">✓ Publier</button>
      <button class="btn b-gh" onclick="closeModal()">Annuler</button>
    </div>`);
}
function publishActu(){
  const t=document.getElementById('pub-t')?.value.trim();
  const x=document.getElementById('pub-x')?.value.trim();
  const cat=document.getElementById('pub-c')?.value;
  const img=document.getElementById('pub-img')?.value.trim()||'';
  if(!t||!x){toast('Remplissez le titre et le contenu.','err');return;}
  const m=['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'][new Date().getMonth()];
  D.actualites.unshift({id:Date.now(),cat,date:m+' '+new Date().getFullYear(),img,titre:t,texte:x});
  saveAdminData(); // Sauvegarde les actualités
  Log.add('Actualité publiée', t);
  closeModal();renderActusHome();renderActus();if(AUTH.isAdmin())renderAdminPage();
  toast('Actualité publiée !','ok');
}
function delActu(id){
  if(!confirm('Supprimer cette actualité ?'))return;
  const i=D.actualites.findIndex(a=>a.id===id);
  if(i>=0){D.actualites.splice(i,1);renderActusHome();renderActus();renderAdminPage();toast('Supprimée.','ok');}
  if(i>=0){
    const title = D.actualites[i].titre;
    D.actualites.splice(i,1);
    saveAdminData(); // Sauvegarde les actualités
    Log.add('Actualité supprimée', title);
    renderActusHome();renderActus();renderAdminPage();toast('Supprimée.','ok');
  }
}

/* ADMIN — Ajouter événement */
function openPubEvModal(){
  openModal('Ajouter un événement',`
    <div class="fg"><label>Titre *</label><input class="fi" type="text" id="ev-t" placeholder="Titre de l'événement"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
      <div class="fg"><label>Jour</label><input class="fi" type="text" id="ev-j" placeholder="15"></div>
      <div class="fg"><label>Mois/Année</label><input class="fi" type="text" id="ev-m" placeholder="Sep"></div>
      <div class="fg"><label>Heure</label><input class="fi" type="text" id="ev-h" placeholder="09h00"></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div class="fg"><label>Type</label>
        <select class="fs" id="ev-type"><option>Académique</option><option>BUE</option><option>Signature</option><option>Ouvert</option></select></div>
      <div class="fg"><label>Lieu *</label><input class="fi" type="text" id="ev-l" placeholder="Amphi B, Université de Parakou"></div>
    </div>
    <div class="fg"><label>Description courte *</label><textarea class="ft" id="ev-d" placeholder="Description de l'événement…" style="min-height:100px"></textarea></div>
    <div class="fg"><label>Détails complets (optionnel)</label><textarea class="ft" id="ev-dt" placeholder="Informations complémentaires, programme…" style="min-height:80px"></textarea></div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn b-vt" onclick="addEvent()">✓ Ajouter</button>
      <button class="btn b-gh" onclick="closeModal()">Annuler</button>
    </div>`);
}
function openAddEvModal(){openPubEvModal();}
function addEvent(){
  const t=document.getElementById('ev-t')?.value.trim();
  const d=document.getElementById('ev-d')?.value.trim();
  const l=document.getElementById('ev-l')?.value.trim();
  if(!t||!d||!l){toast('Titre, description et lieu requis.','err');return;}
  D.events.unshift({j:document.getElementById('ev-j')?.value||'?',m:document.getElementById('ev-m')?.value||'?',
    titre:t,type:document.getElementById('ev-type')?.value||'Académique',
    heure:document.getElementById('ev-h')?.value||'09h00',lieu:l,desc:d,
    detail:document.getElementById('ev-dt')?.value.trim()||''});
  saveAdminData(); // Sauvegarde les événements
  Log.add('Événement ajouté', t);
  closeModal();renderEvents();renderAdminPage();toast('Événement ajouté !','ok');
}

/* ADMIN — Gestion photos */
function dirPos(){return localStorage.getItem('enspd_photo_dir_pos')||'50% 30%';}
function setDirPos(v){localStorage.setItem('enspd_photo_dir_pos',v);
  document.querySelectorAll('[data-dirimg]').forEach(function(im){im.style.objectPosition=v;});
  document.querySelectorAll('[data-dirpos]').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-dirpos')===v);});}
function cadrageGrid(){
  var cur=dirPos();
  var cells=[['0% 0%','Haut gauche'],['50% 0%','Haut'],['100% 0%','Haut droite'],['0% 50%','Gauche'],['50% 50%','Centre'],['100% 50%','Droite'],['0% 100%','Bas gauche'],['50% 100%','Bas'],['100% 100%','Bas droite']];
  return '<div class="dirpos-grid">'+cells.map(function(c){return '<button type="button" class="dirpos-cell'+(c[0]===cur?' on':'')+'" data-dirpos="'+c[0]+'" title="'+c[1]+'" aria-label="Cadrage : '+c[1]+'" onclick="setDirPos(\''+c[0]+'\')"></button>';}).join('')+'</div>';
}
function openPhotoModal(){
  const dp=localStorage.getItem('enspd_photo_dir');
  openModal('Gestion des photos',`
    <div class="m-sec">
      <div class="m-sec-h">Photo du Directeur</div>
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:14px">
        <div style="width:80px;height:80px;border-radius:50%;overflow:hidden;border:2px solid var(--brd);flex-shrink:0;display:flex;align-items:center;justify-content:center;background:var(--bg2)">
          ${dp?`<img src="${dp}" data-dirimg style="width:100%;height:100%;object-fit:cover;object-position:${dirPos()}">`:'<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 21h18M5 21V9l7-4 7 4v12M9 21v-5h6v5"/></svg>'}
        </div>
        <div>
          <p class="f13 c3 mb8">Formats : JPG, PNG. Taille recommandée : 300×300px minimum.</p>
          <label style="display:inline-block">
            <span class="btn b-vt b-sm" style="cursor:pointer"> Choisir une photo</span>
            <input type="file" accept="image/*" style="display:none" onchange="uploadDirPhoto(this)">
          </label>
          ${dp?'<button class="btn b-er b-sm" style="margin-left:8px" onclick="localStorage.removeItem(\'enspd_photo_dir\');closeModal();renderAdmin();toast(\'Photo supprimée.\',\'ok\')">✕ Supprimer</button>':''}
        </div>
      </div>
    </div>
    ${dp?'<div class="m-sec"><div class="m-sec-h">Cadrage de la photo</div><p class="f13 c3 mb8">Cliquez sur la zone du visage à mettre en avant dans le cadre (recadrage).</p>'+cadrageGrid()+'</div>':''}
    <div class="m-sec">
      <div class="m-sec-h">Ajouter des photos à la galerie</div>
      <div class="fg"><label>Catégorie</label>
        <select class="fs" id="gc-sel" onchange="document.getElementById('new-gc-fg').style.display=this.value==='new'?'flex':'none'">
          ${Object.keys(D.galerie).map(c=>`<option>${c}</option>`).join('')}
          <option value="new">+ Nouvelle catégorie…</option>
        </select></div>
      <div class="fg" id="new-gc-fg" style="display:none">
        <label>Nom de la nouvelle catégorie</label>
        <input class="fi" type="text" id="new-gc-name" placeholder="Ex: Conférences"></div>
      <div class="fg"><label>Chemin de l'image (assets/…)</label>
        <input class="fi" type="text" id="gc-src" placeholder="assets/galerie/enspd/photo.jpg"></div>
      <div class="fg"><label>Titre de la photo</label>
        <input class="fi" type="text" id="gc-t" placeholder="Ex: Séance de travaux pratiques"></div>
      <div class="fg"><label>Contexte / Événement</label>
        <input class="fi" type="text" id="gc-ev" placeholder="Ex: Rentrée 2025-2026"></div>
      <button class="btn b-vt" onclick="addGalPhoto()">✓ Ajouter à la galerie</button>
    </div>
    <button class="btn b-gh b-sm mt16" onclick="closeModal()">Fermer</button>`,true);
}
function uploadDirPhoto(inp){
  const file=inp.files[0]; if(!file)return;
  if(!/^image\//.test(file.type)){toast('Fichier non valide : choisissez une image.','err');return;}
  if(file.size>2*1024*1024){toast('Image trop lourde (max 2 Mo).','err');return;}
  const reader=new FileReader();
  reader.onload=e=>{localStorage.setItem('enspd_photo_dir',e.target.result);
    if(!localStorage.getItem('enspd_photo_dir_pos'))localStorage.setItem('enspd_photo_dir_pos','50% 30%');
    closeModal();renderAdmin();updateNavAuth();toast('Photo du Directeur mise à jour !','ok');
    setTimeout(openPhotoModal,400);};
  reader.readAsDataURL(file);
}
function addGalPhoto(){
  const sel=document.getElementById('gc-sel')?.value;
  const cat=sel==='new'?document.getElementById('new-gc-name')?.value.trim():sel;
  const src=document.getElementById('gc-src')?.value.trim();
  const t=document.getElementById('gc-t')?.value.trim();
  const ev=document.getElementById('gc-ev')?.value.trim();
  if(!cat||!src||!t){toast('Catégorie, chemin et titre requis.','err');return;}
  if(!D.galerie[cat])D.galerie[cat]=[];
  D.galerie[cat].push({src,titre:t,ev:ev||cat});
  toast('Photo ajoutée à la galerie "'+cat+'" !','ok');closeModal();
}
function openGalAdminModal(){
  openModal('Galerie — Administration',`
    <p class="f14 c2 mb16">Photos disponibles par catégorie :</p>
    ${Object.entries(D.galerie).map(([cat,imgs])=>`
      <div style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid var(--brd)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <strong class="f14">${cat} (${imgs.length} photo${imgs.length>1?'s':''})</strong>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${imgs.map((g,i)=>`
            <div style="position:relative;width:70px">
              <img src="${g.src}" style="width:70px;height:52px;object-fit:cover;border-radius:6px;border:1px solid var(--brd)"
                onerror="this.src=''">
              <button onclick="delGalPhoto('${cat}',${i})" style="position:absolute;top:-6px;right:-6px;width:18px;height:18px;border-radius:50%;background:var(--er);color:#fff;border:none;cursor:pointer;font-size:10px;display:flex;align-items:center;justify-content:center">✕</button>
            </div>`).join('')}
        </div>
      </div>`).join('')}
    <button class="btn b-vt b-sm mt16" onclick="closeModal();openPhotoModal()">+ Ajouter des photos</button>`,true);
}
function delGalPhoto(cat,idx){
  D.galerie[cat]?.splice(idx,1);
  if(D.galerie[cat]?.length===0)delete D.galerie[cat];
  renderGal(_galCat);
  openGalAdminModal();
}

/* ADMIN — Utilisateurs */
function openUsersModal(){
  const users=AUTH.getUsers();
  openModal('Gestion des utilisateurs',`
    <p class="f14 c3 mb16">${users.length} compte(s) inscrit(s)</p>
    ${users.length?`<div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tr style="background:var(--bg2)">
          <th style="padding:10px;text-align:left;border:1px solid var(--brd)">Nom</th>
          <th style="padding:10px;text-align:left;border:1px solid var(--brd)">Email</th>
          <th style="padding:10px;text-align:left;border:1px solid var(--brd)">Rôle</th>
          <th style="padding:10px;text-align:left;border:1px solid var(--brd)">Filière</th>
          <th style="padding:10px;text-align:center;border:1px solid var(--brd)">Action</th>
        </tr>
        ${users.map((u,i)=>`
          <tr style="${i%2===1?'background:var(--bg2)':''}">
            <td style="padding:9px 10px;border:1px solid var(--brd);font-weight:600;color:var(--txt)">${u.nom}</td>
            <td style="padding:9px 10px;border:1px solid var(--brd);color:var(--txt2)">${u.email}</td>
            <td style="padding:9px 10px;border:1px solid var(--brd)"><span class="badge ${u.role==='etudiant'?'bv':'bgr'}">${u.role}</span></td>
            <td style="padding:9px 10px;border:1px solid var(--brd);color:var(--txt3)">${u.filiere||'—'}</td>
            <td style="padding:9px 10px;border:1px solid var(--brd);text-align:center">
              <button class="btn b-er b-sm" style="padding:3px 8px;font-size:11px" onclick="delUser('${u.email}')">✕</button>
            </td>
          </tr>`).join('')}
      </table></div>`:'<p class="f13 c3">Aucun compte inscrit.</p>'}
    <div style="margin-top:14px;display:flex;gap:8px">
      ${users.length?`<button class="btn b-er b-sm" onclick="if(confirm('Supprimer TOUS les comptes ?')){localStorage.removeItem('enspd_users7');closeModal();toast('Tous les comptes supprimés.','ok');}">Tout supprimer</button>`:''}
      <button class="btn b-gh b-sm" onclick="closeModal()">Fermer</button>
    </div>`,true);
}
function delUser(email){
  const users=AUTH.getUsers().filter(u=>u.email!==email);
  localStorage.setItem('enspd_users7',JSON.stringify(users));
  toast('Compte supprimé.','ok');closeModal();openUsersModal();
}

/* ADMIN — Annonce top bar */
function openTopBarModal(){
  const current=document.querySelector('.top-bar span')?.textContent||'';
  openModal('Modifier l\'annonce principale',`
    <p class="f14 c2 mb16">Cette annonce est affichée dans la barre supérieure du site.</p>
    <div class="fg"><label>Texte de l'annonce</label>
      <textarea class="ft" id="ann-txt" style="min-height:80px">${S.esc(current.trim())}</textarea></div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <button class="btn b-vt" onclick="updateTopBarAnnonce()">✓ Mettre à jour</button>
      <button class="btn b-gh" onclick="closeModal()">Annuler</button>
    </div>`);
}
function updateTopBarAnnonce(){
  const t=document.getElementById('ann-txt')?.value.trim();
  if(!t){ toast('Le texte ne peut pas être vide.','err'); return; }
  document.querySelectorAll('.top-bar span').forEach(el=>{ el.textContent=t; });
  toast('Annonce mise à jour !','ok');
  closeModal();
}

/* ── ANIMATIONS ───────────────────────────────────────────── */
const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('vis');});},{threshold:0.1});
function initAnim(){document.querySelectorAll('.anim:not(.vis)').forEach(el=>obs.observe(el));}

/* ── COUNTUP — UNE SEULE FOIS dans stats-strip ────────────── */
let _counted=false;
const _statsObs=new IntersectionObserver(entries=>{
  if(entries[0].isIntersecting&&!_counted){
    _counted=true;
    document.querySelectorAll('[data-count]').forEach(el=>{
      const target=+el.dataset.count,suf=el.dataset.s||'';
      const dur=1800,start=performance.now();
      const run=now=>{const p=Math.min((now-start)/dur,1),ease=1-Math.pow(1-p,3);
        el.textContent=Math.round(ease*target)+suf;if(p<1)requestAnimationFrame(run);};
      requestAnimationFrame(run);
    });
  }
},{threshold:0.3});

/* ── TÉMOIGNAGES SLIDER ───────────────────────────────────── */
let _ti=0,_tTimer=null,_temoIdx=0,_temoInterval=null;
/* function renderTemos(){
  const track=document.getElementById('temo-track');
  const dots=document.getElementById('temo-dots');
  if(!track)return;
  track.innerHTML=D.temos.map(t=>`
    <div class="temo-slide"><div class="temo-card">
      <span class="tq">"</span>
      <p>${t.texte}</p>
      <div class="ta">
        <div class="tav">${t.init}</div>
        <div class="ti"><div class="n">${t.nom}</div><div class="p">${t.promo}</div></div>
      </div>
    </div></div>`).join('');
  if(dots)dots.innerHTML=D.temos.map((_,i)=>`<button class="temo-dot${i===0?' on':''}" onclick="goTemo(${i})"></button>`).join('');
  goTemo(0);
  if(_tTimer)clearInterval(_tTimer);
  _tTimer=setInterval(()=>goTemo((_ti+1)%D.temos.length),5000);
}
function goTemo(i){
  _ti=i;
  const track=document.getElementById('temo-track');if(!track)return;
  const pv=window.innerWidth<=768?1:3;
  track.style.transform=`translateX(-${i*(track.parentElement.offsetWidth/pv)}px)`;
  document.querySelectorAll('.temo-dot').forEach((d,j)=>d.classList.toggle('on',j===i));
} */

  function renderTemos() {
  const slider = document.getElementById('temo-slider');
  const dots   = document.getElementById('temo-dots');
  if (!slider) return;

  slider.innerHTML = D.temos.map(t => `
    <div class="temo-card">
      <div class="temo-card-inner">
        <span class="tq">"</span>
        <p>${S.esc(tr(t,'texte'))}</p>
        <div class="ta">
          <div class="tav">${S.esc(t.init)}</div>
          <div class="ti">
            <div class="n">${S.esc(tr(t,'nom'))}</div>
            <div class="p">${S.esc(tr(t,'promo'))}</div>
          </div>
        </div>
      </div>
    </div>`).join('');

  if (dots) {
    dots.innerHTML = D.temos.map((_,i) =>
      `<button class="temo-dot${i===0?' on':''}"
               onclick="goTemo(${i})" aria-label="Témoignage ${i+1}"></button>`
    ).join('');
  }

  _temoIdx = 0;
  if (_temoInterval) clearInterval(_temoInterval);
  _temoInterval = setInterval(() =>
    goTemo((_temoIdx + 1) % D.temos.length), 5000);
}

function _temoStep(){
  /* Mobile : 1 carte visible => 100% par cran. Desktop : 3 cartes => 33.333% */
  return window.matchMedia('(max-width: 768px)').matches ? 100 : 33.333;
}
function goTemo(i) {
  _temoIdx = i; _ti = i;
  const slider = document.getElementById('temo-slider');
  if (slider) {
    slider.style.transition = 'transform .48s cubic-bezier(.25,.46,.45,.94)';
    slider.style.transform = `translateX(-${i * _temoStep()}%)`;
  }
  document.querySelectorAll('.temo-dot').forEach((d,j) =>
    d.classList.toggle('on', j===i));
}
function slideTemo(dir){ goTemo((_ti + dir + D.temos.length) % D.temos.length); }
window.addEventListener('resize', () => goTemo(_ti));

/* ── SWIPE TACTILE (mobile uniquement) ─────────────────────── */
function _restartTemoAuto(){
  if(_temoInterval) clearInterval(_temoInterval);
  _temoInterval = setInterval(() => goTemo((_temoIdx + 1) % D.temos.length), 5000);
}
function _initTemoSwipe(){
  const wrap = document.querySelector('.temo-wrap');
  const slider = document.getElementById('temo-slider');
  if(!wrap || !slider || wrap.dataset.swipeInit) return;
  wrap.dataset.swipeInit = '1';

  let startX=0, startY=0, dx=0, dragging=false, locked=false, paused=false, w=0;

  const onStart = (e) => {
    if(!window.matchMedia('(max-width: 768px)').matches) return;
    const t = e.touches[0];
    startX = t.clientX; startY = t.clientY;
    dx = 0; dragging = true; locked = false;
    w = wrap.offsetWidth || 1;
    /* Pause de la rotation auto pendant que l'utilisateur maintient/déplace */
    if(_temoInterval){ clearInterval(_temoInterval); _temoInterval = null; paused = true; }
    slider.style.transition = 'none';
  };
  const onMove = (e) => {
    if(!dragging) return;
    const t = e.touches[0];
    const ddx = t.clientX - startX;
    const ddy = t.clientY - startY;
    if(!locked){
      if(Math.abs(ddx) > 8 || Math.abs(ddy) > 8){
        locked = true;
        if(Math.abs(ddy) > Math.abs(ddx)){ dragging = false; if(paused){ _restartTemoAuto(); paused=false; } return; }
      } else return;
    }
    if(e.cancelable) e.preventDefault();
    dx = ddx;
    const base = _ti * _temoStep();
    slider.style.transform = `translateX(calc(-${base}% + ${dx}px))`;
  };
  const onEnd = () => {
    if(!dragging){ if(paused){ _restartTemoAuto(); paused=false; } return; }
    dragging = false;
    const threshold = w * 0.18;
    let target = _ti;
    if(dx <= -threshold) target = Math.min(_ti + 1, D.temos.length - 1);
    else if(dx >= threshold) target = Math.max(_ti - 1, 0);
    goTemo(target);
    if(paused){ _restartTemoAuto(); paused = false; }
  };

  wrap.addEventListener('touchstart',  onStart, {passive:true});
  wrap.addEventListener('touchmove',   onMove,  {passive:false});
  wrap.addEventListener('touchend',    onEnd);
  wrap.addEventListener('touchcancel', onEnd);
}
document.addEventListener('DOMContentLoaded', _initTemoSwipe);
setTimeout(_initTemoSwipe, 300);


/* ── LIGHTBOX ─────────────────────────────────────────────── */
let _lbImgs=[],_lbIdx=0;
function openLB(imgs,idx){_lbImgs=imgs;_lbIdx=idx;updLB();document.getElementById('lightbox')?.classList.add('on');document.body.style.overflow='hidden';}
function updLB(){
  const img=_lbImgs[_lbIdx];
  document.getElementById('lb-img').src=img.src;
  document.getElementById('lb-caption').textContent=img.titre+(img.ev?' — '+img.ev:'');
  const dl=document.getElementById('lb-dl');if(dl){dl.href=img.src;dl.download=img.titre.replace(/\s+/g,'_')+'.jpg';}
  document.getElementById('lb-cnt').textContent=(_lbIdx+1)+' / '+_lbImgs.length;
}
function lbNav(dir){_lbIdx=(_lbIdx+dir+_lbImgs.length)%_lbImgs.length;updLB();}
function closeLB(){document.getElementById('lightbox')?.classList.remove('on');document.body.style.overflow='';}

/* ── RENDERS ──────────────────────────────────────────────── */
function renderFormApercu(){
  const el=document.getElementById('form-apercu');if(!el)return;
  el.innerHTML=D.filieres.slice(0,4).map((f,i)=>`
    <div class="fil-card anim d${i+1}" onclick="showFil(${f.id})">
      <div class="fil-top"></div>
      <div class="fil-body">
        <span class="fil-sigle">${f.sigle}</span>
        <div class="fil-level">${f.niveau}</div>
        <div class="fil-name">${f.nom}</div>
        <div class="fil-desc">${f.objectif.substring(0,95)}…</div>
      </div>
      <div class="fil-foot"><span class="fil-dur">⏱ ${f.duree}</span><span class="fil-cta">Voir le programme →</span></div>
    </div>`).join('');
  initAnim();
}

function renderWhy(){
  const el=document.getElementById('why-grid');if(!el)return;
  const t=LANG[_lang];
  el.innerHTML=D.why.map((w,i)=>`
    <div class="why-item anim d${(i%3)+1}">
      <div class="why-ico">${w.ico}</div>
      <div class="why-title">${t[w.k]||''}</div>
      <p class="why-desc">${t[w.d]||''}</p>
    </div>`).join('');
  initAnim();
}

/* Filières — couleur neutre uniforme */
function renderFil(filtre='tout'){
  const el=document.getElementById('fil-list');if(!el)return;
  const list=filtre==='tout'?D.filieres:D.filieres.filter(f=>f.niveau===filtre);
  el.innerHTML=list.map((f,i)=>`
    <div class="fil-card anim d${(i%3)+1}" onclick="showFil(${f.id})">
      <div class="fil-top"></div>
      <div class="fil-body">
        <span class="fil-sigle">${f.sigle}</span>
        <div class="fil-level">${f.niveau} · ${f.duree}</div>
        <div class="fil-name">${f.nom}</div>
        <div class="fil-desc">${f.objectif.substring(0,100)}…</div>
      </div>
      <div class="fil-foot"><span class="fil-dur">⏱ ${f.duree}</span><span class="fil-cta">Programme complet →</span></div>
    </div>`).join('');
  initAnim();
}
function filterFil(f,el){document.querySelectorAll('.ff').forEach(b=>b.className='btn b-gh b-sm ff');el.className='btn b-vt b-sm ff';renderFil(f);}

/* Modal filière — GRANDE et lisible avec tout le contenu */
function showFil(id){
  const f=D.filieres.find(x=>x.id===id);if(!f)return;
  const prog=f.programme.map(p=>`
    <div style="margin-bottom:14px">
      <div style="font-size:12px;font-weight:700;color:var(--navy-ink);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid var(--brd)">${p.s}</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${p.ues.map((u,i)=>`<span style="font-size:12.5px;padding:4px 11px;border-radius:100px;background:${i<3?'var(--mn-l)':'var(--bg2)'};color:${i<3?'var(--navy-ink-d)':'var(--txt2)'};border:1px solid var(--brd)">${u}</span>`).join('')}
      </div>
    </div>`).join('');
  openModal(f.nom,`
    <div class="m-sec">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px">
        <span class="badge bmn" style="font-size:13px;padding:5px 14px">${f.niveau} · ${f.sigle}</span>
        <span style="font-size:13px;color:var(--txt3)">⏱ ${f.duree}</span>
      </div>
      <p style="font-size:15.5px;line-height:1.85;color:var(--txt2)">${f.objectif}</p>
    </div>
    <div class="m-sec">
      <div class="m-sec-h">Conditions d'accès</div>
      <div class="alert a-mn" style="margin:0;font-size:14px">${f.admission}</div>
    </div>
    <div class="m-sec">
      <div class="m-sec-h">Compétences développées</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${f.competences.map(c=>`<div style="padding:9px 12px;border-radius:8px;background:var(--bg2);border-left:3px solid var(--vt);font-size:13px;color:var(--txt2)">✓ ${c}</div>`).join('')}
      </div>
    </div>
    <div class="m-sec">
      <div class="m-sec-h">Programme de formation</div>
      ${prog}
    </div>
    <div class="m-sec">
      <div class="m-sec-h"> Débouchés professionnels</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${f.debouches.map(d=>`<span class="badge bmn" style="padding:5px 12px;font-size:12.5px">${d}</span>`).join('')}
      </div>
    </div>
    <div class="m-sec">
      <div class="m-sec-h"> Perspectives</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${f.persp.map(p=>`<span class="badge bor" style="padding:5px 12px;font-size:12.5px">${p}</span>`).join('')}
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn b-vt b-sm" onclick="nav('admissions');closeModal()">Infos admission →</button>
      <button class="btn b-mn b-sm" onclick="nav('contact');closeModal()">Contacter l'école</button>
      <button class="btn b-gh b-sm" onclick="closeModal()">Fermer</button>
    </div>`,true);
}

function renderDebouches(){
  const el=document.getElementById('debouches-grid');if(!el)return;
  el.innerHTML=D.debouches.map(d=>`<div style="padding:14px;border-radius:var(--r);background:var(--vt-p);border:1px solid rgba(46,170,56,.14);text-align:center;font-size:13px;font-weight:600;color:var(--navy-ink)">${d}</div>`).join('');
}

/* Actualités — modal LARGE et lisible de long en large */
function renderActusHome(){const el=document.getElementById('actus-home');if(!el)return;el.innerHTML=D.actualites.slice(0,3).map((a,i)=>acCard(a,i)).join('');initAnim();}
function renderActus(cat=''){const el=document.getElementById('actus-list');if(!el)return;const list=cat?D.actualites.filter(a=>a.cat===cat):D.actualites;el.innerHTML=list.length?list.map((a,i)=>acCard(a,i)).join(''):'<p style="text-align:center;color:var(--txt3);padding:40px">Aucune actualité dans cette catégorie.</p>';initAnim();}
function acCard(a,i){
  return`<div class="card ac-card anim d${(i%3)+1}" onclick="showActu(${a.id})">
    <div class="ac-img">
      ${a.img?`<img src="${S.esc(a.img)}" alt="${S.esc(a.titre)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'ph\\'style=\\'height:195px\\'><div class=\\'ph-ico\\'></div></div>'">`
        :`<div class="ph" style="height:195px"><div class="ph-ico"></div><span style="font-size:12px">${S.esc(a.cat)}</span></div>`}
    </div>
    <div class="ac-body">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span class="badge bv" style="font-size:11px">${S.esc(a.cat)}</span>
        <span style="font-size:11px;color:var(--txt3)">${S.esc(a.date)}</span>
      </div>
      <h3>${S.esc(a.titre)}</h3>
      <p>${S.esc(a.texte.substring(0,88).replace(/\n/g,' '))}…</p>
      <div class="ac-foot"><span></span><span style="color:var(--vt-dd);font-weight:600;font-size:13px">Lire en entier →</span></div>
    </div>
  </div>`;
}
/* Modal actualité GRANDE et lisible — le texte complet */
function showActu(id){
  const a=D.actualites.find(x=>x.id===id);if(!a)return;
  openModal(a.titre,`
    <div style="display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap">
      <span class="badge bv" style="font-size:12.5px">${S.esc(a.cat)}</span>
      <span class="badge bgr">${S.esc(a.date)}</span>
    </div>
    ${a.img?`<img src="${S.esc(a.img)}" alt="${S.esc(a.titre)}" style="width:100%;border-radius:10px;margin-bottom:20px;object-fit:cover;max-height:280px" onerror="this.style.display='none'">`:''}
    <div style="font-size:15.5px;line-height:2;color:var(--txt2);white-space:pre-line">${S.esc(a.texte)}</div>
    <div style="margin-top:22px;display:flex;gap:8px">
      ${AUTH.isAdmin()?`<button class="btn b-er b-sm" onclick="delActu(${a.id});closeModal()">✕ Supprimer</button>`:''}
      <button class="btn b-gh b-sm" onclick="closeModal()">Fermer</button>
    </div>`,true);
}
function filterActus(cat,el){document.querySelectorAll('.af').forEach(b=>b.className='btn b-gh b-sm af');el.className='btn b-vt b-sm af';renderActus(cat);}

/* Admin */
function renderAdmin(){
  const dir=D.admin[0];
  const de=document.getElementById('adm-dir');
  const dp=localStorage.getItem('enspd_photo_dir');
  const small=document.getElementById('dir-avatar-small');
  if(small){small.innerHTML=dp?`<img src="${dp}" alt="Directeur" data-dirimg style="width:100%;height:100%;object-fit:cover;border-radius:50%;object-position:${dirPos()}">`:'ES';}
  if(de)de.innerHTML=`
    <div class="adm-dir anim">
      <div class="adm-dir-ico">${dp?`<img src="${dp}" alt="${dir.nom}" data-dirimg style="object-position:${dirPos()}">`:''}</div>
      <div>
        <h3>${dir.titre}</h3>
        <p class="n">${dir.nom}</p>
        <p style="font-size:12.5px;color:rgba(255,255,255,.6);font-style:italic;margin:3px 0">${dir.role}</p>
        <p>${dir.desc}</p>
        ${AUTH.isAdmin()?`<button class="btn b-sm mt12" style="background:rgba(255,255,255,.1);color:#fff;border-color:rgba(255,255,255,.3)" onclick="openPhotoModal()">Changer la photo</button>`:''}
      </div>
    </div>`;
  const se=document.getElementById('adm-svcs');
  if(se)se.innerHTML=D.admin.slice(1).map((a,i)=>`
    <div class="adm-card anim d${i+1}"><div class="adm-ico">${a.ico}</div><h3>${a.titre}</h3><p>${a.desc}</p></div>`).join('');
  initAnim();
}
function renderAdminPage() {
  const el = document.getElementById('p-admin');
  if (!el) return;
  if (!AUTH.isAdmin()) {
    el.innerHTML = `<div class="pg-hero"><div class="wi wrap">
      <div class="bc">Admin</div><h1>Accès refusé</h1>
      <p>Identifiants administrateur requis.</p>
    </div></div>`;
    return;
  }
  const users = AUTH._users();
  const logs  = Log.get().slice(0, 5);

  el.innerHTML = `
  <div class="pg-hero"><div class="wi wrap">
    <div class="bc">Accueil / Administration</div>
    <h1>Tableau de bord Admin ENSPD</h1>
    <p>Gérez le contenu, les photos, les utilisateurs et les annonces du site.</p>
  </div></div>

  <section class="sec bg-bg"><div class="wrap">

    <!-- KPIs -->
    <div class="adm-kpi-grid">
      <div class="adm-kpi" style="--accent:#3CB944">
        <div class="adm-kpi-bar"></div>
        <div class="adm-kpi-n" style="color:var(--green-ink)">${D.actualites.length}</div>
        <div class="adm-kpi-l">Actualités</div>
      </div>
      <div class="adm-kpi" style="--accent:#1B1E6E">
        <div class="adm-kpi-bar"></div>
        <div class="adm-kpi-n" style="color:var(--navy-ink)">${users.length}</div>
        <div class="adm-kpi-l">Comptes inscrits</div>
      </div>
      <div class="adm-kpi" style="--accent:#F0A500">
        <div class="adm-kpi-bar"></div>
        <div class="adm-kpi-n" style="color:#F0A500">${D.events.length}</div>
        <div class="adm-kpi-l">Événements</div>
      </div>
      <div class="adm-kpi" style="--accent:#0E7490">
        <div class="adm-kpi-bar"></div>
        <div class="adm-kpi-n" style="color:#0E7490">${Object.values(D.galerie).reduce((s,a)=>s+a.length,0)}</div>
        <div class="adm-kpi-l">Photos galerie</div>
      </div>
    </div>

    <!-- Actions rapides -->
    <h3 class="adm-section-title">Actions rapides</h3>
    <div class="adm-quick-grid">
      <div class="adm-qa" onclick="openPubModal()">
        <div class="adm-qa-ico"></div>
        <div class="adm-qa-lbl">Publier actualité</div>
      </div>
      <div class="adm-qa" onclick="openPubEvModal()">
        <div class="adm-qa-ico"></div>
        <div class="adm-qa-lbl">Ajouter événement</div>
      </div>
      <div class="adm-qa" onclick="openPhotoAdminModal()">
        <div class="adm-qa-ico"></div>
        <div class="adm-qa-lbl">Photo Directeur</div>
      </div>
      <div class="adm-qa" onclick="openGalAdminModal()">
        <div class="adm-qa-ico"></div>
        <div class="adm-qa-lbl">Gérer galerie</div>
      </div>
      <div class="adm-qa" onclick="openUsersModal()">
        <div class="adm-qa-ico"></div>
        <div class="adm-qa-lbl">Utilisateurs</div>
      </div>
      <div class="adm-qa" onclick="openTopBarModal()">
        <div class="adm-qa-ico"></div>
        <div class="adm-qa-lbl">Bandeau annonce</div>
      </div>
      <div class="adm-qa" onclick="openChangePassModal()">
        <div class="adm-qa-ico"></div>
        <div class="adm-qa-lbl">Changer mdp</div>
      </div>
      <div class="adm-qa" onclick="openLogsModal()">
        <div class="adm-qa-ico"></div>
        <div class="adm-qa-lbl">Journal logs</div>
      </div>
    </div>

    <!-- Deux colonnes -->
    <div class="adm-two-col">

      <!-- Actualités -->
      <div>
        <div class="adm-col-head">
          <span class="adm-col-title">Actualités publiées (${D.actualites.length})</span>
          <button class="btn b-vt b-sm" onclick="openPubModal()">+ Ajouter</button>
        </div>
        <div class="adm-panel">
          ${D.actualites.slice(0,6).map(a => `
            <div class="adm-row">
              <div class="adm-row-left">
                <div class="adm-row-title">${S.esc(tr(a,'titre').substring(0,40))}${tr(a,'titre').length>40?'…':''}</div>
              </div>
              <span class="badge bv" style="font-size:10px;flex-shrink:0">${S.esc(tr(a,'cat'))}</span>
              <button class="btn b-er b-sm" style="padding:2px 8px;font-size:11px;flex-shrink:0"
                      onclick="delActu(${a.id})">✕</button>
            </div>`).join('')}
        </div>
      </div>

      <!-- Logs -->
      <div>
        <div class="adm-col-head">
          <span class="adm-col-title">Journal d'activité récent</span>
          <button class="btn b-gh b-sm" onclick="openLogsModal()">Tout voir</button>
        </div>
        <div class="adm-panel">
          ${logs.length ? logs.map(l => `
            <div class="adm-row">
              <div class="adm-row-left">
                <div class="adm-row-title">${S.esc(l.action)}</div>
                ${l.detail?`<div class="adm-row-sub">${S.esc(l.detail.substring(0,28))}</div>`:''}
              </div>
              <span style="font-size:11px;color:var(--txt3);white-space:nowrap;margin-left:10px">
                ${new Date(l.at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
              </span>
            </div>`).join('')
          : '<p class="f13 c3 mt8">Aucune activité enregistrée.</p>'}
          ${users.length===0
            ? `<div class="adm-row" style="border-top:1px solid var(--brd);margin-top:6px;padding-top:10px">
                <span style="font-size:12px;color:var(--txt3)">Aucun compte utilisateur inscrit</span>
              </div>`
            : `<div class="adm-row" style="border-top:1px solid var(--brd);margin-top:6px;padding-top:10px">
                <span style="font-size:12px;color:var(--txt3)">${users.length} compte(s) inscrit(s)</span>
                <button class="btn b-gh b-sm" style="font-size:11px" onclick="openUsersModal()">Voir →</button>
              </div>`}
        </div>
      </div>
    </div>

  </div></section>`;
}
function renderLabos(){
  const el=document.getElementById('labos-list');if(!el)return;
  el.innerHTML=D.labos.map((l,i)=>`
    <div class="card cp anim d${i+1}" style="border-left:4px solid ${l.col}">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
        <span style="font-weight:800;color:${l.col};background:${l.bg};padding:5px 14px;border-radius:100px;font-size:13px">${l.sigle}</span>
        <span style="font-size:12px;color:var(--txt3)">Créé en ${l.annee}</span>
      </div>
      <h3 style="font-size:16px;font-weight:700;margin-bottom:10px;color:var(--txt)">${l.titre}</h3>
      <p style="font-size:14px;color:var(--txt2);line-height:1.75">${l.desc}</p>
    </div>`).join('');
  const pe=document.getElementById('partners-list');
  if(pe)pe.innerHTML=D.partners.map(p=>`<span class="badge bv" style="font-size:12.5px;padding:6px 12px">${p}</span>`).join('');
  initAnim();
}

/* ── renderAdmin() — section L'École → Administration & Services ── */
function renderAdmin() {
  const dir = D.admin[0];
  const dp  = localStorage.getItem('enspd_photo_dir');

  /* Photo directeur sur la page accueil */
  const dirAv = document.getElementById('dir-avatar');
  if (dirAv) {
    dirAv.innerHTML = `<img src="assets/galerie/Photo du directeur.jpeg" alt="Directeur" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`
  }

  /* Carte directeur sur la page L'École */
  const de = document.getElementById('adm-dir');
  if (de) de.innerHTML = `
    <div class="adm-dir anim">
      <div class="adm-dir-ico">
        ${dp ? `<img src="${dp}" alt="${dir.nom}" data-dirimg style="object-position:${dirPos()}">` : '<svg width=\"34\" height=\"34\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"><path d=\"M3 21h18M5 21V9l7-4 7 4v12M9 21v-5h6v5\"/></svg>'}
      </div>
      <div>
        <h3>${dir.titre}</h3>
        <p class="n">${dir.nom}</p>
        <p style="font-size:12.5px;color:rgba(255,255,255,.6);font-style:italic;margin:3px 0">
          ${dir.role}
        </p>
        <p>${dir.desc}</p>
        ${AUTH.isAdmin()
          ? `<label style="display:inline-flex;align-items:center;gap:7px;cursor:pointer;
               font-size:12px;font-weight:600;margin-top:12px;padding:6px 14px;
               border-radius:7px;border:1.5px solid rgba(255,255,255,.3);color:#fff">
               Changer la photo
               <input type="file" accept="image/*"
                      onchange="uploadDirPhoto(this)" style="display:none">
             </label>` : ''}
      </div>
    </div>`;

  /* Services */
  const se = document.getElementById('adm-svcs');
  if (se) se.innerHTML = D.admin.slice(1).map((a,i) => `
    <div class="adm-card anim d${i+1}">
      <h3>${a.titre}</h3>
      <p>${a.desc}</p>
    </div>`).join('');

  initAnim();
}

/* ── renderAdminPage() — page Dashboard Admin ── */
function renderAdminPage() {
  const el = document.getElementById('p-admin');
  if (!el) return;

  if (!AUTH.isAdmin()) {
    el.innerHTML = `
      <div class="pg-hero"><div class="wi wrap">
        <div class="bc">Admin</div>
        <h1>Accès refusé</h1>
        <p>Identifiants administrateur requis.</p>
      </div></div>`;
    return;
  }

  const users = AUTH.getUsers();

  /* ── Log sécurisé (si Log n'existe pas) */
  const logs = (typeof Log !== 'undefined') ? Log.get().slice(0,5) : [];

  /* ── Helper sécurisé ── */
  const esc  = (s) => String(s||'')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const lang = (typeof _lang !== 'undefined') ? _lang : 'fr';
  const tget = (obj,k) => (lang==='en' && obj[k+'_en']) ? obj[k+'_en'] : (obj[k]||'');

  el.innerHTML = `
  <div class="pg-hero"><div class="wi wrap">
    <div class="bc">Accueil / Administration</div>
    <h1>Tableau de bord Admin ENSPD</h1>
    <p>Gérez le contenu, les photos, les utilisateurs et les annonces du site.</p>
  </div></div>

  <section class="sec bg-bg"><div class="wrap">

    <!-- KPIs -->
    <div class="adm-kpi-grid">
      <div class="adm-kpi">
        <div class="adm-kpi-bar" style="background:#3CB944"></div>
        <div class="adm-kpi-n" style="color:var(--green-ink)">${D.actualites.length}</div>
        <div class="adm-kpi-l">Actualités</div>
      </div>
      <div class="adm-kpi">
        <div class="adm-kpi-bar" style="background:#1B1E6E"></div>
        <div class="adm-kpi-n" style="color:var(--navy-ink)">${users.length}</div>
        <div class="adm-kpi-l">Comptes inscrits</div>
      </div>
      <div class="adm-kpi">
        <div class="adm-kpi-bar" style="background:#F0A500"></div>
        <div class="adm-kpi-n" style="color:#F0A500">${D.events.length}</div>
        <div class="adm-kpi-l">Événements</div>
      </div>
      <div class="adm-kpi">
        <div class="adm-kpi-bar" style="background:#0E7490"></div>
        <div class="adm-kpi-n" style="color:#0E7490">${Object.values(D.galerie).reduce((s,a)=>s+a.length,0)}</div>
        <div class="adm-kpi-l">Photos galerie</div>
      </div>
    </div>

    <!-- Actions rapides -->
    <h3 class="adm-section-title">Actions rapides</h3>
    <div class="adm-quick-grid">
      <div class="adm-qa" onclick="if(typeof openPubModal!=='undefined')openPubModal()">
        <div class="adm-qa-ico"></div><div class="adm-qa-lbl">Publier actualité</div>
      </div>
      <div class="adm-qa" onclick="if(typeof openPubEvModal!=='undefined')openPubEvModal()">
        <div class="adm-qa-ico"></div><div class="adm-qa-lbl">Ajouter événement</div>
      </div>
      <div class="adm-qa" onclick="
        if(typeof openPhotoAdminModal!=='undefined')openPhotoAdminModal();
        else if(typeof openPhotoModal!=='undefined')openPhotoModal()">
        <div class="adm-qa-ico"></div><div class="adm-qa-lbl">Photo Directeur</div>
      </div>
      <div class="adm-qa" onclick="
        if(typeof openGalAdminModal!=='undefined')openGalAdminModal();
        else if(typeof openGalModal!=='undefined')openGalModal()">
        <div class="adm-qa-ico"></div><div class="adm-qa-lbl">Gérer galerie</div>
      </div>
      <div class="adm-qa" onclick="if(typeof openUsersModal!=='undefined')openUsersModal()">
        <div class="adm-qa-ico"></div><div class="adm-qa-lbl">Utilisateurs</div>
      </div>
      <div class="adm-qa" onclick="if(typeof openTopBarModal!=='undefined')openTopBarModal()">
        <div class="adm-qa-ico"></div><div class="adm-qa-lbl">Bandeau annonce</div>
      </div>
      <div class="adm-qa" onclick="if(typeof openChangePassModal!=='undefined')openChangePassModal()">
        <div class="adm-qa-ico"></div><div class="adm-qa-lbl">Changer mdp</div>
      </div>
      <div class="adm-qa" onclick="if(typeof openLogsModal!=='undefined')openLogsModal()">
        <div class="adm-qa-ico"></div><div class="adm-qa-lbl">Journal logs</div>
      </div>
    </div>

    <!-- Deux colonnes -->
    <div class="adm-two-col">

      <!-- Actualités -->
      <div>
        <div class="adm-col-head">
          <span class="adm-col-title">Actualités (${D.actualites.length})</span>
          <button class="btn b-vt b-sm"
                  onclick="if(typeof openPubModal!=='undefined')openPubModal()">+ Ajouter</button>
        </div>
        <div class="adm-panel">
          ${D.actualites.length
            ? D.actualites.slice(0,6).map(a => `
                <div class="adm-row">
                  <div class="adm-row-left">
                    <div class="adm-row-title">
                      ${S.esc(tr(a,'titre').substring(0,42))}
                      ${tr(a,'titre').length>42?'…':''}
                    </div>
                  </div>
                  <span class="badge bv" style="font-size:10px;flex-shrink:0">
                    ${S.esc(tr(a,'cat'))}
                  </span>
                  <button class="btn b-er b-sm"
                          style="padding:2px 7px;font-size:11px;flex-shrink:0"
                          onclick="if(typeof delActu!=='undefined')delActu(${a.id})">✕</button>
                </div>`).join('')
            : '<p class="f13 c3 mt8">Aucune actualité publiée.</p>'}
        </div>
      </div>

      <!-- Logs + Utilisateurs -->
      <div>
        <div class="adm-col-head">
          <span class="adm-col-title">Activité récente</span>
          <button class="btn b-gh b-sm"
                  onclick="if(typeof openLogsModal!=='undefined')openLogsModal()">Tout voir</button>
        </div>
        <div class="adm-panel">
          ${logs.length
            ? logs.map(l => `
                <div class="adm-row">
                  <div class="adm-row-left">
                    <div class="adm-row-title">${S.esc(l.action)}</div>
                    ${l.detail
                      ? `<div class="adm-row-sub">${S.esc(l.detail.substring(0,32))}</div>`
                      : ''}
                  </div>
                  <span style="font-size:11px;color:var(--txt3);white-space:nowrap;margin-left:8px">
                    ${new Date(l.at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
                  </span>
                </div>`).join('')
            : '<p class="f13 c3 mt8">Aucun log enregistré.</p>'}

          <!-- Résumé utilisateurs -->
          <div class="adm-row" style="border-top:1px solid var(--brd);margin-top:6px;padding-top:10px">
            <span style="font-size:12px;color:var(--txt3)">
              ${users.length
                ? users.length + ' compte(s) inscrit(s)'
                : 'Aucun compte utilisateur inscrit'}
            </span>
            ${users.length
              ? `<button class="btn b-gh b-sm" style="font-size:11px;margin-left:auto"
                         onclick="if(typeof openUsersModal!=='undefined')openUsersModal()">Voir →</button>`
              : ''}
          </div>
        </div>
      </div>
    </div>

  </div></section>`;
}
function renderCond(){
  const el=document.getElementById('cond-list');if(!el)return;
  el.innerHTML=D.cond.map((c,i)=>`
    <div class="card cp anim d${i+1}" style="border-left:4px solid ${c.col}">
      <span class="stag" style="margin-bottom:8px;display:inline-block">${c.titre}</span>
      <p style="font-size:14px;color:var(--txt2);line-height:1.8;margin-top:4px">${c.desc}</p>
    </div>`).join('');
  initAnim();
}

function renderSteps(){
  const el=document.getElementById('steps-list');if(!el)return;
  const cs=['#2EAA38','#1B1E6E','#2EAA38','#1B1E6E'];
  el.innerHTML=D.steps.map((s,i)=>`
    <div class="card cp anim d${i+1}" style="border-top:3px solid ${cs[i]}">
      <div style="font-size:32px;font-weight:900;color:${cs[i]};opacity:.12;line-height:1;margin-bottom:8px">${s.n}</div>
      <h4 style="font-size:14px;font-weight:700;color:${cs[i]};margin-bottom:5px">${s.titre}</h4>
      <p style="font-size:13px;color:var(--txt2);line-height:1.6">${s.desc}</p>
    </div>`).join('');
  initAnim();
}

function renderDocs(){
  const el=document.getElementById('docs-list');if(!el)return;
  el.innerHTML=D.docs.map((d,i)=>`
    <div class="res-item anim" onclick="toast('Modèle bientôt disponible','inf')">
      <div class="res-ico" style="background:var(--vt-l);color:var(--vt-dd);font-weight:700;font-size:14px">${i+1}</div>
      <div class="res-info"><h4>${d.t}</h4><p>${d.p}</p></div>
      <button class="btn b-omn b-sm" onclick="event.stopPropagation();toast('Modèle bientôt disponible','inf')">Modèle</button>
    </div>`).join('');
  initAnim();
}

/* Événements — modal LARGE et lisible */
function renderEvents(){
  const el=document.getElementById('events-list');if(!el)return;
  const cols={BUE:'#1B1E6E',Signature:'#E8960A',Académique:'#2EAA38',Ouvert:'#1B5FA0'};
  /* el.innerHTML=D.events.map((e,i)=>`
    <div class="ev-item anim" onclick="showEvent(${i})">
      <div class="ev-dt" style="background:${cols[e.type]||'#1B1E6E'}">
        <div class="dd">${S.esc(e.j)}</div><div class="dm">${S.esc(e.m)}</div>
      </div>
      <div class="ev-info" style="flex:1">
        <h4>${S.esc(e.titre)}</h4>
        <p>${S.esc(e.desc.substring(0,75))}…</p>
        <div class="ev-meta">
          <span>${S.esc(e.heure)}</span><span>${S.esc(e.lieu.substring(0,35))}</span>
          <span class="badge" style="background:${cols[e.type]||'#1B1E6E'}22;color:${cols[e.type]||'#1B1E6E'}">${S.esc(e.type)}</span>
        </div>
      </div>
    </div>`).join(''); */
  initAnim();
}
function showEvent(i){
  const e=D.events[i];if(!e)return;
  const cols={BUE:'#1B1E6E',Signature:'#E8960A',Académique:'#2EAA38',Ouvert:'#1B5FA0'};
  const c=cols[e.type]||'#1B1E6E';
  openModal(e.titre,`
    <div class="m-sec">
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
        <span class="badge" style="background:${c}22;color:${c};font-size:12.5px">${S.esc(e.j)} ${S.esc(e.m)}</span>
        <span class="badge bgr">${S.esc(e.heure)}</span>
        <span class="badge bgr">${S.esc(e.lieu)}</span>
        <span class="badge" style="background:${c}22;color:${c}">${S.esc(e.type)}</span>
      </div>
      <p style="font-size:15.5px;line-height:1.9;color:var(--txt2)">${S.esc(e.desc)}</p>
      ${e.detail?`<p style="font-size:14px;line-height:1.8;color:var(--txt3);margin-top:14px;padding-top:14px;border-top:1px solid var(--brd)">${S.esc(e.detail)}</p>`:''}
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      ${AUTH.isAdmin()?`<button class="btn b-er b-sm" onclick="delEvent(${i})" style="cursor:pointer">✕ Supprimer</button>`:''}
      <button class="btn b-gh b-sm" onclick="closeModal()">Fermer</button>
    </div>`,true);
}
function delEvent(i){
  if(i>=0&&i<D.events.length){D.events.splice(i,1);renderEvents();closeModal();toast('Événement supprimé.','ok');}
}

/* Galerie par catégories + lightbox */
let _galCat='Tout';
function renderGal(cat){
  if(cat!==undefined)_galCat=cat;
  const catsEl=document.getElementById('gal-cats');
  const grid=document.getElementById('gal-grid');
  if(!catsEl||!grid)return;
  const allCats=['Tout',...Object.keys(D.galerie)];
  catsEl.innerHTML=allCats.map(c=>`<button class="gal-cat-btn${c===_galCat?' on':''}" onclick="renderGal('${c}')">${c}</button>`).join('');
  let imgs=[];
  if(_galCat==='Tout')Object.values(D.galerie).forEach(v=>imgs.push(...v));
  else imgs=D.galerie[_galCat]||[];
  grid.innerHTML=imgs.map((g,i)=>`
    <div class="gal-item" onclick="openLB(getCurGalImgs(),${i})">
      <img src="${g.src}" alt="${g.titre}" loading="lazy"
        onerror="this.parentElement.innerHTML='<div class=\\'ph\\'><div class=\\'ph-ico\\'></div><span>${g.titre}</span></div>'">
      <div class="gal-ov"><span>${g.titre}</span><small>${g.ev}</small></div>
    </div>`).join('');
}
function getCurGalImgs(){if(_galCat==='Tout'){let a=[];Object.values(D.galerie).forEach(v=>a.push(...v));return a;}return D.galerie[_galCat]||[];}

/* Contact */
function envoyerContact(e){
  e.preventDefault();
  const nom=document.getElementById('c-nom')?.value.trim()||'';
  const email=document.getElementById('c-email')?.value.trim()||'';
  const msg=document.getElementById('c-msg')?.value.trim()||'';
  if(!nom||!email||!msg){toast('Remplissez tous les champs.','err');return;}
  if(!isEmail(email)){toast('Email invalide.','err');return;}
  toast('Message envoyé ! Réponse sous 48h, '+nom.split(' ')[0]+'.','ok');e.target.reset();
}

/* ── NEW FEATURE RENDERS ─────────────────────────────────── */
function renderPartnersWall() {
  const el = document.getElementById('partners-logo-wall');
  if (!el) return;
  el.innerHTML = D.partnerLogos.map(p => `
    <div class="partner-logo-chip" title="${S.esc(p.full)}">
      <span class="plc-icon" aria-hidden="true">${p.icon}</span>
      <span class="plc-name">${S.esc(p.nom)}</span>
    </div>`).join('');
}

function renderFaq() {
  const el = document.getElementById('faq-list');
  if (!el) return;
  el.innerHTML = D.faq.map((f, i) => `
    <div class="faq-item" role="listitem">
      <button class="faq-q" aria-expanded="false" onclick="toggleFaq(this)"
              id="faq-q-${i}" aria-controls="faq-a-${i}">
        <span>${S.esc(f.q)}</span>
        <span class="faq-chevron" aria-hidden="true">▾</span>
      </button>
      <div class="faq-a" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}" hidden>
        <p>${S.esc(f.r)}</p>
      </div>
    </div>`).join('');
}

function toggleFaq(btn) {
  const expanded = btn.getAttribute('aria-expanded') === 'true';
  btn.setAttribute('aria-expanded', !expanded);
  const panel = document.getElementById(btn.getAttribute('aria-controls'));
  if (panel) panel.hidden = expanded;
  btn.querySelector('.faq-chevron').style.transform = expanded ? '' : 'rotate(180deg)';
}

function renderPublications() {
  const el = document.getElementById('pub-list');
  if (!el) return;
  const labColors = { LaReSPD: 'var(--vt)', ODeSPoL: 'var(--mn)' };
  el.innerHTML = D.publications.map(p => `
    <div class="pub-item anim">
      <div class="pub-meta">
        <span class="pub-badge" style="background:${labColors[p.labo]||'var(--or)'}22;color:${labColors[p.labo]||'var(--or)'};border-color:${labColors[p.labo]||'var(--or)'}44">${S.esc(p.labo)}</span>
        <span class="pub-type">${S.esc(p.type)}</span>
        <span class="pub-year">${S.esc(p.annee)}</span>
      </div>
      <h4 class="pub-titre">${S.esc(p.titre)}</h4>
      <p class="pub-auteurs">${S.esc(p.auteurs)}</p>
      ${p.url ? `<a href="${S.esc(p.url)}" target="_blank" rel="noopener noreferrer" class="btn b-gh b-sm mt8">Lire →</a>` : `<span class="pub-soon">Texte complet bientôt disponible</span>`}
    </div>`).join('');
  initAnim();
}

/* ── WELCOME OVERLAY ─────────────────────────────────────── */
function chooseVisitor(){
  const el=document.getElementById('welcome-overlay');
  if(el){el.style.transition='opacity .35s';el.style.opacity='0';el.style.pointerEvents='none';setTimeout(()=>el.remove(),380);}
  localStorage.setItem('enspd_welcomed','1');
}
function closeWelcome(){chooseVisitor();}

/* ── COOKIE BANNER ───────────────────────────────────────── */
function _hideCookieBanner(){
  const el=document.getElementById('cookie-banner');
  if(el){el.style.transition='opacity .3s,transform .3s';el.style.opacity='0';el.style.transform='translateY(20px)';setTimeout(()=>el.remove(),340);}
}
function acceptCookies(){localStorage.setItem('enspd_cookies','accepted');_hideCookieBanner();}
function rejectCookies(){localStorage.setItem('enspd_cookies','rejected');_hideCookieBanner();}
function closeCookie(){_hideCookieBanner();}

/* ── PAGE LÉGALE ─────────────────────────────────────────── */
function renderLegal(){
  const el=document.getElementById('legal-content');if(!el)return;
  el.innerHTML=`
    <h2 class="sh-h2 mb16" style="font-size:20px">Éditeur du site</h2>
    <p style="color:var(--txt2);line-height:1.85;margin-bottom:28px">
      <strong>ENSPD — École Nationale de Statistique, de Planification et de Démographie</strong><br>
      Université de Parakou, Bénin<br>
      Email : <a href="mailto:contact@enspd-up.bj" style="color:var(--vt-dd)">contact@enspd-up.bj</a><br>
      Directeur de la publication : Prof. Épiphane SODJINOU
    </p>
    <h2 class="sh-h2 mb16" style="font-size:20px">Hébergement</h2>
    <p style="color:var(--txt2);line-height:1.85;margin-bottom:28px">
      Site statique hébergé sur les serveurs de l'Université de Parakou, Bénin.
    </p>
    <h2 class="sh-h2 mb16" style="font-size:20px">Politique de confidentialité</h2>
    <p style="color:var(--txt2);line-height:1.85;margin-bottom:12px">
      L'ENSPD s'engage à protéger la vie privée des utilisateurs de ce site. Les données collectées sont strictement limitées aux finalités suivantes :
    </p>
    <ul style="color:var(--txt2);line-height:2.1;padding-left:20px;margin-bottom:28px">
      <li>Mémorisation des préférences de navigation (thème sombre/clair, langue)</li>
      <li>Gestion des sessions utilisateurs (comptes étudiants, enseignants, visiteurs)</li>
      <li>Traitement interne du formulaire de contact (aucune transmission à un tiers)</li>
    </ul>
    <div class="alert a-vt mb28">
      <span><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="1"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></span>
      <div><strong>Aucune donnée personnelle n'est transmise à des tiers,</strong> à des régies publicitaires ou à des systèmes de tracking. Les données de session sont stockées uniquement en localStorage sur votre appareil.</div>
    </div>
    <h2 class="sh-h2 mb16" style="font-size:20px">Gestion des cookies</h2>
    <p style="color:var(--txt2);line-height:1.85;margin-bottom:28px">
      Ce site utilise exclusivement des cookies fonctionnels nécessaires au bon fonctionnement : thème, langue et session de connexion. Vous pouvez les supprimer à tout moment via les paramètres de votre navigateur.
    </p>
    <h2 class="sh-h2 mb16" style="font-size:20px">Droits d'auteur</h2>
    <p style="color:var(--txt2);line-height:1.85;margin-bottom:28px">
      © 2026 ENSPD — Université de Parakou. Tous droits réservés. Toute reproduction, même partielle, du contenu de ce site sans autorisation préalable de la direction est interdite.
    </p>
    <h2 class="sh-h2 mb16" style="font-size:20px">Contact</h2>
    <p style="color:var(--txt2);line-height:1.85">
      Pour toute question relative aux données personnelles ou aux mentions légales :<br>
      <a href="mailto:contact@enspd-up.bj" style="color:var(--vt-dd);font-weight:600">contact@enspd-up.bj</a>
    </p>`;
}

/* ── ADMIN — Changer mot de passe ─────────────────────────── */
function openChangePassModal(){
  openModal('Changer le mot de passe administrateur',`
    <div class="fg"><label>Mot de passe actuel</label>
      <input class="fi" type="password" id="cp-old" autocomplete="current-password" placeholder="Mot de passe actuel"></div>
    <div class="fg"><label>Nouveau mot de passe (min. 10 caractères)</label>
      <input class="fi" type="password" id="cp-new" autocomplete="new-password" placeholder="Nouveau mot de passe"></div>
    <div class="fg"><label>Confirmer le nouveau mot de passe</label>
      <input class="fi" type="password" id="cp-c" autocomplete="new-password" placeholder="Répétez le nouveau mot de passe"></div>
    <div id="cp-err" class="alert a-er" style="display:none;margin-bottom:12px"></div>
    <div style="display:flex;gap:8px">
      <button class="btn b-vt" onclick="doChangePass()">Mettre à jour</button>
      <button class="btn b-gh" onclick="closeModal()">Annuler</button>
    </div>`);
}
function doChangePass(){
  const old=document.getElementById('cp-old')?.value||'';
  const n=document.getElementById('cp-new')?.value||'';
  const c=document.getElementById('cp-c')?.value||'';
  const er=document.getElementById('cp-err');
  const e=m=>{er.textContent=m;er.style.display='block';};
  if(!old||!n||!c){e('Remplissez tous les champs.');return;}
  if(hashP('enspd::'+old)!==localStorage.getItem(AUTH._ADMIN_KEY)){e('Mot de passe actuel incorrect.');return;}
  if(n.length<10){e('Nouveau mot de passe trop court (min. 10 caractères).');return;}
  if(passStr(n)<3){e('Mot de passe trop faible (ajoutez majuscules, chiffres, symboles).');return;}
  if(n!==c){e('Les mots de passe ne correspondent pas.');return;}
  AUTH.setAdminPassword(n);
  closeModal();
  toast('Mot de passe administrateur mis à jour.','ok');
}

/* ── ADMIN — Journal d'activité ───────────────────────────── */
function openLogsModal(){
  const users=AUTH.getUsers();
  openModal('Journal d\'activité',`
    <div class="alert a-mn mb20">
      <span>ℹ</span>
      <div>Session actuelle — ${new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</div>
    </div>
    <div style="padding:14px 0;border-bottom:1px solid var(--brd)">
      <span style="font-weight:600;color:var(--txt)">Comptes inscrits :</span>
      <span style="color:var(--txt2);margin-left:8px">${users.length} compte(s)</span>
    </div>
    <div style="padding:14px 0;border-bottom:1px solid var(--brd)">
      <span style="font-weight:600;color:var(--txt)">Actualités publiées :</span>
      <span style="color:var(--txt2);margin-left:8px">${D.actualites.length}</span>
    </div>
    <div style="padding:14px 0;border-bottom:1px solid var(--brd)">
      <span style="font-weight:600;color:var(--txt)">Événements :</span>
      <span style="color:var(--txt2);margin-left:8px">${D.events.length}</span>
    </div>
    <div style="padding:14px 0;margin-bottom:16px">
      <span style="font-weight:600;color:var(--txt)">Photos galerie :</span>
      <span style="color:var(--txt2);margin-left:8px">${Object.values(D.galerie).reduce((s,a)=>s+a.length,0)}</span>
    </div>
    <p class="f13 c3">Un système de logs persistants sera disponible dans une prochaine version.</p>
    <button class="btn b-gh b-sm mt16" onclick="closeModal()">Fermer</button>`);
}

/* ── ADMIN — Photo directeur (alias) ─────────────────────── */
function openPhotoAdminModal(){openPhotoModal();}

/* ── WHY-SLIDER (carrousel auto 2s — section Pourquoi l'ENSPD) ─ */
function initWhySlider(){
  const slider=document.getElementById('why-slider');
  if(!slider)return;
  const slides=slider.querySelectorAll('.why-slide');
  const dots  =slider.querySelectorAll('.why-slider-dot');
  if(slides.length<2)return;
  let i=0;
  let timer=null;
  const INTERVAL=2000; // 2 secondes
  const show=(n)=>{
    slides.forEach((s,k)=>s.classList.toggle('active',k===n));
    dots  .forEach((d,k)=>d.classList.toggle('active',k===n));
    i=n;
  };
  const next=()=>show((i+1)%slides.length);
  const start=()=>{ if(!timer) timer=setInterval(next,INTERVAL); };
  const stop =()=>{ if(timer){clearInterval(timer);timer=null;} };
  // Clic sur les dots
  dots.forEach((d,k)=>d.addEventListener('click',()=>{stop();show(k);start();}));
  // Pause au survol pour faciliter la lecture
  slider.addEventListener('mouseenter',stop);
  slider.addEventListener('mouseleave',start);
  // Pause quand l'onglet est caché (économie CPU)
  document.addEventListener('visibilitychange',()=>{ if(document.hidden) stop(); else start(); });
  // Respect du paramètre système "réduire les animations"
  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches) start();
  // Sécurité : si une seule slide réellement visible, on coupe le timer
  if(slides.length<2 && timer){clearInterval(timer);timer=null;}
}

/* ── AI CHATBOT (Delfa API) ──────────────────────────────── */
/* Contexte compact (gardé court pour rester sous les limites d'URL) */
const CHAT_CTX='[ENSPD-Assistant] Tu es l\'assistant de l\'ENSPD (Statistique, Planification, Démographie), Univ. Parakou, Bénin. Fondée 2012. Directeur: Prof. SODJINOU. 8 formations LMD (2 Licences SA/PSE, 5 Masters, 1 Doctorat). Admission Licence: Bac C/D, concours MESRS/DEC, apresmonbac.bj. Paiement: paiement.tresorbenin.bj. Partenaires: INSAE, Laval, Pan African U. BUE+CRISTAL (vie étudiante). JSSED sep.2026. Contact: Lun-Ven 08h-17h. Réponds en français, concis et utile.';

let _chatOpen=false,_chatHist=[],_chatBusy=false;

function toggleChat(){
  _chatOpen=!_chatOpen;
  const win=document.getElementById('chat-window');
  const fab=document.getElementById('chat-fab');
  if(win){win.classList.toggle('open',_chatOpen);win.setAttribute('aria-hidden',!_chatOpen);}
  if(fab)fab.setAttribute('aria-expanded',String(_chatOpen));
  if(_chatOpen&&_chatHist.length===0){
    _chatPush('bot','Bonjour ! 👋 Je suis l\'assistant virtuel de l\'ENSPD. Posez-moi vos questions sur les formations, admissions, vie étudiante ou tout autre sujet lié à notre école.');
  }
  if(_chatOpen)setTimeout(()=>document.getElementById('chat-input')?.focus(),300);
}
function _chatPush(role,text){_chatHist.push({role,text});_chatRender();}
function _chatRender(){
  const el=document.getElementById('chat-messages');if(!el)return;
  el.innerHTML=_chatHist.map(m=>{
    if(m.role==='bot')return`<div class="cm-row cm-bot"><div class="cm-av">🤖</div><div class="cm-bbl cm-bbl-bot">${S.esc(m.text).replace(/\n/g,'<br>')}</div></div>`;
    return`<div class="cm-row cm-usr"><div class="cm-bbl cm-bbl-usr">${S.esc(m.text)}</div></div>`;
  }).join('');
  if(_chatBusy)el.innerHTML+=`<div class="cm-row cm-bot"><div class="cm-av">🤖</div><div class="cm-bbl cm-bbl-bot cm-typing"><span></span><span></span><span></span></div></div>`;
  el.scrollTop=el.scrollHeight;
}
async function chatSend(){
  const inp=document.getElementById('chat-input');
  if(!inp||_chatBusy)return;
  const txt=inp.value.trim();if(!txt)return;
  inp.value='';inp.style.height='';
  _chatPush('user',txt);_chatBusy=true;_chatRender();
  /* Contexte + 4 derniers échanges + question actuelle, encodé proprement */
  const recent=_chatHist.slice(-5).map(m=>(m.role==='user'?'U':'A')+':'+m.text.slice(0,200)).join('|');
  const msg=CHAT_CTX+' Échanges récents: '+recent;
  try{
    const r=await fetch('/api/chat?message='+encodeURIComponent(msg)+'&model=default');
    if(!r.ok)throw new Error('HTTP '+r.status);
    const d=await r.json();
    _chatBusy=false;
    _chatPush('bot',d.answer||'Désolé, je n\'ai pas pu traiter votre demande. Veuillez réessayer.');
  }catch(err){
    _chatBusy=false;
    _chatPush('bot','Erreur de connexion'+(err.message?' ('+err.message+')':'')+'. Vérifiez votre connexion et réessayez.');
  }
}
function chatKey(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();chatSend();}}
function chatAutoResize(el){el.style.height='auto';el.style.height=Math.min(el.scrollHeight,120)+'px';}

/* ── ANIMATIONS AVANCÉES ─────────────────────────────────── */
function initAnimPlus(){
  /* Observer principal — scroll reveal avec unobserve */
  const mainObs=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.classList.add('vis');
        mainObs.unobserve(e.target);
      }
    });
  },{threshold:0.06,rootMargin:'0px 0px -30px 0px'});
  document.querySelectorAll('.anim-s:not(.vis),.anim-blur:not(.vis)').forEach(el=>mainObs.observe(el));

  /* Stagger automatique sur les grilles et listes */
  document.querySelectorAll('.g2,.g3,.g4,.vie-grid,.form-apercu-grid,.debouches-grid,.qa-wrap,.stats-in').forEach(grid=>{
    grid.querySelectorAll(':scope > *').forEach((child,i)=>{
      const delay=Math.min(i*0.09,0.55);
      child.style.transitionDelay=delay+'s';
    });
  });

  /* Parallax léger sur le hero */
  const heroImg=document.querySelector('.hero-bg img');
  if(heroImg){
    let ticking=false;
    window.addEventListener('scroll',()=>{
      if(!ticking){
        requestAnimationFrame(()=>{
          const s=window.scrollY;
          if(s<window.innerHeight*1.5)heroImg.style.transform='translateY('+Math.round(s*0.22)+'px)';
          ticking=false;
        });
        ticking=true;
      }
    },{passive:true});
  }

  /* Révèle les cartes stat-bande */
  const sbObs=new IntersectionObserver(entries=>{
    entries.forEach((e,i)=>{
      if(e.isIntersecting){
        setTimeout(()=>e.target.classList.add('sbox-vis'),i*80);
        sbObs.unobserve(e.target);
      }
    });
  },{threshold:0.3});
  document.querySelectorAll('.sbox').forEach(el=>sbObs.observe(el));

  /* Ajoute les classes anim-s aux éléments non encore animés */
  document.querySelectorAll('.sec .card:not(.anim):not(.anim-s)').forEach((el,i)=>{
    el.classList.add('anim-s');
    el.style.transitionDelay=Math.min(i%4*0.09,0.36)+'s';
    mainObs.observe(el);
  });
}

/* ── INIT ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded',()=>{
  /* Routing — tous les [data-p] clickables */
  document.querySelectorAll('[data-p]').forEach(el=>{
    el.addEventListener('click',e=>{e.preventDefault();nav(el.dataset.p);});
  });

  /* Modal overlay click */
  document.getElementById('modal')?.addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});

  /* Lightbox keyboard */
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){closeModal();closeLB();}
    if(e.key==='ArrowRight'&&document.getElementById('lightbox')?.classList.contains('on'))lbNav(1);
    if(e.key==='ArrowLeft'&&document.getElementById('lightbox')?.classList.contains('on'))lbNav(-1);
  });

  /* Burger */
  document.getElementById('burger')?.addEventListener('click',()=>{document.getElementById('nav-links')?.classList.toggle('open');});
  document.addEventListener('click',e=>{
    const nl=document.getElementById('nav-links');const bg=document.getElementById('burger');
    if(nl?.classList.contains('open')&&!nl.contains(e.target)&&!bg?.contains(e.target))nl.classList.remove('open');
  });

  /* Scroll — nav scrolled + BTT */
  const btt=document.getElementById('btt');
  window.addEventListener('scroll',()=>{
    document.getElementById('navbar')?.classList.toggle('scrolled',scrollY>20);
    btt?.classList.toggle('on',scrollY>300);
  },{passive:true});
  btt?.addEventListener('click',()=>scrollTo({top:0,behavior:'smooth'}));

  /* Countup observer — stats-strip UNIQUEMENT */
  const sb=document.getElementById('stats-band');
  if(sb)_statsObs.observe(sb);

  /* Masquer les overlays si déjà traités lors d'une visite précédente */
  if(localStorage.getItem('enspd_welcomed')){const wo=document.getElementById('welcome-overlay');if(wo)wo.remove();}
  if(localStorage.getItem('enspd_cookies')){const cb=document.getElementById('cookie-banner');if(cb)cb.remove();}

  /* Init */
  initTheme();
  initLang();
  updateNavAuth();
  renderAdminBar();
  renderLegal();

  /* Renders */
  renderFormApercu();
  renderWhy();
  renderTemos();
  renderActusHome();
  renderActus();
  renderFil();
  renderDebouches();
  renderAdmin();
  renderLabos();
  renderCond();
  renderSteps();
  renderDocs();
  renderEvents();
  renderGal();
  renderPartnersWall();
  renderFaq();
  renderPublications();

  /* Slider d'images "Pourquoi l'ENSPD" — défilement auto 2s */
  initWhySlider();

  nav('accueil');

  /* Fermer le chat si clic en dehors */
  document.addEventListener('click',e=>{
    const win=document.getElementById('chat-window');
    const fab=document.getElementById('chat-fab');
    if(_chatOpen&&win&&!win.contains(e.target)&&!fab?.contains(e.target))toggleChat();
  });

  /* Animations avancées */
  initAnimPlus();
});
