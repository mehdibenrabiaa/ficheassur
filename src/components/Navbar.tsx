"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CONTACT } from "@/lib/contact";

// Same construction as the New World Courtage navbar: on desktop a bordered
// logo cell spanning a thin utility row and the main row, which ends in a
// full-height colour block; on mobile the logo, that same block and a
// hamburger opening a side drawer. Adapted to FicheAssur: broker-facing
// links, "Devenir partenaire" in place of NWC's "Devis gratuit", and
// "Espace pro" (the login, to /connexion) in place of "Espace client".

const MAIN_LINKS = [
  { href: "/#leads", label: "Nos leads" },
  { href: "/#qualite", label: "Qualité" },
  { href: "/#fonctionnement", label: "Fonctionnement" },
  { href: "/#faq", label: "FAQ" },
];

// Right side of the utility row, as on NWC: accessibility, contact, phone.
const UTILITY_LINKS: { href: string; label: string; icon: "eye" | "mail" | "phone" }[] = [
  { href: "/accessibilite", label: "Accessibilité", icon: "eye" },
  { href: `mailto:${CONTACT.email}`, label: "Contact", icon: "mail" },
  { href: CONTACT.phoneHref, label: CONTACT.phoneDisplay, icon: "phone" },
];

// Outline icons matching the lucide set NWC's navbar uses (Eye, Mail, Phone).
function UtilityIcon({ name }: { name: "eye" | "mail" | "phone" }) {
  const common = { viewBox: "0 0 24 24", className: "size-[15px] shrink-0", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "eye") return <svg {...common}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
  if (name === "mail") return <svg {...common}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>;
  return <svg {...common}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" /></svg>;
}

// The FicheAssur logo (marketing assets/fiche_assurance_logo.svg, copied to
// public/brand/). An SVG, so served as is rather than through the image
// optimizer; sized by height, the width follows its 4.37:1 shape.
function Logo({ className = "h-10" }: { className?: string }) {
  return (
    <Image src="/brand/ficheassur-logo.svg" alt="FicheAssur" width={175} height={40} priority unoptimized className={`${className} w-auto`} />
  );
}

// Padlock, as on NWC's "Espace client" button (lucide Lock).
function LockIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} shrink-0`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-[15px]" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path d="M10 2.5 3.5 5v5c0 4 2.8 6.6 6.5 7.5 3.7-.9 6.5-3.5 6.5-7.5V5L10 2.5Z" />
      <path d="m7.2 10 2 2 3.6-4" strokeLinecap="square" />
    </svg>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);

  // Drawer: lock page scroll while open, close on Escape.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        {/* Desktop */}
        <div className="hidden lg:flex">
          <Link href="/" className="flex shrink-0 items-center border-r border-slate-200 px-8 xl:px-12">
            <Logo />
          </Link>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex h-[34px] items-center justify-between border-b border-slate-200 px-5 text-[14px] text-ink">
              <span className="flex items-center gap-2 text-slate-600">
                <ShieldIcon /> Réservé aux courtiers immatriculés à l&apos;ORIAS
              </span>
              <div className="flex items-center gap-7">
                {UTILITY_LINKS.map((l) => (
                  <Link key={l.href} href={l.href} className="flex items-center gap-2 hover:text-brand">
                    <UtilityIcon name={l.icon} /> {l.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex h-[52px] items-stretch">
              <nav className="flex flex-1 items-center gap-0.5">
                {MAIN_LINKS.map((l) => (
                  <Link key={l.href} href={l.href} className="px-5 py-2 text-[15px] font-medium text-ink transition-colors hover:text-brand">
                    {l.label}
                  </Link>
                ))}
              </nav>
              <Link href="/#acces" className="flex items-center bg-accent px-7 text-[15px] font-bold text-white transition-colors hover:bg-accent-hover">
                Devenir partenaire
              </Link>
              <Link href="/connexion" className="flex items-center gap-2 bg-brand px-7 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover">
                <LockIcon /> Espace pro
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile */}
        <div className="flex h-16 items-stretch lg:hidden">
          <Link href="/" className="flex shrink-0 items-center border-r border-slate-200 px-4">
            <Logo className="h-8" />
          </Link>
          <div className="flex-1" />
          <Link href="/#acces" className="flex items-center bg-accent px-4 text-[14px] font-bold text-white transition-colors hover:bg-accent-hover sm:px-6">
            Partenaire
          </Link>
          <Link
            href="/connexion"
            aria-label="Espace pro"
            className="flex items-center gap-2 bg-brand px-4 text-[14px] font-bold text-white transition-colors hover:bg-brand-hover sm:px-5"
          >
            <LockIcon className="size-[17px]" />
            <span className="hidden sm:inline">Espace pro</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            className="flex w-14 items-center justify-center text-ink hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="square" />
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
        className={`fixed inset-y-0 right-0 z-50 flex w-[88%] max-w-sm flex-col bg-white shadow-xl transition-transform duration-300 lg:hidden ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex h-16 items-stretch border-b border-slate-200">
          <Link href="/" onClick={() => setOpen(false)} className="flex items-center border-r border-slate-200 px-4">
            <Logo className="h-8" />
          </Link>
          <div className="flex-1" />
          <button type="button" onClick={() => setOpen(false)} aria-label="Fermer le menu" className="flex w-14 items-center justify-center hover:bg-slate-50">
            <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="square" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto">
          {MAIN_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between border-b border-slate-200 px-5 py-4 text-[15px] font-medium text-ink hover:bg-slate-50"
            >
              {l.label}
              <span className="text-brand" aria-hidden="true">›</span>
            </Link>
          ))}
          <div className="border-b border-slate-200 bg-light">
            {UTILITY_LINKS.slice(0, 1).map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="flex items-center gap-3 px-5 py-3 text-[14px] text-ink hover:text-brand">
                <UtilityIcon name={l.icon} /> {l.label}
              </Link>
            ))}
            <p className="flex items-center gap-2 px-5 pb-4 pt-1 text-[13px] text-slate-600">
              <ShieldIcon /> Réservé aux courtiers ORIAS
            </p>
          </div>
          <div className="flex flex-col gap-3 px-5 py-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Contact</p>
            <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-3 text-[14px] text-ink hover:text-brand">
              <span className="text-brand"><UtilityIcon name="mail" /></span> {CONTACT.email}
            </a>
            <a href={CONTACT.phoneHref} className="flex items-center gap-3 text-[14px] text-ink hover:text-brand">
              <span className="text-brand"><UtilityIcon name="phone" /></span> {CONTACT.phoneDisplay}
            </a>
          </div>
        </nav>

        <div className="grid grid-cols-2">
          <Link
            href="/#acces"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center bg-accent py-4 text-[15px] font-bold text-white transition-colors hover:bg-accent-hover"
          >
            Devenir partenaire
          </Link>
          <Link
            href="/connexion"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 bg-brand py-4 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover"
          >
            <LockIcon /> Espace pro
          </Link>
        </div>
      </aside>
    </>
  );
}
