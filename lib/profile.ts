// Perfil de Jazmin. La IA lo usa para evaluar el "encaje" de cada lead
// con sus habilidades reales. Editá esto cuando cambien tus skills.

export const OWNER = {
  name: "Jazmin D'Onofrio",
  role: "Estudiante de Ingeniería en Sistemas de Información (UTN)",
  tagline:
    "Técnica en Programación · Desarrollo web y análisis de datos con enfoque práctico",
  about:
    "Estudiante de Ingeniería en Sistemas de Información con una fuerte base " +
    "técnica y orientación a la resolución de problemas. Experiencia práctica " +
    "en desarrollo de soluciones digitales, análisis de requerimientos y " +
    "manejo intensivo de datos. Persona proactiva, orientada al trabajo en " +
    "equipo y motivada por aplicar mis conocimientos técnicos en la " +
    "optimización de procesos.",
  email: "dariodonofrio90@gmail.com",
  location: "Argentina",
  skills: {
    lenguajes: ["Java", "Python", "JavaScript", "SQL", "Haskell", "Prolog", "Smalltalk"],
    web: ["React", "Node.js", "HTML", "CSS", "APIs REST"],
    datos: ["SQL", "Power BI", "Análisis de requerimientos", "Modelado"],
    herramientas: ["Git", "GitHub", "Linux", "Figma", "AutoCAD", "Netlify"],
    metodologias: ["Scrum", "Cursos de IA y desarrollo con IA"],
  },
  education: [
    {
      title: "Ingeniería en Sistemas de Información",
      place: "Universidad Tecnológica Nacional (UTN)",
      period: "En curso",
    },
    {
      title: "Técnica en Programación",
      place: "EPET N.º 8 — Ing. Juan Carlos Fontanive",
      period: "Finalizado",
    },
  ],
};

// Versión compacta que se le pasa al prompt de la IA.
export const OWNER_PROFILE_FOR_AI = `
Nombre: ${OWNER.name}
Rol: ${OWNER.role}
Perfil: ${OWNER.about}
Lenguajes: ${OWNER.skills.lenguajes.join(", ")}
Web: ${OWNER.skills.web.join(", ")}
Datos: ${OWNER.skills.datos.join(", ")}
Herramientas: ${OWNER.skills.herramientas.join(", ")}
Nivel: estudiante avanzado / intermedio-avanzado.
`.trim();
