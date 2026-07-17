"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

type FieldType = "text" | "email" | "textarea" | "tags";

type Step = {
  id: "name" | "company" | "email" | "projectDesc" | "expectedTech" | "budget" | "timeline";
  question: string;
  hint?: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  suggestions?: string[];
};

const STEPS: Step[] = [
  {
    id: "name",
    question: "¡Hola! ¿Cómo te llamás?",
    hint: "Empecemos por lo básico.",
    type: "text",
    placeholder: "Tu nombre y apellido",
    required: true,
  },
  {
    id: "company",
    question: "¿De qué empresa o proyecto venís?",
    hint: "Si es personal, podés dejarlo vacío.",
    type: "text",
    placeholder: "Nombre de la empresa (opcional)",
  },
  {
    id: "email",
    question: "¿A qué email te contacto?",
    hint: "Lo uso solo para responderte.",
    type: "email",
    placeholder: "tucorreo@ejemplo.com",
    required: true,
  },
  {
    id: "projectDesc",
    question: "Contame tu proyecto o necesidad",
    hint: "¿Qué querés lograr? Cuanto más detalle, mejor.",
    type: "textarea",
    placeholder: "Describí tu idea, problema u objetivo…",
    required: true,
  },
  {
    id: "expectedTech",
    question: "¿Qué tecnologías esperás usar?",
    hint: "Elegí las que apliquen o agregá las tuyas. Podés saltar este paso.",
    type: "tags",
    suggestions: ["React", "Next.js", "Node.js", "Python", "Java", "SQL", "Power BI", "IA", "App móvil", "Landing"],
  },
  {
    id: "budget",
    question: "¿Tenés un presupuesto estimado?",
    hint: "Orientativo, opcional.",
    type: "text",
    placeholder: "Ej: a definir, rango, etc. (opcional)",
  },
  {
    id: "timeline",
    question: "¿Para cuándo lo necesitás?",
    hint: "Opcional.",
    type: "text",
    placeholder: "Ej: 1 mes, sin apuro, urgente… (opcional)",
  },
];

type FormData = {
  name: string;
  company: string;
  email: string;
  projectDesc: string;
  expectedTech: string[];
  budget: string;
  timeline: string;
};

const EMPTY: FormData = {
  name: "",
  company: "",
  email: "",
  projectDesc: "",
  expectedTech: [],
  budget: "",
  timeline: "",
};

