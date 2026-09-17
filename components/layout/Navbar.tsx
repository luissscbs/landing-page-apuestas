import { NAV_LINKS } from "@/lib/site";
import CtaButton from "@/components/ui/CtaButton";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/85 backdrop-blur">
      <nav
        aria-label="Navegación principal"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6"
      >
        <a href="#inicio" className="flex items-center gap-2" aria-label="P50 Sports inicio">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lime-400 text-sm font-750 text-zinc-950">
            P50
          </span>
          <span className="text-base font-750 tracking-tight text-white">
            P50 Sports
          </span>
          <span className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] font-750 text-zinc-300">
            +18
          </span>
        </a>

        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-450 text-zinc-400 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://app.p50sports.com/login?redirect=%2Fdeportes%2Ffutbol"
            target="_blank"
            rel="noopener sponsored"
            className="hidden min-h-[44px] items-center rounded-full px-4 text-sm font-450 text-zinc-300 hover:text-white sm:inline-flex"
          >
            Entrar
          </a>
          <CtaButton medium="cta_navbar" className="px-5 py-2.5 text-sm">
            Crear cuenta gratis
          </CtaButton>
        </div>
      </nav>
    </header>
  );
}
