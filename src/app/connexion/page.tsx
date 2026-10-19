import type { Metadata } from "next";
import AuthLayout from "@/components/AuthLayout";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Connexion — FicheAssur",
  description: "Connexion à l'espace pro FicheAssur.",
  robots: { index: false, follow: true },
};

// Target of the navbar's "Espace pro" button -- same page as New World
// Courtage's /connexion (its own slim header, no site navbar).
export default function Connexion() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
