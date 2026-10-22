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

# Optional settings, taken from your Codespaces secrets (github.com >
# Settings > Codespaces > Secrets, prefixed FA_ so they can't clash with
# NWC's). A secret that isn't set leaves the feature off.
# Usage: put <secret> <setting> <file>
put() { [ -n "${!1:-}" ] && echo "$2=${!1}" >> "$3" || true; }
put FA_GOOGLE_CLIENT_ID GOOGLE_CLIENT_ID ficheassur_backend/.env
put FA_MICROSOFT_CLIENT_ID MICROSOFT_CLIENT_ID ficheassur_backend/.env
put FA_STRIPE_SECRET_KEY STRIPE_SECRET_KEY ficheassur_backend/.env
put FA_STRIPE_WEBHOOK_SECRET STRIPE_WEBHOOK_SECRET ficheassur_backend/.env
put FA_IMPORT_API_KEY IMPORT_API_KEY ficheassur_backend/.env
put FA_GOOGLE_CLIENT_ID NEXT_PUBLIC_GOOGLE_CLIENT_ID ficheassur/.env.local
put FA_MICROSOFT_CLIENT_ID NEXT_PUBLIC_MICROSOFT_CLIENT_ID ficheassur/.env.local
put FA_STRIPE_PUBLISHABLE_KEY NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ficheassur/.env.local
# No Stripe key: purchases go through without payment, so the espace pro can be tested.
[ -n "${FA_STRIPE_SECRET_KEY:-}" ] || echo "PAYMENTS_SIMULATED=true" >> ficheassur_backend/.env
