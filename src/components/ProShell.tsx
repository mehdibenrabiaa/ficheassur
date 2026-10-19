"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { clearToken, getToken, me, type Broker } from "@/lib/pro";

// The espace pro's shell, like New World Courtage's espace client: the site
// navbar, a sidebar with the sections (a scrollable row of tabs on phones),
// the auth check (no valid session -> /connexion) and the signed-in broker,
// shared with every page through useBroker().

const BrokerContext = createContext<Broker | null>(null);
export const useBroker = () => useContext(BrokerContext) as Broker;

type NavIcon = "home" | "cart" | "list" | "user" | "inbox";
type NavItem = { href: string; label: string; icon: NavIcon; soon?: boolean };

const NAV: NavItem[] = [
  { href: "/espace-pro", label: "Tableau de bord", icon: "home" },
  { href: "/espace-pro/acheter", label: "Acheter des leads", icon: "cart", soon: true },
  { href: "/espace-pro/mes-leads", label: "Mes leads", icon: "list", soon: true },
  { href: "/espace-pro/compte", label: "Mon compte", icon: "user" },
];
const ADMIN_NAV: NavItem[] = [{ href: "/espace-pro/admin/demandes", label: "Demandes d'accès", icon: "inbox" }];

function Icon({ name }: { name: NavIcon | "logout" }) {
  const p = { viewBox: "0 0 24 24", className: "size-[18px] shrink-0", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "home": return <svg {...p}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" /></svg>;
    case "cart": return <svg {...p}><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.6 12.4a1.5 1.5 0 0 0 1.5 1.1h8.7a1.5 1.5 0 0 0 1.4-1.1L21 7H6" /></svg>;
    case "list": return <svg {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
    case "user": return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
    case "inbox": return <svg {...p}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1Z" /></svg>;
    default: return <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>;
  }
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

export default function ProShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [broker, setBroker] = useState<Broker | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/connexion");
      return;
    }
    me().then(setBroker).catch(() => router.replace("/connexion"));
  }, [router]);

  function logout() {
    clearToken();
    router.replace("/connexion");
  }

  if (!broker) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-[60vh] items-center justify-center bg-light">
          <span className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-label="Chargement" />
        </main>
      </>
    );
  }

  const items = broker.role === "admin" ? [...NAV, ...ADMIN_NAV] : NAV;
  const isActive = (href: string) => (href === "/espace-pro" ? pathname === href : pathname.startsWith(href));

  const link = (item: NavItem, mobile = false) => {
    const active = isActive(item.href);
    if (item.soon) {
      return (
        <span key={item.href} className={mobile ? "whitespace-nowrap pb-3 text-sm font-semibold text-slate-300" : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-400"}>
          {!mobile && <Icon name={item.icon} />}
          {item.label}
          <span className="rounded-full bg-light px-2 py-0.5 text-[11px] font-semibold text-slate-500">Bientôt</span>
        </span>
      );
    }
    return mobile ? (
      <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`whitespace-nowrap border-b-2 pb-3 text-sm font-semibold ${active ? "border-brand text-ink" : "border-transparent text-slate-500"}`}>
        {item.label}
      </Link>
    ) : (
      <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${active ? "bg-brand/10 text-brand" : "text-slate-600 hover:bg-light hover:text-ink"}`}>
        <Icon name={item.icon} />
        {item.label}
      </Link>
    );
  };

  return (
    <BrokerContext.Provider value={broker}>
      <Navbar />
      <div className="bg-light md:flex">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex lg:top-[87px] lg:h-[calc(100vh-87px)]">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{initials(broker.full_name)}</span>
            <div className="min-w-0">
              <p className="truncate font-bold text-ink">{broker.full_name}</p>
              <p className="truncate text-xs text-slate-500">{broker.company}</p>
            </div>
          </div>
          <nav aria-label="Espace pro" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            {NAV.map((i) => link(i))}
            {broker.role === "admin" && (
              <>
                <p className="mt-4 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Administration</p>
                {ADMIN_NAV.map((i) => link(i))}
              </>
            )}
          </nav>
          <div className="border-t border-slate-100 p-3">
            <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600">
              <Icon name="logout" /> Déconnexion
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="border-b border-slate-200 bg-white md:hidden">
            <div className="flex items-center justify-between gap-4 px-4 pt-5">
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-ink">{broker.full_name}</p>
                <p className="truncate text-sm text-slate-500">{broker.company}</p>
              </div>
              <button type="button" onClick={logout} className="shrink-0 border border-slate-300 px-3 py-2 text-sm font-semibold text-ink">Déconnexion</button>
            </div>
            <nav aria-label="Espace pro" className="mt-4 flex gap-6 overflow-x-auto px-4 [scrollbar-width:none]">
              {items.map((i) => link(i, true))}
            </nav>
          </div>
          <main className="min-h-[calc(100vh-4rem)] px-4 py-10 md:px-8">
            <div className="mx-auto flex max-w-4xl flex-col gap-8">{children}</div>
          </main>
        </div>
      </div>
    </BrokerContext.Provider>
  );
}
