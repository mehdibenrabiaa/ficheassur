import Link from "next/link";

const NAV = [
  { href: "/#leads", label: "Nos leads" },
  { href: "/#qualite", label: "Qualité" },
  { href: "/#fonctionnement", label: "Fonctionnement" },
  { href: "/#faq", label: "FAQ" },
];

// White bar with a bordered logo cell and a full-height accent block on the
// right — the same construction as the New World Courtage navbar.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 h-16 w-full border-b border-slate-200 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="flex h-full items-stretch">
        <Link href="/" className="flex shrink-0 items-center border-r border-slate-200 px-5 lg:px-12">
          <span className="heading text-[22px] text-ink">
            Fiche<span className="text-brand">Assur</span>
          </span>
        </Link>
        <nav className="hidden flex-1 items-center gap-1 px-4 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="px-4 py-2 text-[15px] font-medium text-ink hover:text-brand">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex-1 lg:hidden" />
        <Link
          href="/#acces"
          className="flex items-center bg-brand px-5 text-[14px] font-bold text-white transition-colors hover:bg-brand-hover sm:px-8"
        >
          Demander un accès
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-[#111111] text-white/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 text-[13px] sm:flex-row sm:items-center sm:justify-between lg:px-12">
        <span className="heading text-[18px] text-white">
          Fiche<span className="text-accent">Assur</span>
        </span>
        <p>Leads assurance qualifiés, réservés aux courtiers immatriculés à l&apos;ORIAS.</p>
      </div>
    </footer>
  );
}
