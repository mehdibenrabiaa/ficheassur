import type { Metadata } from "next";
import AssistanceCenter from "@/components/AssistanceCenter";
import Navbar from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Assistance — FicheAssur",
  description: "Aide FicheAssur : compte, achat de leads, paiements, qualité des fiches. Trouvez une réponse ou contactez notre équipe.",
};

export default function Assistance() {
  return (
    <>
      <Navbar />
      <AssistanceCenter />
      <SiteFooter />
    </>
  );
}
