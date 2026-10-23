"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BrandSplash from "@/components/BrandSplash";
import { clearToken, getToken, me, type Broker } from "@/lib/pro";

// The espace pro's shell, laid out like Stripe's dashboard: a full-height
// sidebar (account switcher at the top, grouped sections, help pinned at the
// bottom; collapsible to an icon rail on desktop like shadcn/ui's sidebar --
// trigger in the top bar, Ctrl/Cmd+B, or a click on the sidebar's edge --
// remembered per browser; a slide-in drawer on phones), a slim top bar with a lead search
// and icon shortcuts, and pages on a plain white canvas. Also the auth check
// (no valid session -> /connexion) and the signed-in broker, shared with
// every page through useBroker().

const BrokerContext = createContext<Broker | null>(null);
export const useBroker = () => useContext(BrokerContext) as Broker;
// For Mon compte: replace the signed-in broker after a profile change.
const SetBrokerContext = createContext<(b: Broker) => void>(() => {});
export const useSetBroker = () => useContext(SetBrokerContext);

type NavIcon = "home" | "cart" | "list" | "user" | "inbox" | "wallet" | "help" | "bell" | "note" | "activity" | "chart";
type NavItem = { href: string; label: string; icon: NavIcon };

const NAV: NavItem[] = [
  { href: "/espace-pro", label: "Tableau de bord", icon: "home" },
  { href: "/espace-pro/finances", label: "Finances", icon: "chart" },
  { href: "/espace-pro/paiements", label: "Paiements", icon: "wallet" },
];
// Client relationship management: the portfolio, then its next steps, notes and history across all leads.
const CRM_NAV: NavItem[] = [
  { href: "/espace-pro/mes-leads", label: "Mes leads", icon: "list" },
  { href: "/espace-pro/crm/rappels", label: "Rappels", icon: "bell" },
  { href: "/espace-pro/crm/notes", label: "Notes", icon: "note" },
  { href: "/espace-pro/crm/activite", label: "Activité", icon: "activity" },
];
const SHOP_NAV: NavItem[] = [{ href: "/espace-pro/acheter", label: "Acheter des leads", icon: "cart" }];
const ADMIN_NAV: NavItem[] = [
  { href: "/espace-pro/admin/demandes", label: "Demandes d'accès", icon: "inbox" },
  { href: "/espace-pro/admin/assistance", label: "Messages d'assistance", icon: "help" },
];

type IconName = NavIcon | "logout" | "menu" | "search" | "settings" | "plus" | "chevron" | "collapse";

const COLLAPSED_KEY = "ficheassur_sidebar_collapsed";

