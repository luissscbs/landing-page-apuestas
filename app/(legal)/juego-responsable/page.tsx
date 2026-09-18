import { SITE } from "@/lib/site";

export default function JuegoResponsablePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 md:px-6">
      <p className="text-xs font-750 uppercase tracking-[0.18em] text-lime-400">+18 Legal</p>
      <h1 className="mt-3 text-3xl font-750 text-white">Juego Responsable y Protección al Usuario</h1>
      <div className="mt-6 space-y-4 text-sm font-450 leading-7 text-zinc-300">
        <p>
          En {SITE.brand} promovemos el juego como una actividad lúdica y de entretenimiento. Apostar sin control 
          puede ocasionar dependencia psicológica y dificultades financieras. El juego no es una alternativa 
          laboral ni un medio para solventar deudas.
        </p>
        <h2 id="autoexclusion" className="text-lg font-750 text-white">
          Mecanismos de Control y Autoexclusión
        </h2>
        <p>
          Dentro de tu perfil en la app de {SITE.brand} puedes configurar de inmediato:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-zinc-300">
          <li><strong>Límites de depósito:</strong> Restringe el monto máximo por día, semana o mes.</li>
          <li><strong>Límites de tiempo de sesión:</strong> Notificaciones de tiempo transcurrido en la aplicación.</li>
          <li><strong>Pausa temporal:</strong> Bloqueo preventivo de tu cuenta de 24 horas a 30 días.</li>
          <li><strong>Autoexclusión definitiva:</strong> Cierre permanente e irrevocable de la cuenta.</li>
        </ul>
        <h2 className="text-lg font-750 text-white">Líneas de Asistencia y Ayuda Profesional</h2>
        <p>
          Si sientes que estás perdiendo el control, oculta tus hábitos o apuestas dinero destinado a necesidades básicas, 
          acude a los servicios de apoyo anónimo y gratuito:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-zinc-300">
          <li><strong>España:</strong> FEJAR (Tel. gratuito: 900 200 225) y portal Juego Seguro DGOJ.</li>
          <li><strong>Colombia:</strong> Línea Salvemos Vidas y Coljuegos (01 8000 112 888).</li>
          <li><strong>México:</strong> Centro de Atención Ciudadana contra las Adicciones (800 911 2000).</li>
          <li><strong>Argentina:</strong> Programas de Prevención de Ludopatía y Línea de Ayuda LOTBA (0800-666-6006).</li>
        </ul>
      </div>
    </main>
  );
}
