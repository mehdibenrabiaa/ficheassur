import type { Metadata } from "next";
import { Suspense } from "react";
import AuthLayout from "@/components/AuthLayout";
import ActivateForm from "@/components/ActivateForm";

export const metadata: Metadata = {
  title: "Activer mon compte — FicheAssur",
  robots: { index: false, follow: false },
};

export default function Activer() {
  return (
    <AuthLayout>
      {/* The form reads ?token= from the URL, which needs a Suspense boundary. */}
      <Suspense fallback={null}>
        <ActivateForm />
      </Suspense>
    </AuthLayout>
  );
}
