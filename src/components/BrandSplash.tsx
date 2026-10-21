// Full-screen loading screen with the FicheAssur logo, shown while the
// espace pro opens (right after logging in, or on a fresh visit): the logo
// as is and still, a soft light passing over it, and a thin bar running
// underneath to show something is loading. Animations are in globals.css
// (.splash-*); with "reduce motion" everything stays still.
export default function BrandSplash({ label = "Ouverture de votre espace pro…" }: { label?: string }) {
  return (
    <div className="splash fixed inset-0 z-[90] flex flex-col items-center justify-center gap-7 bg-white" role="status" aria-live="polite">
      <div className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/ficheassur-logo.svg" alt="FicheAssur" className="h-12 w-auto" />
        <span className="splash-shine pointer-events-none absolute inset-0" aria-hidden="true" />
      </div>
      <div className="h-[3px] w-44 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
        <span className="splash-bar block h-full w-1/3 rounded-full bg-gradient-to-r from-accent to-brand" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
