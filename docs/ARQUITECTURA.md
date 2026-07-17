# Portfolio + Captación de Leads con IA — Arquitectura

> Documento de arquitectura para el portfolio personal de **Jazmin D'Onofrio**
> (Estudiante de Ingeniería en Sistemas — React, Python, Java, SQL, IA).
>
> Objetivo: un portfolio con **vista pública** (captación de leads estilo Typeform)
> y un **panel privado** que usa IA para analizar cada lead automáticamente.

---

## 1. Visión general

Dos "caras" de la misma app:

```
┌──────────────────────────────────────────────────────────────┐
│                       VISTA PÚBLICA                          │
│  Landing / Portfolio  +  Formulario multi-paso (Typeform)     │
│                          │                                    │
│                          ▼  POST /api/leads                   │
├──────────────────────────────────────────────────────────────┤
│                        BACKEND                               │
│  1. Guarda el lead (status = "new")  →  responde al visitante │
│  2. Dispara enriquecimiento con IA (en segundo plano)         │
│         │                                                     │
│         ▼  Claude API (Messages + tool use / JSON)            │
│     { resumen, análisis técnico, viabilidad, email_draft }    │
│         │                                                     │
│         ▼  Guarda análisis (status = "enriched")              │
├──────────────────────────────────────────────────────────────┤
│                    PANEL PRIVADO (auth)                       │
│  Dashboard de leads → tarjeta por lead con lo que generó IA   │
│  Botón "Copiar email", estados, filtros, tiempo real          │
└──────────────────────────────────────────────────────────────┘
```

Regla de oro para no abrumarte: **construir por "rebanadas verticales"** (una
funcionalidad completa de punta a punta) en vez de "todo el frontend, después
todo el backend". Cada fase de abajo es una rebanada que funciona sola.

---

## 2. Stack tecnológico recomendado

Elegido para que sea **ágil (una sola base de código, un solo deploy)** y a la
vez **escalable**, aprovechando lo que ya sabés.

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| **Frontend + Backend** | **Next.js 14+ (App Router) + TypeScript** | Un solo proyecto React con backend incluido (Route Handlers / Server Actions). Menos piezas = menos que mantener. |
| **Estilos** | **Tailwind CSS** + **shadcn/ui** | Rápido, prolijo, componentes accesibles listos. |
| **Animaciones del formulario** | **Framer Motion** | Es lo que da la sensación "Typeform" (transiciones fluidas entre pasos). |
| **Validación** | **Zod** | Valida el formulario y el body de la API con el mismo esquema. |
| **Base de datos** | **PostgreSQL** vía **Supabase** | Postgres administrado (ya sabés SQL) + Auth + Realtime + free tier. |
| **ORM** | **Prisma** (o el cliente de Supabase) | Tipado, migraciones claras. |
| **Auth del panel** | **Supabase Auth** (email/password o magic link) | Solo para vos. Protege `/admin`. |
| **IA** | **Claude API** (Anthropic) — `claude-sonnet-5` por defecto | Buena relación calidad/costo. `claude-haiku-4-5` si querés más barato; `claude-opus-4-8` para máxima calidad. |
| **Deploy** | **Vercel** (app) + **Supabase** (DB) | Deploy con `git push`, HTTPS, variables de entorno, gratis para empezar. |

### ¿Por qué no un backend separado en Python/FastAPI?
Sabés Python y sería válido, pero llamar a la API de IA es solo una petición
HTTP: hacerlo desde Next.js (TypeScript) evita mantener **dos** servicios, dos
deploys y dos lenguajes. Empezá con Next.js full-stack. Si el día de mañana el
análisis de IA se vuelve pesado (colas grandes, modelos propios, procesamiento
de archivos), agregás un microservicio **FastAPI** aparte sin tocar el frontend.
Diseñamos la frontera de la IA (sección 4) para que ese cambio sea fácil.

---

## 3. Modelo de datos

```
leads
├─ id              uuid  (PK)
├─ created_at      timestamptz
├─ name            text
├─ company         text            (nullable)
├─ email           text
├─ project_desc    text            ← "descripción del proyecto/necesidad"
├─ expected_tech   text[]          ← tecnologías esperadas
├─ budget          text            (nullable)
├─ timeline        text            (nullable)
├─ source          text            ← 'form', etc.
└─ status          text            ← 'new' | 'enriching' | 'enriched' | 'error'

lead_analysis        (1:1 con leads, lo genera la IA)
├─ id                uuid (PK)
├─ lead_id           uuid (FK → leads.id)
├─ summary           text          ← Resumen del proyecto
├─ technical_analysis text         ← Análisis técnico y viabilidad
├─ viability_score   int           ← 0-100 (para ordenar/priorizar)
├─ recommended_tech  text[]        ← tecnologías que recomienda usar
├─ email_draft       text          ← borrador de email listo para copiar
├─ model_used        text
└─ created_at        timestamptz
```

