#!/usr/bin/env bash
# Point the site and API at each other. In a codespace the browser reaches a
# port through https://<codespace>-<port>.<domain>, so URLs are built from that.
set -euo pipefail
cd /workspaces
url() { echo "https://${CODESPACE_NAME}-$1.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"; }

secret=$(grep -s '^SECRET_KEY=' ficheassur_backend/.env | cut -d= -f2- || true)
[ -n "$secret" ] || secret=$(python -c "import secrets; print(secrets.token_urlsafe(48))")

cat > ficheassur_backend/.env <<ENV
DATABASE_URL=sqlite+aiosqlite:///./ficheassur.db
ALLOWED_ORIGINS=$(url 3100),http://localhost:3100
TARGET_REGION=FR
BLOCKED_IPS=
SECRET_KEY=$secret
SITE_URL=$(url 3100)
ENV
echo "NEXT_PUBLIC_API_URL=$(url 8100)" > ficheassur/.env.local
