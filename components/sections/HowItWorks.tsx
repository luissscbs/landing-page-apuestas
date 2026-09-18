import SectionHeading from "@/components/ui/SectionHeading";
import { SITE } from "@/lib/site";

const STEPS = [
  {
    n: "01",
    title: "Crea tu cuenta gratis",
    text: "Regístrate en menos de 60 segundos con tus datos básicos. Verificación rápida de mayoría de edad (+18) conforme a la normativa legal.",
  },
  {
    n: "02",
    title: "Deposita y activa tu Bono",
    text: "Elige tu método de pago preferido (transferencia, tarjeta o billeteras digitales). Duplicamos tu primer depósito hasta $100 de forma automática.",
  },
  {
    n: "03",
    title: "Apuesta con ventaja matemática",
    text: "Consulta las cuotas en vivo y los indicadores de valor (+EV). Haz tus pronósticos con confianza y retira tus ganancias en minutos.",
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="border-t border-white/5 bg-zinc-950/60 py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Proceso Simple"
          title={`Empieza a jugar en ${SITE.brand} en 3 pasos`}
          sub="Sin complicaciones burocráticas, con total transparencia en depósitos y retiros."
        />
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="relative flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/60 to-zinc-950/80 p-8 transition-all hover:border-white/20"
            >
              <div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-500 text-lg font-900 text-zinc-950 shadow-[0_0_20px_rgba(163,230,53,0.3)]">
                  {s.n}
                </span>
                <h3 className="mt-6 text-xl font-750 text-white">{s.title}</h3>
                <p className="mt-3 text-sm font-450 leading-relaxed text-zinc-400">
                  {s.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
