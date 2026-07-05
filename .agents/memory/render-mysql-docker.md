---
name: All-in-one PHP+MySQL Docker image for Render
description: How the backend-enspd Dockerfile bundles MySQL with PHP/Apache for a zero-external-DB Render deploy, and the socket/auth gotchas that made it fail silently until fixed.
---

`backend-enspd/Dockerfile` (php:8.2-apache + default-mysql-server) runs both MySQL and Apache in one container via `docker/entrypoint.sh`, so Render deploys need zero external database setup.

Two non-obvious gotchas hit during testing — check these first if the container builds but the app can't reach the DB:

1. **Root bootstrap must use the Unix socket, not TCP to 127.0.0.1.** MariaDB's `root@localhost` account uses `unix_socket` auth. Connecting via `-h127.0.0.1` gets reverse-resolved to hostname `localhost` by the server, which still matches the `unix_socket`-only grant and gets rejected ("Access denied for user 'root'@'localhost'") even though the socket file exists. Fix: bootstrap admin SQL via `mysql --socket=/run/mysqld/mysqld.sock -uroot`.

2. **PHP's mysqlnd default socket path differs from the actual MySQL socket.** With `DB_HOST=localhost`, PDO/mysqli use a compiled-in default socket (`/tmp/mysql.sock`) unless `pdo_mysql.default_socket` / `mysqli.default_socket` are set in php.ini — they don't automatically match wherever `mysqld_safe --socket=...` actually created the socket. Must explicitly set both ini directives to the real socket path in the Dockerfile.

**Why:** Both failures were silent/confusing — build succeeds, container starts, but DB calls fail with generic "Erreur serveur (base de données)" or a cryptic auth error, easy to mistake for a credentials problem.

**How to apply:** Any similar all-in-one Docker image bundling MySQL/MariaDB + PHP on Debian-based images should bootstrap over the Unix socket and pin `*.default_socket` ini settings to match, rather than assuming `localhost`/`127.0.0.1` TCP will "just work".

Also: Render web services are ephemeral — MySQL data in this container is lost on redeploy unless a Render Disk (Starter+ plan) is mounted at `/var/lib/mysql`. `render.yaml` at repo root already declares this disk.
