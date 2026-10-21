#!/usr/bin/env bash
# Runs once, when the codespace is created: clone the backend, install
# dependencies, and create an espace pro admin account.
set -euo pipefail
cd /workspaces
[ -d ficheassur_backend/.git ] || git clone https://github.com/mehdibenrabiaa/ficheassur_backend.git
(cd ficheassur_backend && python -m venv .venv && .venv/bin/pip install -q -r requirements.txt)
(cd ficheassur && npm ci)

bash ficheassur/.devcontainer/write-env.sh

if [ ! -f ~/admin-login.txt ]; then
  pw=$(python -c "import secrets; print(secrets.token_urlsafe(12))")
  (cd ficheassur_backend && .venv/bin/python scripts/create_admin.py "Admin" admin@example.com "$pw")
  printf 'Espace pro admin login\n  email: admin@example.com\n  password: %s\n' "$pw" > ~/admin-login.txt
fi
