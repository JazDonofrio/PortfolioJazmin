"use client";

import { useState } from "react";
import MultiStepForm from "./MultiStepForm";

export default function StartProjectButton({
  label = "Iniciar Proyecto",
  variant = "primary",
}: {
  label?: string;
  variant?: "primary" | "ghost";
}) {
  const [open, setOpen] = useState(false);

  const classes =
    variant === "primary"
      ? "rounded-lg bg-brand-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-brand-600/30 transition hover:bg-brand-500 hover:shadow-brand-500/40"
      : "rounded-lg border border-slate-600 px-7 py-3.5 font-semibold text-slate-200 transition hover:border-slate-400 hover:bg-slate-800";

  return (
    <>
      <button onClick={() => setOpen(true)} className={classes}>
        {label}
      </button>
      {open && <MultiStepForm onClose={() => setOpen(false)} />}
    </>
  );
}
