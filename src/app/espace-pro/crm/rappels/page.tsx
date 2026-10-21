"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState, LeadLine } from "@/components/pro/portfolio";
import { card, ErrorNote, ListSkeleton, PageHeader } from "@/components/pro/ui";
import { listReminders, updateCrmLead, type ReminderItem } from "@/lib/pro";

// Next steps: every callback planned across the portfolio, grouped like a
// to-do list (overdue first). "Fait" clears the reminder; the lead's history
// records it.

type Group = { title: string; tone: string; items: ReminderItem[] };

function groupReminders(items: ReminderItem[], now: number): Group[] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const tomorrow = today.getTime() + 864e5;
  const dayAfter = tomorrow + 864e5;
  const groups: Group[] = [
    { title: "En retard", tone: "text-red-600", items: [] },
    { title: "Aujourd'hui", tone: "text-brand", items: [] },
    { title: "Demain", tone: "text-ink", items: [] },
    { title: "Plus tard", tone: "text-ink", items: [] },
  ];
  for (const r of items) {
    const t = new Date(r.reminder_at).getTime();
    groups[t < now ? 0 : t < tomorrow ? 1 : t < dayAfter ? 2 : 3].items.push(r);
  }
  return groups.filter((g) => g.items.length);
}

const when = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function Rappels() {
  const [items, setItems] = useState<ReminderItem[] | null>(null);
  const [now, setNow] = useState(0);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    listReminders()
      .then((r) => {
        setNow(Date.now());
        setItems(r);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function done(r: ReminderItem) {
    setItems((list) => list?.filter((x) => x !== r) ?? null);
    await updateCrmLead(r.lead.purchase_id, { clear_reminder: true }).catch((e) => {
      setError(e.message);
      load();
    });
  }

  const groups = items ? groupReminders(items, now) : [];
  const overdue = groups.find((g) => g.title === "En retard")?.items.length ?? 0;

  return (
    <>
      <PageHeader
        title="Rappels"
        subtitle={items ? `${items.length} rappel${items.length > 1 ? "s" : ""} prévu${items.length > 1 ? "s" : ""}${overdue ? ` · ${overdue} en retard` : ""}` : "Vos prochaines actions."}
      />
      {error && <ErrorNote>{error}</ErrorNote>}
      {!items ? (
        <ListSkeleton />
      ) : items.length === 0 ? (
        <EmptyState title="Aucun rappel prévu" text="Programmez un rappel depuis la fiche d'un lead : il apparaîtra ici, avec ceux de tout votre portefeuille." />
      ) : (
        groups.map((g) => (
          <section key={g.title} className="flex flex-col gap-3">
            <h2 className={`text-[14px] font-bold ${g.tone}`}>
              {g.title} <span className="font-normal text-slate-500">· {g.items.length}</span>
            </h2>
            <ul className={`${card} divide-y divide-slate-100`}>
              {g.items.map((r) => (
                <li key={r.lead.purchase_id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
                  <span className={`w-36 shrink-0 text-[14px] font-semibold ${g.title === "En retard" ? "text-red-600" : "text-ink"}`}>{when(r.reminder_at)}</span>
                  <div className="min-w-0 flex-1"><LeadLine lead={r.lead} /></div>
                  <div className="flex items-center gap-2">
                    <a href={`tel:${r.lead.phone}`} className="inline-flex h-9 items-center rounded-md border border-slate-300 px-3 text-[13px] font-semibold text-ink hover:border-brand hover:text-brand">
                      Appeler
                    </a>
                    <button type="button" onClick={() => done(r)} className="inline-flex h-9 items-center rounded-md bg-brand px-3 text-[13px] font-semibold text-white hover:bg-brand-hover">
                      Fait
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </>
  );
}
