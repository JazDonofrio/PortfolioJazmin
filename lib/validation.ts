import { z } from "zod";

// Esquema del formulario público. Se usa tanto en el cliente como en la API.
export const leadSchema = z.object({
  name: z.string().trim().min(2, "Ingresá tu nombre").max(120),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  email: z.string().trim().email("Email inválido").max(160),
  projectDesc: z
    .string()
    .trim()
    .min(10, "Contame un poco más sobre el proyecto")
    .max(4000),
  expectedTech: z.array(z.string().trim().min(1)).max(30).default([]),
  budget: z.string().trim().max(120).optional().or(z.literal("")),
  timeline: z.string().trim().max(120).optional().or(z.literal("")),
});

export type LeadInput = z.infer<typeof leadSchema>;
