"use client";

import { useBroker } from "@/components/ProShell";
import { CONTACT } from "@/lib/contact";

export default function MonCompte() {
  const broker = useBroker();
  const rows: [string, string][] = [
    ["Nom", broker.full_name],
    ["Cabinet", broker.company],
    ["Email", broker.email],
    ["Rôle", broker.role === "admin" ? "Administrateur FicheAssur" : "Courtier partenaire"],
  ];
  return (
    <>
      <h1 className="heading text-[30px] leading-tight text-ink">Mon compte</h1>
      <div className="bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        <dl className="divide-y divide-slate-100">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-3 text-[15px]">
              <dt className="text-slate-500">{k}</dt>
              <dd className="text-right font-semibold text-ink">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-[14px] text-slate-600">
          Une information à corriger ? Écrivez-nous à{" "}
          <a href={`mailto:${CONTACT.email}`} className="font-semibold text-brand hover:underline">{CONTACT.email}</a>.
        </p>
      </div>
    </>
  );
}
