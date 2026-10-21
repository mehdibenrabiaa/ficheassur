// Small building blocks shared by the espace pro pages.

import { CRM_STATUSES, type CrmStatus } from "@/lib/pro";

export const card = "bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="heading text-[30px] leading-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-slate-600">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return <span className={`inline-block size-6 animate-spin rounded-full border-2 border-brand border-t-transparent ${className}`} aria-label="Chargement" />;
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return <p role="alert" className="border-l-4 border-red-500 bg-red-50 p-3 text-[14px] text-red-700">{children}</p>;
}

export function StatusBadge({ status }: { status: CrmStatus }) {
  const s = CRM_STATUSES.find((x) => x.value === status)!;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-light px-2.5 py-1 text-[12px] font-semibold text-ink">
      <span className={`size-2 rounded-full ${s.dot}`} aria-hidden="true" /> {s.label}
    </span>
  );
}

export const primaryButton =
  "inline-flex h-11 items-center justify-center gap-2 bg-brand px-5 text-[14px] font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButton =
  "inline-flex h-11 items-center justify-center gap-2 border border-slate-300 bg-white px-5 text-[14px] font-semibold text-ink transition-colors hover:border-brand hover:text-brand disabled:opacity-50";
