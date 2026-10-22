"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { card, CardsSkeleton, ErrorNote } from "@/components/pro/ui";
import { dateShort, dateTime, euros, marketLabel } from "@/lib/format";
import { LEAD_TYPES } from "@/lib/leadTypes";
import RevenuePanel from "@/components/pro/RevenuePanel";
import { addCrmNote, getCrmLead, updateCrmLead, type CrmLeadDetail, type CrmStatus } from "@/lib/pro";
import { Arrow, WithArrows } from "@/components/Arrow";

// One lead in the CRM, laid out like a Salesforce record page: a highlights
// header (name, key fields, call / email), the sales path (Nouveau ->
// Contacté -> Devis envoyé -> Clôturé, closed as Signé or Perdu), then the
// record's details on the left and its activity on the right -- a Note /
// Rappel composer, the next step, and one timeline of notes and history.

type Stage = "new" | "contacted" | "quote_sent" | "closed";
const STAGES: { value: Stage; label: string }[] = [
  { value: "new", label: "Nouveau" },
  { value: "contacted", label: "Contacté" },
  { value: "quote_sent", label: "Devis envoyé" },
  { value: "closed", label: "Clôturé" },
];
const stageOf = (s: CrmStatus): Stage => (s === "won" || s === "lost" ? "closed" : s);

// Value for <input type="datetime-local">, in the browser's time zone.
function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function presets(): { label: string; at: Date }[] {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const nextWeek = new Date(tomorrow);
  nextWeek.setDate(nextWeek.getDate() + 6);
  return [
    { label: "Dans 2 h", at: new Date(Date.now() + 2 * 3600_000) },
    { label: "Demain 9 h", at: tomorrow },
    { label: "Dans une semaine", at: nextWeek },
  ];
}

