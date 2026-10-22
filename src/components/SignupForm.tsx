"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthSubmit, PasswordToggleIcon, authInputClass } from "@/components/AuthLayout";
import { LEAD_TYPES } from "@/lib/leadTypes";
import GoogleButton from "@/components/GoogleButton";
import { useRedirectIfLoggedIn } from "@/components/NavAccount";
import { register } from "@/lib/pro";

// Same design as New World Courtage's /inscription. Self-service: the
// account is created active (backend POST /api/v1/auth/register) and the
// broker lands in the espace pro straight away -- no review to wait for.
export default function SignupForm() {
  const router = useRouter();
  useRedirectIfLoggedIn(); // already logged in: straight to the espace pro
  const [v, setV] = useState({ full_name: "", company: "", email: "", phone: "", orias_number: "", password: "" });
  const [types, setTypes] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => setV((p) => ({ ...p, [k]: e.target.value }));
  const toggle = (t: string) => setTypes((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent || loading) return;
    if (types.length === 0) {
      setError("Choisissez au moins un marché.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register({ ...v, orias_number: v.orias_number || null, lead_types: types });
      router.push("/espace-pro");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
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
          <input id="orias" inputMode="numeric" placeholder="Numéro ORIAS (8 chiffres, facultatif)" value={v.orias_number} onChange={set("orias_number")} className={authInputClass} />
        </div>
        <div>
          <div className="relative">
            <label htmlFor="password" className="sr-only">Mot de passe</label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Choisissez un mot de passe"
              minLength={8}
              value={v.password}
              onChange={set("password")}
              required
              className={`${authInputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-600 hover:text-ink"
            >
              <PasswordToggleIcon shown={showPassword} />
            </button>
          </div>
          <p className="mt-1.5 text-[13px] text-slate-500">8 caractères minimum.</p>
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
        <GoogleButton beforeStart={() => (consent ? null : "Acceptez d'abord les conditions ci-dessous.")} />
      </div>

      <div className="mt-auto pt-10">
        <label htmlFor="consent" className="mb-5 flex items-start gap-2.5 text-[14px] leading-snug text-slate-700">
          <input id="consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-brand" />
          <span>J&apos;accepte d&apos;être contacté par FicheAssur au sujet de mon compte.</span>
        </label>
        <p className="mb-4 text-center text-[14px] text-slate-600">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="font-semibold text-brand hover:underline">Se connecter</Link>
        </p>
        <AuthSubmit disabled={!consent || loading}>{loading ? "Création du compte…" : "Créer mon compte"}</AuthSubmit>
      </div>
    </form>
  );
}
