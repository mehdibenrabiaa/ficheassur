"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CONTACT } from "@/lib/contact";
import { clearToken, getToken, me, type Broker } from "@/lib/pro";

// The espace pro's shell, laid out like a Google pro console (Workspace,
// Ads): its own app bar -- menu button, logo, help and an
// avatar opening an account card -- over a sidebar of
// sections (a slide-in drawer on phones). Also the auth check (no valid
// session -> /connexion) and the signed-in broker, shared with every page
// through useBroker().

const BrokerContext = createContext<Broker | null>(null);
export const useBroker = () => useContext(BrokerContext) as Broker;

type NavIcon = "home" | "cart" | "list" | "user" | "inbox" | "wallet";
type NavItem = { href: string; label: string; icon: NavIcon; soon?: boolean };

const NAV: NavItem[] = [
  { href: "/espace-pro", label: "Tableau de bord", icon: "home" },
  { href: "/espace-pro/acheter", label: "Acheter des leads", icon: "cart" },
  { href: "/espace-pro/mes-leads", label: "Mes leads", icon: "list" },
  { href: "/espace-pro/paiements", label: "Paiements", icon: "wallet" },
];
const ADMIN_NAV: NavItem[] = [{ href: "/espace-pro/admin/demandes", label: "Demandes d'accès", icon: "inbox" }];

type IconName = NavIcon | "logout" | "menu" | "help";

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
    default: return <svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>;
  }
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
}

function Avatar({ broker, size = "size-9 text-[14px]" }: { broker: Broker; size?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-brand font-medium text-white ${size}`} aria-hidden="true">
      {initials(broker.full_name)}
    </span>
  );
}

// Round icon button, as in Google's app bars.
const iconButton = "flex size-10 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-ink";

// The avatar's account card: who is signed in, "Gérer mon compte", sign out.
function AccountMenu({ broker, onLogout }: { broker: Broker; onLogout: () => void }) {
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Compte FicheAssur : ${broker.full_name}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex size-10 items-center justify-center rounded-full transition-shadow hover:ring-4 hover:ring-slate-100"
      >
        <Avatar broker={broker} size="size-8 text-[13px]" />
      </button>

      {open && (
        <div role="dialog" aria-label="Votre compte" className="absolute right-0 top-12 z-50 w-[320px] rounded-[28px] bg-light p-2 shadow-[0_4px_20px_rgba(0,0,0,0.18)]">
          <p className="truncate px-4 pb-2 pt-2 text-center text-[13px] text-slate-600">{broker.email}</p>
          <div className="flex flex-col items-center gap-3 rounded-[24px] bg-white px-5 py-6">
            <Avatar broker={broker} size="size-16 text-[24px]" />
            <div className="text-center">
              <p className="text-[20px] text-ink">Bonjour {broker.full_name.split(" ")[0]} !</p>
              <p className="mt-0.5 text-[13px] text-slate-500">{broker.company}</p>
            </div>
            <Link
              href="/espace-pro/compte"
              onClick={() => setOpen(false)}
              className="rounded-full border border-slate-400 px-5 py-2 text-[14px] font-medium text-brand transition-colors hover:bg-brand/5"
            >
              Gérer mon compte
            </Link>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-[14px] font-medium text-ink transition-colors hover:bg-slate-50"
          >
            <Icon name="logout" className="size-[18px]" /> Déconnexion
          </button>
          <p className="px-4 pb-1 pt-3 text-center text-[12px] text-slate-500">
            <Link href="/accessibilite" onClick={() => setOpen(false)} className="hover:underline">Accessibilité</Link>
            {" · "}
            <a href={`mailto:${CONTACT.email}`} className="hover:underline">Contact</a>
          </p>
        </div>
      )}
    </div>
  );
}

function TopBar({ broker, onMenu, onLogout }: { broker: Broker | null; onMenu?: () => void; onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-1 border-b border-slate-200 bg-white px-2 sm:px-4">
      {onMenu && (
        <button type="button" onClick={onMenu} aria-label="Menu principal" className={`${iconButton} md:hidden`}>
          <Icon name="menu" className="size-6" />
        </button>
      )}
      <Link href="/espace-pro" className="flex items-center gap-3 pl-2 pr-3" aria-label="Espace pro FicheAssur — Tableau de bord">
        <Image src="/brand/ficheassur-logo.svg" alt="" width={140} height={32} priority unoptimized className="hidden h-7 w-auto sm:block" />
      </Link>

      <div className="ml-auto flex items-center gap-1">
        <a href={`mailto:${CONTACT.email}?subject=Aide%20espace%20pro`} className={iconButton} title="Aide" aria-label="Aide">
          <Icon name="help" />
        </a>
        {broker && <AccountMenu broker={broker} onLogout={onLogout} />}
      </div>
    </header>
  );
}

export default function ProShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [broker, setBroker] = useState<Broker | null>(null);
  const [drawer, setDrawer] = useState(false);

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
        <TopBar broker={null} onLogout={logout} />
        <main className="flex min-h-[60vh] items-center justify-center bg-light">
          <span className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-label="Chargement" />
        </main>
      </>
    );
  }

  const isActive = (href: string) => (href === "/espace-pro" ? pathname === href : pathname.startsWith(href));

  // Google-style nav item: a pill, tinted when it's the current page.
  const link = (item: NavItem) => {
    if (item.soon) {
      return (
        <span key={item.href} className="flex h-10 items-center gap-4 rounded-full px-4 text-[14px] text-slate-400">
          <Icon name={item.icon} />
          <span className="flex-1">{item.label}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">Bientôt</span>
        </span>
      );
    }
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex h-10 items-center gap-4 rounded-full px-4 text-[14px] transition-colors ${active ? "bg-brand/10 font-semibold text-brand" : "text-ink hover:bg-slate-100"}`}
      >
        <Icon name={item.icon} />
        {item.label}
      </Link>
    );
  };

  return (
    <BrokerContext.Provider value={broker}>
      <TopBar broker={broker} onMenu={() => setDrawer(true)} onLogout={logout} />

      {/* Phone drawer backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden ${drawer ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setDrawer(false)}
        aria-hidden="true"
      />

      <div className="bg-light md:flex">
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white pt-2 shadow-xl transition-transform duration-300 md:sticky md:top-16 md:z-auto md:h-[calc(100vh-4rem)] md:w-64 md:translate-x-0 md:bg-white md:pt-3 md:shadow-none ${drawer ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex h-14 items-center px-6 md:hidden">
            <Image src="/brand/ficheassur-logo.svg" alt="FicheAssur" width={120} height={28} unoptimized className="h-7 w-auto" />
          </div>
          {/* Any click on a link closes the phone drawer. */}
          <nav aria-label="Espace pro" onClick={() => setDrawer(false)} className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
            {NAV.map(link)}
            {broker.role === "admin" && (
              <>
                <p className="mb-1 mt-5 px-4 text-[12px] font-medium text-slate-500">Administration</p>
                {ADMIN_NAV.map(link)}
              </>
            )}
          </nav>
          <p className="px-7 py-4 text-[12px] text-slate-400">FicheAssur · Espace pro</p>
        </aside>

        <main className="min-h-[calc(100vh-4rem)] min-w-0 flex-1 px-4 py-8 md:px-8 md:py-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-8">{children}</div>
        </main>
      </div>
    </BrokerContext.Provider>
  );
}
