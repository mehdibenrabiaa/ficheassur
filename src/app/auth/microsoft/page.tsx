"use client";

import { useEffect } from "react";

// Where Microsoft's sign-in popup lands (the redirect URI registered in
// Azure): hands the result back to the page that opened it, which then
// closes this popup. Nothing to show.
export default function MicrosoftRedirect() {
  useEffect(() => {
    import("@azure/msal-browser/redirect-bridge").then(({ broadcastResponseToMainFrame }) =>
      broadcastResponseToMainFrame().catch(() => window.close()),
    );
  }, []);
  return <p className="p-6 text-center text-sm text-slate-500">Connexion Microsoft…</p>;
}
