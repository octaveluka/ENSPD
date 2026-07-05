---
name: Proxy server architecture
description: Why server.py exists instead of plain python http.server
---

The site is served by `server.py`, a Python `ThreadingHTTPServer`, not the stock `python3 -m http.server`. This is required because it proxies `/api/chat` server-side to the Delfa AI endpoint, avoiding a browser CORS failure that would occur if the frontend called Delfa directly.

**Why:** Browser-side calls to the external Delfa AI API are blocked by CORS; routing through the same-origin Python server sidesteps that.

**How to apply:** Never replace `server.py` with a plain static file server unless the AI chat feature is removed. Both `PORT` and `DELFA_API_URL` are read from environment variables (with defaults matching prior hardcoded values), so overriding them via env vars is supported.
