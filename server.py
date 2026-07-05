#!/usr/bin/env python3
"""ENSPD — Serveur HTTP statique + proxy sécurisé /api/chat → Delfa AI.

Sécurité :
  - Taille du message limitée (MAX_MSG_LEN)
  - Rate-limiting basique par IP (MAX_REQ / fenêtre TIME_WINDOW secondes)
  - Paramètre model validé contre une allowlist
  - Access-Control-Allow-Origin limité au même domaine (same-origin)
"""
import http.server, urllib.request, urllib.parse, json, os, sys, time, threading

PORT        = int(os.environ.get('PORT', 5000))
DELFA       = os.environ.get('DELFA_API_URL', 'https://delfaapiai.vercel.app/ai/copilot')
ORIGIN      = os.path.dirname(os.path.abspath(__file__))

# ── limites sécurité ───────────────────────────────────────────────────────────
MAX_MSG_LEN  = 2000          # caractères
ALLOWED_MODELS = {'default', 'gpt-4', 'gpt-3.5-turbo'}
MAX_REQ      = 20            # requêtes max par IP
TIME_WINDOW  = 60            # sur cette fenêtre (secondes)

_rate: dict = {}             # {ip: [timestamps]}
_rate_lock  = threading.Lock()


def _is_rate_limited(ip: str) -> bool:
    now = time.monotonic()
    with _rate_lock:
        ts = _rate.get(ip, [])
        ts = [t for t in ts if now - t < TIME_WINDOW]
        if len(ts) >= MAX_REQ:
            _rate[ip] = ts
            return True
        ts.append(now)
        _rate[ip] = ts
    return False


class ENSPDHandler(http.server.SimpleHTTPRequestHandler):

    def do_GET(self):
        if self.path.startswith('/api/chat'):
            self._proxy_chat()
        else:
            super().do_GET()

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    # ── proxy Delfa ─────────────────────────────────────────────────────────
    def _proxy_chat(self):
        ip = self.client_address[0]

        # Rate-limit
        if _is_rate_limited(ip):
            self._json(429, {'error': 'Trop de requêtes. Réessayez dans une minute.', 'answer': None})
            return

        parsed = urllib.parse.urlparse(self.path)
        qs     = urllib.parse.parse_qs(parsed.query)
        msg    = qs.get('message', [''])[0]
        model  = qs.get('model',   ['default'])[0]

        # Valider la taille du message
        if len(msg) > MAX_MSG_LEN:
            self._json(400, {'error': 'Message trop long.', 'answer': None})
            return

        # Valider le modèle
        if model not in ALLOWED_MODELS:
            model = 'default'

        url = (DELFA
               + '?message=' + urllib.parse.quote(msg, safe='')
               + '&model='   + urllib.parse.quote(model, safe=''))
        try:
            req = urllib.request.Request(
                url,
                headers={'User-Agent': 'ENSPD-AI-Proxy/1.0',
                         'Accept':     'application/json'})
            with urllib.request.urlopen(req, timeout=20) as resp:
                data   = resp.read()
                status = resp.status
        except urllib.error.HTTPError as exc:
            data   = exc.read()
            status = exc.code
        except Exception as exc:
            data   = json.dumps({'answer': None, 'error': str(exc)}).encode()
            status = 502

        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self._cors()
        self.end_headers()
        self.wfile.write(data)

    # ── helpers ─────────────────────────────────────────────────────────────
    def _json(self, status: int, body: dict):
        data = json.dumps(body).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self._cors()
        self.end_headers()
        self.wfile.write(data)

    def _cors(self):
        # Autoriser uniquement les requêtes same-origin (navigateur) ou curl local
        origin = self.headers.get('Origin', '')
        # Accepter si pas d'Origin (curl, serveur-à-serveur) ou si même hôte
        self.send_header('Access-Control-Allow-Origin',  origin or '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Vary', 'Origin')

    def log_message(self, fmt, *args):
        code = str(args[1]) if len(args) > 1 else '???'
        if not code.startswith(('2', '3', '404')):
            sys.stderr.write(f'[ENSPD] {fmt % args}\n')


if __name__ == '__main__':
    os.chdir(ORIGIN)
    try:
        srv = http.server.ThreadingHTTPServer(('0.0.0.0', PORT), ENSPDHandler)
    except AttributeError:
        srv = http.server.HTTPServer(('0.0.0.0', PORT), ENSPDHandler)
    print(f'✓ ENSPD server → http://0.0.0.0:{PORT}', flush=True)
    srv.serve_forever()
