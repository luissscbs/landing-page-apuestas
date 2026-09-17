export default function TerminosPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 md:px-6">
      <p className="text-xs font-750 uppercase tracking-[0.18em] text-lime-400">Legal</p>
      <h1 className="mt-3 text-3xl font-750 text-white">Términos y Condiciones</h1>
      <div className="mt-6 space-y-4 text-sm font-450 leading-7 text-zinc-300">
        <p>
          Esta landing es informativa y de captación. No procesa apuestas ni pagos.
          El registro, los depósitos y las apuestas ocurren exclusivamente en la
          plataforma P50 Sports (+18).
        </p>
        <h2 id="bono" className="text-lg font-750 text-white">
          Bono de bienvenida
        </h2>
        <p>
          Bono 100% hasta $100. Rollover x8 en cuotas ≥1.80. Válido 7 días.
          Depósito mínimo $10. Solo +18. Sujeto a verificación de identidad y
          T&amp;C del operador P50. Juega con responsabilidad.
        </p>
        <h2 className="text-lg font-750 text-white">Edad y verificación</h2>
        <p>
          Solo mayores de 18 años. Se requiere verificación de edad antes del
          registro. Nos reservamos redirigir únicamente a usuarios verificados.
        </p>
        <h2 className="text-lg font-750 text-white">Juego responsable</h2>
        <p>
          Las apuestas son entretenimiento, no una forma de ganar dinero ni una
          solución económica. Usa límites y autoexclusión. Ver{" "}
          <a className="underline" href="/juego-responsable">Juego responsable</a>.
        </p>
      </div>
    </main>
  );
}
