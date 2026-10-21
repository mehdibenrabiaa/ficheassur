"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBroker } from "@/components/ProShell";
import { ListSkeleton } from "@/components/pro/ui";
import { SUPPORT_TOPICS } from "@/lib/help";
import { api } from "@/lib/pro";

type SupportMessage = {
  id: string; full_name: string; email: string; topic: string; message: string;
  from_broker: boolean; resolved: boolean; created_at: string;
};

const topicLabel = (v: string) => SUPPORT_TOPICS.find((t) => t.value === v)?.label ?? v;

// Admin: messages sent from the /assistance page's contact form. Reply by
// email ("Répondre" opens it pre-filled), then mark the message as handled.
export default function AssistanceInbox() {
  const broker = useBroker();
  const router = useRouter();
  const [messages, setMessages] = useState<SupportMessage[] | null>(null);
  const [showResolved, setShowResolved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (broker.role !== "admin") {
      router.replace("/espace-pro");
      return;
    }
    api<SupportMessage[]>("/api/v1/support").then(setMessages).catch((e) => setError(e.message));
  }, [broker, router]);

  async function toggle(m: SupportMessage) {
    try {
      const updated = await api<SupportMessage>(`/api/v1/support/${m.id}/resolve?resolved=${!m.resolved}`, { method: "POST" });
      setMessages((list) => list?.map((x) => (x.id === m.id ? updated : x)) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Une erreur est survenue.");
    }
  }

  const open = messages?.filter((m) => !m.resolved) ?? [];
  const shown = messages?.filter((m) => showResolved || !m.resolved) ?? [];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-ink sm:text-[32px]">Assistance</h1>
          <p className="mt-1 text-[15px] text-slate-600">
            Messages envoyés depuis la page Assistance{messages ? ` · ${open.length} à traiter` : ""}.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[14px] text-slate-600">
          <input type="checkbox" checked={showResolved} onChange={(e) => setShowResolved(e.target.checked)} className="size-4 accent-brand" />
          Afficher les messages traités
        </label>
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {!messages ? (
        <ListSkeleton rows={4} />
      ) : shown.length === 0 ? (
        <p className="bg-white p-6 text-[15px] text-slate-600">Aucun message à traiter.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {shown.map((m) => (
            <li key={m.id} className={`flex flex-col gap-3 bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.08)] ${m.resolved ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[17px] font-bold text-ink">
                    {m.full_name}
                    {m.from_broker && <span className="ml-2 rounded-full bg-light px-2 py-0.5 text-[11px] font-semibold text-brand">Courtier connecté</span>}
                  </p>
                  <p className="text-[14px] text-slate-600">{m.email}</p>
                  <p className="mt-1 text-[13px] text-slate-500">
                    {topicLabel(m.topic)} · {new Date(m.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent(`FicheAssur — ${topicLabel(m.topic)}`)}`}
                    className="border border-brand px-4 py-2 text-[13px] font-bold text-brand hover:bg-brand/5"
                  >
                    Répondre
                  </a>
                  <button type="button" onClick={() => toggle(m)} className="bg-brand px-4 py-2 text-[13px] font-bold text-white hover:bg-brand-hover">
                    {m.resolved ? "Rouvrir" : "Marquer traité"}
                  </button>
                </div>
              </div>
              <p className="whitespace-pre-line border-l-2 border-slate-200 pl-3 text-[14px] leading-relaxed text-slate-700">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
