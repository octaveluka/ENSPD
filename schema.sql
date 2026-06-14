-- =====================================================================
--  ENSPD — Schéma de base de données MySQL
--  École Nationale de Statistique, de Planification et de Démographie
--  Université de Parakou (Bénin)
-- ---------------------------------------------------------------------
--  Encodage : utf8mb4 (supporte tous les caractères accentués + emoji)
--  Moteur   : InnoDB (transactions, clés étrangères)
--
--  IMPORT (via phpMyAdmin) :
--    1. Créez une base de données (ex: "enspd") en utf8mb4_unicode_ci.
--    2. Onglet "Importer" -> sélectionnez ce fichier schema.sql -> Exécuter.
--
--  CRÉER LE PREMIER ADMINISTRATEUR (ne PAS insérer le mot de passe à la
--  main : il doit être haché). Utilisez le script CLI fourni :
--      php backend-enspd/bin/create_admin.php  votre-email@exemple.bj  "Nom Complet"
--  Le script vous demandera le mot de passe et l'enregistrera haché.
-- =====================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ---------------------------------------------------------------------
-- Table : actualites (articles / actualités du site)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `actualites` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `titre`      VARCHAR(255) NOT NULL,
  `slug`       VARCHAR(200) NOT NULL,
  `categorie`  VARCHAR(80)  NULL,
  `resume`     TEXT         NULL,
  `contenu`    LONGTEXT     NULL,
  `image`      VARCHAR(255) NULL,
  `date_pub`   DATE         NULL,
  `statut`     ENUM('draft','published') NOT NULL DEFAULT 'published',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_actualites_slug` (`slug`),
  KEY `idx_actualites_statut` (`statut`),
  KEY `idx_actualites_date` (`date_pub`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table : actualite_images (plusieurs photos par actualité)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `actualite_images` (
  `id`           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `actualite_id` INT UNSIGNED NOT NULL,
  `url`          VARCHAR(255) NOT NULL,
  `legende`      VARCHAR(255) NULL,
  `position`     INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_acimg_actualite` (`actualite_id`),
  CONSTRAINT `fk_acimg_actualite`
    FOREIGN KEY (`actualite_id`) REFERENCES `actualites` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table : evenements (agenda / événements)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `evenements` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `titre`       VARCHAR(255) NOT NULL,
  `type`        VARCHAR(80)  NULL,
  `date_event`  DATE         NULL,
  `heure`       VARCHAR(40)  NULL,
  `lieu`        VARCHAR(160) NULL,
  `description` TEXT         NULL,
  `image`       VARCHAR(255) NULL,
  `statut`      ENUM('upcoming','past') NOT NULL DEFAULT 'upcoming',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_evenements_statut` (`statut`),
  KEY `idx_evenements_date` (`date_event`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Table : galerie (photos de la galerie, groupées par catégorie)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `galerie` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `categorie`  VARCHAR(80)  NULL,
  `src`        VARCHAR(255) NOT NULL,
  `titre`      VARCHAR(160) NULL,
  `contexte`   VARCHAR(255) NULL,
  `position`   INT          NOT NULL DEFAULT 0,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_galerie_categorie` (`categorie`),
  KEY `idx_galerie_position` (`position`)
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
-- Table : settings (paramètres clé/valeur : annonce, directeur, etc.)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `k` VARCHAR(80) NOT NULL,
  `v` TEXT        NULL,
  PRIMARY KEY (`k`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Paramètres publics par défaut (modifiables depuis le tableau de bord).
INSERT INTO `settings` (`k`, `v`) VALUES
  ('annonce', ''),
  ('directeur_nom', ''),
  ('directeur_texte', ''),
  ('directeur_photo', '')
ON DUPLICATE KEY UPDATE `k` = `k`;

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
