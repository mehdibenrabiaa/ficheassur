"use client";

import { useBroker } from "@/components/ProShell";
import { LEAD_TYPES } from "@/lib/leadTypes";

// Espace pro home. Buying leads and "Mes leads" (the mini-CRM) come in the
// next phases -- the cards say so rather than showing empty numbers.
export default function EspaceProDashboard() {
  const broker = useBroker();
  const markets = LEAD_TYPES.filter((t) => broker.lead_types.includes(t.value)).map((t) => t.label);

  return (
    <>
      <div>
        <h1 className="heading text-[30px] leading-tight text-ink">Bonjour {broker.full_name.split(" ")[0]}</h1>
        <p className="mt-1 text-[15px] text-slate-600">Bienvenue dans votre espace pro FicheAssur.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { title: "Acheter des leads", text: "Choisissez vos leads par marché et par zone, en partagé ou en exclusivité, et payez à la fiche." },
          { title: "Mes leads", text: "Retrouvez vos leads achetés, suivez-les comme dans un CRM : statut, notes, rappels." },
        ].map((c) => (
          <div key={c.title} className="flex flex-col gap-2 bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[17px] font-bold text-ink">{c.title}</h2>
              <span className="rounded-full bg-light px-2.5 py-0.5 text-[12px] font-semibold text-slate-500">Bientôt</span>
            </div>
            <p className="text-[14px] leading-relaxed text-slate-600">{c.text}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        <h2 className="text-[17px] font-bold text-ink">Vos marchés</h2>
        <p className="mt-1 text-[14px] text-slate-600">
          {markets.length ? markets.join(" · ") : "Aucun marché choisi pour le moment."}
        </p>
      </div>
    </>
  );
}
