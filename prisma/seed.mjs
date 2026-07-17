// Carga un lead de ejemplo para que el panel no esté vacío la primera vez.
// Ejecutar con: npm run db:push && node prisma/seed.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.lead.count();
  if (existing > 0) {
    console.log("Ya hay leads, no se agrega el ejemplo.");
    return;
  }

  const lead = await prisma.lead.create({
    data: {
      name: "Lucía Fernández",
      company: "Cafetería Aroma",
      email: "lucia@aroma.example",
      projectDesc:
        "Necesito una web para mi cafetería con menú online, sistema de reservas de mesas y un panel para cargar promociones. Me gustaría que sea rápida y fácil de administrar.",
      expectedTech: JSON.stringify(["React", "Next.js", "SQL"]),
      budget: "A definir",
      timeline: "1-2 meses",
      status: "enriched",
      analysis: {
        create: {
          summary:
            "Lucía (Cafetería Aroma) quiere una web con menú online, reservas de mesas y panel de promociones, priorizando velocidad y administración sencilla.",
          technicalAnalysis:
            "El proyecto encaja muy bien con el perfil (React/Next.js, SQL). Un stack Next.js + base de datos SQL cubre el menú, las reservas y el panel de administración. Viabilidad alta. Recomiendo arrancar por un MVP con menú + reservas y sumar promociones después.",
          viabilityScore: 88,
          recommendedTech: JSON.stringify([
            "Next.js",
            "React",
            "PostgreSQL",
            "Tailwind CSS",
          ]),
          emailDraft:
            "Hola Lucía,\n\n¡Gracias por escribirme! Tu idea para Cafetería Aroma me parece muy buena y totalmente realizable. Puedo armarte la web con menú online, reservas y un panel simple para tus promociones.\n\n¿Te parece si coordinamos una llamada corta esta semana para repasar el alcance y los tiempos? Contame qué día te viene bien.\n\n¡Saludos!\nJazmin D'Onofrio",
          modelUsed: "seed (ejemplo)",
        },
      },
    },
  });

  console.log("Lead de ejemplo creado:", lead.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
