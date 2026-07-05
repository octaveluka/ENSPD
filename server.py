#!/usr/bin/env python3
"""ENSPD — Serveur HTTP statique + proxy /api/chat → Delfa AI (contourne le CORS)."""
import http.server, urllib.request, urllib.parse, json, os, sys

PORT   = 5000
DELFA  = 'https://delfaapiai.vercel.app/ai/copilot'
ORIGIN = os.path.dirname(os.path.abspath(__file__))


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

    # ── proxy Delfa ──────────────────────────────────────────────────────────
    def _proxy_chat(self):
        parsed = urllib.parse.urlparse(self.path)
        qs     = urllib.parse.parse_qs(parsed.query)
        msg    = qs.get('message', [''])[0]
        model  = qs.get('model',   ['default'])[0]

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

    # ── helpers ──────────────────────────────────────────────────────────────
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin',  '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def log_message(self, fmt, *args):
        code = str(args[1]) if len(args) > 1 else '???'
        if not code.startswith(('2', '3', '404')):
            sys.stderr.write(f'[ENSPD] {fmt % args}\n')


if __name__ == '__main__':
    os.chdir(ORIGIN)
    try:
        srv = http.server.ThreadingHTTPServer(('0.0.0.0', PORT), ENSPDHandler)
    except AttributeError:          # Python < 3.7 fallback
        srv = http.server.HTTPServer(('0.0.0.0', PORT), ENSPDHandler)
    print(f'✓ ENSPD server ready → http://0.0.0.0:{PORT}', flush=True)
    srv.serve_forever()
