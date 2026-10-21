"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LeadGrouped } from "@/components/pro/leadViews";
import { card, ErrorDialog, ErrorNote, ListSkeleton, PageHeader, primaryButton, secondaryButton } from "@/components/pro/ui";
import { euros } from "@/lib/format";
import { LEAD_TYPES } from "@/lib/leadTypes";
import { checkout, listMarketLeads, type MarketLead } from "@/lib/pro";

// The marketplace: leads grouped by market (contact details hidden),
// filtered by market and department. Each one goes in the cart as shared
// (cheaper, up to N brokers) or exclusive (only you, then gone for
// everyone); "Payer" creates the order and opens its payment page
// (/espace-pro/paiement/[id]), which confirms the purchase once paid.
export default function AcheterDesLeads() {
  const router = useRouter();
  const [market, setMarket] = useState("");
  const [department, setDepartment] = useState("");
  const [leads, setLeads] = useState<MarketLead[] | null>(null);
  const [cart, setCart] = useState<Record<string, boolean>>({}); // lead id -> exclusive
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [payError, setPayError] = useState("");

  const load = useCallback(() => {
    const dep = department.trim();
    listMarketLeads({ insurance_type: market, department: /^\d{2,3}$|^2[AB]$/i.test(dep) ? dep : "" })
      .then(setLeads)
      .catch((e) => setError(e.message));
  }, [market, department]);

  useEffect(() => {
    const t = setTimeout(load, 250); // let the department field settle while typing
    return () => clearTimeout(t);
  }, [load]);


  const byId = useMemo(() => Object.fromEntries((leads ?? []).map((l) => [l.id, l])), [leads]);
  const items = Object.entries(cart).filter(([id]) => byId[id]);
  const total = items.reduce((sum, [id, excl]) => sum + (excl ? byId[id].exclusive_price_cents : byId[id].shared_price_cents), 0);

  function choose(lead: MarketLead, exclusive: boolean) {
    setCart((c) => {
      const next = { ...c };
      if (lead.id in next && next[lead.id] === exclusive) delete next[lead.id];
      else next[lead.id] = exclusive;
      return next;
    });
  }

  // Checkbox: adds the lead as shared (the cheaper option), or removes it.
  function toggle(lead: MarketLead) {
    setCart((c) => {
      const next = { ...c };
      if (lead.id in next) delete next[lead.id];
      else next[lead.id] = false;
      return next;
    });
  }

  async function pay() {
    setBusy(true);
    setPayError("");
    try {
      // Paid by card on the payment page -- or already paid when payments
      // are simulated (local dev), where that page shows the confirmation.
      const r = await checkout(items.map(([lead_id, exclusive]) => ({ lead_id, exclusive })));
      router.push(`/espace-pro/paiement/${r.order_id}`);
      return;
    } catch (e) {
      setPayError(e instanceof Error ? e.message : "Une erreur est survenue.");
    }
    setBusy(false);
  }

  return (
    <>
      <PageHeader title="Acheter des leads" subtitle="Payez par carte : les coordonnées s'affichent dans « Mes leads » dès le paiement confirmé." />

      <div className={`${card} flex flex-col gap-4 p-4 sm:flex-row sm:items-center`}>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Marché">
          {[{ value: "", label: "Tous" }, ...LEAD_TYPES].map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={market === t.value}
              onClick={() => setMarket(t.value)}
              className={`rounded-full border px-4 py-1.5 text-[14px] font-semibold transition-colors ${market === t.value ? "border-brand bg-brand text-white" : "border-slate-300 text-ink hover:border-brand"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 sm:ml-auto">
          <span className="text-[14px] font-semibold text-slate-600">Département</span>
          <input
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="ex. 75"
            maxLength={3}
            inputMode="numeric"
            className="h-10 w-24 border border-slate-300 px-3 text-[14px] outline-none focus:border-brand"
          />
        </label>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}
      <ErrorDialog title="Paiement impossible" message={payError} onClose={() => setPayError("")} />

      {!leads ? (
        <ListSkeleton />
      ) : leads.length === 0 ? (
        <p className={`${card} p-8 text-center text-[15px] text-slate-600`}>Aucun lead disponible pour ces critères pour le moment.</p>
      ) : (
        <div key={market} className={`fade-in ${items.length ? "pb-24" : ""}`}>
          <LeadGrouped leads={leads} cart={cart} onChoose={choose} onToggle={toggle} />
        </div>
      )}

      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)] md:left-[var(--sidebar-w)]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 md:px-8">
            <div className="mr-auto">
              <p className="text-[15px] font-bold text-ink">
                {items.length} lead{items.length > 1 ? "s" : ""} · {euros(total)}
              </p>
              <p className="text-[13px] text-slate-500">Paiement sécurisé par carte · leads réservés pendant le paiement</p>
            </div>
            <button type="button" onClick={() => setCart({})} className={secondaryButton}>Vider</button>
            <button type="button" onClick={pay} disabled={busy} className={primaryButton}>
              {busy ? "Chargement…" : `Payer ${euros(total)}`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
