export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14 md:px-6">
      <p className="text-xs font-750 uppercase tracking-[0.18em] text-lime-400">Legal</p>
      <h1 className="mt-3 text-3xl font-750 text-white">Política de Privacidad</h1>
      <div className="mt-6 space-y-4 text-sm font-450 leading-7 text-zinc-300">
        <p>
          Recogemos el mínimo necesario: eventos anónimos de navegación (UTM,
          clics) y cookie <code>age_verified</code> para recordar tu confirmación
          de edad. No pedimos contraseñas ni datos bancarios en esta landing.
        </p>
        <p>
          Los datos de registro y pago se gestionan directamente en P50 Sports
          bajo sus propios Términos y Privacidad. Contacto: ayuda@p50sports.com.
        </p>
      </div>
    </main>
  );
}
