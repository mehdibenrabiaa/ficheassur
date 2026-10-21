"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LeadGrouped } from "@/components/pro/leadViews";
import { ErrorNote, PageHeader, Spinner, card, primaryButton, secondaryButton } from "@/components/pro/ui";
import { euros } from "@/lib/format";
import { LEAD_TYPES } from "@/lib/leadTypes";
import { cancelOrder, checkout, listMarketLeads, type MarketLead } from "@/lib/pro";

// The marketplace: leads grouped by market (contact details hidden),
// filtered by market and department. Each one goes in the cart as shared
// (cheaper, up to N brokers) or exclusive (only you, then gone for
// everyone); the cart is paid by card in one payment on Stripe, and the
// leads land in "Mes leads" once the payment is confirmed.
export default function AcheterDesLeads() {
  return (
    <Suspense fallback={<Spinner className="self-center" />}>
      <Marketplace />
    </Suspense>
  );
}

function Marketplace() {
  const router = useRouter();
  const params = useSearchParams();
  const returned = params.get("commande"); // back from Stripe: "ok" | "annulee"
  const [market, setMarket] = useState("");
  const [department, setDepartment] = useState("");
  const [leads, setLeads] = useState<MarketLead[] | null>(null);
  const [cart, setCart] = useState<Record<string, boolean>>({}); // lead id -> exclusive
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [delivered, setDelivered] = useState(false);

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

  // Back from Stripe without paying: release the held leads straight away
  // (they'd be released after 30 minutes anyway), then show them again.
  const cancelledId = returned === "annulee" ? params.get("id") : null;
  useEffect(() => {
    if (cancelledId) cancelOrder(cancelledId).catch(() => {}).finally(load);
  }, [cancelledId, load]);

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
    setError("");
    setDelivered(false);
    try {
      const r = await checkout(items.map(([lead_id, exclusive]) => ({ lead_id, exclusive })));
      if (r.status === "redirect" && r.url) {
        window.location.assign(r.url); // Stripe's payment page
        return;
      }
      setCart({});
      setDelivered(true);
      router.replace("/espace-pro/acheter");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
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

      {(delivered || returned === "ok") && (
        <p role="status" className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-emerald-600 bg-emerald-50 p-4 text-[14px] text-emerald-900">
          Paiement confirmé : vos leads sont dans « Mes leads »{returned === "ok" && !delivered ? " (quelques secondes peuvent être nécessaires)" : ""}.
          <Link href="/espace-pro/mes-leads" className="font-bold underline">Voir mes leads</Link>
        </p>
      )}
      {returned === "annulee" && (
        <p role="status" className="border-l-4 border-amber-500 bg-amber-50 p-4 text-[14px] text-amber-900">
          Paiement annulé : aucun montant n&apos;a été débité.
        </p>
      )}
      {error && <ErrorNote>{error}</ErrorNote>}

      {!leads ? (
        <Spinner className="self-center" />
      ) : leads.length === 0 ? (
        <p className={`${card} p-8 text-center text-[15px] text-slate-600`}>Aucun lead disponible pour ces critères pour le moment.</p>
      ) : (
        <div className={items.length ? "pb-24" : ""}>
          <LeadGrouped leads={leads} cart={cart} onChoose={choose} onToggle={toggle} />
        </div>
      )}

      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)] md:left-64">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 md:px-8">
            <div className="mr-auto">
              <p className="text-[15px] font-bold text-ink">
                {items.length} lead{items.length > 1 ? "s" : ""} · {euros(total)}
              </p>
              <p className="text-[13px] text-slate-500">Paiement sécurisé par carte · leads réservés pendant le paiement</p>
            </div>
            <button type="button" onClick={() => setCart({})} className={secondaryButton}>Vider</button>
            <button type="button" onClick={pay} disabled={busy} className={primaryButton}>
              {busy ? "Redirection…" : `Payer ${euros(total)}`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
