"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { ErrorNote, Spinner, card, primaryButton, secondaryButton } from "@/components/pro/ui";
import { euros } from "@/lib/format";
import { cancelOrder, confirmOrder, getOrder, type OrderView } from "@/lib/pro";
import { Arrow } from "@/components/Arrow";

// The payment page, like an e-commerce checkout: the order summary on one
// side, Stripe's card form (Embedded Checkout, in an iframe: card details
// never touch FicheAssur) on the other. Once paid, the same page becomes the
// confirmation: what was bought, with a link to each lead in "Mes leads".

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = () => (stripePromise ??= loadStripe(PUBLISHABLE_KEY));

export default function PaiementPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  const load = useCallback(() => getOrder(id).then(setOrder).catch((e) => setError(e.message)), [id]);
  useEffect(() => {
    load();
  }, [load]);

  // Stripe reports the payment complete: deliver the leads, then show the
  // confirmation (the webhook would deliver them too; this is immediate).
  const onPaid = useCallback(() => {
    setConfirming(true);
    confirmOrder(id)
      .catch(() => {})
      .finally(async () => {
        // Stripe can take a moment to mark the session paid: retry briefly.
        for (let i = 0; i < 5; i++) {
          const o = await getOrder(id).catch(() => null);
          if (o?.status === "paid") {
            setOrder(o);
            break;
          }
          await new Promise((r) => setTimeout(r, 1500));
          await confirmOrder(id).catch(() => {});
        }
        setConfirming(false);
      });
  }, [id]);

  async function cancel() {
    await cancelOrder(id).catch(() => {});
    router.push("/espace-pro/acheter");
  }

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!order || confirming) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-[15px] text-slate-600">
        <Spinner />
        {confirming && "Confirmation du paiement…"}
      </div>
    );
  }
  if (order.status === "paid") return <Confirmation order={order} />;
  if (order.status === "expired") {
    return (
      <div className={`${card} mx-auto flex max-w-lg flex-col items-center gap-4 p-10 text-center`}>
        <h1 className="text-[24px] font-bold text-ink">Commande expirée</h1>
        <p className="text-[15px] text-slate-600">
          Cette commande n&apos;a pas été payée à temps ou a été annulée : aucun montant n&apos;a été débité et les leads sont de
          nouveau en vente.
        </p>
        <Link href="/espace-pro/acheter" className={primaryButton}>Revenir aux leads</Link>
      </div>
    );
  }

  return (
    <>
      <div>
        <Link href="/espace-pro/acheter" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand hover:underline"><Arrow dir="left" className="size-4" /> Retour aux leads</Link>
        <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-ink sm:text-[32px]">Paiement</h1>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <OrderSummary order={order} onCancel={cancel} />
        <div className={`${card} overflow-hidden`}>
          {order.client_secret ? <StripeForm clientSecret={order.client_secret} onPaid={onPaid} /> : (
            <p role="alert" className="p-6 text-[14px] text-red-700">Le paiement par carte n&apos;est pas disponible pour le moment.</p>
          )}
        </div>
      </div>
    </>
  );
}

function OrderSummary({ order, onCancel }: { order: OrderView; onCancel: () => void }) {
  const until = new Date(order.expires_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return (
    <div className={`${card} flex flex-col lg:sticky lg:top-8`}>
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-[16px] font-bold text-ink">Récapitulatif</h2>
        <p className="text-[13px] text-slate-500">{order.items.length} lead{order.items.length > 1 ? "s" : ""} · réservé{order.items.length > 1 ? "s" : ""} pour vous jusqu&apos;à {until}</p>
      </div>
      <ul className="divide-y divide-slate-100 px-6">
        {order.items.map((i) => (
          <li key={i.id} className="flex items-start justify-between gap-4 py-3 text-[14px]">
            <span className="text-ink">{i.label}</span>
            <span className="shrink-0 font-semibold text-ink">{euros(i.price_cents)}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
        <span className="text-[15px] font-semibold text-ink">Total</span>
        <span className="text-[20px] font-bold text-ink">{euros(order.total_cents)}</span>
      </div>
      <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 text-[13px] text-slate-600">
        <p>Les coordonnées complètes de chaque prospect s&apos;affichent dans « Mes leads » dès le paiement confirmé.</p>
        <button type="button" onClick={onCancel} className="self-start font-semibold text-slate-600 underline hover:text-ink">
          Annuler la commande
        </button>
      </div>
    </div>
  );
}

function StripeForm({ clientSecret, onPaid }: { clientSecret: string; onPaid: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const onPaidRef = useRef(onPaid);
  useEffect(() => {
    onPaidRef.current = onPaid;
  }, [onPaid]);

  useEffect(() => {
    let checkout: { mount: (el: HTMLElement) => void; destroy: () => void } | null = null;
    let cancelled = false;
    (async () => {
      try {
        if (!PUBLISHABLE_KEY) throw new Error("missing key");
        const stripe = await getStripe();
        if (!stripe || cancelled) return;
        checkout = await stripe.createEmbeddedCheckoutPage({ clientSecret, onComplete: () => onPaidRef.current() });
        if (cancelled) return checkout.destroy();
        checkout.mount(mountRef.current!);
        setState("ready");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
      checkout?.destroy();
    };
  }, [clientSecret]);

  return (
    <>
      {state === "loading" && <div className="flex h-[420px] items-center justify-center"><Spinner /></div>}
      {state === "error" && (
        <p role="alert" className="m-6 border-l-4 border-red-500 bg-red-50 p-4 text-[14px] text-red-700">
          Le formulaire de paiement n&apos;a pas pu se charger. Rechargez la page.
        </p>
      )}
      <div ref={mountRef} className={state === "ready" ? "" : "hidden"} />
    </>
  );
}

function Confirmation({ order }: { order: OrderView }) {
  const delivered = order.items.filter((i) => i.purchase_id);
  const refunded = order.items.filter((i) => !i.purchase_id);
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 py-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
        </span>
        <h1 className="text-[28px] font-bold tracking-tight text-ink sm:text-[32px]">Paiement confirmé</h1>
        <p className="max-w-md text-[15px] text-slate-600">
          Merci ! {delivered.length > 1 ? `Vos ${delivered.length} leads sont` : "Votre lead est"} maintenant dans « Mes leads », avec les
          coordonnées complètes du prospect. Appelez-le vite : il vient de demander un devis.
        </p>
      </div>

      <div className={card}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-[16px] font-bold text-ink">Leads achetés</h2>
          <span className="text-[14px] font-semibold text-ink">{euros(order.total_cents - order.refunded_cents)}</span>
        </div>
        <ul className="divide-y divide-slate-100">
          {delivered.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-4 px-6 py-3 text-[14px]">
              <span className="text-ink">{i.label}</span>
              <Link href={`/espace-pro/mes-leads/${i.purchase_id}`} className="inline-flex shrink-0 items-center gap-1 font-semibold text-brand hover:underline">Voir le lead <Arrow dir="chevron-right" className="size-4" /></Link>
            </li>
          ))}
          {refunded.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-4 px-6 py-3 text-[14px] text-slate-500">
              <span>{i.label}</span>
              <span className="shrink-0">Vendu entre-temps · remboursé {euros(i.price_cents)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/espace-pro/mes-leads" className={primaryButton}>Voir mes leads</Link>
        <Link href="/espace-pro/acheter" className={secondaryButton}>Acheter d&apos;autres leads</Link>
      </div>
      <p className="text-center text-[13px] text-slate-500">Votre reçu est disponible dans Paiements.</p>
    </div>
  );
}
