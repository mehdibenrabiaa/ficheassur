import Navbar from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteChrome";
import AccessRequestForm from "@/components/AccessRequestForm";
import { LEAD_TYPES } from "@/lib/leadTypes";

// Every one of these is something the lead pipeline actually enforces
// (see the backend's app/schemas/lead.py and app/api/v1/leads.py) — keep
// this list honest if that changes.
const QUALITY = [
  { title: "Consentement RGPD explicite", body: "Chaque prospect a coché lui-même son accord pour être recontacté par un nombre limité de courtiers." },
  { title: "Téléphone vérifié", body: "Numéro contrôlé et normalisé au format international : pas de numéros fantaisistes." },
  { title: "Emails jetables refusés", body: "Les adresses temporaires (yopmail, mailinator…) sont bloquées dès la saisie." },
  { title: "Doublons écartés", body: "Un même email ou téléphone envoyé deux fois en 24 h ne génère qu'un seul lead." },
  { title: "Anti-fraude", body: "Limitation des envois par adresse IP pour écarter les robots et les envois en masse." },
  { title: "Fiche détaillée", body: "Besoin, localisation et réponses de qualification : vous savez qui appeler et pourquoi." },
];

const STEPS = [
  { title: "Définissez vos critères", body: "Types d'assurance, départements ciblés et volume souhaité." },
  { title: "Recevez les leads", body: "Les fiches correspondant à vos critères vous sont transmises au fil de l'eau." },
  { title: "Rappelez vite, signez plus", body: "Un prospect qui vient de faire sa demande est un prospect qui attend votre appel." },
];

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
  return <p className={`text-[12px] font-bold uppercase tracking-[0.16em] ${light ? "text-white/70" : "text-brand"}`}>{children}</p>;
}

