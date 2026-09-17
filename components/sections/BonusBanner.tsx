import CtaButton from "@/components/ui/CtaButton";

export default function BonusBanner() {
  return (
    <section id="bono" className="bg-zinc-950 pb-16 md:pb-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="overflow-hidden rounded-3xl border border-lime-400/25 bg-gradient-to-br from-lime-400/15 via-zinc-900 to-zinc-900 p-8 md:p-10">
          <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
            <div>
              <p className="text-xs font-750 uppercase tracking-[0.18em] text-lime-300">
                Bono de bienvenida
              </p>
              <h2 className="mt-3 text-3xl font-750 text-white md:text-4xl">
                Bono 100% hasta $100 en tu primer depósito
              </h2>
              <ul className="mt-4 space-y-2 text-sm font-450 leading-6 text-zinc-300">
                <li>· Rollover x8 en cuotas ≥ 1.80</li>
                <li>· Válido 7 días desde el registro · Depósito mínimo $10</li>
                <li>· Solo +18 · Sujeto a Términos y Condiciones</li>
              </ul>
              <p className="mt-3 text-xs font-450 text-zinc-500">
                Juega con responsabilidad. Ejemplo correcto, sin promesas de ganancias.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <CtaButton medium="cta_bonus" className="w-full">
                Quiero mi bono
              </CtaButton>
              <a
                href="/terminos#bono"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/20 px-6 text-sm font-450 text-white hover:bg-white/10"
              >
                Ver T&amp;C del bono
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
