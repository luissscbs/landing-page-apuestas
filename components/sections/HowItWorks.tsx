import SectionHeading from "@/components/ui/SectionHeading";

const STEPS = [
  { n: "1", title: "Regístrate", text: "Crea tu cuenta gratis en P50 en minutos. Solo +18 con verificación de edad." },
  { n: "2", title: "Deposita", text: "Elige tu método de pago en la app segura de P50. Tú defines tus límites." },
  { n: "3", title: "Apuesta", text: "Elige tu partido y mercado con cuotas decimales claras. Juega con responsabilidad." },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="border-y border-white/10 bg-zinc-900/40 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Cómo funciona"
          title="Empieza en 3 pasos"
        />
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
              <p className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-400 text-base font-750 text-zinc-950">
                {s.n}
              </p>
              <h3 className="mt-4 text-lg font-750 text-white">{s.title}</h3>
              <p className="mt-2 text-sm font-450 leading-6 text-zinc-400">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