function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  const p = { viewBox: "0 0 24 24", className: `${className} shrink-0`, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "home": return <svg {...p}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z" /></svg>;
    case "cart": return <svg {...p}><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.6 12.4a1.5 1.5 0 0 0 1.5 1.1h8.7a1.5 1.5 0 0 0 1.4-1.1L21 7H6" /></svg>;
    case "list": return <svg {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>;
    case "wallet": return <svg {...p}><path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2.5" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></svg>;
    case "user": return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>;
    case "inbox": return <svg {...p}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1Z" /></svg>;
    case "menu": return <svg {...p}><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
    case "help": return <svg {...p}><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" /></svg>;
    case "search": return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
    case "settings": return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg>;
    case "plus": return <svg {...p} strokeWidth={2.4}><path d="M12 6v12M6 12h12" /></svg>;
    case "bell": return <svg {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0" /></svg>;
    case "note": return <svg {...p}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" /><path d="M14 3v6h6M8 13h8M8 17h5" /></svg>;
    case "chart": return <svg {...p}><path d="M3 3v18h18" /><path d="M7 15v3M12 10v8M17 6v12" /></svg>;
    case "activity": return <svg {...p}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>;
    case "chevron": return <svg {...p}><path d="m7 10 5 5 5-5" /></svg>;
    case "collapse": return <svg {...p}><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9 4v16" /></svg>;
    default: return <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>;
  }
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

const iconButton = "flex size-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink";

// Top of the sidebar, like Stripe's account switcher: the cabinet and the
// signed-in broker; opens a menu with the account page and sign-out.
function AccountSwitcher({ broker, onLogout, compact }: { broker: Broker; onLogout: () => void; compact: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const title = broker.company || broker.full_name;
  return (
    <div ref={ref} className="relative px-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={compact ? `${title} — ${broker.full_name}` : undefined}
        className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-white/10"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/15 text-[13px] font-bold text-white" aria-hidden="true">
          {initials(title)}
        </span>
        {!compact && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold text-white">{title}</span>
              <span className="block truncate text-[12px] text-white/70">{broker.full_name}</span>
            </span>
            <Icon name="chevron" className="size-4 text-white/70" />
          </>
        )}
      </button>

      {open && (
        <div role="menu" className={`absolute top-full z-50 mt-1 ${compact ? "left-3 w-60" : "inset-x-3"} border border-slate-200 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]`}>
          <p className="truncate px-4 py-2 text-[12px] text-slate-500">{broker.email}</p>
          <Link role="menuitem" href="/espace-pro/compte" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-2 text-[14px] text-ink hover:bg-slate-50">
            <Icon name="user" className="size-4" /> Mon compte
          </Link>
          <button role="menuitem" type="button" onClick={onLogout} className="flex w-full items-center gap-3 px-4 py-2 text-[14px] text-ink hover:bg-slate-50">
            <Icon name="logout" className="size-4" /> Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}

// Searches the broker's leads (Mes leads reads ?q=).
function LeadSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/espace-pro/mes-leads${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
      }}
      className="relative w-full max-w-md"
    >
      <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
      <label htmlFor="pro-search" className="sr-only">Rechercher dans mes leads</label>
      <input
        id="pro-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher un lead"
        className="h-9 w-full rounded-md bg-slate-100 pl-9 pr-3 text-[14px] text-ink outline-none transition placeholder:text-slate-500 focus:bg-white focus:ring-2 focus:ring-brand/30"
      />
    </form>
  );
}

export default function ProShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [broker, setBroker] = useState<Broker | null>(null);
  const [drawer, setDrawer] = useState(false);
  // Desktop only (the phone drawer always shows labels).
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return typeof window !== "undefined" && localStorage.getItem(COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  function toggleCollapsed() {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSED_KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });
  }
  // Collapsed rail: icons only, the label as a tooltip -- on desktop. In the
  // phone drawer (below md) labels always show.
  const rail = collapsed && !drawer;

  // One trigger, as in shadcn: collapses the sidebar on desktop, opens the drawer on phones.
  function toggleSidebar() {
    if (window.matchMedia("(min-width: 768px)").matches) toggleCollapsed();
    else setDrawer(true);
  }

  // Ctrl/Cmd+B toggles it, like shadcn's sidebar (and VS Code).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "b" && (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if (!getToken()) {
      router.replace("/connexion");
      return;
    }
    // At least 1 s of splash, even when everything loads faster: a deliberate welcome, not a flicker.
    const minimum = new Promise((r) => setTimeout(r, 1000));
    Promise.all([me(), minimum])
      .then(([b]) => setBroker(b))
      .catch(() => router.replace("/connexion"));
  }, [router]);

  function logout() {
    clearToken();
    router.replace("/connexion");
  }

  // Opening the espace pro (just logged in, or a fresh visit): the brand
  // splash while the session is checked. Navigating inside the espace pro
  // keeps this shell mounted, so it only shows on the way in.
  if (!broker) return <BrandSplash />;

  // Checkout (/espace-pro/paiement/<order>, not the Paiements history): no
  // sidebar or top bar to pull the broker away from paying --
  // just the logo and a "secure payment" mark, like any shop's checkout.
  if (pathname.startsWith("/espace-pro/paiement/")) {
    return (
      <BrokerContext.Provider value={broker}><SetBrokerContext.Provider value={setBroker}>
        <div className="min-h-screen bg-slate-50">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 md:px-8">
              <Image src="/brand/ficheassur-logo.svg" alt="FicheAssur" width={134} height={40} priority unoptimized className="h-10 w-auto" />
              <span className="flex items-center gap-2 text-[13px] font-semibold text-slate-600">
                <svg viewBox="0 0 24 24" className="size-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                Paiement sécurisé
              </span>
            </div>
          </header>
          <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:px-8 md:py-10">{children}</main>
        </div>
      </SetBrokerContext.Provider></BrokerContext.Provider>
    );
  }

  const isActive = (href: string) => (href === "/espace-pro" ? pathname === href : pathname.startsWith(href));

  // Nav item: the current page on a lighter tint of the brand-blue sidebar, in white.
  const link = (item: NavItem) => {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        data-tip={rail ? item.label : undefined}
        data-tip-pos="right"
        aria-label={rail ? item.label : undefined}
        className={`flex h-9 items-center gap-3 rounded-md px-2 text-[14px] transition-colors ${rail ? "md:justify-center" : ""} ${active ? "bg-white/15 font-semibold text-white" : "text-white/85 hover:bg-white/10 hover:text-white"}`}
      >
        <Icon name={item.icon} className={`size-[18px] ${active ? "text-white" : "text-white/70"}`} />
        <span className={rail ? "md:sr-only" : ""}>{item.label}</span>
      </Link>
    );
  };
  const group = (title: string, items: NavItem[]) => (
    <div className="mt-6">
      {rail ? <hr className="mx-2 mb-2 hidden border-white/15 md:block" /> : null}
      <p className={`mb-1 px-2 text-[12px] font-medium text-white/60 ${rail ? "md:sr-only" : ""}`}>{title}</p>
      {items.map(link)}
    </div>
  );

  return (
    <BrokerContext.Provider value={broker}><SetBrokerContext.Provider value={setBroker}>
      {/* Phone drawer backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden ${drawer ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setDrawer(false)}
        aria-hidden="true"
      />

      {/* --sidebar-w: the sidebar's desktop width, for fixed bars that sit beside it (the cart's pay bar). */}
      <div className="min-h-screen bg-white md:flex" style={{ "--sidebar-w": rail ? "68px" : "256px" } as React.CSSProperties}>
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-brand bg-brand pt-3 shadow-xl transition-[transform,width] duration-300 md:sticky md:top-0 md:h-screen md:translate-x-0 md:shadow-none ${rail ? "md:w-[68px]" : "md:w-64"} ${drawer ? "translate-x-0" : "-translate-x-full"}`}
        >
          <AccountSwitcher broker={broker} onLogout={logout} compact={rail} />
          {/* Any click on a link closes the phone drawer. Visible overflow when collapsed, so tooltips aren't clipped. */}
          <nav aria-label="Espace pro" onClick={() => setDrawer(false)} className={`mt-4 flex flex-1 flex-col px-3 ${rail ? "md:overflow-visible" : "overflow-y-auto"}`}>
            {NAV.map(link)}
            {group("CRM", CRM_NAV)}
            {group("Marketplace", SHOP_NAV)}
            {broker.role === "admin" && group("Administration", ADMIN_NAV)}
          </nav>
          <Link
            href="/assistance"
            aria-label={rail ? "Assistance" : undefined}
            data-tip={rail ? "Assistance" : undefined}
            data-tip-pos="right"
            className={`flex h-12 items-center gap-3 border-t border-white/15 bg-brand-hover px-5 text-[14px] text-white hover:bg-white/10 ${rail ? "md:justify-center md:px-0" : ""}`}
          >
            <Icon name="help" className="size-[18px] text-white/70" /> <span className={rail ? "md:sr-only" : ""}>Assistance</span>
          </Link>
          {/* The edge "rail": a thin hit area along the sidebar's border that toggles it (shadcn's SidebarRail). */}
          <button
            type="button"
            onClick={toggleCollapsed}
            tabIndex={-1}
            aria-hidden="true"
            className="absolute inset-y-0 -right-2 hidden w-4 cursor-ew-resize after:absolute after:inset-y-0 after:left-1/2 after:w-px after:transition-colors hover:after:bg-slate-300 md:block"
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-2 bg-white/95 px-4 backdrop-blur md:px-8">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Afficher ou masquer le menu"
              data-tip="Menu (Ctrl+B)"
              data-tip-pos="bottom"
              className={`${iconButton} -ml-1 shrink-0`}
            >
              <Icon name="collapse" className="size-[18px]" />
            </button>
            <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" aria-hidden="true" />
            {/* Only where looking up a lead makes sense: not on pages with nothing to search, nor on
                Mes leads, which has its own search box. */}
            {(pathname === "/espace-pro" || pathname.startsWith("/espace-pro/crm/") || /^\/espace-pro\/mes-leads\/./.test(pathname)) && <LeadSearch />}
            <div className="ml-auto flex items-center gap-1">
              <Link href="/assistance" className={iconButton} data-tip="Assistance" data-tip-pos="bottom" aria-label="Assistance"><Icon name="help" /></Link>
              <Link href="/espace-pro/compte" className={iconButton} data-tip="Mon compte" data-tip-pos="bottom" aria-label="Mon compte"><Icon name="settings" /></Link>
              <Link
                href="/espace-pro/acheter"
                data-tip="Acheter des leads"
                data-tip-pos="bottom"
                data-tip-align="end"
                aria-label="Acheter des leads"
                className="ml-1 flex size-8 items-center justify-center rounded-full bg-brand text-white transition-colors hover:bg-brand-hover"
              >
                <Icon name="plus" className="size-4" />
              </Link>
            </div>
          </header>

          <main className="min-w-0 flex-1 px-4 pb-12 pt-4 md:px-8">
            <div className="mx-auto flex max-w-6xl flex-col gap-8">{children}</div>
          </main>
        </div>
      </div>
    </SetBrokerContext.Provider></BrokerContext.Provider>
  );
}
