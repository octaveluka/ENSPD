-- =====================================================================
--  JSSED 2026 — Schéma de base de données MySQL
--  Journées Scientifiques de la Statistique, de l'Évaluation
--  et de la Démographie — ENSPD, Université de Parakou (Bénin)
-- ---------------------------------------------------------------------
--  Encodage : utf8mb4 (supporte tous les caractères accentués + emoji)
--  Moteur   : InnoDB (transactions, clés étrangères)
--
--  IMPORT (via phpMyAdmin) :
--    1. Créez une base de données (ex: "jssed2026") en utf8mb4_unicode_ci.
--    2. Onglet "Importer" -> sélectionnez ce fichier schema.sql -> Exécuter.
--
--  CRÉER LE PREMIER ADMINISTRATEUR (ne PAS insérer le mot de passe à la
--  main : il doit être haché). Utilisez le script CLI fourni :
--      php backend/bin/create_admin.php  votre-email@exemple.com  "Nom Complet"
--  Le script vous demandera le mot de passe et l'enregistrera haché.
-- =====================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ---------------------------------------------------------------------
-- Table : submissions (soumissions de communications / posters)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `submissions` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ref`         VARCHAR(32)  NOT NULL,
  `format`      ENUM('oral','poster') NOT NULL,
  `atelier`     TINYINT UNSIGNED NOT NULL,
  `langue`      VARCHAR(20)  NOT NULL DEFAULT 'fr',
  `prenom`      VARCHAR(80)  NOT NULL,
  `nom`         VARCHAR(80)  NOT NULL,
  `email`       VARCHAR(190) NOT NULL,
  `tel`         VARCHAR(40)  NULL,
  `statut`      VARCHAR(80)  NULL,
  `institution` VARCHAR(160) NULL,
  `pays`        VARCHAR(80)  NULL,
  `titre`       VARCHAR(255) NOT NULL,
  `resume`      TEXT         NOT NULL,
  `keywords`    VARCHAR(255) NULL,
  `financement` VARCHAR(255) NULL,
  `coauthors`   JSON         NULL,
  `status`      ENUM('pending','accepted','revision','rejected') NOT NULL DEFAULT 'pending',
  `consent`     TINYINT(1)   NOT NULL DEFAULT 0,
  `consent_ip`  VARCHAR(45)  NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_submissions_ref` (`ref`),
  KEY `idx_submissions_status` (`status`),
  KEY `idx_submissions_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table : registrations (inscriptions)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `registrations` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ref`            VARCHAR(32)  NOT NULL,
  `type`           ENUM('etudiant','chercheur','exposant') NOT NULL,
  `prenom`         VARCHAR(80)  NOT NULL,
  `nom`            VARCHAR(80)  NOT NULL,
  `email`          VARCHAR(190) NOT NULL,
  `tel`            VARCHAR(40)  NULL,
  `institution`    VARCHAR(160) NULL,
  `pays`           VARCHAR(80)  NULL,
  `statut`         VARCHAR(80)  NULL,
  `consent`        TINYINT(1)   NOT NULL DEFAULT 0,
  `consent_ip`     VARCHAR(45)  NULL,
  `payment_status` ENUM('unpaid','pending','paid') NOT NULL DEFAULT 'unpaid',
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_registrations_ref` (`ref`),
  KEY `idx_registrations_email` (`email`),
  KEY `idx_registrations_payment` (`payment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table : contacts (messages du formulaire de contact)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `contacts` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nom`        VARCHAR(120) NOT NULL,
  `email`      VARCHAR(190) NOT NULL,
  `sujet`      VARCHAR(160) NULL,
  `message`    TEXT         NOT NULL,
  `consent`    TINYINT(1)   NOT NULL DEFAULT 0,
  `ip`         VARCHAR(45)  NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `handled`    TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_contacts_handled` (`handled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table : admins (comptes d'administration)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admins` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email`         VARCHAR(190) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `name`          VARCHAR(120) NOT NULL,
  `role`          ENUM('admin','editor') NOT NULL DEFAULT 'admin',
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login`    DATETIME     NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_admins_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table : rate_limits (anti-abus / limitation de débit par IP)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `rate_limits` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ip`         VARCHAR(45)  NOT NULL,
  `action`     VARCHAR(40)  NOT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_rate_limits_lookup` (`ip`, `action`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table : audit_log (journal des actions d'administration)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_log` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id`    INT UNSIGNED NULL,
  `action`      VARCHAR(80)  NOT NULL,
  `target_type` VARCHAR(40)  NULL,
  `target_id`   VARCHAR(64)  NULL,
  `ip`          VARCHAR(45)  NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_admin` (`admin_id`),
  KEY `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table : speakers (intervenants — keynotes, conférenciers invités, panel)
-- ---------------------------------------------------------------------
--  `type`  : 'keynote' (conférencier principal), 'invited' (invité),
--            'panel' (membre de panel). Chaîne libre côté SQL, validée
--            côté PHP (PHP 8.0 : pas d'enum natif PHP, on utilise des
--            constantes/listes blanches dans les endpoints).
--  `ordre` : ordre d'affichage croissant (puis tri par `nom`).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `speakers` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nom`         VARCHAR(160) NOT NULL,
  `titre`       VARCHAR(160) NULL,
  `affiliation` VARCHAR(200) NULL,
  `pays`        VARCHAR(80)  NULL,
  `bio`         TEXT         NULL,
  `photo`       VARCHAR(255) NULL,
  `type`        VARCHAR(20)  NOT NULL DEFAULT 'invited',
  `ordre`       INT          NOT NULL DEFAULT 0,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_speakers_order` (`ordre`, `nom`),
  KEY `idx_speakers_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table : program_sessions (programme — sessions du déroulé de l'événement)
-- ---------------------------------------------------------------------
--  `type`       : 'pleniere','conference','atelier','poster','pause',
--                 'hommage','autre'. Liste blanche validée côté PHP.
--  `speaker_id` : INT nullable. VOLONTAIREMENT SANS clé étrangère dure
--                 (pas de FOREIGN KEY) afin de garder la suppression d'un
--                 intervenant simple (pas de blocage par contrainte) : si
--                 un intervenant est supprimé, la session reste affichée
--                 sans nom lié (la jointure LEFT JOIN renvoie alors NULL).
--                 L'intégrité « molle » est gérée applicativement.
--  Index sur (jour, ordre) pour l'affichage chronologique du programme.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `program_sessions` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `jour`        DATE         NOT NULL,
  `heure_debut` VARCHAR(10)  NULL,
  `heure_fin`   VARCHAR(10)  NULL,
  `titre`       VARCHAR(255) NOT NULL,
  `type`        VARCHAR(20)  NOT NULL DEFAULT 'autre',
  `salle`       VARCHAR(120) NULL,
  `atelier`     TINYINT      NULL,
  `speaker_id`  INT          NULL,
  `description` TEXT         NULL,
  `ordre`       INT          NOT NULL DEFAULT 0,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_program_jour_ordre` (`jour`, `ordre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Données d'exemple (intervenants) — JSSED 2026, 15–18 septembre 2026.
-- Idempotence : on n'insère que si la table est vide.
-- ---------------------------------------------------------------------
INSERT INTO `speakers` (`nom`, `titre`, `affiliation`, `pays`, `bio`, `type`, `ordre`)
SELECT * FROM (
  SELECT
    'Pr. Mouftaou AMADOU SANNI' AS nom,
    'Professeur de démographie' AS titre,
    'ENSPD — Université de Parakou' AS affiliation,
    'Bénin' AS pays,
    'Figure majeure de la démographie et de la statistique au Bénin, dont l''œuvre et l''engagement scientifique sont mis à l''honneur lors de cette édition.' AS bio,
    'keynote' AS type,
    1 AS ordre
) AS t
WHERE NOT EXISTS (SELECT 1 FROM `speakers`);

INSERT INTO `speakers` (`nom`, `titre`, `affiliation`, `pays`, `bio`, `type`, `ordre`)
SELECT * FROM (
  SELECT 'Conférencier inaugural (à confirmer)', 'Conférencier invité', 'Institut partenaire', 'Afrique de l''Ouest',
         'Conférence inaugurale d''ouverture des Journées Scientifiques.', 'keynote', 2
) AS t
WHERE (SELECT COUNT(*) FROM `speakers`) = 1;

INSERT INTO `speakers` (`nom`, `titre`, `affiliation`, `pays`, `bio`, `type`, `ordre`)
SELECT * FROM (
  SELECT 'Conférencière de clôture (à confirmer)', 'Conférencière invitée', 'Université partenaire', 'Afrique de l''Ouest',
         'Conférence finale de synthèse et perspectives.', 'invited', 3
) AS t
WHERE (SELECT COUNT(*) FROM `speakers`) = 2;

-- ---------------------------------------------------------------------
-- Données d'exemple (programme) — 15 au 18 septembre 2026.
-- Idempotence : on n'insère que si la table est vide.
-- ---------------------------------------------------------------------
INSERT INTO `program_sessions` (`jour`, `heure_debut`, `heure_fin`, `titre`, `type`, `salle`, `atelier`, `description`, `ordre`)
SELECT * FROM (
  SELECT '2026-09-15' AS jour, '09:00' AS heure_debut, '10:00' AS heure_fin,
         'Cérémonie d''ouverture et conférence inaugurale' AS titre, 'pleniere' AS type,
         'Amphithéâtre principal' AS salle, NULL AS atelier,
         'Ouverture officielle des JSSED 2026 et conférence inaugurale.' AS description, 1 AS ordre
) AS t
WHERE NOT EXISTS (SELECT 1 FROM `program_sessions`);

INSERT INTO `program_sessions` (`jour`, `heure_debut`, `heure_fin`, `titre`, `type`, `salle`, `atelier`, `description`, `ordre`)
SELECT * FROM (
  SELECT '2026-09-15', '10:30', '12:30',
         'Session plénière d''hommage au Pr. Mouftaou AMADOU SANNI', 'hommage',
         'Amphithéâtre principal', NULL,
         'Hommage scientifique : parcours, contributions et héritage en démographie et statistique.', 2
) AS t
WHERE (SELECT COUNT(*) FROM `program_sessions`) = 1;

INSERT INTO `program_sessions` (`jour`, `heure_debut`, `heure_fin`, `titre`, `type`, `salle`, `atelier`, `description`, `ordre`)
SELECT * FROM (
  SELECT '2026-09-16', '09:00', '12:30',
         'Atelier 1 — Statistique et science des données', 'atelier',
         'Salle A', 1,
         'Communications orales et échanges autour de la statistique appliquée et de la science des données.', 1
) AS t
WHERE (SELECT COUNT(*) FROM `program_sessions`) = 2;

INSERT INTO `program_sessions` (`jour`, `heure_debut`, `heure_fin`, `titre`, `type`, `salle`, `atelier`, `description`, `ordre`)
SELECT * FROM (
  SELECT '2026-09-16', '14:00', '17:30',
         'Atelier 2 — Évaluation des politiques publiques', 'atelier',
         'Salle B', 2,
         'Méthodes d''évaluation d''impact et suivi-évaluation des programmes de développement.', 2
) AS t
WHERE (SELECT COUNT(*) FROM `program_sessions`) = 3;

INSERT INTO `program_sessions` (`jour`, `heure_debut`, `heure_fin`, `titre`, `type`, `salle`, `atelier`, `description`, `ordre`)
SELECT * FROM (
  SELECT '2026-09-17', '09:00', '12:30',
         'Atelier 3 — Démographie et dynamiques de population', 'atelier',
         'Salle A', 3,
         'Transition démographique, santé de la reproduction et dynamiques de population.', 1
) AS t
WHERE (SELECT COUNT(*) FROM `program_sessions`) = 4;

INSERT INTO `program_sessions` (`jour`, `heure_debut`, `heure_fin`, `titre`, `type`, `salle`, `atelier`, `description`, `ordre`)
SELECT * FROM (
  SELECT '2026-09-17', '14:00', '16:00',
         'Session posters', 'poster',
         'Hall d''exposition', NULL,
         'Présentation des posters scientifiques et échanges avec les auteurs.', 2
) AS t
WHERE (SELECT COUNT(*) FROM `program_sessions`) = 5;

INSERT INTO `program_sessions` (`jour`, `heure_debut`, `heure_fin`, `titre`, `type`, `salle`, `atelier`, `description`, `ordre`)
SELECT * FROM (
  SELECT '2026-09-18', '09:00', '10:30',
         'Conférence finale et synthèse', 'conference',
         'Amphithéâtre principal', NULL,
         'Conférence de clôture, synthèse des travaux et perspectives.', 1
) AS t
WHERE (SELECT COUNT(*) FROM `program_sessions`) = 6;

INSERT INTO `program_sessions` (`jour`, `heure_debut`, `heure_fin`, `titre`, `type`, `salle`, `atelier`, `description`, `ordre`)
SELECT * FROM (
  SELECT '2026-09-18', '11:00', '12:00',
         'Cérémonie de clôture', 'pleniere',
         'Amphithéâtre principal', NULL,
         'Remise des distinctions et clôture officielle des JSSED 2026.', 2
) AS t
WHERE (SELECT COUNT(*) FROM `program_sessions`) = 7;