// What a buyer actually receives — an illustration, with the contact
// details masked as they would be before purchase.
function SampleLead() {
  const rows: [string, string][] = [
    ["Besoin", "Assurance auto"],
    ["Localisation", "75011 · Paris"],
    ["Conducteur", "26 – 40 ans"],
    ["Sinistres (3 ans)", "Aucun"],
    ["Actuellement assuré", "Oui"],
    ["Téléphone", "+33 6 •• •• •• 78"],
  ];
  return (
    <div className="bg-white text-ink shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
      <div className="h-1.5 bg-accent" aria-hidden="true" />
      <div className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-bold uppercase tracking-[0.16em] text-brand">Nouveau lead</span>
          <span className="flex items-center gap-1.5 text-[12px] font-medium text-[#27ae7a]">
            <span className="size-2 rounded-full bg-[#27ae7a]" aria-hidden="true" /> il y a 2 min
          </span>
        </div>
        <dl className="mt-5 divide-y divide-slate-100">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5 text-[14px]">
              <dt className="text-slate-500">{k}</dt>
              <dd className="font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex items-center gap-2 bg-light px-3 py-2.5 text-[13px] font-medium">
          <Check className="text-[#27ae7a]" /> Consentement RGPD recueilli
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <section className="bg-brand">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-5 py-14 lg:grid-cols-[1fr_400px] lg:gap-16 lg:px-12 lg:py-24">
            <div className="text-white">
              <Eyebrow light>Réservé aux courtiers en assurance</Eyebrow>
              <h1 className="heading mt-4 text-[40px] leading-[1.05] sm:text-[54px] lg:text-[62px]">
                Des leads assurance <em>prêts à signer.</em>
              </h1>
              <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-white/80">
                Des particuliers et professionnels qui viennent de demander un devis, avec leur consentement, leur besoin
                et leurs réponses de qualification. Vous n&apos;avez plus qu&apos;à les rappeler.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#acces" className="inline-flex h-12 items-center justify-center bg-white px-7 text-[15px] font-bold text-brand transition-colors hover:bg-white/90">
                  Demander un accès
                </a>
                <a href="#leads" className="inline-flex h-12 items-center justify-center border border-white/60 px-7 text-[15px] font-bold text-white transition-colors hover:bg-white/10">
                  Voir les types de leads
                </a>
              </div>
            </div>
            <SampleLead />
          </div>
        </section>

        <section id="leads" className="scroll-mt-16 lg:scroll-mt-[87px]">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:px-12 lg:py-20">
            <Eyebrow>Nos leads</Eyebrow>
            <h2 className="heading mt-3 text-[30px] leading-[1.1] sm:text-[38px]">
              Quatre marchés, <em>des prospects qualifiés.</em>
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {LEAD_TYPES.map((t) => (
                <div key={t.value} className="bg-light">
                  <div className="h-1.5 bg-brand" aria-hidden="true" />
                  <div className="flex flex-col gap-3 p-6">
                    <h3 className="heading text-[22px]">{t.label}</h3>
                    <p className="text-[15px] leading-relaxed text-slate-600">{t.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="qualite" className="scroll-mt-16 lg:scroll-mt-[87px] bg-light">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:px-12 lg:py-20">
            <Eyebrow>Qualité</Eyebrow>
            <h2 className="heading mt-3 max-w-2xl text-[30px] leading-[1.1] sm:text-[38px]">
              Chaque fiche est contrôlée <em>avant de vous parvenir.</em>
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-px bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
              {QUALITY.map((q) => (
                <div key={q.title} className="flex flex-col gap-3 bg-white p-6">
                  <Check className="text-brand" />
                  <h3 className="text-[16px] font-semibold">{q.title}</h3>
                  <p className="text-[15px] leading-relaxed text-slate-600">{q.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="fonctionnement" className="scroll-mt-16 lg:scroll-mt-[87px]">
          <div className="mx-auto max-w-6xl px-5 py-16 lg:px-12 lg:py-20">
            <Eyebrow>Fonctionnement</Eyebrow>
            <h2 className="heading mt-3 text-[30px] leading-[1.1] sm:text-[38px]">
              Trois étapes, <em>sans engagement.</em>
            </h2>
            <ol className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex flex-col gap-3 border border-slate-200 p-6">
                  <span className="flex size-9 items-center justify-center bg-brand text-sm font-bold text-white">{i + 1}</span>
                  <h3 className="text-[17px] font-semibold">{s.title}</h3>
                  <p className="text-[15px] leading-relaxed text-slate-600">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="faq" className="scroll-mt-16 lg:scroll-mt-[87px] bg-light">
          <div className="mx-auto max-w-3xl px-5 py-16 lg:py-20">
            <Eyebrow>FAQ</Eyebrow>
            <h2 className="heading mt-3 text-[30px] leading-[1.1] sm:text-[38px]">Questions fréquentes</h2>
            <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200 bg-white">
              {FAQ.map((f) => (
                <details key={f.q} className="group px-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[16px] font-semibold">
                    {f.q}
                    <span className="text-[22px] font-normal text-brand transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                  </summary>
                  <p className="pb-5 text-[15px] leading-relaxed text-slate-600">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="acces" className="scroll-mt-16 lg:scroll-mt-[87px]">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-16 lg:grid-cols-[1fr_1.4fr] lg:gap-16 lg:px-12 lg:py-20">
            <div>
              <Eyebrow>Demande d&apos;accès</Eyebrow>
              <h2 className="heading mt-3 text-[30px] leading-[1.1] sm:text-[38px]">
                Recevez vos premiers <em>leads.</em>
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-slate-600">
                Laissez-nous vos coordonnées : nous vérifions votre immatriculation ORIAS et vous rappelons pour définir
                vos critères et votre volume.
              </p>
            </div>
            <div className="border border-slate-200">
              <div className="h-1.5 bg-brand" aria-hidden="true" />
              <div className="p-6 sm:p-8">
                <AccessRequestForm />
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
