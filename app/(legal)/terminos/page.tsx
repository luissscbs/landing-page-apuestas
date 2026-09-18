import { SITE } from "@/lib/site";

export default function TerminosPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 md:px-6">
      <p className="text-xs font-750 uppercase tracking-[0.18em] text-lime-400">Legal</p>
      <h1 className="mt-3 text-3xl font-750 text-white">Términos y Condiciones</h1>
      <div className="mt-6 space-y-4 text-sm font-450 leading-7 text-zinc-300">
        <p>
          Esta landing es informativa y de captación oficial para {SITE.brand}. No procesa apuestas ni cobros
          directos en esta página. El registro, la custodia de fondos, los depósitos y las apuestas ocurren
          exclusivamente en la plataforma autorizada de {SITE.brand} (+18).
        </p>
        <h2 id="bono" className="text-lg font-750 text-white">
          Bono de bienvenida 100% hasta $100
        </h2>
        <p>
          Duplicamos tu primer depósito hasta un máximo de $100 USD (o equivalente en moneda local). 
          Condiciones aplicables: Rollover x8 sobre cuotas mínimas ≥ 1.80 en apuestas simples o combinadas. 
          Vigencia de 7 días naturales desde el momento del registro. Depósito mínimo requerido: $10 USD. 
          Válido solo para usuarios mayores de 18 años con identidad verificada. Juega con moderación.
        </p>
        <h2 className="text-lg font-750 text-white">Edad mínima legal y verificación de identidad</h2>
        <p>
          El acceso está estrictamente restringido a personas de 18 años cumplidos o más (o la mayoría de edad 
          legal aplicable en tu país de residencia). Se exigirá la verificación documental (KYC) antes de 
          procesar cualquier retiro de fondos.
        </p>
        <h2 className="text-lg font-750 text-white">Políticas de Juego Responsable</h2>
        <p>
          Las apuestas deportivas son exclusivamente una actividad de entretenimiento y recreación, jamás deben 
          considerarse un empleo, inversión con rendimiento asegurado ni método para solucionar problemas económicos. 
          Ponemos a tu disposición herramientas para limitar depósitos diarios/semanales/mensuales, pausas temporales 
          y autoexclusión definitiva. Consulta nuestra guía de{" "}
          <a className="text-lime-400 underline" href="/juego-responsable">
            Juego Responsable
          </a>.
        </p>
      </div>
    </main>
  );
}
