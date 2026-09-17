import CtaButton from "@/components/ui/CtaButton";

export default function FinalCta() {
  return (
    <section className="bg-zinc-950 pb-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="rounded-3xl border border-white/10 bg-zinc-900 px-6 py-12 text-center md:py-16">
          <h2 className="mx-auto max-w-2xl text-3xl font-750 text-white md:text-4xl">
            Crea tu cuenta gratis y vive el próximo partido
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base font-450 text-zinc-400">
            Registro en minutos en la app segura de P50. Solo +18. Juega con
            responsabilidad.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <CtaButton medium="cta_final">Crear cuenta gratis</CtaButton>
            <CtaButton variant="ghost" destination="login" medium="cta_final_login">
              Ya tengo cuenta
            </CtaButton>
          </div>
        </div>
      </div>
    </section>
  );
}