function isValid(step: Step, data: FormData): boolean {
  if (!step.required) return true;
  const v = data[step.id];
  if (step.id === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
  if (Array.isArray(v)) return v.length > 0;
  return String(v).trim().length >= (step.id === "projectDesc" ? 10 : 2);
}

export default function MultiStepForm({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [data, setData] = useState<FormData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;
  const progress = Math.round(((index + (done ? 1 : 0)) / STEPS.length) * 100);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          company: data.company,
          email: data.email,
          projectDesc: data.projectDesc,
          expectedTech: data.expectedTech,
          budget: data.budget,
          timeline: data.timeline,
        }),
      });
      if (!res.ok) throw new Error("No se pudo enviar. Revisá los datos.");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  }, [data]);

  const next = useCallback(() => {
    if (!isValid(step, data)) {
      setError(step.required ? "Este campo es obligatorio." : null);
      return;
    }
    setError(null);
    if (isLast) {
      void submit();
    } else {
      setIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }
  }, [step, data, isLast, submit]);

  const back = useCallback(() => {
    setError(null);
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  // Enter para avanzar (Shift+Enter hace salto de línea en textarea).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && !e.shiftKey && !done) {
        if (step.type !== "textarea" || (e.target as HTMLElement)?.tagName !== "TEXTAREA") {
          e.preventDefault();
          next();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, onClose, step, done]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950">
      {/* Barra de progreso */}
      <div className="h-1.5 w-full bg-slate-800">
        <motion.div
          className="h-full bg-brand-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <span className="text-sm text-slate-400">
          {done ? "Completado" : `Paso ${index + 1} de ${STEPS.length}`}
        </span>
        <button
          onClick={onClose}
          aria-label="Cerrar"
          className="rounded-full px-3 py-1 text-slate-400 transition hover:bg-slate-800 hover:text-white"
        >
          ✕ Cerrar
        </button>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="mb-4 text-5xl">🎉</div>
                <h2 className="mb-3 text-3xl font-bold">¡Gracias, {data.name.split(" ")[0]}!</h2>
                <p className="mb-8 text-slate-300">
                  Recibí tu mensaje. Voy a analizarlo y te respondo a la brevedad
                  a <span className="text-brand-300">{data.email}</span>.
                </p>
                <button
                  onClick={onClose}
                  className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white transition hover:bg-brand-500"
                >
                  Volver al portfolio
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.25 }}
              >
                <label className="block">
                  <h2 className="mb-2 text-2xl font-bold sm:text-3xl">
                    {step.question}
                  </h2>
                  {step.hint && (
                    <p className="mb-6 text-slate-400">{step.hint}</p>
                  )}

                  <StepInput
                    step={step}
                    data={data}
                    setData={setData}
                    onEnter={next}
                  />
                </label>

                {error && (
                  <p className="mt-3 text-sm text-rose-400">{error}</p>
                )}

                <div className="mt-8 flex items-center gap-3">
                  {index > 0 && (
                    <button
                      onClick={back}
                      className="rounded-lg px-4 py-3 text-slate-300 transition hover:bg-slate-800"
                    >
                      ← Atrás
                    </button>
                  )}
                  <button
                    onClick={next}
                    disabled={submitting}
                    className="rounded-lg bg-brand-600 px-6 py-3 font-medium text-white transition hover:bg-brand-500 disabled:opacity-60"
                  >
                    {submitting
                      ? "Enviando…"
                      : isLast
                        ? "Enviar ✓"
                        : "Continuar →"}
                  </button>
                  <span className="hidden text-xs text-slate-500 sm:inline">
                    presioná Enter ↵
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function StepInput({
  step,
  data,
  setData,
  onEnter,
}: {
  step: Step;
  data: FormData;
  setData: React.Dispatch<React.SetStateAction<FormData>>;
  onEnter: () => void;
}) {
  const base =
    "w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-lg text-white outline-none transition focus:border-brand-500";

  if (step.type === "textarea") {
    return (
      <textarea
        autoFocus
        rows={5}
        className={base}
        placeholder={step.placeholder}
        value={data.projectDesc}
        onChange={(e) => setData((d) => ({ ...d, projectDesc: e.target.value }))}
      />
    );
  }

  if (step.type === "tags") {
    const selected = data.expectedTech;
    const toggle = (tag: string) =>
      setData((d) => ({
        ...d,
        expectedTech: d.expectedTech.includes(tag)
          ? d.expectedTech.filter((t) => t !== tag)
          : [...d.expectedTech, tag],
      }));
    return (
      <div>
        <div className="flex flex-wrap gap-2">
          {step.suggestions?.map((tag) => {
            const on = selected.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggle(tag)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  on
                    ? "border-brand-500 bg-brand-600 text-white"
                    : "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500"
                }`}
              >
                {on ? "✓ " : ""}
                {tag}
              </button>
            );
          })}
        </div>
        <input
          type="text"
          className={`${base} mt-4`}
          placeholder="Agregar otra y presionar Enter…"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              const val = (e.target as HTMLInputElement).value.trim();
              if (val && !selected.includes(val)) toggle(val);
              (e.target as HTMLInputElement).value = "";
            }
          }}
        />
      </div>
    );
  }

  const value =
    step.id === "name"
      ? data.name
      : step.id === "company"
        ? data.company
        : step.id === "email"
          ? data.email
          : step.id === "budget"
            ? data.budget
            : data.timeline;

  return (
    <input
      autoFocus
      type={step.type}
      className={base}
      placeholder={step.placeholder}
      value={value}
      onChange={(e) => setData((d) => ({ ...d, [step.id]: e.target.value }))}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onEnter();
        }
      }}
    />
  );
}
