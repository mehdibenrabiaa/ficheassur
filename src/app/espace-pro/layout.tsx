import type { Metadata } from "next";
import ProShell from "@/components/ProShell";

export const metadata: Metadata = {
  title: "Espace pro — FicheAssur",
  robots: { index: false, follow: false },
};

// ProShell checks the session in the browser and shows a spinner until it
// knows who is signed in, so the pages below never render during Next's
// instant-navigation validation. That's by design for this login-gated area:
// opt it out of the check rather than have it flag every espace pro page.
export const instant = false;

export default function EspaceProLayout({ children }: { children: React.ReactNode }) {
  return <ProShell>{children}</ProShell>;
}
