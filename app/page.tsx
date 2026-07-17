import Link from "next/link";
import { OWNER } from "@/lib/profile";
import StartProjectButton from "@/components/StartProjectButton";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-bold tracking-tight">
            {OWNER.name.split(" ")[0]}
            <span className="text-brand-400">.</span>
          </span>
          <nav className="hidden gap-6 text-sm text-slate-300 sm:flex">
            <a href="#sobre-mi" className="hover:text-white">Sobre mí</a>
            <a href="#skills" className="hover:text-white">Skills</a>
            <a href="#formacion" className="hover:text-white">Formación</a>
          </nav>
          <StartProjectButton label="Contactar" variant="ghost" />
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-600/20 blur-3xl" />
        <div className="mx-auto max-w-5xl px-6 py-24 text-center sm:py-32">
          <p className="mb-4 inline-block rounded-full border border-slate-700 bg-slate-900 px-4 py-1 text-sm text-brand-300">
            {OWNER.role}
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Hola, soy {OWNER.name}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            {OWNER.tagline}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <StartProjectButton label="🚀 Iniciar Proyecto" />
            <a
              href="#sobre-mi"
              className="rounded-lg border border-slate-600 px-7 py-3.5 font-semibold text-slate-200 transition hover:border-slate-400 hover:bg-slate-800"
            >
              Conocer más
            </a>
          </div>
        </div>
      </section>

      {/* SOBRE MÍ */}
      <section id="sobre-mi" className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-6 text-2xl font-bold sm:text-3xl">Sobre mí</h2>
        <p className="max-w-3xl text-lg leading-relaxed text-slate-300">
          {OWNER.about}
        </p>
      </section>

      {/* SKILLS */}
      <section id="skills" className="border-y border-slate-800/60 bg-slate-900/30">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-8 text-2xl font-bold sm:text-3xl">Habilidades</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <SkillCard title="Lenguajes" items={OWNER.skills.lenguajes} />
            <SkillCard title="Web" items={OWNER.skills.web} />
            <SkillCard title="Datos" items={OWNER.skills.datos} />
            <SkillCard title="Herramientas" items={OWNER.skills.herramientas} />
            <SkillCard title="Metodologías" items={OWNER.skills.metodologias} />
          </div>
        </div>
      </section>

      {/* FORMACIÓN */}
      <section id="formacion" className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-8 text-2xl font-bold sm:text-3xl">Formación</h2>
        <div className="space-y-4">
          {OWNER.education.map((e) => (
            <div
              key={e.title}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-5"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-semibold">{e.title}</h3>
                <span className="text-sm text-brand-300">{e.period}</span>
              </div>
              <p className="mt-1 text-slate-400">{e.place}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="border-t border-slate-800/60">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            ¿Tenés un proyecto en mente?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            Contame qué necesitás y te respondo con una propuesta. Solo te toma
            un minuto.
          </p>
          <div className="mt-8">
            <StartProjectButton label="🚀 Iniciar Proyecto" />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/60 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 text-sm text-slate-500 sm:flex-row">
          <span>
            © {OWNER.name} — {OWNER.location}
          </span>
          <Link href="/admin" className="hover:text-slate-300">
            Panel de administración
          </Link>
        </div>
      </footer>
    </main>
  );
}

function SkillCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <h3 className="mb-3 font-semibold text-brand-300">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <span
            key={i}
            className="rounded-md bg-slate-800 px-2.5 py-1 text-sm text-slate-200"
          >
            {i}
          </span>
        ))}
      </div>
    </div>
  );
}
