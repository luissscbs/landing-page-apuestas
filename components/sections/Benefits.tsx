import SectionHeading from "@/components/ui/SectionHeading";

const BENEFITS = [
  {
    title: "Cuotas competitivas",
    text: "Cuotas decimales claras en fútbol, con movimiento visible ↑ ↓ y sin letra pequeña.",
  },
  {
    title: "Pagos rápidos",
    text: "Depósitos y retiros ágiles desde la app de P50. Retiro promedio en menos de 24 h.",
  },
  {
    title: "App móvil",
    text: "Sigue partidos en vivo y apuesta desde cualquier lugar con la app de P50 Sports.",
  },
  {
    title: "Soporte 24/7",
    text: "Ayuda en español y herramientas de juego responsable: límites y autoexclusión.",
  },
];

export default function Benefits() {
  return (
    <section id="beneficios" className="bg-zinc-950 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Beneficios P50"
          title="Todo lo que necesitas para vivir el partido"
          sub="Una experiencia simple: cuotas claras, pagos ágiles y control total de tu juego."
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <article
              key={b.title}
              className="rounded-2xl border border-white/10 bg-zinc-900 p-6"
            >
              <h3 className="text-lg font-750 text-white">{b.title}</h3>
              <p className="mt-2 text-sm font-450 leading-6 text-zinc-400">{b.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
