"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearToken, getToken, me, type Broker } from "@/lib/pro";

// The public navbar's account block, like New World Courtage's: "Espace pro"
// (padlock, to /connexion) when logged out; once logged in, the broker's
// first name with a menu (espace pro pages, sign out). The session is only
// read after mount, so the server render and the first client render match.

export function useSession() {
  const [broker, setBroker] = useState<Broker | null>(null);
  useEffect(() => {
    if (!getToken()) return;
    me().then(setBroker).catch(() => setBroker(null));
  }, []);
  return [broker, setBroker] as const;
}

export const firstName = (b: Broker) => b.full_name.trim().split(/\s+/)[0] || "Mon compte";

export const ACCOUNT_LINKS = [
  { label: "Tableau de bord", href: "/espace-pro" },
  { label: "Acheter des leads", href: "/espace-pro/acheter" },
  { label: "Mes leads", href: "/espace-pro/mes-leads" },
  { label: "Mon compte", href: "/espace-pro/compte" },
];

export function LockIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function UserIcon({ className = "size-[17px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

const block = "flex items-center gap-2 bg-brand font-bold text-white transition-colors hover:bg-brand-hover";

// Desktop block.
export default function NavAccount({ broker, onLogout }: { broker: Broker | null; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => root.current && !root.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!broker) {
    return (
      <Link href="/connexion" className={`${block} px-7 text-[15px]`}>
        <LockIcon /> Espace pro
      </Link>
    );
  }

  return (
    <div ref={root} className="relative flex">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={`${block} px-6 text-[15px]`}>
        <UserIcon />
        {firstName(broker)}
        <svg viewBox="0 0 24 24" className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 w-60 border border-slate-200 bg-white py-1 shadow-lg">
          <p className="truncate border-b border-slate-100 px-5 py-2.5 text-[13px] text-slate-500">{broker.company || broker.email}</p>
          {ACCOUNT_LINKS.map((l) => (
            <Link key={l.href} href={l.href} role="menuitem" onClick={() => setOpen(false)} className="block px-5 py-3 text-[15px] text-ink hover:bg-light hover:text-brand">
              {l.label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2 border-t border-slate-200 px-5 py-3 text-left text-[15px] text-ink hover:bg-light hover:text-brand"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}

// Sends a logged-in broker straight to the espace pro (login and sign-up pages).
export function useRedirectIfLoggedIn() {
  const router = useRouter();
  useEffect(() => {
    if (!getToken()) return;
    me().then(() => router.replace("/espace-pro")).catch(() => {});
  }, [router]);
}

export function useLogout(setBroker: (b: Broker | null) => void) {
  const router = useRouter();
  return () => {
    clearToken();
    setBroker(null);
    router.push("/");
  };
}
