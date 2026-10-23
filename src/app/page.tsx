import { Suspense } from "react";
import LatestEditorial from "@/components/EditorialCards";
import Navbar from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteChrome";
import FAQAccordion from "@/components/FAQAccordion";
import AccessRequestForm from "@/components/AccessRequestForm";
import { LEAD_TYPES } from "@/lib/leadTypes";

// Every one of these is something the lead pipeline actually enforces
// (see the backend's app/schemas/lead.py and app/api/v1/leads.py) — keep
// this list honest if that changes.
type QualityIconName = "shield" | "phone" | "mail" | "copy" | "bot" | "file";

// One outline icon per quality check (lucide style, as in the navbar).
function QualityIcon({ name, className }: { name: QualityIconName; className?: string }) {
  const p = { viewBox: "0 0 24 24", className, fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "shield": return <svg {...p}><path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.7 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1Z" /><path d="m9 12 2 2 4-4" /></svg>;
    case "phone": return <svg {...p}><path d="M22 16.9v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" /></svg>;
    case "mail": return <svg {...p}><path d="M22 13V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9" /><path d="m22 7-10 5.5L2 7M17 17l4 4M21 17l-4 4" /></svg>;
    case "copy": return <svg {...p}><rect x="8" y="8" width="13" height="13" rx="1.5" /><path d="M4 16a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2" /></svg>;
    case "bot": return <svg {...p}><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M12 7v4M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 16h.01M16 16h.01" /></svg>;
    default: return <svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h5" /></svg>;
  }
}

const QUALITY: { icon: QualityIconName; title: string; body: string }[] = [
  { icon: "shield", title: "Consentement RGPD explicite", body: "Chaque prospect a coché lui-même son accord pour être recontacté par un nombre limité de courtiers." },
  { icon: "phone", title: "Téléphone vérifié", body: "Numéro contrôlé et normalisé au format international : pas de numéros fantaisistes." },
  { icon: "mail", title: "Emails jetables refusés", body: "Les adresses temporaires (yopmail, mailinator…) sont bloquées dès la saisie." },
  { icon: "copy", title: "Doublons écartés", body: "Un même email ou téléphone envoyé deux fois en 24 h ne génère qu'un seul lead." },
  { icon: "bot", title: "Anti-fraude", body: "Limitation des envois par adresse IP pour écarter les robots et les envois en masse." },
  { icon: "file", title: "Fiche détaillée", body: "Besoin, localisation et réponses de qualification : vous savez qui appeler et pourquoi." },
];

// Same cards as New World Courtage's "Nous rendons le processus simple"
// (its OurProcess / InfoCardsSection style2 with step numbers). Photos in
// public/steps/, from NWC's library for now.
const STEPS = [
  {
    image: "/steps/choix.webp",
    imageAlt: "Une courtière choisit ses leads sur son ordinateur",
    title: "Choisissez vos leads",
    body: "Le marché (auto, moto, pro de l'automobile, véhicules pro), la zone et la quantité, sans abonnement. Optez pour l'exclusivité : le lead n'est vendu qu'à vous.",
  },
  {
    image: "/steps/paiement.webp",
    imageAlt: "Un couple règle un achat depuis un téléphone",
    title: "Payez au lead",
    body: "Un prix par lead, rien d'autre : vous ne payez que les fiches que vous recevez.",
  },
  {
    image: "/steps/appel.webp",
    imageAlt: "Une courtière rappelle un prospect au téléphone",
    title: "Appelez et signez",
    body: "Le prospect vient de demander un devis et attend votre appel : rappelez-le et signez comme vous le faites d'habitude.",
  },
]

const FAQ = [
  { q: "Qui peut acheter des leads ?", a: "Uniquement les courtiers et intermédiaires en assurance immatriculés à l'ORIAS. Chaque demande d'accès est vérifiée avant ouverture du compte." },
  { q: "D'où viennent les leads ?", a: "De particuliers et professionnels qui ont demandé eux-mêmes des devis en ligne, et accepté d'être recontactés." },
  { q: "Un lead est-il vendu à plusieurs courtiers ?", a: "Un prospect accepte d'être contacté par un nombre limité de partenaires, indiqué clairement avant l'envoi de sa demande." },
  { q: "Et si une fiche est inexploitable ?", a: "Contactez-nous : les leads non conformes (coordonnées erronées, doublon) sont examinés au cas par cas." },
];

