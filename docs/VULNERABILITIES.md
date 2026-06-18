# Vulnérabilités et faiblesses identifiées — JSSED / ENSPD

Inventaire honnête issu de la revue de code. **Statut** :
✅ *Corrigé / déjà mitigé dans le code* · 🟡 *À configurer au déploiement* ·
🔵 *Recommandation (amélioration future)*.
**Sévérité** : Critique / Élevée / Moyenne / Faible / Info.

| # | Vulnérabilité / faiblesse | Sévérité | Statut | Détail & remédiation |
|---|---------------------------|----------|--------|----------------------|
| 1 | Injection SQL | Critique | ✅ Mitigé | PDO `emulate_prepares=false`, requêtes préparées partout, filtres en liste blanche. Maintenir la règle : aucune variable concaténée dans le SQL. |
| 2 | XSS stocké/réfléchi | Élevée | ✅ Mitigé | `escape()` (PHP) + `esc()` (JS) sur toute sortie ; endpoints publics en JSON + `nosniff` ; CSP. |
| 3 | CSRF sur actions admin | Élevée | ✅ Mitigé | Jeton CSRF par session, `X-CSRF-Token`, `hash_equals`, cookie `SameSite=Lax`. |
| 4 | Force brute login admin | Élevée | ✅ Mitigé | Rate-limit 5/15min/IP + bcrypt + réponses génériques. Résiduel : par IP uniquement (cf. #12). |
| 5 | Fixation de session | Élevée | ✅ Mitigé | `session_regenerate_id(true)` à la connexion ; cookie httponly/secure/SameSite. |
| 6 | Divulgation d'erreurs détaillées | Moyenne | 🟡 À configurer | `env=prod` masque les détails. Vérifier aussi `display_errors=Off`, `log_errors=On` côté serveur (php.ini / `.user.ini`). |
| 7 | CORS trop permissif | Moyenne | 🟡 À configurer | Code OK (liste blanche). **Risque si** `cors_origins` reste sur l'exemple ou inclut du HTTP. Mettre uniquement le(s) domaine(s) réel(s) en HTTPS. |
| 8 | Absence de HTTPS / HSTS | Élevée | 🟡 À configurer | Activer Let's Encrypt, forcer la redirection HTTP→HTTPS, ajouter `Strict-Transport-Security`. `cookie_secure=true`. |
| 9 | En-têtes de sécurité manquants | Faible | 🔵 Recommandation | Présents : XCTO, XFO, Referrer-Policy, CORP, CSP. **Manquent** : `Strict-Transport-Security`, `Permissions-Policy` (ex. `geolocation=(), camera=(), microphone=()`). À ajouter au `.htaccess`. |
| 10 | Politique de mot de passe admin faible | Moyenne | 🟡 À configurer | `bin/create_admin.php` impose ≥ 10 caractères. Recommandé : ≥ 12, refuser mots de passe communs. Documenté ; renforcer le minimum dans le script si souhaité. |
| 11 | Rate-limit contournable (multi-IP / X-Forwarded-For) | Moyenne | 🔵 Recommandation | `client_ip()` fait confiance à `X-Forwarded-For` (1er hop). Sur mutualisé derrière proxy c'est nécessaire, mais usurpable. Si VPS sans proxy : utiliser `REMOTE_ADDR` seul. |
| 12 | Pas de 2FA / pas de verrouillage par compte | Moyenne | 🔵 Recommandation | Ajouter TOTP (2FA) pour les admins et un compteur d'échecs par compte (en plus du rate-limit IP). |
| 13 | Upload de fichiers | Info | ✅ N/A | Aucun endpoint d'upload aujourd'hui (`photo` = URL/chemin texte). Si ajouté : MIME réel + liste blanche + hors web-root + pas d'exécution PHP. |
| 14 | IDOR sur données participants | Élevée | ✅ Mitigé | Aucun endpoint public par identifiant ; tout l'admin derrière `require_admin()`. Ne pas créer d'accès public « par référence » non authentifié. |
| 15 | CSP avec `'unsafe-inline'` (admin) | Faible | 🔵 Recommandation | Toléré (styles/scripts internes au dashboard). Resserrer via nonces si externalisation. |
| 16 | Journaux & rate_limits non purgés | Faible | 🔵 Recommandation | `rate_limits` se nettoie à la volée ; prévoir une purge planifiée d'`audit_log` ancien et des données personnelles post-événement (RGPD). |
| 17 | Cookie de session : durée de vie navigateur (`lifetime=0`) | Info | ✅ Conçu ainsi | Session non persistante + idle-timeout serveur 30 min. Conforme aux bonnes pratiques. |
| 18 | Absence de protection anti-automatisation forte (formulaires publics) | Faible | ✅ Mitigé | Honeypot + rate-limit + consentement. Pour campagnes de spam massives, envisager un challenge léger. |
| 19 | Pas de WAF / fail2ban par défaut | Faible | 🔵 Recommandation | Sur VPS : fail2ban sur logs Apache + login. Sur mutualisé : activer les protections de l'hébergeur (ModSecurity si dispo). |
| 20 | Sauvegardes & reprise | Moyenne | 🟡 À configurer | Mettre en place dumps MySQL planifiés + sauvegarde des fichiers + test de restauration (cf. DEPLOYMENT). |

---

## Synthèse

- **Le code est sain** sur les vulnérabilités majeures (injection, XSS, CSRF,
  fixation de session, IDOR, force brute) : elles sont **déjà mitigées**.
- Les éléments restants sont surtout des **tâches de déploiement** (#6, #7, #8,
  #10, #20) et des **améliorations recommandées** (#9, #11, #12, #15, #16, #19).
- **Priorités au déploiement** : HTTPS + HSTS (#8), `env=prod` + erreurs off
  (#6), CORS verrouillé (#7), sauvegardes testées (#20), en-têtes manquants (#9).
