#!/usr/bin/env bash
# Runs every time the codespace starts: point the site and API at each other
# through the codespace's forwarded URLs, then (re)start both dev servers.
# Logs: /tmp/fa-{backend,site}.log
set -uo pipefail
cd /workspaces
url() { echo "https://${CODESPACE_NAME}-$1.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"; }

cat > ficheassur_backend/.env <<ENV
DATABASE_URL=sqlite+aiosqlite:///./ficheassur.db
ALLOWED_ORIGINS=$(url 3100),http://localhost:3100
TARGET_REGION=FR
BLOCKED_IPS=
ENV
echo "NEXT_PUBLIC_API_URL=$(url 8100)" > ficheassur/.env.local

# The access form posts to the API from the browser, across origins, so the
# API port has to be reachable without the codespace's login cookie.
gh codespace ports visibility 8100:public -c "$CODESPACE_NAME" >/dev/null 2>&1 \
  || echo "Could not make port 8100 public: do it in the Ports tab (right-click > Port Visibility > Public)."

pkill -f "uvicorn app.main:app" || true
pkill -f "next dev" || true
(cd ficheassur_backend && nohup .venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8100 > /tmp/fa-backend.log 2>&1 &)
(cd ficheassur && nohup npx next dev -p 3100 > /tmp/fa-site.log 2>&1 &)
echo "Servers starting: Site :3100, API :8100 (see the Ports tab)."