function Check({ className = "text-accent" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={`size-5 shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path d="M4 10.5l4 4 8-9" strokeLinecap="square" />
    </svg>
  );
}

function Eyebrow({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return <p className={`inline-block px-3 py-1 text-[12px] font-bold uppercase tracking-[0.16em] ${light ? "bg-white text-brand" : "bg-brand text-white"}`}>{children}</p>;
}

// Card photos, in public/leads/ (taken from New World Courtage's library
// for now) -- replace a file under the same name to change a photo.
const LEAD_IMAGES: Record<string, string> = {
  AUTO: "/leads/auto.webp",
  MOTO: "/leads/moto.webp",
  AUTO_PRO: "/leads/pro-auto.webp",
  COMMERCIAL_AUTO: "/leads/vehicules-pro.webp",
};

// One outline icon per lead market (same stroke style as the lucide set
// the navbar uses): car (Auto and Véhicules pro -- taxis and VTC), motorbike, wrench.
function LeadIcon({ type }: { type: string }) {
  const p = { viewBox: "0 0 24 24", className: "size-6", fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (type === "AUTO" || type === "COMMERCIAL_AUTO") return <svg {...p}><path d="M5 17h14M3 13l2-5.5A2 2 0 0 1 6.9 6h10.2a2 2 0 0 1 1.9 1.5L21 13v4h-2" /><path d="M3 13v4h2" /><circle cx="7.5" cy="17" r="1.8" /><circle cx="16.5" cy="17" r="1.8" /><path d="M3 13h18" /></svg>;
  if (type === "MOTO") return <svg {...p}><circle cx="5.5" cy="16.5" r="3" /><circle cx="18.5" cy="16.5" r="3" /><path d="M5.5 16.5 9 10h5l3 6.5M14 10l2-3h2.5M9 10 7.5 7H5" /></svg>;
  if (type === "AUTO_PRO") return <svg {...p}><path d="M14.7 6.3a4 4 0 0 0-5.3 5.3L3 18l3 3 6.4-6.4a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6Z" /></svg>;
  return <svg {...p}><path d="M2 6h11v10H2zM13 9h4.5l3.5 3.5V16h-8" /><circle cx="6" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></svg>;
}

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero, built like New World Courtage's (its PhotoHero): desktop, a
            full-width photo with a blue gradient behind the text; mobile, the
            photo on top fading into a blue panel. Photo: public/heroes/
            home-desktop.webp / home-mobile.webp -- replace both files (same
            names) with FicheAssur's own when available. */}
        <section className="relative w-full lg:min-h-[min(640px,calc(100svh-87px))] lg:overflow-hidden">
          <div className="relative h-[260px] sm:h-[340px] lg:absolute lg:inset-0 lg:h-full">
            <picture>
              <source media="(max-width: 1023px)" srcSet="/heroes/home-mobile.webp" />
              <img
                src="/heroes/home-desktop.webp"
                alt="Un bureau de courtage en assurance"
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </picture>
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-brand to-transparent lg:inset-0 lg:h-auto lg:bg-gradient-to-r lg:from-brand/95 lg:via-brand/70 lg:to-brand/10"
            />
          </div>

          <div className="relative bg-brand lg:flex lg:min-h-[min(640px,calc(100svh-87px))] lg:items-center lg:bg-transparent">
            <div className="w-full px-5 pb-12 pt-4 sm:px-8 lg:px-12 lg:py-16 2xl:px-24">
              <div className="text-white lg:w-4/5">
                <h1 className="heading mt-4 text-[48px] leading-[1] sm:text-[58px] md:text-[64px] lg:text-[72px] xl:text-[78px] 2xl:text-[94px]">
                  Des leads assurance <em className="whitespace-nowrap">prêts à signer.</em>
                </h1>
                <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-white/85 lg:mt-5 lg:text-[17px]">
                  Des prospects qui viennent de demander un devis, qualifiés et consentants. Vous n&apos;avez plus qu&apos;à les rappeler.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a href="#acces" className="inline-flex h-12 items-center justify-center gap-1 border-2 border-white px-7 text-[15px] font-bold text-white transition-colors hover:bg-white hover:text-brand">
                    Devenir partenaire
                    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                  </a>
                  <a href="#leads" className="inline-flex h-12 items-center justify-center bg-accent px-7 text-[15px] font-bold text-white transition-colors hover:bg-accent-hover">
                    Voir les types de leads
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="leads" className="scroll-mt-16 lg:scroll-mt-[87px] w-full py-4">
          <div className="px-5 lg:px-12 2xl:px-24">
          <div className="bg-light px-4 py-10 sm:px-8 lg:px-14 lg:py-14">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <Eyebrow>Nos leads</Eyebrow>
              <h2 className="heading mt-3 text-[30px] leading-[1.1] sm:text-[38px]">
                Quatre marchés, <em>des prospects qualifiés.</em>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-slate-600">
                Choisissez les marchés que vous travaillez : chaque lead vient d&apos;une demande de devis récente, avec le besoin et le profil du prospect.
              </p>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {LEAD_TYPES.map((t) => (
                <div key={t.value} className="flex flex-col bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
                  <div className="h-1.5 bg-brand" aria-hidden="true" />
                  <div className="relative h-44">
                    <img src={LEAD_IMAGES[t.value]} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    <span className="absolute bottom-0 left-6 flex size-11 translate-y-1/2 items-center justify-center bg-brand text-white shadow-md">
                      <LeadIcon type={t.value} />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-6 pt-9">
                    <h3 className="heading text-[22px]">{t.label}</h3>
                    <p className="flex-1 text-[15px] leading-relaxed text-slate-600">{t.body}</p>
                    {/* Pinned to the card's bottom so the four links line up. */}
                    <a href={t.href} aria-label={`Voir les leads ${t.label}`} className="group mt-3 inline-flex w-fit items-center gap-1 text-[15px] font-bold text-brand">
                      <span className="group-hover:underline">Voir les leads</span>
                      <svg viewBox="0 0 24 24" className="size-[18px] shrink-0 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
          </div>
        </section>

        {/* Qualité, as a "bento": a photo (public/sections/qualite-desktop.webp, 780 x 980, and qualite-mobile.webp, 780 x 640) and
            the six checks as tiles, the first one in brand blue. */}
        <section id="qualite" className="scroll-mt-16 lg:scroll-mt-[87px] bg-white w-full py-4">
          <div className="px-5 lg:px-12 2xl:px-24">
          <div className="bg-light px-4 py-10 sm:px-8 lg:px-14 lg:py-14">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <Eyebrow>Qualité</Eyebrow>
              <h2 className="heading mx-auto mt-3 max-w-2xl text-[30px] leading-[1.1] sm:text-[38px]">
                Chaque fiche est contrôlée <em>avant de vous parvenir.</em>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-slate-600">
                Coordonnées vérifiées, doublons écartés, consentement enregistré : vous ne payez que pour des prospects joignables et réellement intéressés.
              </p>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-4 md:grid-rows-[repeat(3,minmax(150px,auto))]">
              <div className="relative min-h-[320px] overflow-hidden md:col-span-2 md:row-span-3 md:min-h-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <picture>
                  {/* Phones/tablets (stacked layout): a near-square crop; desktop: the tall tile. */}
                  <source media="(max-width: 767px)" srcSet="/sections/qualite-mobile.webp" />
                  <img src="/sections/qualite-desktop.webp" alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                </picture>
              </div>
              {QUALITY.map((q, i) => (
                <div key={q.title} className={`flex flex-col gap-3 p-6 ${i === 0 ? "bg-brand text-white" : "bg-white text-ink"}`}>
                  <QualityIcon name={q.icon} className={`size-7 ${i === 0 ? "text-white" : "text-brand"}`} />
                  <h3 className="text-[16px] font-semibold">{q.title}</h3>
                  <p className={`text-[14px] leading-relaxed ${i === 0 ? "text-white/80" : "text-slate-600"}`}>{q.body}</p>
                </div>
              ))}
            </div>
          </div>
          </div>
          </div>
        </section>

        <section id="fonctionnement" className="scroll-mt-16 lg:scroll-mt-[87px] w-full py-4">
          <div className="px-5 lg:px-12 2xl:px-24">
            <div className="overflow-hidden bg-light px-4 py-10 sm:px-8 lg:px-14 lg:py-14">
              <div className="mx-auto mb-12 flex max-w-3xl flex-col gap-3 text-center">
                <h2 className="heading text-[30px] leading-[1.15] sm:text-[38px]">
                  Trois étapes, <em>sans abonnement.</em>
                </h2>
                <p className="text-[16px] text-slate-600">
                  Vous choisissez vos leads et leur nombre, vous payez à la fiche, et vous rappelez des prospects qui
                  viennent de demander un devis.
                </p>
              </div>
              <ol className="mx-auto grid w-full max-w-[1140px] grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {STEPS.map((step, i) => (
                  <li key={step.title} className="flex h-full flex-col bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.14)] transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.14)]">
                    <div className="relative h-52 shrink-0 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={step.image} alt={step.imageAlt} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col gap-3 px-4 pb-3 pt-6">
                      <span className="flex size-8 items-center justify-center bg-brand text-sm font-bold text-white">{i + 1}</span>
                      <h3 className="heading text-[22px] leading-[1.2] text-ink lg:text-[24px]">{step.title}</h3>
                      <p className="flex-1 text-[15px] leading-relaxed text-slate-700">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="mt-10 flex justify-center">
                <a href="/inscription" className="inline-flex h-12 items-center gap-0.5 bg-brand px-6 text-[15px] font-bold text-white transition-colors hover:bg-brand-hover">
                  Devenir partenaire
                  <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="acces" className="scroll-mt-16 lg:scroll-mt-[87px] w-full py-4">
          <div className="px-5 lg:px-12 2xl:px-24">
          <div className="bg-light px-4 py-10 sm:px-8 lg:px-14 lg:py-14">
          <div className="mx-auto flex max-w-3xl flex-col gap-10">
            <div className="text-center">
              <Eyebrow>Demande d&apos;accès</Eyebrow>
              <h2 className="heading mt-3 text-[30px] leading-[1.1] sm:text-[38px]">
                Recevez vos premiers <em>leads.</em>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-slate-600">
                Laissez-nous vos coordonnées : nous vérifions votre immatriculation ORIAS et vous rappelons pour définir
                vos critères et votre volume.
              </p>
            </div>
            <div className="bg-white">
              <div className="h-1.5 bg-brand" aria-hidden="true" />
              <div className="p-6 sm:p-8">
                <AccessRequestForm />
              </div>
            </div>
          </div>
          </div>
          </div>
        </section>
        <section id="faq" className="scroll-mt-16 lg:scroll-mt-[87px] w-full py-4">
          <div className="px-5 lg:px-12 2xl:px-24">
          <div className="bg-white px-4 py-10 sm:px-8 lg:px-14 lg:py-14">
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <Eyebrow>FAQ</Eyebrow>
              <h2 className="heading mt-3 text-[30px] leading-[1.1] sm:text-[38px]">Questions fréquentes</h2>
              <p className="mx-auto mt-4 max-w-2xl text-[16px] leading-relaxed text-slate-600">
                Tout ce qu&apos;il faut savoir avant de devenir partenaire : origine des leads, tarifs, exclusivité et fonctionnement.
              </p>
            </div>
            <FAQAccordion items={FAQ} />
          </div>
          </div>
          </div>
        </section>

        <Suspense fallback={null}><LatestEditorial /></Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
