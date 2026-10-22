// "Continuer avec Microsoft": Microsoft's sign-in popup (MSAL) returns an ID
// token, which the backend verifies before signing the broker in. Needs
// NEXT_PUBLIC_MICROSOFT_CLIENT_ID; the popup comes back on /auth/microsoft
// (the redirect URI registered in Azure), which hands the result back here.

import type { PublicClientApplication } from "@azure/msal-browser";

export const MICROSOFT_CLIENT_ID = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || "";

let appPromise: Promise<PublicClientApplication> | null = null;

function getApp() {
  appPromise ??= (async () => {
    const { PublicClientApplication } = await import("@azure/msal-browser");
    const app = new PublicClientApplication({
      auth: {
        clientId: MICROSOFT_CLIENT_ID,
        authority: "https://login.microsoftonline.com/common", // work, school and personal accounts
        redirectUri: `${window.location.origin}/auth/microsoft`,
      },
      cache: { cacheLocation: "sessionStorage" },
    });
    await app.initialize();
    return app;
  })();
  return appPromise;
}

// Resolves with the ID token, or null if the visitor closed the popup.
export async function getMicrosoftIdToken(): Promise<string | null> {
  if (!MICROSOFT_CLIENT_ID) throw new Error("La connexion avec Microsoft n'est pas encore configurée.");
  const app = await getApp();
  try {
    const result = await app.loginPopup({ scopes: ["openid", "profile", "email"], prompt: "select_account" });
    return result.idToken || null;
  } catch (e) {
    const code = (e as { errorCode?: string }).errorCode ?? "";
    if (code === "user_cancelled") return null;
    if (code === "popup_window_error") throw new Error("La fenêtre Microsoft n'a pas pu s'ouvrir. Autorisez les pop-ups et réessayez.");
    throw new Error("Connexion Microsoft impossible. Réessayez.");
  }
}
