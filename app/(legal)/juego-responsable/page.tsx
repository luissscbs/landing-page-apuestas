export default function JuegoResponsablePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 md:px-6">
      <p className="text-xs font-750 uppercase tracking-[0.18em] text-lime-400">+18</p>
      <h1 className="mt-3 text-3xl font-750 text-white">Juego responsable</h1>
      <div className="mt-6 space-y-4 text-sm font-450 leading-7 text-zinc-300">
        <p>
          +18. Juega con responsabilidad. El juego puede generar adicción. Las
          apuestas son entretenimiento, no una forma de ganar dinero.
        </p>
        <h2 id="autoexclusion" className="text-lg font-750 text-white">
          Límites y autoexclusión
        </h2>
        <p>
          Define límites de depósito y tiempo en la app de P50. Si necesitas
          parar, usa la autoexclusión del operador o pide ayuda en los centros
          de atención al jugador de tu país (España DGOJ, Colombia Coljuegos,
          México SEGOB, Argentina LOTBA según provincia).
        </p>
        <p>
          Señales de alerta: apostar para recuperar pérdidas, ocultar el juego o
          gastar más de lo planeado. Si te ocurre, busca ayuda profesional.
        </p>
      </div>
    </main>
  );
}
