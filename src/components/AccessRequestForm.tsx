"use client";

import { useState } from "react";
import { z } from "zod";
import { LEAD_TYPES } from "@/lib/leadTypes";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8100").replace(/\/+$/, "");

const schema = z.object({
  full_name: z.string().trim().min(2, "Indiquez votre nom"),
  company: z.string().trim().min(2, "Indiquez le nom de votre cabinet"),
  email: z.string().trim().email("Adresse email invalide"),
  phone: z.string().trim().regex(/^(?:(?:\+|00)33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/, "Numéro de téléphone invalide"),
  orias_number: z.string().trim().refine((v) => v === "" || /^\d{8}$/.test(v.replace(/\D/g, "")), "Le numéro ORIAS comporte 8 chiffres"),
  lead_types: z.array(z.string()).min(1, "Choisissez au moins un type de lead"),
  message: z.string().trim().max(2000),
});

type Values = z.infer<typeof schema>;
type Errors = Partial<Record<keyof Values, string>>;

const EMPTY: Values = { full_name: "", company: "", email: "", phone: "", orias_number: "", lead_types: [], message: "" };

const inputClass =
  "h-12 w-full border border-slate-300 bg-white px-4 text-[15px] text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";

// The landing page's call to action: a broker asking for buyer access.
// No account is created here — requests are reviewed (ORIAS check, call
// back) before anyone can buy leads.
export default function AccessRequestForm() {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  const set = <K extends keyof Values>(k: K, v: Values[K]) => setValues((p) => ({ ...p, [k]: v }));
  const toggleType = (t: string) =>
    set("lead_types", values.lead_types.includes(t) ? values.lead_types.filter((x) => x !== t) : [...values.lead_types, t]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const errs: Errors = {};
      for (const issue of parsed.error.issues) errs[issue.path[0] as keyof Values] ??= issue.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    setState("sending");
    setServerError(null);
    try {
      const res = await fetch(`${API_URL}/api/v1/access-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsed.data,
          orias_number: parsed.data.orias_number || null,
          message: parsed.data.message || null,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const detail = Array.isArray(body?.detail)
          ? String(body.detail[0]?.msg ?? "").replace(/^Value error, /, "")
          : body?.detail;
        throw new Error(res.status === 429 ? "Trop de demandes. Réessayez plus tard." : detail || "Une erreur est survenue.");
      }
      setState("sent");
    } catch (err) {
      setState("error");
      setServerError(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  if (state === "sent") {
    return (
      <div className="flex flex-col gap-3 bg-light p-8">
        <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-brand">Demande envoyée</p>
        <h3 className="heading text-[26px] leading-tight text-ink">Merci, nous revenons vers vous sous 24 h.</h3>
        <p className="text-[15px] text-slate-600">
          Un conseiller vérifie votre immatriculation et vous rappelle pour configurer vos critères de leads.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nom et prénom" error={errors.full_name}>
          <input value={values.full_name} onChange={(e) => set("full_name", e.target.value)} autoComplete="name" className={inputClass} />
        </Field>
        <Field label="Cabinet de courtage" error={errors.company}>
          <input value={values.company} onChange={(e) => set("company", e.target.value)} autoComplete="organization" className={inputClass} />
        </Field>
        <Field label="Email professionnel" error={errors.email}>
          <input type="email" value={values.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" className={inputClass} />
        </Field>
        <Field label="Téléphone" error={errors.phone}>
          <input type="tel" value={values.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" placeholder="06 12 34 56 78" className={inputClass} />
        </Field>
      </div>

      <Field label="Numéro ORIAS (facultatif)" error={errors.orias_number}>
        <input value={values.orias_number} onChange={(e) => set("orias_number", e.target.value)} inputMode="numeric" placeholder="12345678" className={`${inputClass} sm:max-w-xs`} />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-[14px] font-medium text-ink">Leads qui vous intéressent</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {LEAD_TYPES.map((t) => {
            const on = values.lead_types.includes(t.value);
            return (
              <button
                key={t.value}
                type="button"
                aria-pressed={on}
                onClick={() => toggleType(t.value)}
                className={`h-12 border-2 px-3 text-[14px] font-medium transition ${on ? "border-brand bg-brand text-white" : "border-slate-200 bg-white text-ink hover:border-slate-300"}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        {errors.lead_types && <span className="text-[13px] text-red-600">{errors.lead_types}</span>}
      </fieldset>

      <Field label="Message (facultatif)" error={errors.message}>
        <textarea value={values.message} onChange={(e) => set("message", e.target.value)} rows={3} placeholder="Zones ciblées, volume mensuel souhaité…" className="w-full border border-slate-300 bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15" />
      </Field>

      {serverError && <p role="alert" className="bg-red-50 p-3 text-[14px] text-red-700">{serverError}</p>}

      <button
        type="submit"
        disabled={state === "sending"}
        className="inline-flex h-12 items-center justify-center gap-2 self-start bg-brand px-8 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-60"
      >
        {state === "sending" && <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
        {state === "sending" ? "Envoi…" : "Demander mon accès"}
      </button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[14px] font-medium text-ink">{label}</span>
      {children}
      {error && <span className="text-[13px] text-red-600">{error}</span>}
    </label>
  );
}
