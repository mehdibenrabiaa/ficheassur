"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Select from "@/components/Select";
import ExpensesPanel from "@/components/pro/ExpensesPanel";
import { CardsSkeleton, ErrorNote, PageHeader, SectionTitle, card } from "@/components/pro/ui";
import { costShare, pct, roi, share } from "@/lib/finance";
import { euros, marketLabel } from "@/lib/format";
import { LEAD_TYPES } from "@/lib/leadTypes";
import { getFinance, type Finance } from "@/lib/pro";

// Finances: what the broker spends -- leads, plus frais généraux (phone,
// internet, subscriptions) -- against what the leads earned (the amounts
// recorded on each lead's page): figures, by month, by market, the most
// profitable leads, and the list of frais.
//
// Chart colours (validated: lightness band, CVD separation; aqua is below 3:1
// contrast, relieved by the legend and the table view): revenue = blue,
// leads = orange, frais = aqua. Text stays in ink colours.
const REVENUE = "#2a78d6";
const SPENT = "#eb6834";
const EXPENSES = "#1baf7a";

// Periods: one month (this one by default, arrows to step), rolling ranges, or custom dates.
const MODES = [
  { value: "month", label: "Par mois" },
  { value: "12m", label: "12 derniers mois" },
  { value: "year", label: "Cette année" },
  { value: "all", label: "Depuis le début" },
  { value: "custom", label: "Personnalisé" },
] as const;
type Mode = (typeof MODES)[number]["value"];

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const thisMonth = () => iso(new Date()).slice(0, 7);
function shiftMonth(m: string, by: number) {
  const d = new Date(`${m}-01T12:00:00`);
  d.setMonth(d.getMonth() + by);
  return iso(d).slice(0, 7);
}

// The period as since / until dates (null = open), or null while a custom range is incomplete or inverted.
function rangeOf(mode: Mode, month: string, from: string, to: string): { since: string | null; until: string | null } | null {
  const d = new Date();
  if (mode === "month") {
    const last = new Date(`${month}-01T12:00:00`);
    last.setMonth(last.getMonth() + 1, 0);
    return { since: `${month}-01`, until: iso(last) };
  }
  if (mode === "year") return { since: `${d.getFullYear()}-01-01`, until: null };
  if (mode === "all") return { since: null, until: null };
  if (mode === "custom") return from && to && from <= to ? { since: from, until: to } : null;
  d.setMonth(d.getMonth() - 11, 1);
  return { since: iso(d), until: null };
}

const monthLabel = (m: string, style: "short" | "long" = "short") =>
  new Date(`${m}-01T12:00:00`).toLocaleDateString("fr-FR", { month: style, year: style === "long" ? "numeric" : undefined });

// A figure tile. The dot before the label is its series' colour in the
// chart (revenue blue, leads orange, frais aqua); results have none.
function Tile({ label, value, hint, tone = "text-ink", accent }: { label: string; value: string; hint?: string; tone?: string; accent?: string }) {
  return (
    <div className={`${card} flex flex-col gap-1 p-5`}>
      <p className="flex items-center gap-2 text-[13px] text-slate-500">
        {accent && <span className="size-2.5 shrink-0 rounded-full" style={{ background: accent }} aria-hidden="true" />}
        {label}
      </p>
      <p className={`text-[26px] font-bold leading-tight tracking-tight ${tone}`}>{value}</p>
      {hint && <p className="text-[12px] text-slate-500">{hint}</p>}
    </div>
  );
}

