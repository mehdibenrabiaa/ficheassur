"use client";

import { useMemo, useState } from "react";
import { CONTACT } from "@/lib/contact";
import { HELP_TOPICS, SUPPORT_TOPICS, type HelpTopic } from "@/lib/help";
import { api } from "@/lib/pro";
import Select from "@/components/Select";
import { Arrow } from "@/components/Arrow";

// The help centre, laid out like Stripe's support site: a search over the
// help articles, topic cards, the answers, then "still need help?" with a
// contact form that files a support message (read in the espace pro's
// Administration > Assistance) instead of opening a mail app.

function TopicIcon({ name }: { name: HelpTopic["icon"] }) {
  const p = { viewBox: "0 0 24 24", className: "size-6", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "user": return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
    case "cart": return <svg {...p}><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.6 12.4a1.5 1.5 0 0 0 1.5 1.1h8.7a1.5 1.5 0 0 0 1.4-1.1L21 7H6" /></svg>;
    case "card": return <svg {...p}><rect x="2" y="5" width="20" height="14" rx="1" /><path d="M2 10h20M6 15h4" /></svg>;
    case "shield": return <svg {...p}><path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6Z" /><path d="m9 12 2 2 4-4" /></svg>;
    case "list": return <svg {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
    default: return <svg {...p}><path d="m11 17 2 2a1 1 0 0 0 1.4 0l5.3-5.3a2 2 0 0 0 0-2.8L15 6.2a2 2 0 0 0-2.8 0L11 7.5" /><path d="m3 13 3.5 3.5a1 1 0 0 0 1.4 0L13 11.4M3 13V7l4-4 4 4" /></svg>;
  }
}

const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const inputClass =
  "h-12 w-full border border-slate-300 bg-white px-4 text-[15px] text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15";

export default function AssistanceCenter() {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<string | null>(null);

  const results = useMemo(() => {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    return HELP_TOPICS.filter((t) => !topic || t.id === topic)
      .map((t) => ({
        ...t,
        articles: t.articles.filter((a) => words.every((w) => normalize(`${a.q} ${a.a}`).includes(w))),
      }))
      .filter((t) => t.articles.length > 0);
  }, [query, topic]);

  function pickTopic(id: string) {
    setTopic((cur) => (cur === id ? null : id));
    document.getElementById("questions")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main>
      {/* Hero + search */}
      <section className="bg-brand">
        <div className="mx-auto max-w-3xl px-5 py-14 text-center text-white lg:py-20">
          <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-white/70">Assistance</p>
          <h1 className="heading mt-3 text-[36px] leading-[1.05] sm:text-[48px]">
            Comment pouvons-nous <em>vous aider ?</em>
          </h1>
          <div className="relative mx-auto mt-8 max-w-xl">
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <label htmlFor="help-search" className="sr-only">Rechercher dans l&apos;aide</label>
            <input
              id="help-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher : mot de passe, remboursement, exclusif…"
              className="h-14 w-full bg-white pl-12 pr-4 text-[16px] text-ink shadow-lg outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-white/30"
            />
          </div>
        </div>
      </section>

      {/* Topics */}
      <section className="w-full py-4">
        <div className="px-5 lg:px-12 2xl:px-24">
          <div className="bg-light px-4 py-10 sm:px-8 lg:px-14 lg:py-14">
            <div className="mx-auto max-w-6xl">
              <h2 className="heading text-center text-[28px] leading-tight sm:text-[34px]">Parcourir par <em>sujet</em></h2>
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {HELP_TOPICS.map((t) => {
                  const on = topic === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => pickTopic(t.id)}
                      className={`flex items-start gap-4 border-2 bg-white p-5 text-left shadow-[0_1px_4px_rgba(0,0,0,0.08)] transition hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] ${on ? "border-brand" : "border-transparent"}`}
                    >
                      <span className="flex size-11 shrink-0 items-center justify-center bg-brand text-white"><TopicIcon name={t.icon} /></span>
                      <span>
                        <span className="block text-[16px] font-bold text-ink">{t.title}</span>
                        <span className="mt-1 block text-[14px] leading-snug text-slate-600">{t.description}</span>
                        <span className="mt-2 flex items-center gap-1 text-[13px] font-semibold text-brand">{t.articles.length} articles <Arrow dir="chevron-right" className="size-3.5" /></span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Answers */}
      <section id="questions" className="scroll-mt-16 lg:scroll-mt-[87px] w-full py-4">
        <div className="mx-auto max-w-3xl px-5 py-6">
          {(topic || query) && (
            <div className="mb-6 flex flex-wrap items-center gap-3 text-[14px] text-slate-600">
              <span>
                {results.reduce((n, t) => n + t.articles.length, 0)} résultat(s)
                {topic && <> dans <strong className="text-ink">{HELP_TOPICS.find((t) => t.id === topic)?.title}</strong></>}
              </span>
              <button type="button" onClick={() => { setTopic(null); setQuery(""); }} className="font-semibold text-brand hover:underline">
                Tout afficher
              </button>
            </div>
          )}
          {results.length === 0 ? (
            <div className="bg-light p-8 text-center">
              <p className="text-[16px] font-semibold text-ink">Aucun article ne correspond à votre recherche.</p>
              <p className="mt-1 text-[14px] text-slate-600">Essayez d&apos;autres mots, ou écrivez-nous ci-dessous : nous répondons sous 24 h ouvrées.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {results.map((t) => (
                <div key={t.id}>
                  <h2 className="heading text-[24px] leading-tight text-ink">{t.title}</h2>
                  <div className="mt-4 divide-y divide-slate-200 border-y border-slate-200 bg-white">
                    {t.articles.map((a) => (
                      <details key={a.q} className="group px-5" open={Boolean(query)}>
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[16px] font-semibold text-ink">
                          {a.q}
                          <span className="text-[22px] font-normal text-brand transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                        </summary>
                        <p className="pb-5 text-[15px] leading-relaxed text-slate-600">{a.a}</p>
                      </details>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Still need help */}
      <section id="contact" className="scroll-mt-16 lg:scroll-mt-[87px] w-full py-4">
        <div className="px-5 lg:px-12 2xl:px-24">
          <div className="bg-light px-4 py-10 sm:px-8 lg:px-14 lg:py-14">
            <div className="mx-auto max-w-6xl">
              <div className="text-center">
                <h2 className="heading text-[28px] leading-tight sm:text-[34px]">Besoin d&apos;aide <em>supplémentaire ?</em></h2>
                <p className="mx-auto mt-3 max-w-2xl text-[16px] leading-relaxed text-slate-600">
                  Notre équipe répond à chaque message sous 24 h ouvrées, du lundi au vendredi.
                </p>
              </div>
              <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
                <div className="bg-white">
                  <div className="h-1.5 bg-brand" aria-hidden="true" />
                  <div className="p-6 sm:p-8">
                    <h3 className="text-[18px] font-bold text-ink">Envoyer un message</h3>
                    <ContactForm defaultTopic={topic} />
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
                    <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-slate-500">Par téléphone</p>
                    <a href={CONTACT.phoneHref} className="mt-2 block text-[22px] font-bold text-brand hover:underline">{CONTACT.phoneDisplay}</a>
                    <p className="mt-1 text-[14px] text-slate-600">Du lundi au vendredi, de 9 h à 18 h.</p>
                  </div>
                  <div className="bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
                    <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-slate-500">Par email</p>
                    <a href={`mailto:${CONTACT.email}`} className="mt-2 block break-all text-[16px] font-semibold text-brand hover:underline">{CONTACT.email}</a>
                    <p className="mt-1 text-[14px] text-slate-600">Réponse sous 24 h ouvrées.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function ContactForm({ defaultTopic }: { defaultTopic: string | null }) {
  const [v, setV] = useState({ full_name: "", email: "", topic: "", message: "" });
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const topic = v.topic || defaultTopic || "";
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic) return setError("Choisissez un sujet.");
    if (v.message.trim().length < 10) return setError("Décrivez votre demande en quelques mots (10 caractères minimum).");
    setError("");
    setState("sending");
    try {
      await api("/api/v1/support", { method: "POST", body: JSON.stringify({ ...v, topic }) });
      setState("sent");
    } catch (err) {
      setState("idle");
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
  }

  if (state === "sent") {
    return (
      <div role="status" className="mt-4 border-l-4 border-accent bg-light p-5">
        <p className="font-semibold text-ink">Message envoyé, merci.</p>
        <p className="mt-1 text-[14px] text-slate-600">Nous vous répondons à {v.email} sous 24 h ouvrées.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] font-medium text-ink">Nom et prénom</span>
          <input required minLength={2} autoComplete="name" value={v.full_name} onChange={set("full_name")} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[14px] font-medium text-ink">Email</span>
          <input required type="email" autoComplete="email" value={v.email} onChange={set("email")} className={inputClass} />
        </label>
      </div>
      <div className="flex flex-col gap-1.5">
        <span id="support-topic" className="text-[14px] font-medium text-ink">Sujet</span>
        <Select value={topic} onChange={(t) => setV((p) => ({ ...p, topic: t }))} options={SUPPORT_TOPICS} placeholder="Choisissez un sujet" ariaLabel="Sujet" className="rounded-none" />
      </div>
      <label className="flex flex-col gap-1.5">
        <span className="text-[14px] font-medium text-ink">Votre message</span>
        <textarea required minLength={10} maxLength={4000} rows={5} value={v.message} onChange={set("message")} placeholder="Décrivez votre demande. Pour un lead, indiquez son nom ou sa date d'achat." className="w-full border border-slate-300 bg-white px-4 py-3 text-[15px] text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15" />
      </label>
      <p className="text-[12px] leading-relaxed text-slate-500">
        Vos informations servent uniquement à traiter votre demande.
      </p>
      {error && <p role="alert" className="text-[14px] text-red-600">{error}</p>}
      <button type="submit" disabled={state === "sending"} className="inline-flex h-12 items-center justify-center self-start bg-brand px-8 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-60">
        {state === "sending" ? "Envoi…" : "Envoyer"}
      </button>
    </form>
  );
}
