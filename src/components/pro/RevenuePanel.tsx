"use client";

import { useState } from "react";
import Combobox from "@/components/pro/Combobox";
import { card, primaryButton } from "@/components/pro/ui";
import { costShare, pct, roi, share } from "@/lib/finance";
import { euros } from "@/lib/format";
import { addRevenue, deleteRevenue, type CrmLeadDetail } from "@/lib/pro";

// A lead's profitability: what it cost, what it earned (one line per amount
// invoiced -- commission, fees, renewals), and the return. Feeds Finances.

const LABELS = ["Commission", "Frais de courtage", "Honoraires", "Commission de renouvellement"];

const inputClass = "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-[14px] text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/15";

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// "1 234,56" / "1234.5" / "300" -> cents, or null.
function toCents(v: string): number | null {
  const n = Number(v.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : null;
}

export default function RevenuePanel({ lead, onChange }: { lead: CrmLeadDetail; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [v, setV] = useState({ amount: "", label: LABELS[0], date: today() });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const earned = lead.revenues.reduce((s, r) => s + r.amount_cents, 0);
  const net = earned - lead.price_cents;
  const r = earned ? roi(lead.price_cents, earned) : null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const cents = toCents(v.amount);
    if (!cents) return setError("Indiquez un montant (par exemple 350 ou 350,50).");
    setBusy(true);
    setError("");
    try {
      await addRevenue(lead.id, { amount_cents: cents, label: v.label.trim() || LABELS[0], invoiced_on: v.date });
      setV({ amount: "", label: LABELS[0], date: today() });
      setOpen(false);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
    setBusy(false);
  }

  async function remove(id: string) {
    await deleteRevenue(id).catch((err) => setError(err.message));
    onChange();
  }

  return (
    <section className={`${card} flex flex-col gap-4 p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-accent pb-2">
        <h2 className="text-[15px] font-bold text-ink">Rentabilité</h2>
        {!open && (
          <button type="button" onClick={() => setOpen(true)} className="text-[14px] font-semibold text-brand hover:underline">
            + Ajouter un montant facturé
          </button>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        {[
          ["Prix du lead", euros(lead.price_cents), "text-ink"],
          ["Chiffre d'affaires", earned ? euros(earned) : "—", "text-ink"],
          ["Bénéfice net", earned ? euros(net) : "—", net >= 0 ? "text-emerald-700" : "text-red-600"],
          ["Retour sur investissement", pct(r), r === null ? "text-ink" : r >= 0 ? "text-emerald-700" : "text-red-600"],
        ].map(([label, value, tone]) => (
          <div key={label}>
            <dt className="text-[12px] text-slate-500">{label}</dt>
            <dd className={`text-[18px] font-bold ${earned || label === "Prix du lead" ? tone : "text-slate-400"}`}>{value}</dd>
          </div>
        ))}
      </dl>
      {earned > 0 && (
        <p className="text-[13px] text-slate-600">Le prix du lead représente {share(costShare(lead.price_cents, earned))} du chiffre d&apos;affaires qu&apos;il a généré.</p>
      )}

      {open && (
        <form onSubmit={save} className="grid grid-cols-1 gap-3 rounded-md bg-slate-50 p-4 sm:grid-cols-[1fr_1.4fr_1fr_auto] sm:items-end">
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold text-ink">Montant (€)</span>
            <input value={v.amount} onChange={(e) => setV({ ...v, amount: e.target.value })} inputMode="decimal" placeholder="350,00" autoFocus className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold text-ink">Nature</span>
            <Combobox value={v.label} onChange={(label) => setV({ ...v, label })} options={LABELS} maxLength={80} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[12px] font-semibold text-ink">Facturé le</span>
            <input type="date" value={v.date} onChange={(e) => setV({ ...v, date: e.target.value })} required className={inputClass} />
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className={primaryButton}>{busy ? "…" : "Ajouter"}</button>
            <button type="button" onClick={() => { setOpen(false); setError(""); }} className="h-11 px-3 text-[14px] font-semibold text-slate-600 hover:text-ink">Annuler</button>
          </div>
        </form>
      )}
      {error && <p role="alert" className="text-[13px] text-red-600">{error}</p>}

      {lead.revenues.length > 0 ? (
        <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
          {lead.revenues.map((x) => (
            <li key={x.id} className="flex items-center gap-3 px-4 py-2.5 text-[14px]">
              <span className="w-24 shrink-0 text-slate-500">{new Date(x.invoiced_on).toLocaleDateString("fr-FR")}</span>
              <span className="flex-1 text-ink">{x.label}</span>
              <span className="font-semibold text-ink">{euros(x.amount_cents)}</span>
              <button type="button" onClick={() => remove(x.id)} aria-label={`Supprimer ${x.label}`} data-tip="Supprimer" data-tip-align="end" className="flex size-8 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600">
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></svg>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        !open && <p className="text-[13px] text-slate-500">Signé ? Ajoutez la commission ou les frais facturés pour suivre ce que vous rapportent vos leads.</p>
      )}
    </section>
  );
}
