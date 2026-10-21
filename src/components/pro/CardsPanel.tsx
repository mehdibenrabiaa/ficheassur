"use client";

import { useEffect, useRef, useState } from "react";
import { loadStripe, type Stripe, type StripeElements } from "@stripe/stripe-js";
import { SectionTitle, card, primaryButton, secondaryButton } from "@/components/pro/ui";
import { addCardSetup, deleteCard, setDefaultCard, type SavedCard } from "@/lib/pro";

// Saved cards, managed without leaving the espace pro: the list (default
// first), "Par défaut" / "Supprimer", and "Ajouter une carte" with Stripe's
// card form embedded in the page (Payment Element). Card details go straight
// to Stripe -- FicheAssur only sees the brand and last 4 digits.

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
let stripePromise: Promise<Stripe | null> | null = null;
const getStripe = () => (stripePromise ??= loadStripe(PUBLISHABLE_KEY));

const BRANDS: Record<string, string> = { visa: "Visa", mastercard: "Mastercard", amex: "American Express", cb: "CB" };

export default function CardsPanel({ cards, onChange }: { cards: SavedCard[]; onChange: () => void }) {
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null); // card awaiting "Supprimer ? Oui / Non"
  const sorted = [...cards].sort((a, b) => Number(b.default) - Number(a.default));

  async function act(id: string, fn: () => Promise<unknown>) {
    setBusy(id);
    setError("");
    try {
      await fn();
      setConfirming(null);
      onChange();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    }
    setBusy(null);
  }

  return (
    <section className={`${card} flex flex-col gap-4 p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle icon="card" title="Moyens de paiement" subtitle="La carte par défaut est proposée à chaque achat." />
        {!adding && (
          <button type="button" onClick={() => setAdding(true)} className="text-[14px] font-semibold text-brand hover:underline">+ Ajouter une carte</button>
        )}
      </div>

      {sorted.length > 0 ? (
        <ul className="divide-y divide-slate-100 rounded-md border border-slate-200">
          {sorted.map((c) => {
            const expired = new Date(c.exp_year, c.exp_month) < new Date();
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span className="flex h-8 w-12 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  {c.brand.slice(0, 4)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-ink">{BRANDS[c.brand] ?? c.brand} •••• {c.last4}</span>
                  <span className={`text-[13px] ${expired ? "font-semibold text-red-600" : "text-slate-500"}`}>
                    {expired ? "Expirée" : "Expire"} {String(c.exp_month).padStart(2, "0")}/{c.exp_year}
                  </span>
                </span>
                {c.default ? (
                  <span className="rounded-full bg-brand/10 px-2.5 py-1 text-[12px] font-semibold text-brand">Par défaut</span>
                ) : (
                  <button type="button" disabled={busy !== null} onClick={() => act(c.id, () => setDefaultCard(c.id))} className="rounded-md px-2 py-1 text-[13px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-ink disabled:opacity-50">
                    Définir par défaut
                  </button>
                )}
                {confirming === c.id ? (
                  <span className="flex items-center gap-1">
                    <span className="text-[13px] text-slate-600">Supprimer ?</span>
                    <button type="button" disabled={busy !== null} onClick={() => act(c.id, () => deleteCard(c.id))} className="rounded-md bg-red-600 px-2.5 py-1 text-[13px] font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                      {busy === c.id ? "…" : "Oui"}
                    </button>
                    <button type="button" onClick={() => setConfirming(null)} className="rounded-md px-2 py-1 text-[13px] font-semibold text-slate-600 hover:bg-slate-100">Non</button>
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => setConfirming(c.id)}
                    className="rounded-md px-2 py-1 text-[13px] font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        !adding && <p className="text-[14px] text-slate-600">Aucune carte enregistrée. Ajoutez-en une maintenant, ou cochez « enregistrer » lors de votre prochain paiement.</p>
      )}

      {adding && (
        <AddCardForm
          onDone={() => {
            setAdding(false);
            onChange();
          }}
          onCancel={() => setAdding(false)}
        />
      )}
      {error && <p role="alert" className="text-[13px] text-red-600">{error}</p>}
    </section>
  );
}

function AddCardForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const mount = useRef<HTMLDivElement>(null);
  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "saving" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let destroy: (() => void) | null = null;
    (async () => {
      try {
        if (!PUBLISHABLE_KEY) throw new Error("Le paiement par carte n'est pas encore configuré.");
        const [stripe, { client_secret }] = await Promise.all([getStripe(), addCardSetup()]);
        if (!stripe || cancelled) return;
        // The form in the site's look: brand colour, square-ish corners, the site font.
        const elements = stripe.elements({
          clientSecret: client_secret,
          locale: "fr",
          appearance: {
            theme: "stripe",
            variables: { colorPrimary: "#062499", colorText: "#262626", borderRadius: "6px", fontFamily: "system-ui, sans-serif", fontSizeBase: "15px" },
          },
        });
        const element = elements.create("payment", { layout: "tabs" });
        element.mount(mount.current!);
        element.on("ready", () => !cancelled && setState("ready"));
        stripeRef.current = stripe;
        elementsRef.current = elements;
        destroy = () => element.destroy();
      } catch (e) {
        if (!cancelled) {
          setState("error");
          setError(e instanceof Error ? e.message : "Le formulaire n'a pas pu se charger.");
        }
      }
    })();
    return () => {
      cancelled = true;
      destroy?.();
    };
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    if (!stripe || !elements) return;
    setState("saving");
    setError("");
    // Stays on the page; only a bank's 3-D Secure check, if any, shows its own window.
    const { error: err } = await stripe.confirmSetup({ elements, redirect: "if_required", confirmParams: { return_url: window.location.href } });
    if (err) {
      setState("ready");
      setError(err.message ?? "La carte n'a pas pu être enregistrée.");
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4 rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-[14px] font-semibold text-ink">Nouvelle carte</p>
      {state === "loading" && <div className="skeleton h-40" aria-label="Chargement du formulaire" />}
      <div ref={mount} className={state === "loading" ? "hidden" : ""} />
      {error && <p role="alert" className="text-[13px] text-red-600">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={state !== "ready"} className={primaryButton}>{state === "saving" ? "Enregistrement…" : "Enregistrer la carte"}</button>
        <button type="button" onClick={onCancel} className={secondaryButton}>Annuler</button>
        <span className="flex items-center gap-1.5 text-[12px] text-slate-500">
          <svg viewBox="0 0 24 24" className="size-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
          Chiffré et traité par Stripe
        </span>
      </div>
    </form>
  );
}
