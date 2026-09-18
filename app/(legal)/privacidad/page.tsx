import { SITE } from "@/lib/site";

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 md:px-6">
      <p className="text-xs font-750 uppercase tracking-[0.18em] text-lime-400">Legal</p>
      <h1 className="mt-3 text-3xl font-750 text-white">Política de Privacidad</h1>
      <div className="mt-6 space-y-4 text-sm font-450 leading-7 text-zinc-300">
        <p>
          En {SITE.brand} priorizamos la confidencialidad de tus datos. En esta landing pública recopilamos 
          únicamente la telemetría esencial de navegación anónima (parámetros de campaña UTM y fuentes de referencia) 
          y una cookie local técnica (<code>age_verified</code>) que recuerda tu confirmación de mayoría de edad.
        </p>
        <p>
          No almacenamos datos bancarios, contraseñas ni información de tarjetas en esta landing. 
          Todas las transacciones de pago y la creación de cuenta se procesan mediante cifrado SSL/TLS 
          de grado bancario en la plataforma oficial de {SITE.brand}.
        </p>
        <p>
          Para cualquier consulta de privacidad, baja de datos o ejercicio de derechos ARCO, contáctanos en:{" "}
          <a className="text-lime-400 underline" href={`mailto:${SITE.supportEmail}`}>
            {SITE.supportEmail}
          </a>.
        </p>
      </div>
    </main>
  );
}
