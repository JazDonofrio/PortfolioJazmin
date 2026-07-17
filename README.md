# Portfolio de Jazmin D'Onofrio — con captación de leads e IA

Portfolio web personal con dos partes:

1. **Vista pública** — landing/portfolio + un **formulario interactivo paso a
   paso (estilo Typeform)** para que clientes o reclutadores dejen su consulta.
2. **Panel privado (`/admin`)** — dashboard donde ves todos los leads, cada uno
   con una **tarjeta generada por IA**: resumen del proyecto, análisis técnico y
   de viabilidad, tecnologías recomendadas y un **borrador de email listo para
   copiar**.

> La app funciona **sin configurar nada externo**: usa una base SQLite local y,
> si todavía no cargás una API key de Claude, genera el análisis con una lógica
> de respaldo. Cuando agregás la key, usa la IA real automáticamente.

---

## 🚀 Puesta en marcha (local)

Requisitos: **Node.js 18+** (probado con Node 22).

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo de entorno
cp .env.example .env
#    (opcional) editá .env para poner tu contraseña y tu API key de Claude

# 3. Crear la base de datos local
npm run db:push

# 4. (Opcional) cargar un lead de ejemplo
node prisma/seed.mjs

# 5. Levantar la app
npm run dev
```

Abrí **http://localhost:3000** — es tu portfolio.
El panel está en **http://localhost:3000/admin**
(contraseña por defecto: `cambiame123`, cambiala en `.env`).

---

## ⚙️ Variables de entorno (`.env`)

| Variable | Para qué |
|----------|----------|
| `DATABASE_URL` | Base de datos. Por defecto SQLite local (`file:./dev.db`). |
| `ADMIN_PASSWORD` | Contraseña del panel `/admin`. **Cambiala.** |
| `ANTHROPIC_API_KEY` | API key de Claude. Vacía = usa análisis de respaldo. |
| `ANTHROPIC_MODEL` | Modelo (por defecto `claude-sonnet-5`). |

La API key se obtiene en **https://console.anthropic.com**. Nunca se expone al
navegador: solo se usa en el backend.

---

## 🧠 Cómo funciona el flujo con IA

1. El visitante completa el formulario → `POST /api/leads`.
2. El lead se guarda y se le responde **al instante** (no espera a la IA).
3. En segundo plano, la IA analiza el lead (respuestas + perfil de Jazmin) y
   guarda: resumen, análisis técnico, score de viabilidad, tecnologías
   recomendadas y borrador de email.
4. En `/admin` ves cada lead con su tarjeta. Botón **Copiar** para el email y
   **Regenerar análisis** cuando quieras.

---

## 🗂️ Estructura

```
app/
├─ page.tsx              # Landing / portfolio (público)
├─ login/page.tsx        # Login del panel
├─ admin/page.tsx        # Dashboard de leads (protegido)
└─ api/
   ├─ leads/route.ts             # POST: crea lead + dispara IA
   ├─ leads/[id]/regenerate/     # Regenerar análisis
   └─ admin/{login,logout}/      # Sesión del panel
components/
├─ MultiStepForm.tsx     # Formulario tipo Typeform (Framer Motion)
├─ StartProjectButton.tsx
├─ LeadCard.tsx          # Tarjeta con el análisis de IA
└─ AdminHeader.tsx
lib/
├─ ai.ts                 # Integración con Claude + respaldo
├─ leads.ts              # Crear / enriquecer / listar leads
├─ profile.ts            # Perfil de Jazmin (editá tus skills acá)
├─ auth.ts               # Auth simple del panel
└─ validation.ts         # Validación con Zod
prisma/
├─ schema.prisma         # Modelo de datos
└─ seed.mjs              # Lead de ejemplo
```

Para personalizar tu portfolio, editá **`lib/profile.ts`** (nombre, skills,
formación, textos).

---

## ☁️ Deploy a producción (Vercel + Postgres)

La base SQLite es ideal para local, pero en Vercel el disco es de solo lectura.
Para producción:

1. Creá una base **PostgreSQL** (ej. [Supabase](https://supabase.com) o
   [Neon](https://neon.tech)).
2. En `prisma/schema.prisma` cambiá `provider = "sqlite"` por
   `provider = "postgresql"`.
3. En Vercel, cargá las variables `DATABASE_URL`, `ADMIN_PASSWORD`,
   `ANTHROPIC_API_KEY`.
4. Corré `npx prisma db push` apuntando a la base nueva.
5. Deploy con `git push` (Vercel conecta el repo automáticamente).

---

## 🧰 Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Framer Motion · Prisma ·
SQLite/PostgreSQL · Claude API (Anthropic) · Zod.

Ver **`docs/ARQUITECTURA.md`** para el detalle de arquitectura y decisiones.
