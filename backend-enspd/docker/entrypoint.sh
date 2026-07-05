#!/bin/bash
# =====================================================================
# ENSPD Backend — Entrypoint Docker (Render)
# Initialise MySQL (si nécessaire), applique le schéma, puis lance Apache.
# =====================================================================
set -e

DB_HOST="${DB_HOST:-localhost}"
DB_NAME="${DB_NAME:-enspd}"
DB_USER="${DB_USER:-enspd_user}"
DB_PASS="${DB_PASS:-CHANGEZ_MOI}"
DB_PORT="${DB_PORT:-3306}"
LISTEN_PORT="${PORT:-10000}"

echo "[entrypoint] Démarrage du backend ENSPD..."

# ---------------------------------------------------------------------
# 1. Adapter Apache au port fourni par Render ($PORT)
# ---------------------------------------------------------------------
sed -i "s/:10000/:${LISTEN_PORT}/" /etc/apache2/sites-available/000-default.conf
sed -i "s/Listen 80/Listen ${LISTEN_PORT}/" /etc/apache2/ports.conf 2>/dev/null || true
if ! grep -q "Listen ${LISTEN_PORT}" /etc/apache2/ports.conf; then
  echo "Listen ${LISTEN_PORT}" >> /etc/apache2/ports.conf
fi

# ---------------------------------------------------------------------
# 2. Initialiser le data-dir MySQL au tout premier démarrage
#    (persistant si un Disk Render est monté sur /var/lib/mysql)
# ---------------------------------------------------------------------
if [ -z "$(ls -A /var/lib/mysql 2>/dev/null)" ]; then
  echo "[entrypoint] Premier démarrage : initialisation de MySQL..."
  mysql_install_db --user=mysql --datadir=/var/lib/mysql --auth-root-authentication-method=normal >/tmp/mysql_install.log 2>&1
fi

# ---------------------------------------------------------------------
# 3. Démarrer mysqld en arrière-plan
# ---------------------------------------------------------------------
SOCKET=/run/mysqld/mysqld.sock
gosu mysql mysqld_safe --datadir=/var/lib/mysql --socket="${SOCKET}" --skip-networking=0 --bind-address=127.0.0.1 &

echo "[entrypoint] Attente de MySQL..."
for i in $(seq 1 60); do
  if mysqladmin --socket="${SOCKET}" ping --silent 2>/dev/null; then
    break
  fi
  sleep 1
done

# ---------------------------------------------------------------------
# 4. Créer la base, l'utilisateur et importer le schéma (idempotent)
#    (bootstrap via le socket local : root utilise l'auth unix_socket)
# ---------------------------------------------------------------------
mysql --socket="${SOCKET}" -uroot <<-SQL
  CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
  CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASS}';
  ALTER USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
  ALTER USER '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASS}';
  GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
  GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'127.0.0.1';
  FLUSH PRIVILEGES;
SQL

echo "[entrypoint] Import du schéma (idempotent, CREATE TABLE IF NOT EXISTS)..."
mysql --socket="${SOCKET}" -uroot "${DB_NAME}" < /var/www/html/schema.sql

# ---------------------------------------------------------------------
# 5. Créer un compte admin par défaut au tout premier démarrage
#    (email/mot de passe modifiables ensuite depuis le tableau de bord)
# ---------------------------------------------------------------------
ADMIN_EXISTS=$(mysql --socket="${SOCKET}" -uroot "${DB_NAME}" -N -e "SELECT COUNT(*) FROM admins;" 2>/dev/null || echo "0")
if [ "${ADMIN_EXISTS}" = "0" ]; then
  echo "[entrypoint] Création du compte admin par défaut (admin@enspd.bj / EnspdAdmin2026!)..."
  php /var/www/html/bin/create_admin.php admin@enspd.bj "Direction ENSPD" admin "EnspdAdmin2026!" \
    || echo "[entrypoint] ⚠ Échec de la création automatique de l'admin (non bloquant)."
fi

echo "[entrypoint] Backend prêt. Démarrage d'Apache sur le port ${LISTEN_PORT}..."
exec apache2-foreground
