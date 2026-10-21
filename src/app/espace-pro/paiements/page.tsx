"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ErrorNote, PageHeader, Spinner, card, primaryButton } from "@/components/pro/ui";
import { dateTime, euros } from "@/lib/format";
import { billingPortal, getBilling, type Billing } from "@/lib/pro";

// Payments: the saved card (managed on Stripe's page, which also has the
// receipts) and every order paid, with the leads it contained.
export default function Paiements() {
  const [data, setData] = useState<Billing | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getBilling().then(setData).catch((e) => setError(e.message));
  }, []);

  async function manageCards() {
    setError("");
    try {
      window.location.assign((await billingPortal()).url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    }
  }

  return (
    <>
      <PageHeader title="Paiements" subtitle="Vous payez par carte à chaque achat de leads." />
      {error && <ErrorNote>{error}</ErrorNote>}

      {!data ? (
        !error && <Spinner className="self-center" />
      ) : (
        <>
          <section className={`${card} flex flex-wrap items-center justify-between gap-4 p-6`}>
            <div>
              <p className="text-[13px] font-semibold text-slate-500">Moyen de paiement</p>
              {data.simulated ? (
                <p className="mt-1 text-[14px] text-slate-600">Mode test : les achats sont validés sans paiement réel.</p>
              ) : data.card ? (
                <p className="mt-1 text-[16px] font-semibold capitalize text-ink">
                  {data.card.brand} •••• {data.card.last4}
                  <span className="ml-2 text-[14px] font-normal normal-case text-slate-500">
                    exp. {String(data.card.exp_month).padStart(2, "0")}/{data.card.exp_year}
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-[14px] text-slate-600">Aucune carte enregistrée. Vous pourrez l&apos;enregistrer lors de votre premier paiement.</p>
              )}
            </div>
            {!data.simulated && (
              <button type="button" onClick={manageCards} className={primaryButton}>
                {data.card ? "Gérer mes cartes et reçus" : "Ajouter une carte"}
              </button>
            )}
          </section>

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
