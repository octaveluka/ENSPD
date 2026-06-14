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
