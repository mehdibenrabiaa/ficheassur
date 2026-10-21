"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Shared shell for the account pages (connexion, inscription) -- same design
// as New World Courtage's (its components/AuthLayout.js): a slim header, the
// form column on the left and a welcome photo with rotating security tips on
// the right (hidden on small screens).

type TipIcon = "mail" | "phone" | "shield";

const SECURITY_TIPS: { icon: TipIcon; title: string; text: string }[] = [
  {
    icon: "mail",
    title: "Méfiez-vous des emails inattendus.",
    text: "FicheAssur ne vous demandera jamais votre mot de passe par email, SMS ou téléphone.",
  },
  {
    icon: "phone",
    title: "Des leads proposés hors de votre espace ?",
    text: "Nous ne vendons des leads que depuis votre espace pro. En cas de doute, appelez-nous au 07 45 89 18 65.",
  },
  {
    icon: "shield",
    title: "Vérifiez toujours l'adresse du site.",
    text: "Connectez-vous uniquement depuis ficheassur.fr et ne cliquez pas sur les liens d'un message douteux.",
  },
];

const TIP_INTERVAL_MS = 7000;

// Outline icons in the lucide style NWC uses (MailWarning, PhoneOff, ShieldAlert).
function Icon({ name, className = "size-5" }: { name: TipIcon | "help" | "close"; className?: string }) {
  const p = { viewBox: "0 0 24 24", className, fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "mail") return <svg {...p}><path d="M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12.5" /><path d="m22 7-10 5.5L2 7M20 14v4M20 22h.01" /></svg>;
  if (name === "phone") return <svg {...p}><path d="M10.7 13.3a16 16 0 0 0 3.4 2.6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 4.2 4.2 2 2 0 0 1 6.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.4 2.1L10.1 9.8M22 2 2 22" /></svg>;
  if (name === "shield") return <svg {...p}><path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.7 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1ZM12 8v4M12 16h.01" /></svg>;
  if (name === "help") return <svg {...p}><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" /></svg>;
  return <svg {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>;
}

function SecurityTips() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setActive((i) => (i + 1) % SECURITY_TIPS.length), TIP_INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div
      className="absolute inset-x-0 bottom-0 pb-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="overflow-hidden" aria-roledescription="carrousel" aria-label="Conseils de sécurité">
        {/* Each tip is 60% of the width and centered, so the neighbours peek in at the sides. */}
        <ul
          className="flex transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(calc(20% - ${active} * 60% - ${active} * 16px))` }}
        >
          {SECURITY_TIPS.map(({ icon, title, text }, index) => (
            <li key={title} aria-hidden={index !== active} className="mr-4 flex w-[60%] shrink-0 gap-4 bg-white p-5 text-ink shadow-sm">
              <span className="flex size-10 shrink-0 items-center justify-center bg-brand/10 text-brand">
                <Icon name={icon} />
              </span>
              <div>
                <p className="text-[14px] font-bold leading-snug">{title}</p>
                <p className="mt-1 text-[13px] leading-snug text-slate-600">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-5 flex justify-center gap-2">
        {SECURITY_TIPS.map(({ title }, index) => (
          <button
            key={title}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Conseil ${index + 1}`}
            aria-current={index === active}
            className={`h-2.5 rounded-full border border-white transition-all duration-300 ${index === active ? "w-8 bg-white" : "w-2.5 bg-transparent"}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4 lg:px-6">
        <Link href="/" className="shrink-0">
          <Image src="/brand/ficheassur-logo.svg" alt="FicheAssur" width={140} height={32} priority unoptimized className="h-8 w-auto" />
        </Link>
        <nav className="flex items-stretch text-[15px] text-ink">
          <a href="mailto:contact@newworldcourtage.com" className="flex items-center gap-2 px-3 hover:text-brand lg:px-4">
            <Icon name="help" className="size-[22px]" />
            <span className="hidden sm:inline">Assistance</span>
            <span className="sr-only sm:hidden">Assistance</span>
          </a>
          <span className="my-1 w-px bg-slate-300" aria-hidden="true" />
          <Link href="/" className="flex items-center gap-2 px-3 hover:text-brand lg:px-4">
            <Icon name="close" className="size-[22px]" />
            <span className="hidden sm:inline">Quitter</span>
            <span className="sr-only sm:hidden">Quitter</span>
          </Link>
        </nav>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row">
        <main className="flex w-full flex-col px-6 py-8 sm:px-10 lg:w-[440px] lg:shrink-0 lg:px-7">{children}</main>

        <aside className="relative hidden flex-1 overflow-hidden lg:block" aria-label="Bienvenue">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/heroes/connexion.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/25 to-transparent" aria-hidden="true" />
          <p className="relative pt-10 text-center text-[20px] font-medium uppercase tracking-wide text-white">Bienvenue</p>
          <SecurityTips />
        </aside>
      </div>
    </div>
  );
}

// Form field styles shared by the account pages: grey fill, bottom border only.
export const authInputClass =
  "h-14 w-full rounded-none border-0 border-b border-slate-500 bg-porcelain px-3 text-[16px] text-ink placeholder:text-slate-500 outline-none focus-visible:border-b-2 focus-visible:border-brand";

export function AuthSubmit({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="h-12 w-full bg-brand text-[15px] font-bold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-[#eeeeee] disabled:text-slate-400"
    >
      {children}
    </button>
  );
}

export function PasswordToggleIcon({ shown }: { shown: boolean }) {
  const p = { viewBox: "0 0 24 24", className: "size-[18px]", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  return shown
    ? <svg {...p}><path d="M10.7 5.1A10 10 0 0 1 22 12a13 13 0 0 1-1.7 2.7M6.6 6.6A13.5 13.5 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6M2 2l20 20M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
    : <svg {...p}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>;
}
