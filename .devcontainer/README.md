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
