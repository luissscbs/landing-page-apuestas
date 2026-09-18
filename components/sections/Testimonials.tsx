import SectionHeading from "@/components/ui/SectionHeading";
import { SITE } from "@/lib/site";

const QUOTES = [
  {
    name: "Diego M.",
    location: "Madrid, España",
    badge: "Apostador Estratégico",
    rating: "★★★★★",
    text: "La función de cuotas con valor (+EV) y las probabilidades del modelo son fantásticas. Además, retiré mis ganancias a mi cuenta en menos de 10 minutos reales.",
  },
  {
    name: "Carolina R.",
    location: "Bogotá, Colombia",
    badge: "Usuario Verificada",
    rating: "★★★★★",
    text: "Lo que más valoro de CBS Sports es la honestidad. Las condiciones del bono de bienvenida se entienden a la primera y las cuotas de LaLiga son claramente superiores.",
  },
  {
    name: "Sebastián V.",
    location: "CDMX, México",
    badge: "Fan de Fútbol Internacional",
    rating: "★★★★★",
    text: "La interfaz es rapidísima en el celular y no se traba como otras casas. Me gusta poder fijarme límites semanales de depósito directamente en la app.",
  },
];

export default function Testimonials() {
  return (
    <section aria-label="Opiniones y Experiencias" className="border-t border-white/5 bg-zinc-950/70 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Prueba Social"
          title={`Lo que opinan los jugadores de ${SITE.brand}`}
          sub="Opiniones reales sobre la agilidad de los retiros, las cuotas y el soporte técnico."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {QUOTES.map((q) => (
            <figure
              key={q.name}
              className="flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 p-7 transition-all hover:border-lime-400/30"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-750 tracking-wider text-lime-400">
                    {q.rating}
                  </span>
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-450 text-zinc-400">
                    {q.badge}
                  </span>
                </div>
                <blockquote className="mt-4 text-sm font-450 leading-relaxed text-zinc-300">
                  &ldquo;{q.text}&rdquo;
                </blockquote>
              </div>
              <figcaption className="mt-6 border-t border-white/5 pt-4">
                <p className="text-sm font-750 text-white">{q.name}</p>
                <p className="text-xs font-450 text-zinc-500">{q.location}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-zinc-500">
          Las apuestas son una actividad de ocio y entretenimiento para mayores de 18 años. Los testimonios reflejan experiencias individuales y no constituyen garantía de ganancias.
        </p>
      </div>
    </section>
  );
}
