import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { enrichLead } from "@/lib/leads";

export const runtime = "nodejs";

// Regenera el análisis de IA de un lead. Solo para el admin autenticado.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = await params;
  await enrichLead(id);
  return NextResponse.json({ ok: true });
}
