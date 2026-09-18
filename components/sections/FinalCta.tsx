import CtaButton from "@/components/ui/CtaButton";
import { SITE } from "@/lib/site";

export default function FinalCta() {
  return (
    <section className="bg-[#070709] pb-24 pt-8">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-zinc-900 via-zinc-950 to-[#070709] px-6 py-14 text-center shadow-2xl md:py-20">
          {/* Luz ambiental de fondo */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(163,230,53,0.12),transparent_70%)]"
          />

          <div className="relative mx-auto max-w-2xl">
            <span className="inline-flex rounded-full border border-lime-400/30 bg-lime-400/10 px-3.5 py-1 text-xs font-750 text-lime-300">
              Regístrate en menos de 1 minuto · +18
            </span>
            <h2 className="mt-5 text-3xl font-750 tracking-tight text-white sm:text-4xl md:text-5xl">
              Vive el próximo gran partido con cuotas inteligentes
            </h2>
            <p className="mt-4 text-base font-450 leading-relaxed text-zinc-300">
              Crea tu cuenta gratuita en {SITE.brand}, obtén tu Bono de Bienvenida del 100% y
              compara cuotas en vivo con el respaldo de modelos predictivos.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3.5 sm:flex-row sm:items-center">
              <CtaButton
                medium="cta_final"
                variant="accent"
                className="w-full text-base py-3.5 sm:w-auto shadow-xl"
              >
                Crear cuenta y duplicar depósito
              </CtaButton>
              <CtaButton
                variant="ghost"
                destination="login"
                medium="cta_final_login"
                className="w-full text-base py-3.5 sm:w-auto"
              >
                Ya tengo cuenta en {SITE.brand}
              </CtaButton>
            </div>
            <p className="mt-6 text-xs font-450 text-zinc-500">
              Juega con responsabilidad. Las apuestas no garantizan ingresos. Solo mayores de 18 años.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
