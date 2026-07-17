"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LeadWithAnalysis } from "@/lib/leads";

const STATUS_LABEL: Record<string, { text: string; className: string }> = {
  new: { text: "Nuevo", className: "bg-slate-700 text-slate-200" },
  enriching: { text: "Analizando…", className: "bg-amber-600/30 text-amber-300" },
  enriched: { text: "Analizado por IA", className: "bg-emerald-600/30 text-emerald-300" },
  error: { text: "Error", className: "bg-rose-600/30 text-rose-300" },
};

function scoreColor(score: number): string {
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-rose-400";
}

export default function LeadCard({ lead }: { lead: LeadWithAnalysis }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [open, setOpen] = useState(true);

  const a = lead.analysis;
  const status = STATUS_LABEL[lead.status] ?? STATUS_LABEL.new;

  async function copyEmail() {
    if (!a) return;
    await navigator.clipboard.writeText(a.emailDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function regenerate() {
    setRegenerating(true);
    try {
      await fetch(`/api/leads/${lead.id}/regenerate`, { method: "POST" });
      router.refresh();
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      {/* Cabecera */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">
            {lead.name}
            {lead.company && (
              <span className="font-normal text-slate-400"> · {lead.company}</span>
            )}
          </h3>
          <a
            href={`mailto:${lead.email}`}
            className="text-sm text-brand-300 hover:underline"
          >
            {lead.email}
          </a>
        </div>
        <div className="flex items-center gap-2">
          {a && (
            <span className={`text-2xl font-extrabold ${scoreColor(a.viabilityScore)}`}>
              {a.viabilityScore}
              <span className="text-xs font-normal text-slate-500">/100</span>
            </span>
          )}
          <span className={`rounded-full px-3 py-1 text-xs ${status.className}`}>
            {status.text}
          </span>
        </div>
      </div>

      {/* Mensaje original */}
      <p className="mt-4 rounded-lg bg-slate-950/60 p-3 text-sm text-slate-300">
        “{lead.projectDesc}”
      </p>
      {lead.expectedTech.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {lead.expectedTech.map((t) => (
            <span key={t} className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Análisis de IA */}
      {a ? (
        <div className="mt-5 space-y-4">
          <button
            onClick={() => setOpen((o) => !o)}
            className="text-sm text-slate-400 hover:text-white"
          >
            {open ? "▾ Ocultar análisis de IA" : "▸ Ver análisis de IA"}
          </button>

          {open && (
            <>
              <Block title="📋 Resumen del proyecto">{a.summary}</Block>
              <Block title="🛠️ Análisis técnico y viabilidad">
                {a.technicalAnalysis}
              </Block>

              {a.recommendedTech.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-brand-300">
                    💡 Tecnologías recomendadas
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {a.recommendedTech.map((t) => (
                      <span
                        key={t}
                        className="rounded-md border border-brand-700 bg-brand-600/20 px-2.5 py-1 text-xs text-brand-200"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Borrador de email */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-brand-300">
                    ✉️ Borrador de email
                  </p>
                  <button
                    onClick={copyEmail}
                    className="rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-brand-500"
                  >
                    {copied ? "¡Copiado! ✓" : "Copiar"}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-sm text-slate-300">
                  {a.emailDraft}
                </pre>
              </div>

              <p className="text-xs text-slate-600">
                Generado por: {a.modelUsed}
              </p>
            </>
          )}
        </div>
      ) : (
        <p className="mt-5 text-sm text-slate-500">
          {lead.status === "enriching"
            ? "La IA está analizando este lead…"
            : "Todavía no hay análisis."}
        </p>
      )}

      {/* Acciones */}
      <div className="mt-5 flex items-center gap-3 border-t border-slate-800 pt-4">
        <button
          onClick={regenerate}
          disabled={regenerating}
          className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800 disabled:opacity-60"
        >
          {regenerating ? "Regenerando…" : "🔄 Regenerar análisis"}
        </button>
        <span className="text-xs text-slate-600">
          {new Date(lead.createdAt).toLocaleString("es-AR")}
        </span>
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-sm font-semibold text-brand-300">{title}</p>
      <p className="text-sm leading-relaxed text-slate-300">{children}</p>
    </div>
  );
}
