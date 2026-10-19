import Link from "next/link";

export const metadata = { title: "Demande envoyée — FicheAssur" };

const NEXT_STEPS = [
  "Nous transmettons votre demande aux assureurs partenaires adaptés à votre profil.",
  "Ils vous contactent sous 24 à 48 h ouvrées, par téléphone ou par email.",
  "Vous comparez leurs propositions librement : vous n'êtes engagé(e) à rien.",
];

export default function QuoteSuccess() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-700" aria-hidden="true">✓</div>
        <h1 className="text-2xl font-bold">Votre demande est bien enregistrée</h1>
        <p className="mt-2 text-slate-600">Voici ce qui va se passer maintenant :</p>
        <ol className="mt-6 flex flex-col gap-4 text-left">
          {NEXT_STEPS.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">{i + 1}</span>
              <span className="pt-0.5 text-slate-700">{s}</span>
            </li>
          ))}
        </ol>
        <Link href="/" className="mt-8 inline-block text-sm font-medium text-blue-600 hover:underline">Retour à l&apos;accueil</Link>
      </div>
    </main>
  );
}
