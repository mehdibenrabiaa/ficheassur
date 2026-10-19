"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBroker } from "@/components/ProShell";
import { LEAD_TYPES } from "@/lib/leadTypes";
import { acceptAccessRequest, listAccessRequests, type AccessRequest, type ActivationLink } from "@/lib/pro";

const STATUS: Record<string, { label: string; className: string }> = {
  invited: { label: "Invité, en attente d'activation", className: "bg-amber-50 text-amber-800" },
  active: { label: "Compte actif", className: "bg-green-50 text-green-700" },
  disabled: { label: "Désactivé", className: "bg-slate-100 text-slate-600" },
};

const label = (v: string) => LEAD_TYPES.find((t) => t.value === v)?.label ?? v;

// Admin: partner requests. "Accepter" (after checking the ORIAS number)
// creates the broker's account and gives the one-time activation link to
// send them -- FicheAssur doesn't send emails yet.
export default function DemandesAcces() {
  const broker = useBroker();
  const router = useRouter();
  const [requests, setRequests] = useState<AccessRequest[] | null>(null);
  const [links, setLinks] = useState<Record<string, ActivationLink>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (broker.role !== "admin") {
      router.replace("/espace-pro");
      return;
    }
    listAccessRequests().then(setRequests).catch((e) => setError(e.message));
  }, [broker, router]);

  async function accept(r: AccessRequest) {
    setBusy(r.id);
    setError("");
    try {
      const link = await acceptAccessRequest(r.id);
      setLinks((l) => ({ ...l, [r.id]: link }));
      setRequests((list) => list?.map((x) => (x.id === r.id ? { ...x, broker_status: "invited" } : x)) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div>
        <h1 className="heading text-[30px] leading-tight text-ink">Demandes d&apos;accès</h1>
        <p className="mt-1 text-[15px] text-slate-600">
          Vérifiez le numéro ORIAS, puis acceptez : le compte est créé et vous obtenez le lien d&apos;activation à envoyer au courtier (valable 7 jours).
        </p>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {!requests ? (
        <span className="size-6 animate-spin self-center rounded-full border-2 border-brand border-t-transparent" aria-label="Chargement" />
      ) : requests.length === 0 ? (
        <p className="bg-white p-6 text-[15px] text-slate-600">Aucune demande pour le moment.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {requests.map((r) => {
            const status = r.broker_status ? STATUS[r.broker_status] : null;
            const link = links[r.id];
            return (
              <li key={r.id} className="flex flex-col gap-3 bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[17px] font-bold text-ink">{r.full_name} <span className="font-normal text-slate-500">· {r.company}</span></p>
                    <p className="text-[14px] text-slate-600">{r.email} · {r.phone}</p>
                    <p className="mt-1 text-[14px] text-slate-600">
                      ORIAS : <span className="font-semibold text-ink">{r.orias_number || "non renseigné"}</span>
                      {r.orias_number && (
                        <a href="https://www.orias.fr/" target="_blank" rel="noopener noreferrer" className="ml-2 font-semibold text-brand hover:underline">Vérifier sur orias.fr</a>
                      )}
                    </p>
                    <p className="mt-1 text-[13px] text-slate-500">
                      Marchés : {r.lead_types.map(label).join(", ")} · reçue le {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    </p>
                    {r.message && <p className="mt-2 border-l-2 border-slate-200 pl-3 text-[14px] text-slate-600">{r.message}</p>}
                  </div>
                  {status ? (
                    <span className={`rounded-full px-3 py-1 text-[12px] font-semibold ${status.className}`}>{status.label}</span>
                  ) : (
                    <button type="button" onClick={() => accept(r)} disabled={busy === r.id} className="bg-brand px-5 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-brand-hover disabled:opacity-60">
                      {busy === r.id ? "…" : "Accepter"}
                    </button>
                  )}
                </div>
                {link && (
                  <div className="border-l-4 border-accent bg-light p-4 text-[14px]">
                    <p className="font-semibold text-ink">Lien d&apos;activation à envoyer à {link.broker.email} :</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <code className="min-w-0 flex-1 break-all bg-white px-3 py-2 text-[13px]">{link.activation_url}</code>
                      <button type="button" onClick={() => navigator.clipboard?.writeText(link.activation_url)} className="border border-brand px-3 py-2 text-[13px] font-bold text-brand hover:bg-brand/5">
                        Copier
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
