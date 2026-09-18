import { FOOTER_DISCLAIMER, LEGAL_LINKS, SITE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#050507] text-zinc-400">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
          {/* Columna Marca & Aviso Legal */}
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500 text-xs font-900 text-zinc-950">
                CBS
              </div>
              <span className="text-base font-750 tracking-tight text-white">
                {SITE.brand}
              </span>
              <span className="rounded-full border border-lime-400/30 bg-lime-400/10 px-2 py-0.5 text-[11px] font-750 text-lime-300">
                +18
              </span>
            </div>
            <p className="mt-4 max-w-md text-sm font-450 leading-6 text-zinc-400">
              {FOOTER_DISCLAIMER}
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Cifrado Bancario SSL 256-bit
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-lime-400" />
                Auditoría RNG Certificada
              </span>
            </div>
            <p className="mt-4 text-xs text-zinc-500">
              Soporte y consultas de cuenta:{" "}
              <a
                className="text-zinc-300 underline hover:text-white"
                href={`mailto:${SITE.supportEmail}`}
              >
                {SITE.supportEmail}
              </a>
            </p>
          </div>

          {/* Columna Enlaces Legales */}
          <nav aria-label="Legal">
            <p className="text-sm font-750 text-white tracking-wide uppercase">Legal & Compliance</p>
            <ul className="mt-4 space-y-2.5">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-sm font-450 text-zinc-400 transition-colors hover:text-lime-300"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="/juego-responsable#autoexclusion"
                  className="text-sm font-450 text-zinc-400 transition-colors hover:text-lime-300"
                >
                  Límites de Depósito y Autoexclusión
                </a>
              </li>
            </ul>
          </nav>

          {/* Columna Jurisdicciones y Ayuda */}
          <nav aria-label="Ayuda por país">
            <p className="text-sm font-750 text-white tracking-wide uppercase">Organismos de Ayuda</p>
            <ul className="mt-4 space-y-2.5 text-xs text-zinc-400 leading-5">
              <li>
                <strong className="text-zinc-300">España:</strong> FEJAR (900 200 225) · DGOJ Juego Seguro.
              </li>
              <li>
                <strong className="text-zinc-300">Colombia:</strong> Coljuegos · Línea Salvemos Vidas (01 8000 112 888).
              </li>
              <li>
                <strong className="text-zinc-300">México:</strong> SEGOB / Centro de Atención Ciudadana (800 911 2000).
              </li>
              <li>
                <strong className="text-zinc-300">Latam / Global:</strong> Gamblers Anonymous & Gambling Therapy.
              </li>
            </ul>
          </nav>
        </div>

        {/* Barra inferior de copyright */}
        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs font-450 text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {SITE.brand}. Todos los derechos reservados. Solo para mayores de 18 años.</p>
          <p className="text-zinc-400">
            Juega con moderación. El juego debe ser siempre entretenimiento.
          </p>
        </div>
      </div>
    </footer>
  );
}
