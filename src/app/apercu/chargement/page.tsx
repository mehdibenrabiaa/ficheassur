import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BrandSplash from "@/components/BrandSplash";

export const metadata: Metadata = { title: "Aperçu — chargement", robots: { index: false, follow: false } };

// Design preview: the espace pro's loading screen, shown without end so it
// can be looked at. Development only -- a 404 on the live site.
export default function ApercuChargement() {
  if (process.env.NODE_ENV === "production") notFound();
  return <BrandSplash />;
}
