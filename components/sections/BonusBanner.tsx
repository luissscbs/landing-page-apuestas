import CtaButton from "@/components/ui/CtaButton";
import { SITE } from "@/lib/site";

export default function BonusBanner() {
  return (
    <section id="bono" className="bg-[#070709] py-16 md:py-24 border-t border-white/5">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-lime-400/30 bg-gradient-to-br from-lime-400/15 via-zinc-900/90 to-zinc-950 p-8 md:p-12 shadow-[0_0_50px_rgba(163,230,53,0.1)]">
          {/* Luz ambiental */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-lime-400/20 blur-3xl"
          />

          <div className="relative grid gap-8 md:grid-cols-[1.3fr_0.7fr] md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-1 text-xs font-750 text-lime-300">
                <span>Promoción Exclusiva Nuevos Usuarios</span>
              </div>
              <h2 className="mt-4 text-3xl font-750 tracking-tight text-white sm:text-4xl md:text-5xl">
                Bono 100% hasta <span className="text-lime-400">$100 USD</span>
              </h2>
              <p className="mt-3 text-base text-zinc-300 font-450 leading-relaxed">
                Duplicamos tu primer depósito para que comiences con saldo doble en tus partidos favoritos.
              </p>

              {/* Bullets transparentes de T&C */}
              <ul className="mt-5 space-y-2 text-sm font-450 text-zinc-300">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
                  <span><strong>Rollover justo:</strong> Solo x8 en cuotas mínimas ≥ 1.80.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
                  <span><strong>Depósito mínimo:</strong> Desde solo $10 USD. Vigencia de 7 días.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
                  <span><strong>Transparencia total:</strong> Sin letra pequeña abusiva ni retenciones indebidas.</span>
                </li>
              </ul>

              <p className="mt-4 text-xs font-450 text-zinc-500">
                +18. Juega con responsabilidad. Aplican Términos y Condiciones completos de {SITE.brand}.
              </p>
            </div>

            <div className="flex flex-col gap-3.5">
              <CtaButton
                medium="cta_bonus"
                variant="accent"
                className="w-full text-base py-3.5 shadow-xl"
              >
                Reclamar Bono de Bienvenida
              </CtaButton>
              <a
                href="/terminos#bono"
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/20 px-6 text-sm font-450 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                Consultar Términos del Bono
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
