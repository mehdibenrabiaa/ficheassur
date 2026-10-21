"use client";

import { useState } from "react";
import { card } from "@/components/pro/ui";
import { ago, euros, marketLabel } from "@/lib/format";
import { LEAD_TYPES } from "@/lib/leadTypes";
import type { MarketLead } from "@/lib/pro";

// The marketplace's lead list ("Acheter des leads"): one collapsible
// section per market, a compact row per lead with a Partagé | Exclusif switch.

export type LeadViewProps = {
  leads: MarketLead[];
  cart: Record<string, boolean>; // lead id -> exclusive
  onChoose: (l: MarketLead, exclusive: boolean) => void;
  onToggle: (l: MarketLead) => void;
};

function MarketIcon({ type, className = "size-5" }: { type: string; className?: string }) {
  const p = { viewBox: "0 0 24 24", className, fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (type === "MOTO") return <svg {...p}><circle cx="5.5" cy="16.5" r="3" /><circle cx="18.5" cy="16.5" r="3" /><path d="M5.5 16.5 9 10h5l3 6.5M14 10l2-3h2.5M9 10 7.5 7H5" /></svg>;
  if (type === "AUTO_PRO") return <svg {...p}><path d="M14.7 6.3a4 4 0 0 0-5.3 5.3L3 18l3 3 6.4-6.4a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6Z" /></svg>;
  if (type === "COMMERCIAL_AUTO") return <svg {...p}><path d="M2 6h11v10H2zM13 9h4.5l3.5 3.5V16h-8" /><circle cx="6" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></svg>;
  return <svg {...p}><path d="M5 17h14M3 13l2-5.5A2 2 0 0 1 6.9 6h10.2a2 2 0 0 1 1.9 1.5L21 13v4h-2" /><path d="M3 13v4h2" /><circle cx="7.5" cy="17" r="1.8" /><circle cx="16.5" cy="17" r="1.8" /></svg>;
}

// Two-option switch "Partagé | Exclusif" with prices; clicking the selected
// option again takes the lead out of the cart.
function ModeSwitch({ lead, cart, onChoose, full = false }: { lead: MarketLead; cart: LeadViewProps["cart"]; onChoose: LeadViewProps["onChoose"]; full?: boolean }) {
  const opt = (exclusive: boolean) => {
    const selected = lead.id in cart && cart[lead.id] === exclusive;
    const disabled = exclusive && !lead.exclusive_available;
    return (
      <button
        type="button"
        disabled={disabled}
        aria-pressed={selected}
        onClick={() => onChoose(lead, exclusive)}
        title={disabled ? "Déjà acheté par un autre courtier" : undefined}
        className={`flex flex-1 flex-col items-center px-3 py-1.5 leading-tight transition-colors disabled:cursor-not-allowed disabled:text-slate-300 ${
          selected ? (exclusive ? "bg-accent text-white" : "bg-brand text-white") : "text-ink hover:bg-light"
        }`}
      >
        <span className="text-[11px] font-semibold opacity-80">{exclusive ? "Exclusif" : "Partagé"}</span>
        <span className="text-[14px] font-bold">{disabled ? "—" : euros(exclusive ? lead.exclusive_price_cents : lead.shared_price_cents)}</span>
      </button>
    );
  };
  return (
    <div className={`flex divide-x divide-slate-300 border border-slate-300 ${full ? "w-full" : "w-[184px] shrink-0"}`} role="group" aria-label="Type d'achat">
      {opt(false)}
      {opt(true)}
    </div>
  );
}

const facts = (l: MarketLead) => Object.values(l.details).map(String);

// Grouped by market: one collapsible section per market, compact rows inside.
export function LeadGrouped({ leads, cart, onChoose, onToggle }: LeadViewProps) {
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  const groups = LEAD_TYPES.map((t) => ({ type: t, leads: leads.filter((l) => l.insurance_type === t.value) })).filter((g) => g.leads.length);

  return (
    <div className="flex flex-col gap-4">
      {groups.map(({ type, leads: rows }) => {
        const isClosed = closed[type.value];
        const from = Math.min(...rows.map((l) => l.shared_price_cents));
        return (
          <section key={type.value} className={card}>
            <button
              type="button"
              onClick={() => setClosed((c) => ({ ...c, [type.value]: !c[type.value] }))}
              aria-expanded={!isClosed}
              className="flex w-full items-center gap-3 px-5 py-4 text-left"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-brand/10 text-brand"><MarketIcon type={type.value} className="size-[18px]" /></span>
              <span className="flex-1">
                <span className="block text-[16px] font-bold text-ink">{type.label}</span>
                <span className="text-[13px] text-slate-500">{rows.length} lead{rows.length > 1 ? "s" : ""} · à partir de {euros(from)}</span>
              </span>
              <svg viewBox="0 0 24 24" className={`size-5 text-slate-500 transition-transform ${isClosed ? "" : "rotate-180"}`} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            {!isClosed && (
              <ul className="divide-y divide-slate-100 border-t border-slate-100">
                {rows.map((l) => (
                  <li key={l.id} className={`flex flex-wrap items-center gap-3 px-5 py-3 ${l.id in cart ? "bg-brand/5" : ""}`}>
                    <input type="checkbox" checked={l.id in cart} onChange={() => onToggle(l)} aria-label={`Sélectionner le lead ${l.city}`} className="size-4 accent-brand" />
                    <span className="w-44 shrink-0 text-[14px] font-semibold text-ink">{l.city} <span className="font-normal text-slate-500">({l.department})</span></span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-slate-600">{facts(l).slice(0, 3).join(" · ")}</span>
                    <span className="w-20 text-[12px] text-slate-500">{ago(l.created_at)}</span>
                    <ModeSwitch lead={l} cart={cart} onChoose={onChoose} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
