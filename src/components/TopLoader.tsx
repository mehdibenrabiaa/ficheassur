"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Stripe-style progress bar along the top of the screen: starts when an
// internal link is clicked, completes when the new page is on screen.
// (Navigations started from code -- router.push -- skip it; they follow an
// action that already shows its own state.)
export default function TopLoader() {
  const pathname = usePathname();
  const search = useSearchParams();
  const url = `${pathname}?${search}`;
  // The URL we were on when a link was clicked. Still on it: loading. On
  // another one: the new page is here, so the bar completes and fades.
  const [from, setFrom] = useState<string | null>(null);
  const state = from === null ? "idle" : from === url ? "loading" : "done";

  useEffect(() => {
    if (state !== "done") return;
    const t = setTimeout(() => setFrom(null), 500);
    return () => clearTimeout(t);
  }, [state]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const next = new URL(a.href, location.href);
      if (next.origin !== location.origin) return;
      if (next.pathname === location.pathname && next.search === location.search) return; // same page / anchor
      setFrom(`${location.pathname}?${location.search.replace(/^\?/, "")}`);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (state === "idle") return null;
  return <div className="top-loader" data-state={state} role="progressbar" aria-label="Chargement de la page" />;
}
