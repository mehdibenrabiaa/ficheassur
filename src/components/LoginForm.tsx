"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthSubmit, PasswordToggleIcon, authInputClass } from "@/components/AuthLayout";
import GoogleButton from "@/components/GoogleButton";
import { login } from "@/lib/pro";

// Same form as New World Courtage's /connexion, signing in to the espace pro
// (backend POST /api/v1/auth/login).
export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/espace-pro");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <h1 className="mb-7 text-center text-[28px] font-medium leading-tight text-ink">Connectez-vous à votre espace pro</h1>

      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="email" className="sr-only">Adresse email</label>
          <input id="email" type="email" autoComplete="email" placeholder="Entrez votre adresse email" value={email} onChange={(e) => setEmail(e.target.value)} required className={authInputClass} />
        </div>
        <div className="relative">
          <label htmlFor="password" className="sr-only">Mot de passe</label>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Entrez votre mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={`${authInputClass} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-600 hover:text-ink"
          >
            <PasswordToggleIcon shown={showPassword} />
          </button>
        </div>
      </div>

      <Link href="/assistance#contact" className="mt-6 self-center text-[14px] text-brand hover:underline">
        Mot de passe oublié ?
      </Link>

      {error && <p role="alert" className="mt-5 text-sm text-red-600">{error}</p>}

      <div className="mt-8">
        <GoogleButton />
      </div>

      <div className="mt-auto pt-10">
        <p className="mb-4 text-center text-[14px] text-slate-600">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="font-semibold text-brand hover:underline">Créer un compte</Link>
        </p>
        <AuthSubmit disabled={loading || !email || !password}>{loading ? "Connexion…" : "Valider"}</AuthSubmit>
      </div>
    </form>
  );
}
