# =====================================================================
# ENSPD Backend — Image tout-en-un pour Render (PHP + Apache + MySQL)
# =====================================================================
# Cette image embarque son PROPRE serveur MySQL pour que le déploiement
# ne nécessite AUCUNE base de données externe à configurer : au premier
# démarrage du conteneur, la base est créée, le schéma importé et
# l'utilisateur MySQL provisionné automatiquement à partir des variables
# d'environnement (DB_HOST=localhost, DB_NAME, DB_USER, DB_PASS...).
#
# ⚠️ Persistance : sur Render, montez un "Disk" (voir render.yaml) sur
# /var/lib/mysql, sinon les données MySQL seront perdues à chaque
# redéploiement du service (comportement normal d'un conteneur Docker
# sans volume persistant).
# =====================================================================
FROM php:8.2-apache

ENV DEBIAN_FRONTEND=noninteractive

# ---------------------------------------------------------------------
# 1. Paquets système : MySQL Server + extensions PHP nécessaires
# ---------------------------------------------------------------------
RUN apt-get update && apt-get install -y --no-install-recommends \
      default-mysql-server \
      default-mysql-client \
      unzip \
      gosu \
    && docker-php-ext-install pdo pdo_mysql mysqli \
    && a2enmod rewrite headers \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# ---------------------------------------------------------------------
# 2. Code de l'application
# ---------------------------------------------------------------------
WORKDIR /var/www/html
COPY . /var/www/html/

# Apache sert directement backend-enspd/ comme racine du site.
RUN chown -R www-data:www-data /var/www/html \
    && mkdir -p /var/lib/mysql /var/run/mysqld \
    && chown -R mysql:mysql /var/lib/mysql /var/run/mysqld

# ---------------------------------------------------------------------
# 3. Apache : écoute sur le port fourni par Render ($PORT)
# ---------------------------------------------------------------------
COPY docker/apache-vhost.conf /etc/apache2/sites-available/000-default.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# PHP (mysqlnd) doit pointer vers le même socket Unix que le serveur MySQL
# pour que DB_HOST=localhost fonctionne (sinon il cherche /tmp/mysql.sock).
RUN echo "pdo_mysql.default_socket=/run/mysqld/mysqld.sock" > /usr/local/etc/php/conf.d/zz-mysql-socket.ini \
    && echo "mysqli.default_socket=/run/mysqld/mysqld.sock" >> /usr/local/etc/php/conf.d/zz-mysql-socket.ini

EXPOSE 10000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
