import LeadFunnelWizard from "@/components/forms/LeadFunnelWizard";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center px-4">
          <span className="text-xl font-bold tracking-tight">Fiche<span className="text-blue-600">Assur</span></span>
        </div>
      </header>
      <section className="flex-1 px-4 py-10 sm:py-16">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Comparez vos devis d&apos;assurance</h1>
          <p className="mt-3 text-slate-600">Gratuit, sans engagement, en 2 minutes.</p>
        </div>
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <LeadFunnelWizard />
        </div>
      </section>
    </main>
  );
}
