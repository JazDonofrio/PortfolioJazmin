import { NextResponse } from "next/server";
import { after } from "next/server";
import { leadSchema } from "@/lib/validation";
import { createLead, enrichLead } from "@/lib/leads";

export const runtime = "nodejs";

// Recibe un lead del formulario público, lo guarda y responde al instante.
// El análisis con IA se dispara en segundo plano (no bloquea al visitante).
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const lead = await createLead(parsed.data);

  // Enriquecimiento en segundo plano: corre después de responder al visitante.
  after(async () => {
    await enrichLead(lead.id);
  });

  return NextResponse.json({ ok: true, id: lead.id }, { status: 201 });
}
