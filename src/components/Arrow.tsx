import { Fragment } from "react";

// Arrows as icons (lucide's chevron / arrow shapes), never as text
// characters like "←" or "›".
const PATHS = {
  left: "M19 12H5M12 19l-7-7 7-7",
  right: "M5 12h14M12 5l7 7-7 7",
  "chevron-left": "m15 18-6-6 6-6",
  "chevron-right": "m9 18 6-6-6-6",
} as const;

export function Arrow({ dir = "right", className = "size-4" }: { dir?: keyof typeof PATHS; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`inline-block shrink-0 ${className}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[dir]} />
    </svg>
  );
}

// History lines come from the backend as text ("Nouveau → Contacté"): show each "→" as an icon.
export function WithArrows({ text }: { text: string }) {
  const parts = text.split(/\s*→\s*/);
  if (parts.length === 1) return <>{text}</>;
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <Arrow dir="right" className="mx-1 inline size-3.5 -translate-y-px text-slate-400" />}
          {p}
          <span className="sr-only">{i < parts.length - 1 ? " vers " : ""}</span>
        </Fragment>
      ))}
    </>
  );
}
