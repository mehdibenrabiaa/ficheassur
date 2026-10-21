"use client";

import { useEffect, useState } from "react";
import Select from "@/components/Select";
import { SectionTitle, card, primaryButton } from "@/components/pro/ui";
import { euros } from "@/lib/format";
import { addExpense, deleteExpense, listExpenses, stopExpense, type Expense, type ExpenseCategory, type ExpenseFrequency } from "@/lib/pro";

// Frais généraux on the Finances page: the broker's running costs besides
// leads (phone, internet, subscriptions...), one-off, monthly or yearly.
// They count as costs in the figures above; onChange reloads them.

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "phone", label: "Téléphone" },
  { value: "internet", label: "Internet" },
  { value: "software", label: "Logiciel / abonnement" },
  { value: "other", label: "Autre" },
];
const FREQUENCIES: { value: ExpenseFrequency; label: string }[] = [
  { value: "monthly", label: "Tous les mois" },
  { value: "yearly", label: "Tous les ans" },
  { value: "once", label: "Une seule fois" },
];
const PER = { monthly: "/ mois", yearly: "/ an", once: "" };

const inputClass = "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[14px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const toCents = (v: string) => {
  const n = Number(v.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
};
const frDate = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export default function ExpensesPanel({ onChange }: { onChange: () => void }) {
  const [items, setItems] = useState<Expense[] | null>(null);
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ label: "", category: "phone" as ExpenseCategory, amount: "", frequency: "monthly" as ExpenseFrequency, start_on: today() });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = () => listExpenses().then(setItems).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const active = (items ?? []).filter((e) => e.frequency !== "once" && (!e.end_on || e.end_on >= today()));
  const perMonth = active.reduce((s, e) => s + e.monthly_cents, 0);

  async function act(fn: () => Promise<unknown>) {
    setError("");
    try {
      await fn();
      await load();
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const cents = toCents(v.amount);
    if (!v.label.trim()) return setError("Donnez un nom à ce frais (par exemple « Forfait mobile »).");
    if (!cents) return setError("Indiquez un montant (par exemple 29,99).");
    setBusy(true);
    await act(async () => {
      await addExpense({ label: v.label.trim(), category: v.category, amount_cents: cents, frequency: v.frequency, start_on: v.start_on });
      setV({ label: "", category: "phone", amount: "", frequency: "monthly", start_on: today() });
      setOpen(false);
    });
    setBusy(false);
  }

  return (
    <section className={`${card} flex flex-col gap-4 p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <SectionTitle icon="receipt" title="Frais généraux" subtitle={<>Téléphone, internet, abonnements… comptés dans vos coûts.
            {perMonth > 0 && <> Frais récurrents : <strong className="text-ink">{euros(perMonth)} / mois</strong>.</>}</>} />
        </div>
        {!open && (
          <button type="button" onClick={() => setOpen(true)} className="text-[14px] font-semibold text-brand hover:underline">+ Ajouter un frais</button>
        )}
      </div>

      {open && (
        <form onSubmit={save} className="grid grid-cols-1 gap-3 rounded-md bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1.2fr_0.8fr_1fr_1fr]">
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold text-ink">Libellé</span>
            <input value={v.label} onChange={(e) => setV({ ...v, label: e.target.value })} maxLength={80} placeholder="Forfait mobile" autoFocus className={inputClass} />
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold text-ink">Catégorie</span>
            <Select size="sm" value={v.category} onChange={(c) => setV({ ...v, category: c as ExpenseCategory })} options={CATEGORIES} ariaLabel="Catégorie" className="!h-10" />
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold text-ink">Montant (€)</span>
            <input value={v.amount} onChange={(e) => setV({ ...v, amount: e.target.value })} inputMode="decimal" placeholder="29,99" className={inputClass} />
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold text-ink">Fréquence</span>
            <Select size="sm" value={v.frequency} onChange={(f) => setV({ ...v, frequency: f as ExpenseFrequency })} options={FREQUENCIES} ariaLabel="Fréquence" className="!h-10" />
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold text-ink">{v.frequency === "once" ? "Payé le" : "Depuis le"}</span>
            <input type="date" value={v.start_on} onChange={(e) => setV({ ...v, start_on: e.target.value })} required className={inputClass} />
          </label>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-5">
            <button type="submit" disabled={busy} className={primaryButton}>{busy ? "…" : "Ajouter"}</button>
            <button type="button" onClick={() => { setOpen(false); setError(""); }} className="h-11 px-3 text-[14px] font-semibold text-slate-600 hover:text-ink">Annuler</button>
          </div>
        </form>
      )}
      {error && <p role="alert" className="text-[13px] text-red-600">{error}</p>}

      {items && items.length > 0 ? (
        <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
          {items.map((e) => {
            const stopped = e.end_on !== null && e.end_on < today();
            return (
              <li key={e.id} className={`flex flex-col gap-2 px-4 py-3 text-[14px] sm:flex-row sm:items-center sm:gap-4 ${stopped ? "text-slate-400" : ""}`}>
                <span className="min-w-0 flex-1">
                  <span className={`block font-semibold sm:inline ${stopped ? "" : "text-ink"}`}>{e.label}</span>
                  <span className="text-[13px] text-slate-500 sm:ml-2">
                    {CATEGORIES.find((c) => c.value === e.category)?.label} · {e.frequency === "once" ? `payé le ${frDate(e.start_on)}` : `depuis le ${frDate(e.start_on)}`}
                    {e.end_on && e.frequency !== "once" && ` · arrêté le ${frDate(e.end_on)}`}
                  </span>
                </span>
                <span className="flex items-center justify-between gap-3 sm:contents">
                <span className={`font-semibold ${stopped ? "" : "text-ink"}`}>{euros(e.amount_cents)} <span className="font-normal text-slate-500">{PER[e.frequency]}</span></span>
                <span className="flex items-center gap-1">
                  {e.frequency !== "once" && (
                    <button
                      type="button"
                      onClick={() => act(() => stopExpense(e.id, e.end_on ? null : today()))}
                      className="rounded-md px-2 py-1 text-[13px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-ink"
                    >
                      {e.end_on ? "Reprendre" : "Arrêter"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => act(() => deleteExpense(e.id))}
                    aria-label={`Supprimer ${e.label}`}
                    data-tip="Supprimer"
                    data-tip-align="end"
                    className="flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></svg>
                  </button>
                </span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        items && !open && <p className="text-[13px] text-slate-500">Aucun frais pour le moment. Ajoutez votre forfait téléphone, votre box internet ou vos logiciels pour connaître votre bénéfice réel.</p>
      )}
    </section>
  );
}
