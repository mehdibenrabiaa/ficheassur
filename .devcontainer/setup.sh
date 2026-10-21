#!/usr/bin/env bash
# Runs once, when the codespace is created: clone the backend and install
# dependencies. The backend creates its SQLite database on first start.
set -euo pipefail
cd /workspaces
[ -d ficheassur_backend/.git ] || git clone https://github.com/mehdibenrabiaa/ficheassur_backend.git
(cd ficheassur_backend && python -m venv .venv && .venv/bin/pip install -q -r requirements.txt)
(cd ficheassur && npm ci)