`leads` se llena desde el formulario público. `lead_analysis` lo llena la IA.
Separarlos deja claro qué escribió el cliente y qué generó la IA, y permite
re-generar el análisis sin tocar el lead original.

**Seguridad (RLS de Supabase):** el formulario público solo puede **insertar**
en `leads`; solo tu usuario autenticado puede **leer** `leads` y `lead_analysis`.

---

## 4. Cómo estructurar el backend y conectar el formulario con la IA

El flujo tiene un principio clave: **el visitante nunca espera a la IA.**
Guardás el lead y respondés al instante; la IA trabaja después.

### Paso a paso del flujo

1. **Submit del formulario** → `POST /api/leads`
   - Validás con Zod. Insertás el lead con `status = 'new'`.
   - Respondés `200` al visitante inmediatamente ("¡Gracias! Te contacto pronto").

2. **Disparo del enriquecimiento (segundo plano)** — 3 opciones, de más simple a más robusta:
   - **A. `after()` de Next.js** (recomendado para empezar): tras responder al
     visitante, corrés la llamada a IA en la misma request sin bloquearlo.
   - **B. Supabase Edge Function on-insert**: un trigger en la DB dispara la
     función cuando entra un lead. Desacopla totalmente.
   - **C. Cola (QStash / Inngest)**: para volumen alto y reintentos formales.

   Empezá con **A**. La frontera está aislada, migrar a B/C es cambiar quién
   invoca `enrichLead(leadId)`, no la lógica.

3. **Servicio de IA — `enrichLead(leadId)`** (una función aislada, el "cerebro"):
   - Marca `status = 'enriching'`.
   - Arma el prompt con: (a) las respuestas del lead + (b) **tu perfil**
     (skills, nivel, stack) guardado como constante/config — así la IA evalúa
     el encaje con *vos*.
   - Llama a Claude pidiendo **salida estructurada** (tool use / JSON schema),
     no texto libre, para poder guardar cada campo por separado.
   - Guarda el resultado en `lead_analysis`, marca `status = 'enriched'`.
   - Si falla: `status = 'error'` (para reintentar desde el panel).

4. **Panel** lee `leads` + `lead_analysis`. Con **Supabase Realtime**, la
   tarjeta aparece/actualiza sola cuando la IA termina (sin recargar).

### Contrato de salida de la IA (JSON estructurado)

Definí una herramienta (tool) que obliga a Claude a devolver exactamente esto:

```jsonc
{
  "summary":            "string — resumen claro de qué quiere lograr el cliente",
  "technical_analysis": "string — cómo encajan tus skills y la viabilidad",
  "viability_score":    0,        // 0-100, para priorizar leads
  "recommended_tech":   ["..."],  // stack sugerido para ESE proyecto
  "email_draft":        "string — respuesta profesional lista para copiar"
}
```

### Esqueleto del servicio de IA (referencia)

```ts
// lib/ai/enrichLead.ts
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic(); // usa ANTHROPIC_API_KEY del entorno

// Tu perfil vive acá para que la IA evalúe el encaje contigo.
const JAZMIN_PROFILE = `
Jazmin D'Onofrio — Estudiante de Ingeniería en Sistemas (UTN).
Skills: React, Python, Java, SQL, análisis de requerimientos, IA.
Nivel: intermedio-avanzado. Enfoque: soluciones web y datos.
`;

const analysisTool = {
  name: "guardar_analisis_de_lead",
  description: "Devuelve el análisis estructurado del lead.",
  input_schema: {
    type: "object",
    properties: {
      summary:            { type: "string" },
      technical_analysis: { type: "string" },
      viability_score:    { type: "integer", minimum: 0, maximum: 100 },
      recommended_tech:   { type: "array", items: { type: "string" } },
      email_draft:        { type: "string" },
    },
    required: ["summary","technical_analysis","viability_score",
               "recommended_tech","email_draft"],
  },
} as const;

export async function analyzeLead(lead: LeadInput) {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 2000,
    tools: [analysisTool],
    tool_choice: { type: "tool", name: "guardar_analisis_de_lead" },
    messages: [{
      role: "user",
      content: `Perfil del profesional:\n${JAZMIN_PROFILE}\n\n` +
        `Lead recibido:\n` +
        `Nombre: ${lead.name}\nEmpresa: ${lead.company ?? "-"}\n` +
        `Email: ${lead.email}\nProyecto: ${lead.project_desc}\n` +
        `Tecnologías esperadas: ${lead.expected_tech.join(", ")}\n\n` +
        `Generá: resumen del proyecto, análisis técnico y de viabilidad ` +
        `respecto al perfil, score 0-100, tecnologías recomendadas, y un ` +
        `borrador de email profesional proponiendo próximos pasos/reunión.`,
    }],
  });

  const toolUse = msg.content.find((c) => c.type === "tool_use");
  return toolUse.input; // { summary, technical_analysis, ... } ya tipado
}
```

