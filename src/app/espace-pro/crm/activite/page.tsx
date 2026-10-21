"use client";

import { useState } from "react";
import { EmptyState, LeadLine, LoadMore, usePagedList } from "@/components/pro/portfolio";
import { card, ErrorNote, ListSkeleton, PageHeader } from "@/components/pro/ui";
import { listActivity, type ActivityItem } from "@/lib/pro";

// The portfolio's history, newest first and grouped by day: purchases,
// status changes, reminders and notes on every lead. Loaded 50 at a time as
// you scroll; the type filter is applied by the server, over all of it.

const KINDS: Record<string, { label: string; dot: string }> = {
  purchased: { label: "Achat", dot: "bg-brand" },
  status: { label: "Statut", dot: "bg-violet-500" },
  reminder: { label: "Rappel", dot: "bg-amber-500" },
  note: { label: "Note", dot: "bg-emerald-500" },
  revenue: { label: "Facturation", dot: "bg-sky-600" },
};
const KIND_FILTERS = [{ value: "", label: "Tout" }, ...Object.entries(KINDS).map(([value, k]) => ({ value, label: k.label }))];

const day = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const hour = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

export default function Activite() {
  const [kind, setKind] = useState("");
  const { items, total, hasMore, loading, loadMore, error } = usePagedList((cursor) => listActivity(kind, cursor), kind);

  const days: { day: string; items: ActivityItem[] }[] = [];
  for (const i of items ?? []) {
    const d = day(i.created_at);
    if (days.at(-1)?.day !== d) days.push({ day: d, items: [] });
    days.at(-1)!.items.push(i);
  }

  return (
    <>
      <PageHeader
        title="Activité"
        subtitle={items && total ? `${total.toLocaleString("fr-FR")} événement${total > 1 ? "s" : ""} dans votre portefeuille.` : "L'historique de tout votre portefeuille."}
      />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Type d'activité">
        {KIND_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={kind === f.value}
            onClick={() => setKind(f.value)}
            className={`rounded-full border px-4 py-1.5 text-[13px] font-semibold transition-colors ${kind === f.value ? "border-brand bg-brand text-white" : "border-slate-300 text-ink hover:border-brand"}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {error && <ErrorNote>{error}</ErrorNote>}
      {!items ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        kind ? (
          <p className="text-[15px] text-slate-600">Aucune activité de ce type.</p>
        ) : (
          <EmptyState title="Aucune activité" text="Achats, changements de statut, rappels et notes de tous vos leads s'afficheront ici." />
        )
      ) : (
        <div key={kind} className="fade-in flex flex-col gap-6">
          {days.map((d) => (
            <section key={d.day} className="flex flex-col gap-2">
              <h2 className="text-[13px] font-bold uppercase tracking-wide text-slate-500 first-letter:uppercase">{d.day}</h2>
              <ul className={`${card} divide-y divide-slate-100`}>
                {d.items.map((i) => {
                  const k = KINDS[i.kind] ?? { label: i.kind, dot: "bg-slate-400" };
                  return (
                    <li key={i.id} className="flex flex-wrap items-start gap-x-4 gap-y-1 px-5 py-3">
                      <span className="w-12 shrink-0 pt-0.5 text-[13px] text-slate-500">{hour(i.created_at)}</span>
                      <span className="flex w-20 shrink-0 items-center gap-2 pt-0.5 text-[13px] font-semibold text-ink">
                        <span className={`size-2 rounded-full ${k.dot}`} aria-hidden="true" /> {k.label}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <LeadLine lead={i.lead} showStatus={false} />
                        <p className="text-[14px] text-slate-600">{i.detail}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
          <LoadMore hasMore={hasMore} loading={loading} onLoad={loadMore} shown={items.length} total={total} />
        </div>
      )}
    </>
  );
}
