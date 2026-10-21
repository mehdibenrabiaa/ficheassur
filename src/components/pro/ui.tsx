"use client";

// Small building blocks shared by the espace pro pages.

import { useEffect, useRef } from "react";
import { CRM_STATUSES, type CrmStatus } from "@/lib/pro";

// Every espace pro card: thin border, rounded, and a faint shadow so it lifts off the page.
export const card = "rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04),0_2px_8px_rgba(16,24,40,0.05)]";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-ink sm:text-[32px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[15px] text-slate-600">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return <span className={`inline-block size-6 animate-spin rounded-full border-2 border-brand border-t-transparent ${className}`} aria-label="Chargement" />;
}

// Loading placeholders shaped like what's coming, with a shimmer (Stripe's
// approach) -- the page keeps its layout instead of jumping when data lands.
export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`skeleton block ${className}`} aria-hidden="true" />;
}

// A list or table loading: a few rows of name / detail / action.
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className={`${card} divide-y divide-slate-100`} role="status" aria-label="Chargement">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className={`h-3.5 ${["w-48", "w-40", "w-56"][i % 3]}`} />
            <Skeleton className={`h-3 ${["w-72", "w-60", "w-64"][i % 3]} max-w-full`} />
          </div>
          <Skeleton className="hidden h-8 w-24 sm:block" />
        </div>
      ))}
    </div>
  );
}

// A dashboard loading: a row of figure cards, then a wide panel.
export function CardsSkeleton() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Chargement">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`${card} flex flex-col gap-3 p-6`}>
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className={`${card} flex flex-col gap-4 p-6`}>
        <Skeleton className="h-4 w-32" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
      </div>
    </div>
  );
}

// A card section's title with a small icon in a soft brand square, so each
// section is recognisable at a glance (Finances, and anywhere else).
const SECTION_ICONS = {
  chart: "M3 3v18h18M7 15v3M12 10v8M17 6v12",
  table: "M3 5h18v14H3zM3 10h18M9 10v9",
  trophy: "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4",
  receipt: "M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3ZM9 8h6M9 12h6",
  card: "M2 5h20v14H2zM2 10h20M6 15h4",
} as const;
export function SectionTitle({ icon, title, subtitle }: { icon: keyof typeof SECTION_ICONS; title: string; subtitle?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={SECTION_ICONS[icon]} /></svg>
      </span>
      <div className="min-w-0">
        <h2 className="text-[16px] font-bold leading-9 text-ink">{title}</h2>
        {subtitle && <p className="-mt-1.5 text-[13px] text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

export function ErrorNote({ children }: { children: React.ReactNode }) {
  return <p role="alert" className="border-l-4 border-red-500 bg-red-50 p-3 text-[14px] text-red-700">{children}</p>;
}

// An error after an action (e.g. "Payer"), as a modal over the page: an
// inline note at the top goes unseen when the button is further down.
// Closes with the button, Escape or a click outside.
export function ErrorDialog({ title = "Action impossible", message, onClose }: { title?: string; message: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (message && d && !d.open) d.showModal();
    if (!message && d?.open) d.close();
  }, [message]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
      aria-labelledby="error-dialog-title"
      className="m-auto w-[calc(100%-2rem)] max-w-md bg-white p-0 shadow-2xl backdrop:bg-ink/50"
    >
      <div className="h-1.5 bg-red-500" aria-hidden="true" />
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M12 8v5M12 16.5h.01" /><circle cx="12" cy="12" r="9.5" /></svg>
          </span>
          <div>
            <h2 id="error-dialog-title" className="text-[18px] font-bold text-ink">{title}</h2>
            <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{message}</p>
          </div>
        </div>
        <button type="button" autoFocus onClick={() => ref.current?.close()} className={`${primaryButton} self-end`}>
          Compris
        </button>
      </div>
    </dialog>
  );
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
