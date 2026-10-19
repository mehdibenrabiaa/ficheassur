import type { Metadata } from "next";
import AuthLayout from "@/components/AuthLayout";
import SignupForm from "@/components/SignupForm";

export const metadata: Metadata = {
  title: "Créer un compte — FicheAssur",
  description: "Créez votre compte courtier FicheAssur.",
  robots: { index: false, follow: true },
};

export default function Inscription() {
  return (
    <AuthLayout>
      <SignupForm />
    </AuthLayout>
  );
}
