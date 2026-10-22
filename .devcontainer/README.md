# Working on FicheAssur in a codespace

| Folder | Port | What |
|---|---|---|
| `ficheassur` | 3100 | Site (Next.js) |
| `ficheassur_backend` | 8100 | API (FastAPI, SQLite `ficheassur.db`) |

The servers start by themselves. Open them from the **Ports** tab.

- **Espace pro admin login:** run `cat ~/admin-login.txt`.
- **Logs:** `tail -f /tmp/fa-backend.log` (or `fa-site.log`).
- **Restart:** `bash /workspaces/ficheassur/.devcontainer/start.sh`.

Both folders are separate git repos. Commit and push each one. Stop the codespace when you're done.

## Secrets (Google, Microsoft, Stripe…)

Settings files aren't in git. To turn on these features in every codespace, add them once at **github.com › Settings › Codespaces › Secrets** and give each secret access to the `ficheassur` repo:

`FA_GOOGLE_CLIENT_ID`, `FA_MICROSOFT_CLIENT_ID`, `FA_STRIPE_SECRET_KEY`, `FA_STRIPE_WEBHOOK_SECRET`, `FA_STRIPE_PUBLISHABLE_KEY`, `FA_IMPORT_API_KEY`

Then rebuild the codespace, or run `bash /workspaces/ficheassur/.devcontainer/start.sh`. Without a Stripe key, purchases go through without payment (test mode). For Google sign-in, the codespace's site address (`https://<codespace>-3100.app.github.dev`) must be listed in the Google client's **Authorized JavaScript origins**.
