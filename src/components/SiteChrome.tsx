import Image from "next/image";
import Link from "next/link";
import { CONTACT } from "@/lib/contact";
import { LEAD_TYPES } from "@/lib/leadTypes";
import CurrentYear from "@/components/CurrentYear";

// Built like New World Courtage's footer (its components/Footer.js): a brand
// blue block with the white logo, link columns and contact, then legal links
// and notices. Only links to pages that exist -- add the legal pages
// (mentions légales, confidentialité, CGV) here once they're written.

const SITE_LINKS = [
  { label: "Qualité des leads", href: "/#qualite" },
  { label: "Fonctionnement", href: "/#fonctionnement" },
  { label: "Questions fréquentes", href: "/#faq" },
  { label: "Assistance", href: "/assistance" },
  { label: "Devenir partenaire", href: "/inscription" },
  { label: "Espace pro", href: "/connexion" },
];

const LEGAL_LINKS = [{ label: "Accessibilité", href: "/accessibilite" }];

function MailIcon() {
  return <svg viewBox="0 0 24 24" className="size-[15px] shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>;
}

function PhoneIcon() {
  return <svg viewBox="0 0 24 24" className="size-[15px] shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" /></svg>;
}

function Column({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-[160px] flex-col gap-3">
      <h3 className="text-[15px] font-bold text-white">{heading}</h3>
      {children}
    </div>
  );
}

const linkClass = "text-[15px] text-white/75 transition-colors hover:text-white";

export function SiteFooter() {
  return (
    <footer className="w-full bg-brand">
      <div className="px-5 py-14 sm:px-6 lg:px-12 2xl:px-24">
        <div className="flex flex-col gap-10 border-b border-white/20 pb-12 md:flex-row md:gap-12 lg:gap-16">
          <div className="shrink-0">
            <Link href="/" aria-label="FicheAssur — Accueil">
              <Image src="/brand/ficheassur-logo-white.svg" alt="FicheAssur" width={161} height={48} unoptimized loading="eager" className="h-12 w-auto" />
            </Link>
            <p className="mt-4 max-w-[240px] text-[14px] leading-relaxed text-white/75">
              Leads assurance qualifiés, réservés aux courtiers immatriculés à l&apos;ORIAS.
            </p>
          </div>

          <div className="flex flex-col gap-8 sm:flex-row sm:gap-6 lg:gap-16">
            <Column heading="Nos marchés">
              <ul className="flex flex-col gap-2.5">
                {LEAD_TYPES.map((t) => (
                  <li key={t.value}><a href={t.href} className={linkClass}>Leads {t.label}</a></li>
                ))}
              </ul>
            </Column>

            <Column heading="FicheAssur">
              <ul className="flex flex-col gap-2.5">
                {SITE_LINKS.map((l) => (
                  <li key={l.href}><Link href={l.href} className={linkClass}>{l.label}</Link></li>
                ))}
              </ul>
            </Column>

            <Column heading="Contact">
              <ul className="flex flex-col gap-3.5">
                <li>
                  <a href={`mailto:${CONTACT.email}`} className={`flex items-center gap-2.5 break-all ${linkClass}`}>
                    <MailIcon /> {CONTACT.email}
                  </a>
                </li>
                <li>
                  <a href={CONTACT.phoneHref} className={`flex items-center gap-2.5 ${linkClass}`}>
                    <PhoneIcon /> {CONTACT.phoneDisplay}
                  </a>
                </li>
              </ul>
            </Column>
          </div>
        </div>

        <div className="flex flex-col gap-5 pt-10">
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-[14px] text-white/75 transition-colors hover:text-white">{l.label}</Link>
            ))}
          </div>
          <p className="max-w-4xl text-[13px] leading-relaxed text-white/75">
            FicheAssur met en relation des courtiers et intermédiaires en assurance immatriculés à l&apos;ORIAS avec des
            particuliers et professionnels ayant demandé à être recontactés. Chaque lead est collecté avec le consentement
            explicite du prospect, conformément au RGPD.
          </p>
          <p className="max-w-4xl text-[13px] leading-relaxed text-white/75">
            <strong>Mention :</strong> les images présentes sur ce site peuvent être générées par intelligence artificielle.
            Toute ressemblance avec des personnes réelles, vivantes ou décédées, serait purement fortuite.
          </p>
          <p className="text-[13px] text-white/75">© <CurrentYear /> FicheAssur. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
