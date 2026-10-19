import type { Metadata } from "next";
import ProShell from "@/components/ProShell";

export const metadata: Metadata = {
  title: "Espace pro — FicheAssur",
  robots: { index: false, follow: false },
};

export default function EspaceProLayout({ children }: { children: React.ReactNode }) {
  return <ProShell>{children}</ProShell>;
}
