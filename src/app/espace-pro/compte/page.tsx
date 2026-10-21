"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBroker, useSetBroker } from "@/components/ProShell";
import { PageHeader, card, primaryButton, secondaryButton } from "@/components/pro/ui";
import { CONTACT } from "@/lib/contact";
import { LEAD_TYPES } from "@/lib/leadTypes";
import { clearToken, updateMe, type Broker } from "@/lib/pro";

// Mon compte, laid out like Stripe's settings: one section per topic, its
// title and explanation on the left, the form on the right. The broker edits
// their profile and markets; the email (their login) changes through support.

const inputClass =
  "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[14px] text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:bg-slate-50 disabled:text-slate-500";

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="grid grid-cols-1 gap-4 border-t border-slate-200 pt-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
      <div>
        <h2 className="text-[16px] font-bold text-ink">{title}</h2>
        <p className="mt-1 text-[14px] leading-relaxed text-slate-600">{description}</p>
      </div>
      <div className={`${card} p-6`}>{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-ink">{label}</span>
      {children}
      {hint && <span className="text-[12px] text-slate-500">{hint}</span>}
    </label>
  );
}

// "Enregistré" next to a save button, or the error.
function SaveStatus({ state }: { state: { ok?: string; error?: string } }) {
  if (state.error) return <span role="alert" className="text-[13px] text-red-600">{state.error}</span>;
  if (state.ok) return <span role="status" className="text-[13px] font-semibold text-emerald-700">✓ {state.ok}</span>;
  return null;
}

const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

export default function MonCompte() {
  const broker = useBroker();
  const router = useRouter();

  return (
    <>
      <PageHeader title="Mon compte" subtitle="Votre profil, vos marchés et votre accès." />

      {/* Identity strip */}
      <div className={`${card} flex flex-wrap items-center gap-5 p-6`}>
        <span className="flex size-14 shrink-0 items-center justify-center rounded-md bg-brand text-[20px] font-bold text-white" aria-hidden="true">
          {initials(broker.company || broker.full_name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[18px] font-bold text-ink">{broker.full_name}</p>
          <p className="truncate text-[14px] text-slate-600">{broker.company || "Cabinet à compléter"} · {broker.email}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[12px] font-semibold">
          <span className="rounded-full bg-light px-3 py-1 text-brand">{broker.role === "admin" ? "Administrateur" : "Courtier partenaire"}</span>
          {broker.created_at && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
              Membre depuis {new Date(broker.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-8">
        <ProfileSection broker={broker} />
        <MarketsSection broker={broker} />
        <Section title="Email de connexion" description="L'adresse avec laquelle vous vous connectez et recevez nos messages.">
          <Field label="Email" hint="Pour changer d'adresse, écrivez-nous : nous vérifions la nouvelle avant de la modifier.">
            <input value={broker.email} disabled className={inputClass} />
          </Field>
          <a href={`mailto:${CONTACT.email}?subject=${encodeURIComponent("Changement d'email FicheAssur")}`} className="mt-4 inline-block text-[14px] font-semibold text-brand hover:underline">
            Demander un changement d&apos;email
          </a>
        </Section>
        <Section title="Session" description="Déconnectez-vous de cet appareil. Pensez-y sur un ordinateur partagé.">
          <button
            type="button"
            onClick={() => {
              clearToken();
              router.replace("/connexion");
            }}
            className={secondaryButton}
          >
            Se déconnecter
          </button>
        </Section>
      </div>
    </>
  );
}

function profileOf(b: Broker) {
  return { full_name: b.full_name, company: b.company, phone: b.phone ?? "", orias_number: b.orias_number ?? "" };
}

function ProfileSection({ broker }: { broker: Broker }) {
  const setBroker = useSetBroker();
  const [v, setV] = useState(() => profileOf(broker));
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<{ ok?: string; error?: string }>({});
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setV((p) => ({ ...p, [k]: e.target.value }));
    setState({});
  };
  const dirty = JSON.stringify(v) !== JSON.stringify(profileOf(broker));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const b = await updateMe({ ...v, phone: v.phone || null, orias_number: v.orias_number || null, lead_types: broker.lead_types });
      setBroker(b);
      setV(profileOf(b));
      setState({ ok: "Profil enregistré" });
    } catch (err) {
      setState({ error: err instanceof Error ? err.message : "Une erreur est survenue." });
    }
    setBusy(false);
  }

  return (
    <Section title="Profil" description="Votre nom et votre cabinet, tels qu'ils apparaissent sur vos factures et pour notre équipe.">
      <form onSubmit={save} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nom et prénom"><input required minLength={2} value={v.full_name} onChange={set("full_name")} autoComplete="name" className={inputClass} /></Field>
          <Field label="Cabinet"><input required minLength={2} value={v.company} onChange={set("company")} autoComplete="organization" className={inputClass} /></Field>
          <Field label="Téléphone"><input type="tel" value={v.phone} onChange={set("phone")} autoComplete="tel" placeholder="06 12 34 56 78" className={inputClass} /></Field>
          <Field label="Numéro ORIAS" hint="8 chiffres, visible sur orias.fr"><input value={v.orias_number} onChange={set("orias_number")} inputMode="numeric" placeholder="12345678" className={inputClass} /></Field>
        </div>
        <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4">
          <button type="submit" disabled={!dirty || busy} className={primaryButton}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
          <SaveStatus state={state} />
        </div>
      </form>
    </Section>
  );
}

function MarketsSection({ broker }: { broker: Broker }) {
  const setBroker = useSetBroker();
  const [types, setTypes] = useState<string[]>(broker.lead_types);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<{ ok?: string; error?: string }>({});
  const dirty = [...types].sort().join() !== [...broker.lead_types].sort().join();

  function toggle(t: string) {
    setTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
    setState({});
  }

  async function save() {
    if (!types.length) return setState({ error: "Choisissez au moins un marché." });
    setBusy(true);
    try {
      const b = await updateMe({ full_name: broker.full_name, company: broker.company || broker.full_name, phone: broker.phone, orias_number: broker.orias_number, lead_types: types });
      setBroker(b);
      setState({ ok: "Marchés enregistrés" });
    } catch (err) {
      setState({ error: err instanceof Error ? err.message : "Une erreur est survenue." });
    }
    setBusy(false);
  }

  return (
    <Section title="Marchés suivis" description="Les types de leads qui vous intéressent. Ils nous aident à vous proposer les bons prospects.">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {LEAD_TYPES.map((t) => {
          const on = types.includes(t.value);
          return (
            <button
              key={t.value}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(t.value)}
              className={`flex items-center justify-between gap-3 rounded-md border px-4 py-3 text-left text-[14px] font-semibold transition-colors ${on ? "border-brand bg-brand/5 text-brand" : "border-slate-300 text-ink hover:border-slate-400"}`}
            >
              {t.label}
              <span className={`flex size-5 items-center justify-center rounded border ${on ? "border-brand bg-brand text-white" : "border-slate-300"}`} aria-hidden="true">
                {on && <svg viewBox="0 0 20 20" className="size-3.5" fill="none" stroke="currentColor" strokeWidth={3}><path d="M4 10.5l4 4 8-9" /></svg>}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4">
        <button type="button" onClick={save} disabled={!dirty || busy} className={primaryButton}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
        <SaveStatus state={state} />
      </div>
    </Section>
  );
}
