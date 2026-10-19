"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthSubmit, PasswordToggleIcon, authInputClass } from "@/components/AuthLayout";
import { activate } from "@/lib/pro";

// First password, from the activation link an admin sends after accepting a
// partner request (backend POST /api/v1/auth/activate). One use only.
export default function ActivateForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await activate(token, password);
      router.push("/espace-pro");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  if (!token) {
    return <p className="text-center text-[15px] text-slate-600">Ce lien d&apos;activation est incomplet. Utilisez le lien reçu par email.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
      <h1 className="mb-2 text-center text-[28px] font-medium leading-tight text-ink">Activez votre espace pro</h1>
      <p className="mb-7 text-center text-[14px] text-slate-600">Choisissez votre mot de passe pour accéder à vos leads.</p>
      <div className="flex flex-col gap-5">
        <div className="relative">
          <label htmlFor="password" className="sr-only">Mot de passe</label>
          <input id="password" type={show ? "text" : "password"} autoComplete="new-password" placeholder="Choisissez un mot de passe" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required className={`${authInputClass} pr-12`} />
          <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"} className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-600 hover:text-ink">
            <PasswordToggleIcon shown={show} />
          </button>
        </div>
        <div>
          <label htmlFor="confirm" className="sr-only">Confirmez le mot de passe</label>
          <input id="confirm" type={show ? "text" : "password"} autoComplete="new-password" placeholder="Confirmez le mot de passe" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} required className={authInputClass} />
          <p className="mt-1.5 text-[13px] text-slate-500">8 caractères minimum.</p>
        </div>
      </div>
      {error && <p role="alert" className="mt-5 text-sm text-red-600">{error}</p>}
      <div className="mt-auto pt-10">
        <AuthSubmit disabled={loading || password.length < 8 || !confirm}>{loading ? "Activation…" : "Activer mon compte"}</AuthSubmit>
      </div>
    </form>
  );
}
