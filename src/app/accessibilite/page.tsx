import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteChrome";
import { CONTACT } from "@/lib/contact";

export const metadata: Metadata = {
  title: "Accessibilité — FicheAssur",
  description: "Déclaration d'accessibilité du site FicheAssur.",
};

const LAST_UPDATED = "19 octobre 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="heading text-[24px] leading-tight text-ink">{title}</h2>
      <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}

// No audit has been carried out yet, so under the RGAA the site can't
// claim any level of conformity — this states that plainly rather than
// guessing a percentage. Update once an audit exists.
export default function Accessibilite() {
  return (
    <>
      <Navbar />
      <main>
        <section className="bg-brand">
          <div className="mx-auto max-w-3xl px-5 py-14 text-white lg:py-20">
            <p className="text-[12px] font-bold uppercase tracking-[0.16em] text-white/70">Accessibilité</p>
            <h1 className="heading mt-3 text-[38px] leading-[1.05] sm:text-[48px]">
              Déclaration <em>d&apos;accessibilité.</em>
            </h1>
          </div>
        </section>

        <div className="mx-auto flex max-w-3xl flex-col gap-10 px-5 py-14">
          <p className="text-[14px] text-slate-500">Dernière mise à jour : {LAST_UPDATED}</p>

          <Section title="Notre engagement">
            <p>
              FicheAssur s&apos;engage à rendre son site accessible au plus grand nombre, conformément au référentiel général
              d&apos;amélioration de l&apos;accessibilité (RGAA).
            </p>
          </Section>

          <Section title="État de conformité">
            <div className="border-l-4 border-brand bg-light p-4 text-[14px] text-ink">
              Le site n&apos;a pas encore fait l&apos;objet d&apos;un audit de conformité. En l&apos;absence d&apos;audit, il est
              considéré comme non conforme au RGAA.
            </div>
            <p>
              Le site a toutefois été conçu avec des pratiques d&apos;accessibilité : structure de titres cohérente, navigation
              possible au clavier, champs de formulaire libellés, contrastes de couleurs lisibles et respect du réglage
              «&nbsp;réduire les animations&nbsp;» du système.
            </p>
          </Section>

          <Section title="Signaler un problème">
            <p>
              Si vous ne parvenez pas à accéder à un contenu ou à un service, contactez-nous : nous vous apporterons une
              réponse ou une alternative.
            </p>
            <ul className="flex flex-col gap-1.5 text-ink">
              <li>Email : <a href={`mailto:${CONTACT.email}`} className="text-brand underline underline-offset-2">{CONTACT.email}</a></li>
              <li>Téléphone : <a href={CONTACT.phoneHref} className="text-brand underline underline-offset-2">{CONTACT.phoneDisplay}</a></li>
            </ul>
          </Section>

          <Section title="Voies de recours">
            <p>
              Si vous n&apos;obtenez pas de réponse satisfaisante, vous pouvez saisir le Défenseur des droits, par son formulaire
              en ligne sur defenseurdesdroits.fr ou par courrier : Défenseur des droits, Libre réponse 71120, 75342 Paris CEDEX 07.
            </p>
          </Section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
