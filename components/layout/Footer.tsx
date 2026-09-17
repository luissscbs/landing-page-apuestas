import { FOOTER_DISCLAIMER, LEGAL_LINKS, SITE } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-zinc-950">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-400 text-sm font-750 text-zinc-950">
                P50
              </span>
              <span className="text-base font-750 text-white">P50 Sports</span>
            </p>
            <p className="mt-4 max-w-md text-sm font-450 leading-6 text-zinc-400">
              {FOOTER_DISCLAIMER}
            </p>
            <p className="mt-3 text-sm font-450 text-zinc-500">
              Contacto ayuda:{" "}
              <a
                className="underline hover:text-zinc-300"
                href={`mailto:${SITE.supportEmail}`}
              >
                {SITE.supportEmail}
              </a>
            </p>
          </div>

          <nav aria-label="Legal">
            <p className="text-sm font-750 text-white">Legal</p>
            <ul className="mt-3 space-y-2">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-sm font-450 text-zinc-400 hover:text-white"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="/juego-responsable#autoexclusion"
                  className="text-sm font-450 text-zinc-400 hover:text-white"
                >
                  Autoexclusión y límites
                </a>
              </li>
            </ul>
          </nav>

          <nav aria-label="Ayuda por país">
            <p className="text-sm font-750 text-white">Juego responsable</p>
            <ul className="mt-3 space-y-2 text-sm font-450 text-zinc-400">
              <li>España: Juega con responsabilidad. 18+</li>
              <li>Colombia: Juegue legal, apueste legal</li>
              <li>México y Argentina: +18, verifica el operador local</li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs font-450 text-zinc-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 P50 Sports. Todos los derechos reservados. +18</p>
          <p>Las apuestas son entretenimiento, no una forma de ganar dinero.</p>
        </div>
      </div>
    </footer>
  );
}
