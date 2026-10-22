"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getGoogleAccessToken } from "@/lib/google";
import { MICROSOFT_CLIENT_ID, getMicrosoftIdToken } from "@/lib/microsoft";
import { googleSignIn, microsoftSignIn } from "@/lib/pro";

// Same "ou / Continuer avec Google" block as New World Courtage's
// SocialAuthButtons (and its Google icon), plus "Continuer avec Microsoft"
// once NEXT_PUBLIC_MICROSOFT_CLIENT_ID is set. Signs in -- or creates the
// account on first use -- then opens the espace pro. `beforeStart` lets a form block
// it with a message (e.g. sign-up: the terms must be accepted first).
export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.9 29.6 5 24 5 16 5 9.1 9.5 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4c-2 1.5-4.6 2.5-7.6 2.5-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9 39.4 15.9 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.6 5.4C41.6 35.6 44 30.3 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  );
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 21 21" className={className} aria-hidden="true">
      <path fill="#f25022" d="M1 1h9v9H1z" />
      <path fill="#7fba00" d="M11 1h9v9h-9z" />
      <path fill="#00a4ef" d="M1 11h9v9H1z" />
      <path fill="#ffb900" d="M11 11h9v9h-9z" />
    </svg>
  );
}

const PROVIDERS = {
  google: { label: "Continuer avec Google", icon: <GoogleIcon className="size-6" />, getToken: getGoogleAccessToken, signIn: googleSignIn },
  microsoft: { label: "Continuer avec Microsoft", icon: <MicrosoftIcon className="size-5" />, getToken: getMicrosoftIdToken, signIn: microsoftSignIn },
} as const;
type Provider = keyof typeof PROVIDERS;

export default function GoogleButton({ beforeStart }: { beforeStart?: () => string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Provider | null>(null);
  const [error, setError] = useState("");
  const providers: Provider[] = MICROSOFT_CLIENT_ID ? ["google", "microsoft"] : ["google"];

  async function start(provider: Provider) {
    const blocked = beforeStart?.();
    if (blocked) {
      setError(blocked);
      return;
    }
    setError("");
    setBusy(provider);
    try {
      const token = await PROVIDERS[provider].getToken();
      if (!token) return; // popup closed
      await PROVIDERS[provider].signIn(token);
      router.push("/espace-pro");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative mb-1 flex items-center">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="px-3 text-xs text-slate-400">ou</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>
      {providers.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => start(p)}
          disabled={busy !== null}
          className="inline-flex h-12 items-center justify-center gap-3 border border-slate-300 bg-white text-base font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          {busy === p ? <span className="size-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand" aria-hidden="true" /> : PROVIDERS[p].icon}
          {PROVIDERS[p].label}
        </button>
      ))}
      {error && <p role="alert" className="text-[13px] text-red-600">{error}</p>}
    </div>
  );
}
