// "Continuer avec Google": Google's popup (Google Identity Services token
// client) gives an access token, which the backend checks with Google before
// signing the broker in. Needs NEXT_PUBLIC_GOOGLE_CLIENT_ID; without it the
// button explains that Google sign-in isn't set up.

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

type TokenResponse = { access_token?: string; error?: string };
type TokenClient = { requestAccessToken: () => void };
type GoogleOAuth = {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (r: TokenResponse) => void;
    error_callback?: (e: { type: string }) => void;
  }) => TokenClient;
};
declare global {
  interface Window { google?: { accounts: { oauth2: GoogleOAuth } } }
}

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Impossible de joindre Google. Vérifiez votre connexion."));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

// Resolves with the access token, or null if the visitor closed the popup.
export async function getGoogleAccessToken(): Promise<string | null> {
  if (!GOOGLE_CLIENT_ID) throw new Error("La connexion avec Google n'est pas encore configurée.");
  await loadScript();
  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "openid email profile",
      callback: (r) => (r.access_token ? resolve(r.access_token) : reject(new Error("Connexion Google refusée. Réessayez."))),
      error_callback: (e) => (e.type === "popup_closed" ? resolve(null) : reject(new Error("La fenêtre Google n'a pas pu s'ouvrir. Autorisez les pop-ups et réessayez."))),
    });
    client.requestAccessToken();
  });
}
