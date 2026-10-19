"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthSubmit, authInputClass } from "@/components/AuthLayout";
import { LEAD_TYPES } from "@/lib/leadTypes";
import GoogleButton from "@/components/GoogleButton";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8100").replace(/\/+$/, "");

// Same design as New World Courtage's /inscription. A FicheAssur account is
// opened only after the broker's ORIAS registration is checked, so "creating
// an account" files a partner request (POST /api/v1/access-requests, the
// same endpoint as the landing page's form) -- no password until then.
export default function SignupForm() {
  const [v, setV] = useState({ full_name: "", company: "", email: "", phone: "", orias_number: "" });
  const [types, setTypes] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const [googleNotice, setGoogleNotice] = useState(false);
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((p) => ({ ...p, [k]: e.target.value }));
  const toggle = (t: string) => setTypes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent || state === "sending") return;
    if (types.length === 0) {
      setError("Choisissez au moins un marché.");
      return;
    }
    setError("");
    setState("sending");
    try {
      const res = await fetch(`${API_URL}/api/v1/access-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, orias_number: v.orias_number || null, lead_types: types, message: null }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const detail = Array.isArray(body?.detail) ? String(body.detail[0]?.msg ?? "").replace(/^Value error, /, "") : body?.detail;
        throw new Error(res.status === 429 ? "Trop de demandes. Réessayez plus tard." : detail || "Une erreur est survenue.");
      }
      setState("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div className="flex flex-1 flex-col">
        <h1 className="mb-5 text-center text-[28px] font-medium leading-tight text-ink">Demande envoyée</h1>
        <div className="border-l-4 border-accent bg-light p-5 text-[15px] leading-relaxed text-slate-700">
          <p className="font-bold text-ink">Merci, nous revenons vers vous sous 24 h.</p>
          <p className="mt-2">Nous vérifions votre immatriculation ORIAS, puis nous vous envoyons vos accès à l&apos;espace pro par email.</p>
        </div>
        <Link href="/" className="mt-8 self-center text-[14px] font-semibold text-brand hover:underline">Retour à l&apos;accueil</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <h1 className="mb-2 text-center text-[28px] font-medium leading-tight text-ink">Créez votre compte pro</h1>
      <p className="mb-7 text-center text-[14px] text-slate-600">Réservé aux courtiers immatriculés à l&apos;ORIAS.</p>

      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="full_name" className="sr-only">Nom et prénom</label>
          <input id="full_name" autoComplete="name" placeholder="Nom et prénom" value={v.full_name} onChange={set("full_name")} required minLength={2} className={authInputClass} />
        </div>
        <div>
          <label htmlFor="company" className="sr-only">Cabinet</label>
          <input id="company" autoComplete="organization" placeholder="Nom de votre cabinet" value={v.company} onChange={set("company")} required minLength={2} className={authInputClass} />
        </div>
        <div>
          <label htmlFor="email" className="sr-only">Adresse email</label>
          <input id="email" type="email" autoComplete="email" placeholder="Adresse email professionnelle" value={v.email} onChange={set("email")} required className={authInputClass} />
        </div>
        <div>
          <label htmlFor="phone" className="sr-only">Téléphone</label>
          <input id="phone" type="tel" autoComplete="tel" placeholder="Téléphone" value={v.phone} onChange={set("phone")} required className={authInputClass} />
        </div>
        <div>
          <label htmlFor="orias" className="sr-only">Numéro ORIAS</label>
          <input id="orias" inputMode="numeric" placeholder="Numéro ORIAS (8 chiffres)" value={v.orias_number} onChange={set("orias_number")} className={authInputClass} />
        </div>
      </div>

      <fieldset className="mt-6">
        <legend className="mb-2.5 text-[14px] font-semibold text-ink">Marchés qui vous intéressent</legend>
        <div className="grid grid-cols-2 gap-2">
          {LEAD_TYPES.map((t) => {
            const on = types.includes(t.value);
            return (
              <button
                key={t.value}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(t.value)}
                className={`min-h-11 border px-2 text-[13px] font-bold transition-colors ${on ? "border-brand bg-brand text-white" : "border-brand bg-white text-brand hover:bg-brand/5"}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {error && <p role="alert" className="mt-5 text-sm text-red-600">{error}</p>}

      <div className="mt-8">
        <GoogleButton onClick={() => setGoogleNotice(true)} />
        {googleNotice && (
          <p role="status" className="mt-3 border-l-4 border-accent bg-light p-3 text-[13px] leading-relaxed text-slate-700">
            L&apos;inscription avec Google arrive bientôt. En attendant, remplissez le formulaire : nous vérifions votre ORIAS et vous envoyons vos accès.
          </p>
        )}
      </div>

      <div className="mt-auto pt-10">
        <label htmlFor="consent" className="mb-5 flex items-start gap-2.5 text-[14px] leading-snug text-slate-700">
          <input id="consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-brand" />
          <span>J&apos;accepte d&apos;être recontacté par FicheAssur au sujet de ma demande d&apos;ouverture de compte.</span>
        </label>
        <p className="mb-4 text-center text-[14px] text-slate-600">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="font-semibold text-brand hover:underline">Se connecter</Link>
        </p>
        <AuthSubmit disabled={!consent || state === "sending"}>{state === "sending" ? "Envoi en cours…" : "Créer mon compte"}</AuthSubmit>
      </div>
    </form>
  );
}
