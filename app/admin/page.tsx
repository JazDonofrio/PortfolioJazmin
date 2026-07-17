import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { listLeads } from "@/lib/leads";
import LeadCard from "@/components/LeadCard";
import AdminHeader from "@/components/AdminHeader";

// Siempre datos frescos (no cachear el dashboard).
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  const leads = await listLeads();
  const total = leads.length;
  const analyzed = leads.filter((l) => l.status === "enriched").length;
  const avgScore =
    analyzed > 0
      ? Math.round(
          leads
            .filter((l) => l.analysis)
            .reduce((s, l) => s + (l.analysis?.viabilityScore ?? 0), 0) /
            analyzed
        )
      : 0;

  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-bold">Panel de Leads</h1>
            <p className="text-sm text-slate-400">Gestión y análisis con IA</p>
          </div>
          <AdminHeader />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Métricas */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <Stat label="Leads totales" value={total} />
          <Stat label="Analizados por IA" value={analyzed} />
          <Stat label="Score promedio" value={total ? `${avgScore}/100` : "—"} />
        </div>

        {/* Lista */}
        {total === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-400">
            <p className="text-lg">Todavía no hay leads.</p>
            <p className="mt-2 text-sm">
              Cuando alguien complete el formulario del portfolio, vas a verlo
              acá con su análisis de IA.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {leads.map((lead) => (
              <LeadCard key={lead.id} lead={lead} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 text-center">
      <div className="text-3xl font-extrabold text-brand-300">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{label}</div>
    </div>
  );
}