> El uso de `tool_choice` forzado garantiza que Claude responda con el JSON
> exacto que necesitás guardar en `lead_analysis`. Nunca parseás texto a mano.

---

## 5. Estructura de carpetas (Next.js App Router)

```
portfolio/
├─ app/
│  ├─ (public)/
│  │  ├─ page.tsx                 # Landing / portfolio
│  │  └─ contacto/ ...            # (o modal) formulario multi-paso
│  ├─ admin/
│  │  ├─ layout.tsx               # protege la ruta (auth)
│  │  └─ page.tsx                 # dashboard de leads
│  └─ api/
│     └─ leads/route.ts           # POST crea lead + dispara enrich
├─ components/
│  ├─ form/                       # pasos del formulario (Typeform-like)
│  │  ├─ StepName.tsx, StepEmail.tsx, StepProject.tsx ...
│  │  └─ MultiStepForm.tsx        # orquesta pasos + Framer Motion
│  └─ admin/LeadCard.tsx          # tarjeta con lo que generó la IA
├─ lib/
│  ├─ ai/enrichLead.ts            # servicio de IA (sección 4)
│  ├─ db.ts                       # Prisma / cliente Supabase
│  └─ validation.ts               # esquemas Zod
├─ prisma/schema.prisma           # modelo de datos (sección 3)
└─ .env.local                     # ANTHROPIC_API_KEY, SUPABASE_URL, ...
```

### Idea de configuración de los pasos del formulario

Definí los pasos como **datos**, no como código repetido. Así agregar/quitar
preguntas es editar un array:

```ts
export const FORM_STEPS = [
  { id: "name",    label: "¿Cómo te llamás?",          type: "text",  required: true },
  { id: "company", label: "¿De qué empresa?",           type: "text"  },
  { id: "email",   label: "¿Tu email de contacto?",     type: "email", required: true },
  { id: "project_desc", label: "Contame tu proyecto o necesidad", type: "textarea", required: true },
  { id: "expected_tech", label: "¿Tecnologías esperadas?", type: "tags" },
];
```

---

## 6. Paso a paso para empezar a codificar (sin abrumarte)

Cada fase es una rebanada que **funciona y se puede deployar** antes de pasar a
la siguiente. No pases de fase hasta que la actual ande.

| Fase | Qué hacés | Resultado visible |
|------|-----------|-------------------|
| **0. Setup** | `create-next-app` (TS + Tailwind), subir a GitHub, deploy a Vercel. | "Hello world" online. |
| **1. Portfolio público** | Landing con tu info del CV: about, skills, proyectos, contacto. Estático. | Tu portfolio ya sirve como CV online. |
| **2. Formulario (sin IA)** | `MultiStepForm` con Framer Motion + Zod. `POST /api/leads` guarda en Supabase. | Los leads entran a la DB. |
| **3. Panel + Auth** | Ruta `/admin` protegida con Supabase Auth. Lista los leads (tabla/tarjetas). | Ves tus leads logueado. |
| **4. IA** | `enrichLead()` con Claude. La tarjeta muestra resumen, análisis, email. Botón "Copiar email". | La magia: análisis automático. |
| **5. Segundo plano + Realtime** | Disparar con `after()`, estados, tiempo real, reintentos, filtros/orden por score. | UX pulida y en vivo. |
| **6. Deploy final** | Variables de entorno, RLS en Supabase, dominio. | Producción. |

**Empezá hoy por la Fase 0 y 1.** Son las que menos dependen de decisiones y te
dan algo publicado rápido (motivación). El formulario (Fase 2) y la IA (Fase 4)
son el corazón, pero llegás a ellos con la base ya funcionando.

### Checklist de arranque (Fase 0)
- [ ] `npx create-next-app@latest portfolio --ts --tailwind --app`
- [ ] Crear proyecto en **Supabase**, copiar `SUPABASE_URL` y `SUPABASE_ANON_KEY`
- [ ] Sacar una **API key** en console.anthropic.com → `ANTHROPIC_API_KEY`
- [ ] `npm i @anthropic-ai/sdk zod framer-motion @supabase/supabase-js`
- [ ] Conectar el repo a **Vercel** y cargar las variables de entorno
- [ ] Primer deploy

---

## 7. Notas de seguridad y costos

- **Nunca** pongas `ANTHROPIC_API_KEY` en el frontend. Vive solo en el backend
  (Route Handler / Edge Function). El navegador jamás la ve.
- Activá **RLS** en Supabase desde el día 1: público = solo `INSERT` en `leads`.
- Poné un **rate limit** simple en `/api/leads` (evita spam de formularios).
- Costo de IA: cada lead son ~1-2k tokens. Con `claude-sonnet-5` es centavos por
  lead. Podés bajar a `claude-haiku-4-5` si el volumen crece.
- Guardá el `model_used` en `lead_analysis` para saber con qué se generó cada uno.
```
