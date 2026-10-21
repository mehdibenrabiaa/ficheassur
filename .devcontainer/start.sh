#!/usr/bin/env bash
# Runs every time the codespace starts: (re)start both dev servers in the
# background. Logs: /tmp/fa-{backend,site}.log
set -uo pipefail
cd /workspaces
bash ficheassur/.devcontainer/write-env.sh

# The site calls the API from the browser, across origins, so the API port
# has to be reachable without the codespace's login cookie.
gh codespace ports visibility 8100:public -c "$CODESPACE_NAME" >/dev/null 2>&1 \
  || echo "Could not make port 8100 public: do it in the Ports tab (right-click > Port Visibility > Public)."

pkill -f "uvicorn app.main:app" || true
pkill -f "next dev" || true
(cd ficheassur_backend && nohup .venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8100 > /tmp/fa-backend.log 2>&1 &)
(cd ficheassur && nohup npx next dev -p 3100 > /tmp/fa-site.log 2>&1 &)
echo "Servers starting: Site :3100, API :8100 (see the Ports tab)."
[ -f ~/admin-login.txt ] && cat ~/admin-login.txt
