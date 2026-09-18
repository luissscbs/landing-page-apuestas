import SectionHeading from "@/components/ui/SectionHeading";
import { SITE } from "@/lib/site";

const BENEFITS = [
  {
    icon: "⚡",
    tag: "Margen < 3.2%",
    title: "Cuotas con Menor Margen",
    text: "Minimizamos el sobreprecio de la casa para ofrecer pagos más altos en cada partido de fútbol y grandes ligas mundiales.",
  },
  {
    icon: "🧠",
    tag: "IA & Estadística",
    title: "Modelos Probabilísticos",
    text: "Algoritmos Dixon-Coles y Machine Learning calculan las probabilidades reales de cada evento, ayudándote a tomar decisiones informadas.",
  },
  {
    icon: "💸",
    tag: "Instant Payout",
    title: "Retiros en Menos de 15 Minutos",
    text: "Procesamiento automatizado de pagos directos a tu banco o monedero electrónico sin esperas ni comisiones injustificadas.",
  },
  {
    icon: "🛡️",
    tag: "+18 Seguro",
    title: "Juego Seguro y Control",
    text: "Herramientas integradas para definir límites de depósito, tiempo de sesión y autoexclusión. Tu entretenimiento protegido siempre.",
  },
];

export default function Benefits() {
  return (
    <section id="beneficios" className="bg-[#070709] py-16 md:py-24 border-t border-white/5">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Ventajas Competitivas"
          title={`Por qué los apostadores eligen ${SITE.brand}`}
          sub="Combinamos cuotas matemáticas de nivel profesional con la experiencia de usuario más limpia y rápida."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <article
              key={b.title}
              className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/80 to-zinc-950/80 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-lime-400/40 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800 text-xl border border-white/10 group-hover:scale-110 transition-transform">
                    {b.icon}
                  </span>
                  <span className="rounded-full bg-lime-400/10 border border-lime-400/20 px-2.5 py-0.5 text-[10px] font-750 text-lime-300">
                    {b.tag}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-750 text-white group-hover:text-lime-300 transition-colors">
                  {b.title}
                </h3>
                <p className="mt-2.5 text-sm font-450 leading-relaxed text-zinc-400">
                  {b.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
