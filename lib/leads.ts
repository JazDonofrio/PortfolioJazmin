import { prisma } from "./prisma";
import { analyzeLead } from "./ai";
import type { LeadInput } from "./validation";

// Crea el lead en la base de datos (status inicial: "new").
export async function createLead(input: LeadInput) {
  return prisma.lead.create({
    data: {
      name: input.name,
      company: input.company || null,
      email: input.email,
      projectDesc: input.projectDesc,
      expectedTech: JSON.stringify(input.expectedTech ?? []),
      budget: input.budget || null,
      timeline: input.timeline || null,
    },
  });
}

// Enriquece un lead con IA y guarda el análisis. Idempotente-ish:
// si ya existe análisis, lo reemplaza.
export async function enrichLead(leadId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return;

  await prisma.lead.update({
    where: { id: leadId },
    data: { status: "enriching" },
  });

  try {
    const analysis = await analyzeLead({
      name: lead.name,
      company: lead.company,
      email: lead.email,
      projectDesc: lead.projectDesc,
      expectedTech: safeParseArray(lead.expectedTech),
      budget: lead.budget,
      timeline: lead.timeline,
    });

    await prisma.leadAnalysis.upsert({
      where: { leadId },
      create: {
        leadId,
        summary: analysis.summary,
        technicalAnalysis: analysis.technicalAnalysis,
        viabilityScore: analysis.viabilityScore,
        recommendedTech: JSON.stringify(analysis.recommendedTech),
        emailDraft: analysis.emailDraft,
        modelUsed: analysis.modelUsed,
      },
      update: {
        summary: analysis.summary,
        technicalAnalysis: analysis.technicalAnalysis,
        viabilityScore: analysis.viabilityScore,
        recommendedTech: JSON.stringify(analysis.recommendedTech),
        emailDraft: analysis.emailDraft,
        modelUsed: analysis.modelUsed,
      },
    });

    await prisma.lead.update({
      where: { id: leadId },
      data: { status: "enriched" },
    });
  } catch (err) {
    console.error("[leads] Error al enriquecer lead:", err);
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: "error" },
    });
  }
}

// Lista todos los leads con su análisis, listos para el dashboard.
export async function listLeads() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    include: { analysis: true },
  });

  return leads.map((l) => ({
    id: l.id,
    createdAt: l.createdAt,
    name: l.name,
    company: l.company,
    email: l.email,
    projectDesc: l.projectDesc,
    expectedTech: safeParseArray(l.expectedTech),
    budget: l.budget,
    timeline: l.timeline,
    status: l.status,
    analysis: l.analysis
      ? {
          summary: l.analysis.summary,
          technicalAnalysis: l.analysis.technicalAnalysis,
          viabilityScore: l.analysis.viabilityScore,
          recommendedTech: safeParseArray(l.analysis.recommendedTech),
          emailDraft: l.analysis.emailDraft,
          modelUsed: l.analysis.modelUsed,
        }
      : null,
  }));
}

export type LeadWithAnalysis = Awaited<ReturnType<typeof listLeads>>[number];

function safeParseArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}
