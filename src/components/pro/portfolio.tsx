"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { marketLabel } from "@/lib/format";
import { LEAD_TYPES } from "@/lib/leadTypes";
import type { LeadRef, Page } from "@/lib/pro";
import { StatusBadge } from "@/components/pro/ui";

// Shared by the CRM section's pages (Rappels, Notes, Activité): who an item
// is about, linking to the lead's page in Mes leads.
export function LeadLine({ lead, showStatus = true }: { lead: LeadRef; showStatus?: boolean }) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
      <Link href={`/espace-pro/mes-leads/${lead.purchase_id}`} className="truncate text-[15px] font-semibold text-ink hover:text-brand hover:underline">
        {lead.name || "Prospect"}
      </Link>
      <span className="text-[13px] text-slate-500">
        {marketLabel(lead.insurance_type, LEAD_TYPES)} · {lead.city}
      </span>
      {showStatus && <StatusBadge status={lead.status} />}
    </div>
  );
}

// Empty state with a way forward.
export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-slate-300 p-10 text-center">
      <p className="text-[16px] font-semibold text-ink">{title}</p>
      <p className="max-w-md text-[14px] text-slate-600">{text}</p>
      <Link href="/espace-pro/mes-leads" className="mt-2 text-[14px] font-semibold text-brand hover:underline">Ouvrir Mes leads</Link>
    </div>
  );
}

// A list served a page at a time: the first page loads when `key` changes
// (a new search or filter, after a short pause), the next ones as the
// bottom comes into view -- or with the "Charger plus" button.
export function usePagedList<T>(fetchPage: (cursor: string | null) => Promise<Page<T>>, key: string) {
  const [items, setItems] = useState<T[] | null>(null);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fetchRef = useRef(fetchPage);
  useEffect(() => {
    fetchRef.current = fetchPage;
  });

  useEffect(() => {
    let stale = false;
    const t = setTimeout(() => {
      fetchRef.current(null)
        .then((p) => {
          if (stale) return;
          setItems(p.items);
          setTotal(p.total);
          setCursor(p.next_cursor);
        })
        .catch((e) => !stale && setError(e.message));
    }, 250);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [key]);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    try {
      const p = await fetchRef.current(cursor);
      setItems((cur) => [...(cur ?? []), ...p.items]);
      setCursor(p.next_cursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    }
    setLoading(false);
  }, [cursor, loading]);

  return { items, total, hasMore: Boolean(cursor), loading, loadMore, error };
}

// Bottom of a paged list: loads the next page when scrolled into view.
export function LoadMore({ hasMore, loading, onLoad, shown, total }: { hasMore: boolean; loading: boolean; onLoad: () => void; shown: number; total: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver((entries) => entries[0].isIntersecting && onLoad(), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, onLoad]);
  return (
    <div ref={ref} className="flex flex-col items-center gap-2 py-4 text-[13px] text-slate-500">
      <span>{shown.toLocaleString("fr-FR")} sur {total.toLocaleString("fr-FR")}</span>
      {hasMore && (
        <button type="button" onClick={onLoad} disabled={loading} className="rounded-md border border-slate-300 px-4 py-2 font-semibold text-ink hover:border-brand hover:text-brand disabled:opacity-50">
          {loading ? "Chargement…" : "Charger plus"}
        </button>
      )}
    </div>
  );
}
