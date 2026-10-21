"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useBroker } from "@/components/ProShell";
import { card, CardsSkeleton, ErrorNote, PageHeader, primaryButton, StatusBadge } from "@/components/pro/ui";
import { euros, dateTime, ago, marketLabel } from "@/lib/format";
import { LEAD_TYPES } from "@/lib/leadTypes";
import { CRM_STATUSES, getCrmSummary, type CrmSummary } from "@/lib/pro";

// Espace pro home: spending this month, the pipeline at a glance, callbacks due today
// (or overdue), and the latest leads bought.
export default function EspaceProDashboard() {
  const broker = useBroker();
  const [data, setData] = useState<CrmSummary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getCrmSummary().then(setData).catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <PageHeader
        title={`Bonjour ${broker.full_name.split(" ")[0]}`}
        subtitle="Voici où en sont vos leads aujourd'hui."
        action={<Link href="/espace-pro/acheter" className={primaryButton}>Acheter des leads</Link>}
      />

      {error && <ErrorNote>{error}</ErrorNote>}
      {!data && !error && <CardsSkeleton />}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className={`${card} flex flex-col gap-1 p-6`}>
              <p className="text-[13px] font-semibold text-slate-500">Dépensé ce mois-ci</p>
              <p className="heading text-[34px] leading-none text-ink">{euros(data.spent_month_cents)}</p>
              <Link href="/espace-pro/paiements" className="mt-2 text-[14px] font-semibold text-brand hover:underline">Mes paiements</Link>
            </div>
            <div className={`${card} flex flex-col gap-1 p-6`}>
              <p className="text-[13px] font-semibold text-slate-500">Leads achetés</p>
              <p className="heading text-[34px] leading-none text-ink">{data.total}</p>
              <Link href="/espace-pro/mes-leads" className="mt-2 text-[14px] font-semibold text-brand hover:underline">Voir mes leads</Link>
            </div>
            <div className={`${card} flex flex-col gap-1 p-6`}>
              <p className="text-[13px] font-semibold text-slate-500">Taux de signature</p>
              <p className="heading text-[34px] leading-none text-ink">
                {data.total ? `${Math.round((data.counts.won / data.total) * 100)} %` : "—"}
              </p>
              <p className="mt-2 text-[14px] text-slate-500">{data.counts.won} signé{data.counts.won > 1 ? "s" : ""}</p>
            </div>
          </div>

          <section className={`${card} p-6`}>
            <h2 className="text-[17px] font-bold text-ink">Pipeline</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {CRM_STATUSES.map((s) => (
                <Link key={s.value} href={`/espace-pro/mes-leads?statut=${s.value}`} className="flex flex-col gap-1 bg-light p-4 transition-colors hover:bg-slate-200/60">
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-600">
                    <span className={`size-2 rounded-full ${s.dot}`} aria-hidden="true" /> {s.label}
                  </span>
                  <span className="text-[24px] font-bold text-ink">{data.counts[s.value]}</span>
                </Link>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className={`${card} p-6`}>
              <h2 className="text-[17px] font-bold text-ink">Rappels du jour</h2>
              {data.reminders_due.length === 0 ? (
                <p className="mt-3 text-[14px] text-slate-500">Aucun rappel prévu aujourd&apos;hui.</p>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {data.reminders_due.map((l) => {
                    const late = l.reminder_at && new Date(l.reminder_at) < new Date();
                    return (
                      <li key={l.id}>
                        <Link href={`/espace-pro/mes-leads/${l.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-brand">
                          <span className="min-w-0">
                            <span className="block truncate font-semibold">{l.first_name} {l.last_name}</span>
                            <span className="text-[13px] text-slate-500">{l.phone}</span>
                          </span>
                          <span className={`shrink-0 text-[13px] font-semibold ${late ? "text-red-600" : "text-slate-600"}`}>
                            {late ? "En retard · " : ""}{dateTime(l.reminder_at!)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section className={`${card} p-6`}>
              <h2 className="text-[17px] font-bold text-ink">Derniers achats</h2>
              {data.recent.length === 0 ? (
                <div className="mt-3 flex flex-col items-start gap-3">
                  <p className="text-[14px] text-slate-500">Vous n&apos;avez pas encore acheté de lead.</p>
                  <Link href="/espace-pro/acheter" className="text-[14px] font-semibold text-brand hover:underline">Parcourir les leads disponibles</Link>
                </div>
              ) : (
                <ul className="mt-3 divide-y divide-slate-100">
                  {data.recent.map((l) => (
                    <li key={l.id}>
                      <Link href={`/espace-pro/mes-leads/${l.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-brand">
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{l.first_name} {l.last_name}</span>
                          <span className="text-[13px] text-slate-500">
                            {marketLabel(l.insurance_type, LEAD_TYPES)} · {l.city} · {ago(l.purchased_at)}
                          </span>
                        </span>
                        <StatusBadge status={l.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </>
  );
}