export default function Finances() {
  const [mode, setMode] = useState<Mode>("month");
  const [month, setMonth] = useState(thisMonth);
  const [from, setFrom] = useState(() => `${thisMonth()}-01`);
  const [to, setTo] = useState(() => iso(new Date()));
  const [data, setData] = useState<Finance | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0); // bumped when frais change
  const [market, setMarket] = useState(""); // "" = all markets

  const range = rangeOf(mode, month, from, to);
  const rangeKey = range ? `${range.since}|${range.until}|${market}` : "";
  useEffect(() => {
    if (!rangeKey) return;
    const [since, until, m] = rangeKey.split("|").map((x) => (x === "null" || x === "" ? null : x));
    getFinance(since, until, m).then(setData).catch((e) => setError(e.message));
  }, [rangeKey, reload]);
  const isCurrentMonth = month === thisMonth();

  const t = data?.totals;
  const costs = t ? t.spent_cents + t.expenses_cents : 0;
  const net = t ? t.revenue_cents - costs : 0;
  const r = t ? roi(costs, t.revenue_cents) : null; // over all costs: leads + frais
  const leadsRoi = t ? roi(t.spent_cents, t.revenue_cents) : null;

  return (
    <>
      <PageHeader title="Finances" subtitle="Ce que vous dépensez (leads et frais généraux), et ce que vos leads vous rapportent." />
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[13px] font-semibold text-slate-600">Marché</span>
          <div className="w-60">
            <Select size="sm" value={market} onChange={setMarket} options={[{ value: "", label: "Tous les marchés" }, ...LEAD_TYPES.map((t) => ({ value: t.value, label: t.label }))]} ariaLabel="Marché" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Période">
          {MODES.map((p) => (
            <button
              key={p.value}
              type="button"
              aria-pressed={mode === p.value}
              onClick={() => setMode(p.value)}
              className={`rounded-full border px-4 py-1.5 text-[13px] font-semibold transition-colors ${mode === p.value ? "border-brand bg-brand text-white" : "border-slate-300 text-ink hover:border-brand"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {mode === "month" && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setMonth((m) => shiftMonth(m, -1))} aria-label="Mois précédent" className="flex size-9 items-center justify-center rounded-md border border-slate-300 text-ink hover:border-brand">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
            </button>
            <span className="min-w-40 text-center text-[16px] font-bold capitalize text-ink" aria-live="polite">{monthLabel(month, "long")}</span>
            <button type="button" onClick={() => setMonth((m) => shiftMonth(m, 1))} disabled={isCurrentMonth} aria-label="Mois suivant" className="flex size-9 items-center justify-center rounded-md border border-slate-300 text-ink hover:border-brand disabled:opacity-40">
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
            </button>
            {!isCurrentMonth && (
              <button type="button" onClick={() => setMonth(thisMonth())} className="ml-1 text-[13px] font-semibold text-brand hover:underline">Ce mois-ci</button>
            )}
          </div>
        )}
        {mode === "custom" && (
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-ink">Du</span>
              <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className="h-10 rounded-md border border-slate-300 px-3 text-[14px] outline-none focus:border-brand" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold text-ink">Au</span>
              <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className="h-10 rounded-md border border-slate-300 px-3 text-[14px] outline-none focus:border-brand" />
            </label>
            {!range && <p role="alert" className="pb-2 text-[13px] text-red-600">Choisissez une date de début avant la date de fin.</p>}
          </div>
        )}
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}

      {!data || !t ? (
        <CardsSkeleton />
      ) : (
        <div key={rangeKey} className="fade-in flex flex-col gap-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Tile accent={REVENUE} label="Chiffre d'affaires facturé" value={euros(t.revenue_cents)} hint={`Sur ${t.leads_with_revenue} lead${t.leads_with_revenue > 1 ? "s" : ""}, par date de facture`} />
            <Tile accent={SPENT} label="Dépensé en leads" value={euros(t.spent_cents)} hint={`${t.leads} lead${t.leads > 1 ? "s" : ""} acheté${t.leads > 1 ? "s" : ""}`} />
            <Tile
              accent={EXPENSES}
              label="Frais généraux"
              value={market ? "—" : euros(t.expenses_cents)}
              tone={market ? "text-slate-400" : "text-ink"}
              hint={market ? "Non répartis par marché : non comptés ici" : "Téléphone, internet, abonnements…"}
            />
            <Tile label="Bénéfice net" value={euros(net)} tone={net >= 0 ? "text-emerald-700" : "text-red-600"} hint={market ? "CA − leads de ce marché" : "CA − leads − frais généraux"} />
            <Tile
              label="Retour sur investissement"
              value={pct(r)}
              tone={r === null ? "text-ink" : r >= 0 ? "text-emerald-700" : "text-red-600"}
              hint={
                t.revenue_cents && market
                  ? `Sur le coût des leads de ce marché (ils coûtent ${share(costShare(t.spent_cents, t.revenue_cents))} du CA)`
                  : t.revenue_cents
                  ? `Sur tous vos coûts. Leads seuls : ${pct(leadsRoi)} (ils coûtent ${share(costShare(t.spent_cents, t.revenue_cents))} du CA)`
                  : "Ajoutez vos montants facturés sur chaque lead"
              }
            />
          </div>

          {t.revenue_cents === 0 && (
            <p className="rounded-md border border-dashed border-slate-300 p-4 text-[14px] text-slate-600">
              Pour calculer votre rentabilité, ouvrez un lead signé dans{" "}
              <Link href="/espace-pro/mes-leads" className="font-semibold text-brand hover:underline">Mes leads</Link> et ajoutez la commission ou les frais facturés dans « Rentabilité ».
            </p>
          )}

          <MonthsChart months={data.months} />
          {!market && <ByMarket rows={data.by_market} />}
          {data.top_leads.length > 0 && <TopLeads rows={data.top_leads} />}
          <ExpensesPanel onChange={() => setReload((n) => n + 1)} />
        </div>
      )}
    </>
  );
}

// Grouped bars per month, one euro axis. Hover (or keyboard focus) a month
// for its values; "Tableau" shows the same numbers as a table.
function MonthsChart({ months }: { months: Finance["months"] }) {
  const [asTable, setAsTable] = useState(false);
  const max = Math.max(1, ...months.flatMap((m) => [m.spent_cents, m.revenue_cents, m.expenses_cents]));
  const ticks = [1, 0.5, 0];

  return (
    <section className={`${card} p-5`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <SectionTitle icon="chart" title="Par mois" subtitle={<>{months.length} mois · leads par date d&apos;achat, CA par date de facture, frais par mois payé</>} />
        </div>
        <div className="flex items-center gap-4">
          <ul className="flex gap-4 text-[13px] text-slate-600" aria-label="Légende">
            <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: REVENUE }} aria-hidden="true" /> Chiffre d&apos;affaires</li>
            <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: SPENT }} aria-hidden="true" /> Leads</li>
            <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: EXPENSES }} aria-hidden="true" /> Frais généraux</li>
          </ul>
          <button type="button" onClick={() => setAsTable((x) => !x)} className="rounded-md border border-slate-300 px-3 py-1.5 text-[13px] font-semibold text-ink hover:border-brand">
            {asTable ? "Graphique" : "Tableau"}
          </button>
        </div>
      </div>

      {asTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead><tr className="border-b border-slate-200 text-left text-[12px] text-slate-500"><th className="py-2 font-medium">Mois</th><th className="py-2 text-right font-medium">Chiffre d&apos;affaires</th><th className="py-2 text-right font-medium">Leads</th><th className="py-2 text-right font-medium">Frais généraux</th></tr></thead>
            <tbody>
              {months.map((m) => (
                <tr key={m.month} className="border-b border-slate-100"><td className="py-2 capitalize">{monthLabel(m.month, "long")}</td><td className="py-2 text-right">{euros(m.revenue_cents)}</td><td className="py-2 text-right">{euros(m.spent_cents)}</td><td className="py-2 text-right">{euros(m.expenses_cents)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        // On phones the 12 months scroll sideways inside the card rather than squeezing.
        <div className="-mx-1 overflow-x-auto px-1">
        <div className="flex min-w-[560px] gap-3">
          {/* y axis */}
          <div className="flex h-56 flex-col justify-between whitespace-nowrap pb-6 text-right text-[11px] text-slate-500" aria-hidden="true">
            {ticks.map((f) => <span key={f}>{euros(Math.round((max * f) / 100) * 100).replace(/,00\s€/, " €")}</span>)}
          </div>
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between" aria-hidden="true">
              {ticks.map((f) => <span key={f} className={`border-t ${f === 0 ? "border-slate-300" : "border-dashed border-slate-200"}`} />)}
            </div>
            <ol className="relative flex h-56 items-end gap-1">
              {months.map((m, i) => (
                <li
                  key={m.month}
                  tabIndex={0}
                  data-tip-align={i >= months.length - 4 ? "end" : undefined}
                  data-tip={`${monthLabel(m.month, "long")} · CA ${euros(m.revenue_cents)} · Leads ${euros(m.spent_cents)} · Frais ${euros(m.expenses_cents)}`}
                  aria-label={`${monthLabel(m.month, "long")} : chiffre d'affaires ${euros(m.revenue_cents)}, leads ${euros(m.spent_cents)}, frais généraux ${euros(m.expenses_cents)}`}
                  className="group flex h-full flex-1 flex-col justify-end rounded-sm outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand/40"
                >
                  <div className="flex h-[calc(100%-1.5rem)] items-end justify-center gap-[2px]">
                    <span className="w-full max-w-4 rounded-t" style={{ height: `${(m.revenue_cents / max) * 100}%`, minHeight: m.revenue_cents ? 2 : 0, background: REVENUE }} />
                    <span className="w-full max-w-4 rounded-t" style={{ height: `${(m.spent_cents / max) * 100}%`, minHeight: m.spent_cents ? 2 : 0, background: SPENT }} />
                    <span className="w-full max-w-4 rounded-t" style={{ height: `${(m.expenses_cents / max) * 100}%`, minHeight: m.expenses_cents ? 2 : 0, background: EXPENSES }} />
                  </div>
                  <span className="h-6 pt-1.5 text-center text-[11px] capitalize text-slate-500">{monthLabel(m.month)}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
        </div>
      )}
    </section>
  );
}

function ByMarket({ rows }: { rows: Finance["by_market"] }) {
  if (!rows.length) return null;
  return (
    <section className={`${card} overflow-x-auto`}>
      <div className="px-5 pt-5"><SectionTitle icon="table" title="Par marché" /></div>
      <table className="mt-3 w-full min-w-[560px] text-[14px]">
        <thead>
          <tr className="border-b border-slate-200 text-left text-[12px] text-slate-500">
            <th className="px-5 py-2 font-medium">Marché</th>
            <th className="px-3 py-2 text-right font-medium">Leads</th>
            <th className="px-3 py-2 text-right font-medium">Dépensé</th>
            <th className="px-3 py-2 text-right font-medium">Chiffre d&apos;affaires</th>
            <th className="px-3 py-2 text-right font-medium">ROI</th>
            <th className="px-5 py-2 text-right font-medium">Coût / CA</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => {
            const r = roi(m.spent_cents, m.revenue_cents);
            return (
              <tr key={m.insurance_type} className="border-b border-slate-100 last:border-0">
                <td className="px-5 py-3 font-semibold text-ink">{marketLabel(m.insurance_type, LEAD_TYPES)}</td>
                <td className="px-3 py-3 text-right">{m.leads} <span className="text-slate-500">achetés · {m.leads_with_revenue} facturés</span></td>
                <td className="px-3 py-3 text-right">{euros(m.spent_cents)}</td>
                <td className="px-3 py-3 text-right">{euros(m.revenue_cents)}</td>
                <td className={`px-3 py-3 text-right font-semibold ${m.revenue_cents === 0 ? "text-slate-400" : r !== null && r >= 0 ? "text-emerald-700" : "text-red-600"}`}>{m.revenue_cents ? pct(r) : "—"}</td>
                <td className="px-5 py-3 text-right">{share(costShare(m.spent_cents, m.revenue_cents))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function TopLeads({ rows }: { rows: Finance["top_leads"] }) {
  return (
    <section className={`${card} overflow-x-auto`}>
      <div className="px-5 pt-5"><SectionTitle icon="trophy" title="Leads les plus rentables" /></div>
      <table className="mt-3 w-full min-w-[560px] text-[14px]">
        <thead>
          <tr className="border-b border-slate-200 text-left text-[12px] text-slate-500">
            <th className="px-5 py-2 font-medium">Prospect</th>
            <th className="px-3 py-2 text-right font-medium">Prix du lead</th>
            <th className="px-3 py-2 text-right font-medium">Chiffre d&apos;affaires</th>
            <th className="px-5 py-2 text-right font-medium">ROI</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => (
            <tr key={x.lead.purchase_id} className="border-b border-slate-100 last:border-0">
              <td className="px-5 py-3">
                <Link href={`/espace-pro/mes-leads/${x.lead.purchase_id}`} className="font-semibold text-ink hover:text-brand hover:underline">{x.lead.name || "Prospect"}</Link>
                <span className="ml-2 text-[13px] text-slate-500">{marketLabel(x.lead.insurance_type, LEAD_TYPES)} · {x.lead.city}</span>
              </td>
              <td className="px-3 py-3 text-right">{euros(x.price_cents)}</td>
              <td className="px-3 py-3 text-right">{euros(x.revenue_cents)}</td>
              <td className="px-5 py-3 text-right font-semibold text-emerald-700">{pct(roi(x.price_cents, x.revenue_cents))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
