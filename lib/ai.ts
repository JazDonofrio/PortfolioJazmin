import Anthropic from "@anthropic-ai/sdk";
import { OWNER_PROFILE_FOR_AI } from "./profile";

export type LeadForAnalysis = {
  name: string;
  company?: string | null;
  email: string;
  projectDesc: string;
  expectedTech: string[];
  budget?: string | null;
  timeline?: string | null;
};

export type Analysis = {
  summary: string;
  technicalAnalysis: string;
  viabilityScore: number;
  recommendedTech: string[];
  emailDraft: string;
  modelUsed: string;
};

const analysisTool: Anthropic.Tool = {
  name: "guardar_analisis_de_lead",
  description:
    "Guarda el análisis estructurado de un lead que llegó por el formulario del portfolio.",
  input_schema: {
    type: "object",
    properties: {
      summary: {
        type: "string",
        description: "Resumen claro y conciso de qué quiere lograr el cliente.",
      },
      technical_analysis: {
        type: "string",
        description:
          "Análisis técnico y de viabilidad: cómo encajan las habilidades del profesional con el proyecto y qué considerar.",
      },
      viability_score: {
        type: "integer",
        description: "Puntaje de encaje/viabilidad de 0 a 100.",
      },
      recommended_tech: {
        type: "array",
        items: { type: "string" },
        description: "Tecnologías recomendadas para ESTE proyecto en concreto.",
      },
      email_draft: {
        type: "string",
        description:
          "Borrador de email profesional al cliente, en español, proponiendo próximos pasos o una reunión. Listo para copiar.",
      },
    },
    required: [
      "summary",
      "technical_analysis",
      "viability_score",
      "recommended_tech",
      "email_draft",
    ],
  },
};

function buildPrompt(lead: LeadForAnalysis): string {
  return [
    "Sos el asistente del portfolio de este profesional. Analizá el siguiente lead.",
    "",
    "=== PERFIL DEL PROFESIONAL ===",
    OWNER_PROFILE_FOR_AI,
    "",
    "=== LEAD RECIBIDO ===",
    `Nombre: ${lead.name}`,
    `Empresa: ${lead.company || "(no indicada)"}`,
    `Email: ${lead.email}`,
    `Descripción del proyecto/necesidad: ${lead.projectDesc}`,
    `Tecnologías esperadas: ${
      lead.expectedTech.length ? lead.expectedTech.join(", ") : "(no indicadas)"
    }`,
    `Presupuesto: ${lead.budget || "(no indicado)"}`,
    `Plazo: ${lead.timeline || "(no indicado)"}`,
    "",
    "Generá: (1) un resumen del proyecto, (2) un análisis técnico y de",
    "viabilidad evaluando el encaje con el perfil, (3) un score 0-100,",
    "(4) tecnologías recomendadas, y (5) un borrador de email profesional",
    "para responderle al cliente proponiendo próximos pasos o una reunión.",
  ].join("\n");
}

// Análisis con IA real (Claude). Requiere ANTHROPIC_API_KEY.
async function analyzeWithClaude(lead: LeadForAnalysis): Promise<Analysis> {
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const msg = await anthropic.messages.create({
    model,
    max_tokens: 2000,
    tools: [analysisTool],
    tool_choice: { type: "tool", name: "guardar_analisis_de_lead" },
    messages: [{ role: "user", content: buildPrompt(lead) }],
  });

  const toolUse = msg.content.find(
    (c): c is Anthropic.ToolUseBlock => c.type === "tool_use"
  );
  if (!toolUse) throw new Error("La IA no devolvió el análisis esperado.");

  const out = toolUse.input as {
    summary: string;
    technical_analysis: string;
    viability_score: number;
    recommended_tech: string[];
    email_draft: string;
  };

  return {
    summary: out.summary,
    technicalAnalysis: out.technical_analysis,
    viabilityScore: Math.max(0, Math.min(100, Math.round(out.viability_score))),
    recommendedTech: out.recommended_tech ?? [],
    emailDraft: out.email_draft,
    modelUsed: model,
  };
}

// Análisis de respaldo (sin IA): heurística simple para que la app funcione
// completa aunque todavía no cargues la ANTHROPIC_API_KEY.
function analyzeWithFallback(lead: LeadForAnalysis): Analysis {
  const tech = lead.expectedTech.length
    ? lead.expectedTech
    : ["React", "Next.js", "Node.js", "SQL"];

  const known = new Set(
    [
      "react",
      "next",
      "next.js",
      "javascript",
      "typescript",
      "node",
      "node.js",
      "python",
      "java",
      "sql",
      "html",
      "css",
      "power bi",
      "figma",
    ].map((t) => t.toLowerCase())
  );
  const matches = tech.filter((t) => known.has(t.toLowerCase()));
  const score = Math.min(
    95,
    55 + matches.length * 8 + (lead.projectDesc.length > 120 ? 10 : 0)
  );

  const summary =
    `${lead.name}${lead.company ? ` (${lead.company})` : ""} busca: ` +
    `${lead.projectDesc.slice(0, 240)}${
      lead.projectDesc.length > 240 ? "…" : ""
    }`;

  const technicalAnalysis =
    `El proyecto encaja con el perfil (React, Python, Java, SQL). ` +
    `Tecnologías esperadas: ${tech.join(", ")}. ` +
    (matches.length
      ? `Coincidencias directas con las habilidades: ${matches.join(", ")}. `
      : `No hay coincidencias directas evidentes; conviene profundizar en una reunión. `) +
    `Viabilidad estimada ${score}/100. ` +
    `Sugerencia: definir alcance, priorizar un MVP y estimar tiempos en una llamada inicial.`;

  const emailDraft =
    `Hola ${lead.name.split(" ")[0]},\n\n` +
    `¡Muchas gracias por contactarme! Leí lo que me contás sobre tu proyecto ` +
    `y me parece muy interesante. Creo que puedo ayudarte a llevarlo adelante ` +
    `usando ${tech.slice(0, 3).join(", ")}.\n\n` +
    `Para avanzar, me gustaría proponerte una breve reunión (15-20 min) donde ` +
    `podamos repasar los objetivos, el alcance y los tiempos. ¿Te viene bien ` +
    `esta semana? Contame qué días y horarios te quedan cómodos.\n\n` +
    `Quedo atenta. ¡Saludos!\n${"Jazmin D'Onofrio"}`;

  return {
    summary,
    technicalAnalysis,
    viabilityScore: score,
    recommendedTech: tech.slice(0, 6),
    emailDraft,
    modelUsed: "fallback (sin IA)",
  };
}

// Punto de entrada: usa Claude si hay API key, si no, el respaldo.
export async function analyzeLead(lead: LeadForAnalysis): Promise<Analysis> {
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim()) {
    try {
      return await analyzeWithClaude(lead);
    } catch (err) {
      console.error("[ai] Falló Claude, uso respaldo:", err);
      return analyzeWithFallback(lead);
    }
  }
  return analyzeWithFallback(lead);
}