function Icon({ name, className = "size-4" }: { name: "phone" | "mail" | "note" | "bell" | "clock" | "check" | "person"; className?: string }) {
  const p = { viewBox: "0 0 24 24", className: `${className} shrink-0`, fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "phone": return <svg {...p}><path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" /></svg>;
    case "mail": return <svg {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>;
    case "note": return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></svg>;
    case "bell": return <svg {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0" /></svg>;
    case "clock": return <svg {...p}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>;
    case "check": return <svg {...p}><path d="M20 6 9 17l-5-5" /></svg>;
    default: return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
  }
}

// Label above value, as in a Salesforce field section.
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 border-b border-slate-100 pb-2">
      <dt className="text-[12px] text-slate-500">{label}</dt>
      <dd className="mt-0.5 min-h-[20px] break-words text-[14px] text-ink">{children}</dd>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 bg-light px-3 py-2 text-[14px] font-bold text-ink">{title}</h3>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-3 px-3 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<CrmLeadDetail | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [picked, setPicked] = useState<Stage | null>(null); // stage clicked on the path, not saved yet
  const [composer, setComposer] = useState<"note" | "reminder">("note");
  const [note, setNote] = useState("");
  const [reminder, setReminder] = useState("");

  const load = useCallback(() => {
    getCrmLead(id)
      .then((l) => {
        setLead(l);
        setReminder(l.reminder_at ? toLocalInput(new Date(l.reminder_at)) : "");
      })
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(load, [load]);

  async function run(action: () => Promise<unknown>) {
    setSaving(true);
    setError("");
    try {
      await action();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  }

  const setStatus = (status: CrmStatus) => run(async () => {
    await updateCrmLead(id, { status });
    setPicked(null);
  });

  if (!lead) return error ? <ErrorNote>{error}</ErrorNote> : <CardsSkeleton />;

  const current = stageOf(lead.status);
  const selected = picked ?? current;
  const currentIndex = STAGES.findIndex((s) => s.value === current);
  const overdue = lead.reminder_at && new Date(lead.reminder_at) < new Date();

  // Notes and history in one timeline, newest first ("Note ajoutée" events
  // are left out: the note itself is shown).
  const timeline = [
    ...lead.notes.map((n) => ({ id: n.id, at: n.created_at, kind: "note" as const, text: n.body })),
    ...lead.events.filter((e) => e.kind !== "note").map((e) => ({ id: e.id, at: e.created_at, kind: e.kind, text: e.detail })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <>
      <Link href="/espace-pro/mes-leads" className="-mb-4 inline-flex items-center gap-1.5 self-start text-[13px] font-semibold text-accent hover:underline"><Arrow dir="left" className="size-3.5" /> Mes leads</Link>

      {/* Highlights panel */}
      <section className={card}>
        <div className="flex flex-wrap items-start gap-4 p-5">
          <span className="flex size-12 shrink-0 items-center justify-center bg-brand text-white"><Icon name="person" className="size-6" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">Lead · {marketLabel(lead.insurance_type, LEAD_TYPES)}</p>
            <h1 className="text-[24px] font-bold leading-tight text-ink">{lead.first_name} {lead.last_name}</h1>
          </div>
          {/* Phones: a full-width row of their own under the name. */}
          <div className="flex w-full gap-2 sm:w-auto">
            <a href={`tel:${lead.phone}`} className="inline-flex h-10 flex-1 items-center justify-center gap-2 bg-brand px-4 text-[14px] font-bold text-white hover:bg-brand-hover sm:flex-none">
              <Icon name="phone" /> Appeler
            </a>
            <a href={`mailto:${lead.email}`} className="inline-flex h-10 flex-1 items-center justify-center gap-2 border border-slate-300 bg-white px-4 text-[14px] font-semibold text-ink hover:border-brand sm:flex-none">
              <Icon name="mail" /> Email
            </a>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-t border-slate-100 px-5 py-4 sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Téléphone", <a key="p" href={`tel:${lead.phone}`} className="text-accent hover:underline">{lead.phone}</a>],
            ["Email", <a key="e" href={`mailto:${lead.email}`} className="break-all text-accent hover:underline">{lead.email}</a>],
            ["Localisation", `${lead.zip_code} ${lead.city}`],
            ["Type d'achat", lead.exclusive ? "Exclusif" : "Partagé"],
            ["Acheté le", dateShort(lead.purchased_at)],
            ["Prochain rappel", lead.reminder_at ? <span key="r" className={overdue ? "font-semibold text-red-600" : ""}>{dateTime(lead.reminder_at)}</span> : "—"],
          ].map(([label, value]) => (
            <div key={label as string} className="min-w-0">
              <dt className="text-[12px] text-slate-500">{label}</dt>
              <dd className="truncate text-[14px] font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Sales path */}
      <section className={`${card} flex flex-col gap-3 p-4 lg:flex-row lg:items-center`}>
        <ol className="flex min-w-0 flex-1 overflow-x-auto" aria-label="Étapes">
          {STAGES.map((s, i) => {
            const done = i < currentIndex;
            const isCurrent = s.value === current;
            const isPicked = s.value === selected && !isCurrent;
            const closedLabel = s.value === "closed" && current === "closed" ? (lead.status === "won" ? "Signé" : "Perdu") : s.label;
            const tone = isCurrent
              ? lead.status === "lost" ? "bg-slate-500 text-white" : lead.status === "won" ? "bg-emerald-600 text-white" : "bg-accent text-white"
              : isPicked ? "bg-brand text-white" : done ? "bg-brand/80 text-white" : "bg-slate-200 text-slate-600 hover:bg-slate-300";
            return (
              <li key={s.value} className="min-w-[120px] flex-1">
                <button
                  type="button"
                  onClick={() => setPicked(s.value === current ? null : s.value)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={`flex h-10 w-full items-center justify-center gap-1.5 px-6 text-[13px] font-semibold transition-colors ${tone}`}
                  style={{
                    clipPath: i === 0
                      ? "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)"
                      : "polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%, 12px 50%)",
                    marginLeft: i === 0 ? 0 : -6,
                  }}
                >
                  {done && <Icon name="check" className="size-3.5" />}
                  {closedLabel}
                </button>
              </li>
            );
          })}
        </ol>
        <div className="flex shrink-0 gap-2">
          {selected === "closed" && current !== "closed" ? (
            <>
              <button type="button" disabled={saving} onClick={() => setStatus("won")} className="h-10 bg-emerald-600 px-4 text-[13px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50">Clôturer : Signé</button>
              <button type="button" disabled={saving} onClick={() => setStatus("lost")} className="h-10 border border-slate-300 bg-white px-4 text-[13px] font-semibold text-ink hover:border-slate-500 disabled:opacity-50">Clôturer : Perdu</button>
            </>
          ) : picked && picked !== "closed" ? (
            <button type="button" disabled={saving} onClick={() => setStatus(picked)} className="h-10 bg-brand px-4 text-[13px] font-bold text-white hover:bg-brand-hover disabled:opacity-50">
              Marquer comme étape actuelle
            </button>
          ) : current !== "closed" ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => (currentIndex + 1 === 3 ? setPicked("closed") : setStatus(STAGES[currentIndex + 1].value as CrmStatus))}
              className="h-10 bg-brand px-4 text-[13px] font-bold text-white hover:bg-brand-hover disabled:opacity-50"
            >
              <span className="inline-flex items-center gap-1.5"><Icon name="check" /> Étape terminée</span>
            </button>
          ) : (
            <button type="button" disabled={saving} onClick={() => setStatus(lead.status === "won" ? "lost" : "won")} className="h-10 border border-slate-300 bg-white px-4 text-[13px] font-semibold text-ink hover:border-brand disabled:opacity-50">
              Changer en {lead.status === "won" ? "Perdu" : "Signé"}
            </button>
          )}
        </div>
      </section>

      {error && <ErrorNote>{error}</ErrorNote>}

      <RevenuePanel lead={lead} onChange={load} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* Details */}
        <section className={`${card} flex flex-col gap-6 p-5`}>
          <h2 className="border-b-2 border-accent pb-2 text-[15px] font-bold text-ink">Détails</h2>
          <Section title="Informations du prospect">
            <Field label="Prénom">{lead.first_name}</Field>
            <Field label="Nom">{lead.last_name}</Field>
            <Field label="Téléphone"><a href={`tel:${lead.phone}`} className="text-accent hover:underline">{lead.phone}</a></Field>
            <Field label="Email"><a href={`mailto:${lead.email}`} className="text-accent hover:underline">{lead.email}</a></Field>
            <Field label="Code postal">{lead.zip_code}</Field>
            <Field label="Ville">{lead.city}</Field>
          </Section>
          {Object.keys(lead.details).length > 0 && (
            <Section title="Qualification">
              {Object.entries(lead.details).map(([k, v]) => <Field key={k} label={k}>{String(v)}</Field>)}
            </Section>
          )}
          <Section title="Achat">
            <Field label="Marché">{marketLabel(lead.insurance_type, LEAD_TYPES)}</Field>
            <Field label="Type d'achat">{lead.exclusive ? "Exclusif (vous seul)" : "Partagé"}</Field>
            <Field label="Prix">{euros(lead.price_cents)}</Field>
            <Field label="Acheté le">{dateTime(lead.purchased_at)}</Field>
            <Field label="Demande du prospect">{dateTime(lead.lead_created_at)}</Field>
          </Section>
        </section>

        {/* Activity */}
        <section className={`${card} flex flex-col gap-5 p-5`}>
          <h2 className="border-b-2 border-accent pb-2 text-[15px] font-bold text-ink">Activité</h2>

          <div>
            <div className="flex border-b border-slate-200" role="tablist">
              {([["note", "Note", "note"], ["reminder", "Rappel", "bell"]] as const).map(([value, label, icon]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={composer === value}
                  onClick={() => setComposer(value)}
                  className={`-mb-px flex items-center gap-1.5 border-b-2 px-4 py-2 text-[13px] font-semibold ${composer === value ? "border-brand text-brand" : "border-transparent text-slate-500 hover:text-ink"}`}
                >
                  <Icon name={icon} /> {label}
                </button>
              ))}
            </div>

            {composer === "note" ? (
              <form
                className="mt-3 flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (note.trim()) run(async () => { await addCrmNote(id, note); setNote(""); });
                }}
              >
                <label htmlFor="note" className="sr-only">Nouvelle note</label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Compte rendu d'appel, besoins, objections…"
                  className="w-full border border-slate-300 px-3 py-2 text-[14px] outline-none focus:border-brand"
                />
                <button type="submit" disabled={saving || !note.trim()} className="h-9 self-end bg-brand px-4 text-[13px] font-bold text-white hover:bg-brand-hover disabled:opacity-50">Enregistrer</button>
              </form>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {presets().map((p) => (
                    <button key={p.label} type="button" disabled={saving} onClick={() => run(() => updateCrmLead(id, { reminder_at: p.at.toISOString() }))} className="rounded-full border border-slate-300 px-3 py-1 text-[12px] font-semibold text-ink hover:border-brand">
                      {p.label}
                    </button>
                  ))}
                </div>
                <label htmlFor="reminder" className="sr-only">Date et heure du rappel</label>
                <div className="flex gap-2">
                  <input id="reminder" type="datetime-local" value={reminder} onChange={(e) => setReminder(e.target.value)} className="h-9 min-w-0 flex-1 border border-slate-300 px-2 text-[13px] outline-none focus:border-brand" />
                  <button type="button" disabled={saving || !reminder} onClick={() => run(() => updateCrmLead(id, { reminder_at: new Date(reminder).toISOString() }))} className="h-9 bg-brand px-4 text-[13px] font-bold text-white hover:bg-brand-hover disabled:opacity-50">Enregistrer</button>
                </div>
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-[13px] font-bold text-ink">Prochaines étapes</h3>
            {lead.reminder_at ? (
              <div className={`flex items-center gap-3 border-l-4 p-3 ${overdue ? "border-red-500 bg-red-50" : "border-accent bg-light"}`}>
                <Icon name="bell" className={`size-5 ${overdue ? "text-red-600" : "text-accent"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-ink">Rappeler {lead.first_name}</p>
                  <p className={`text-[12px] ${overdue ? "font-semibold text-red-600" : "text-slate-600"}`}>{overdue ? "En retard · " : ""}{dateTime(lead.reminder_at)}</p>
                </div>
                <button type="button" disabled={saving} onClick={() => run(() => updateCrmLead(id, { clear_reminder: true }))} className="text-[12px] font-semibold text-slate-500 hover:text-red-600">Supprimer</button>
              </div>
            ) : (
              <p className="text-[13px] text-slate-500">Aucun rappel prévu.</p>
            )}
          </div>

          <div>
            <h3 className="mb-3 text-[13px] font-bold text-ink">Activités passées</h3>
            <ol className="flex flex-col">
              {timeline.map((t, i) => (
                <li key={t.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`flex size-7 items-center justify-center rounded-full text-white ${t.kind === "note" ? "bg-accent" : t.kind === "reminder" ? "bg-amber-500" : "bg-brand"}`}>
                      <Icon name={t.kind === "note" ? "note" : t.kind === "reminder" ? "bell" : "clock"} className="size-3.5" />
                    </span>
                    {i < timeline.length - 1 && <span className="w-px flex-1 bg-slate-200" aria-hidden="true" />}
                  </div>
                  <div className="min-w-0 flex-1 pb-4">
                    <p className="text-[12px] text-slate-500">{t.kind === "note" ? "Note" : t.kind === "reminder" ? "Rappel" : "Mise à jour"} · {dateTime(t.at)}</p>
                    <p className={`mt-0.5 text-[14px] text-ink ${t.kind === "note" ? "whitespace-pre-wrap" : ""}`}>{t.kind === "note" ? t.text : <WithArrows text={t.text} />}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </>
  );
}
