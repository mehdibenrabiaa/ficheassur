import type { Metadata } from "next";
import { Google_Sans_Flex } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import TopLoader from "@/components/TopLoader";

const sans = Google_Sans_Flex({
  variable: "--font-sans-flex",
  subsets: ["latin"],
  weight: "variable",
  axes: ["slnt"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FicheAssur — Leads assurance qualifiés pour courtiers",
  description: "Achetez des leads assurance auto, moto, pro de l'automobile et véhicules pro : prospects qualifiés, consentement RGPD, réservé aux courtiers ORIAS.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${sans.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        {/* useSearchParams needs a Suspense boundary to keep pages static. */}
        <Suspense fallback={null}>
          <TopLoader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
