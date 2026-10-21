"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { card, ErrorNote, ListSkeleton, PageHeader, secondaryButton } from "@/components/pro/ui";
import { dateShort, dateTime, marketLabel } from "@/lib/format";
import { LEAD_TYPES } from "@/lib/leadTypes";
import { CRM_STATUSES, downloadCrmCsv, listCrmLeads, updateCrmLead, type CrmLead, type CrmStatus } from "@/lib/pro";
import Select from "@/components/Select";

// The broker's CRM: every lead they bought, as a list (status editable in
// place) or a kanban board (drag a card to another column), with search,
// a status filter (?statut=, from the dashboard's pipeline) and CSV export.
export default function MesLeads() {
  return (
    <Suspense fallback={<ListSkeleton />}>
      <MesLeadsInner />
    </Suspense>
  );
}

function MesLeadsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const status = (params.get("statut") ?? "") as CrmStatus | "";
  const [q, setQ] = useState(params.get("q") ?? "");
  const [view, setView] = useState<"list" | "board">("list");
  const [leads, setLeads] = useState<CrmLead[] | null>(null);
  const [error, setError] = useState("");

  // The board always shows every status; the list honours the filter.
  const load = useCallback(() => {
    listCrmLeads({ status: view === "list" ? status : "", q })
      .then(setLeads)
      .catch((e) => setError(e.message));
  }, [status, q, view]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const setStatusFilter = (s: string) => router.replace(s ? `/espace-pro/mes-leads?statut=${s}` : "/espace-pro/mes-leads");

  async function move(lead: CrmLead, to: CrmStatus) {
    if (lead.status === to) return;
    setLeads((ls) => ls?.map((l) => (l.id === lead.id ? { ...l, status: to } : l)) ?? null); // optimistic
    try {
      await updateCrmLead(lead.id, { status: to });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
      load();
    }
  }

  async function exportCsv() {
    try {
      await downloadCrmCsv({ status: view === "list" ? status : "", q });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export impossible.");
    }
  }

  return (
    <>
      <PageHeader
        title="Mes leads"
        subtitle="Suivez chaque prospect jusqu'à la signature."
        action={<button type="button" onClick={exportCsv} className={secondaryButton}>Exporter (CSV)</button>}
      />

      <div className={`${card} flex flex-col gap-3 p-4`}>
        {/* Search and view on one row; the status tabs on their own row below, wrapping on small screens. */}
        <div className="flex items-center gap-3">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un nom, un téléphone, une ville…"
            aria-label="Rechercher"
            className="h-10 w-full border border-slate-300 px-3 text-[14px] outline-none focus:border-brand min-w-0 flex-1 sm:max-w-sm"
          />
          <div className="ml-auto flex shrink-0 border border-slate-300" role="group" aria-label="Affichage">
            {(["list", "board"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className={`px-4 py-2 text-[13px] font-semibold ${view === v ? "bg-brand text-white" : "text-ink hover:bg-light"}`}
              >
                {v === "list" ? "Liste" : "Tableau"}
              </button>
            ))}
          </div>
        </div>
        {view === "list" && (
          <div className="flex flex-wrap gap-1 border-t border-slate-100 pt-3" role="group" aria-label="Statut">
            {[{ value: "", label: "Tous" }, ...CRM_STATUSES].map((s) => (
              <button
                key={s.value}
                type="button"
                aria-pressed={status === s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${status === s.value ? "bg-brand text-white" : "text-slate-600 hover:bg-light"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      {!leads ? (
        <ListSkeleton />
      ) : leads.length === 0 && !q && !status ? (
        <div className={`${card} flex flex-col items-center gap-3 p-10 text-center`}>
          <p className="text-[16px] font-semibold text-ink">Vous n&apos;avez pas encore de lead.</p>
          <Link href="/espace-pro/acheter" className="font-semibold text-brand hover:underline">Acheter vos premiers leads</Link>
        </div>
      ) : (
        // Keyed by view and status tab, so switching fades the new content in.
        <div key={`${view}-${status}`} className="fade-in">
          {view === "list" ? <ListView leads={leads} onMove={move} /> : <BoardView leads={leads} onMove={move} />}
        </div>
      )}
    </>
  );
}

function ListView({ leads, onMove }: { leads: CrmLead[]; onMove: (l: CrmLead, s: CrmStatus) => void }) {
  if (leads.length === 0) return <p className={`${card} p-8 text-center text-[15px] text-slate-600`}>Aucun lead ne correspond.</p>;
  const statusOptions = CRM_STATUSES.map((s) => ({ value: s.value, label: s.label, dot: s.dot }));
  return (
    <>
    {/* Phones: one card per lead instead of a wide table. */}
    <ul className="flex flex-col gap-3 sm:hidden">
      {leads.map((l) => (
        <li key={l.id} className={`${card} flex flex-col gap-3 p-4`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={`/espace-pro/mes-leads/${l.id}`} className="block truncate text-[16px] font-semibold text-ink hover:text-brand">
                {l.first_name} {l.last_name}
              </Link>
              <span className="text-[13px] text-slate-500">{marketLabel(l.insurance_type, LEAD_TYPES)} · {l.zip_code} {l.city}{l.exclusive ? " · Exclusif" : ""}</span>
            </div>
            <a href={`tel:${l.phone}`} aria-label={`Appeler ${l.first_name}`} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-white">
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" /></svg>
            </a>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-44">
              <Select size="sm" value={l.status} onChange={(v) => onMove(l, v as CrmStatus)} options={statusOptions} ariaLabel={`Statut de ${l.first_name} ${l.last_name}`} />
            </div>
            <span className="text-[12px] text-slate-500">{l.reminder_at ? `Rappel ${dateTime(l.reminder_at)}` : `Acheté le ${dateShort(l.purchased_at)}`}</span>
          </div>
        </li>
      ))}
    </ul>
    <div className={`${card} hidden overflow-x-auto sm:block`}>
      <table className="w-full min-w-[720px] text-left text-[14px]">
        <thead className="border-b border-slate-200 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Prospect</th>
            <th className="px-4 py-3">Marché</th>
            <th className="px-4 py-3">Téléphone</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3">Rappel</th>
            <th className="px-4 py-3">Acheté le</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {leads.map((l) => (
            <tr key={l.id} className="hover:bg-light/60">
              <td className="px-4 py-3">
                <Link href={`/espace-pro/mes-leads/${l.id}`} className="font-semibold text-ink hover:text-brand">
                  {l.first_name} {l.last_name}
                </Link>
                <span className="block text-[12px] text-slate-500">{l.zip_code} {l.city}{l.exclusive ? " · Exclusif" : ""}</span>
              </td>
              <td className="px-4 py-3 text-slate-700">{marketLabel(l.insurance_type, LEAD_TYPES)}</td>
              <td className="px-4 py-3"><a href={`tel:${l.phone}`} className="whitespace-nowrap text-brand hover:underline">{l.phone}</a></td>
              <td className="px-4 py-3">
                <div className="w-40">
                  <Select
                    size="sm"
                    value={l.status}
                    onChange={(v) => onMove(l, v as CrmStatus)}
                    options={statusOptions}
                    ariaLabel={`Statut de ${l.first_name} ${l.last_name}`}
                  />
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{l.reminder_at ? dateTime(l.reminder_at) : "—"}</td>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">{dateShort(l.purchased_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}

function BoardView({ leads, onMove }: { leads: CrmLead[]; onMove: (l: CrmLead, s: CrmStatus) => void }) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<CrmStatus | null>(null);

  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
      {CRM_STATUSES.map((s) => {
        const col = leads.filter((l) => l.status === s.value);
        return (
          <section
            key={s.value}
            aria-label={s.label}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(s.value);
            }}
            onDragLeave={() => setOver(null)}
            onDrop={() => {
              const lead = leads.find((l) => l.id === dragId);
              if (lead) onMove(lead, s.value);
              setDragId(null);
              setOver(null);
            }}
            className={`flex w-64 shrink-0 flex-col gap-2 p-2 transition-colors ${over === s.value ? "bg-brand/10" : "bg-slate-200/50"}`}
          >
            <h2 className="flex items-center justify-between px-1 py-1 text-[13px] font-bold text-ink">
              <span className="flex items-center gap-2"><span className={`size-2 rounded-full ${s.dot}`} aria-hidden="true" /> {s.label}</span>
              <span className="text-slate-500">{col.length}</span>
            </h2>
            {col.map((l) => (
              <Link
                key={l.id}
                href={`/espace-pro/mes-leads/${l.id}`}
                draggable
                onDragStart={() => setDragId(l.id)}
                onDragEnd={() => setDragId(null)}
                className={`flex cursor-grab flex-col gap-1 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)] ${dragId === l.id ? "opacity-50" : ""}`}
              >
                <span className="font-semibold text-ink">{l.first_name} {l.last_name}</span>
                <span className="text-[12px] text-slate-500">{marketLabel(l.insurance_type, LEAD_TYPES)} · {l.city}</span>
                {l.reminder_at && <span className="text-[12px] font-semibold text-slate-600">Rappel : {dateTime(l.reminder_at)}</span>}
              </Link>
            ))}
            {col.length === 0 && <p className="px-1 py-4 text-center text-[12px] text-slate-400">Déposez un lead ici</p>}
          </section>
        );
      })}
    </div>
  );
}
