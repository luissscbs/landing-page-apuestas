import SectionHeading from "@/components/ui/SectionHeading";

const QUOTES = [
  {
    name: "Diego M. · CDMX",
    text: "Me registré en minutos y las cuotas se entienden a la primera. Uso límites semanales desde la app.",
  },
  {
    name: "Carolina R. · Bogotá",
    text: "Lo que más me gusta es que todo es claro: T&C del bono a un clic y retiros sin vueltas.",
  },
  {
    name: "Javier L. · Madrid",
    text: "Sigo LaLiga en vivo y comparo cuotas rápido desde el móvil. El soporte responde en español.",
  },
];

export default function Testimonials() {
  return (
    <section aria-label="Opiniones" className="border-y border-white/10 bg-zinc-900/40 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Prueba social"
          title="Jugadores que ya usan P50"
          sub="Opiniones sobre la experiencia. Las apuestas son entretenimiento: nunca garantizan ganancias."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {QUOTES.map((q) => (
            <figure key={q.name} className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
              <blockquote className="text-sm font-450 leading-6 text-zinc-300">
                &ldquo;{q.text}&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-sm font-750 text-white">{q.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
