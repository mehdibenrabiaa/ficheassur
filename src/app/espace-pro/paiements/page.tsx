"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { card, ErrorNote, ListSkeleton, PageHeader, primaryButton } from "@/components/pro/ui";
import { dateTime, euros } from "@/lib/format";
import CardsPanel from "@/components/pro/CardsPanel";
import { getBilling, type Billing } from "@/lib/pro";

// Payments: the saved cards (added, set as default or removed right here --
// Stripe's form is embedded, no detour through Stripe's site) and every order
// paid, with the leads it contained.
export default function Paiements() {
  const [data, setData] = useState<Billing | null>(null);
  const [error, setError] = useState("");

  const load = () => getBilling().then(setData).catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  return (
    <>
      <PageHeader title="Paiements" subtitle="Vous payez par carte à chaque achat de leads." />
      {error && <ErrorNote>{error}</ErrorNote>}

      {!data ? (
        !error && <ListSkeleton />
      ) : (
        <>
          {data.simulated ? (
            <section className={`${card} p-5 text-[14px] text-slate-600`}>Mode test : les achats sont validés sans paiement réel.</section>
          ) : (
            <CardsPanel cards={data.cards} onChange={load} />
          )}

          <section className={card}>
            <h2 className="px-6 pt-6 text-[17px] font-bold text-ink">Historique des achats</h2>
            {data.orders.length === 0 ? (
              <div className="flex flex-col items-start gap-2 p-6">
                <p className="text-[14px] text-slate-500">Aucun achat pour le moment.</p>
                <Link href="/espace-pro/acheter" className="text-[14px] font-semibold text-brand hover:underline">Acheter des leads</Link>
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {data.orders.map((o) => (
                  <li key={o.id} className="px-6 py-4">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="text-[15px] font-semibold text-ink">
                        {dateTime(o.paid_at)} · {o.items.length} lead{o.items.length > 1 ? "s" : ""}
                      </p>
                      <p className="shrink-0 text-[15px] font-bold text-ink">{euros(o.total_cents - o.refunded_cents)}</p>
                    </div>
                    <ul className="mt-1.5 flex flex-col gap-0.5 text-[13px] text-slate-600">
                      {o.items.map((i, n) => (
                        <li key={n} className="flex justify-between gap-4">
                          <span className="truncate">{i.label}</span>
                          <span className="shrink-0">{euros(i.price_cents)}</span>
                        </li>
                      ))}
                    </ul>
                    {o.refunded_cents > 0 && (
                      <p className="mt-1.5 text-[13px] font-semibold text-emerald-700">
                        Remboursé : {euros(o.refunded_cents)} (lead vendu à un autre courtier pendant votre paiement)
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
