"use client";

import { useState } from "react";
import { EmptyState, LeadLine, LoadMore, usePagedList } from "@/components/pro/portfolio";
import { card, ErrorNote, ListSkeleton, PageHeader } from "@/components/pro/ui";
import { dateTime } from "@/lib/format";
import { listAllNotes } from "@/lib/pro";

// Every note across the portfolio, newest first, searchable (note text,
// prospect's name or city), loaded 50 at a time as you scroll. Notes are
// written on each lead's page.
export default function Notes() {
  const [q, setQ] = useState("");
  const { items: notes, total, hasMore, loading, loadMore, error } = usePagedList((cursor) => listAllNotes(q, cursor), q);

  return (
    <>
      <PageHeader
        title="Notes"
        subtitle={notes && total ? `${total.toLocaleString("fr-FR")} note${total > 1 ? "s" : ""}${q ? ` pour « ${q} »` : ""}, de la plus récente à la plus ancienne.` : "Toutes les notes de votre portefeuille, de la plus récente à la plus ancienne."}
      />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher dans les notes, un nom, une ville…"
        aria-label="Rechercher dans les notes"
        className="h-10 w-full max-w-md rounded-md border border-slate-300 px-3 text-[14px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
      />
      {error && <ErrorNote>{error}</ErrorNote>}
      {!notes ? (
        <ListSkeleton />
      ) : notes.length === 0 ? (
        q ? (
          <p className="text-[15px] text-slate-600">Aucune note ne correspond à « {q} ».</p>
        ) : (
          <EmptyState title="Aucune note pour le moment" text="Ajoutez des notes depuis la fiche d'un lead (appel, objection, documents reçus…) : elles sont toutes réunies ici." />
        )
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((n) => (
            <li key={n.id} className={`${card} flex flex-col gap-3 p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <LeadLine lead={n.lead} showStatus={false} />
                <span className="text-[13px] text-slate-500">{dateTime(n.created_at)}</span>
              </div>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink">{n.body}</p>
            </li>
          ))}
        </ul>
      )}
      {notes && notes.length > 0 && <LoadMore hasMore={hasMore} loading={loading} onLoad={loadMore} shown={notes.length} total={total} />}
    </>
  );
}
