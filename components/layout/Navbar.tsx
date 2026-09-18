"use client";

import { useState } from "react";
import { NAV_LINKS, SITE } from "@/lib/site";
import CtaButton from "@/components/ui/CtaButton";
import { getLoginUrl } from "@/lib/cbs";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070709]/85 backdrop-blur-xl transition-all">
      <nav
        aria-label="Navegación principal"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 md:px-6"
      >
        {/* Logotipo CBS Sports */}
        <a
          href="#inicio"
          className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]"
          aria-label={`${SITE.brand} inicio`}
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500 shadow-[0_0_15px_rgba(163,230,53,0.35)]">
            <span className="text-xs font-900 tracking-tighter text-zinc-950">
              CBS
            </span>
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full border border-zinc-950 bg-emerald-400" />
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-750 tracking-tight text-white flex items-center gap-1.5">
              {SITE.brand}
              <span className="rounded-full border border-lime-400/30 bg-lime-400/10 px-1.5 py-0.2 text-[10px] font-750 text-lime-300">
                PRO
              </span>
            </span>
            <span className="text-[10px] font-450 tracking-wide text-zinc-400 -mt-0.5">
              Predictive Sportsbook
            </span>
          </div>
        </a>

        {/* Links de navegación escritorio */}
        <div className="hidden items-center gap-6 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-450 text-zinc-300 transition-colors hover:text-lime-300"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Acciones derecha */}
        <div className="flex items-center gap-2.5">
          <a
            href={getLoginUrl()}
            target="_blank"
            rel="noopener sponsored"
            className="hidden min-h-[42px] items-center rounded-full px-4 text-sm font-450 text-zinc-300 transition-colors hover:text-white sm:inline-flex"
          >
            Iniciar sesión
          </a>
          <CtaButton
            medium="cta_navbar"
            className="h-[42px] px-5 text-sm"
          >
            Registrarse
          </CtaButton>

          {/* Botón hamburguesa móvil */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-zinc-300 hover:text-white lg:hidden"
            aria-label="Abrir menú"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Menú desplegable en móvil */}
      {mobileMenuOpen && (
        <div className="border-b border-white/10 bg-[#070709] px-4 py-4 lg:hidden">
          <div className="flex flex-col space-y-3">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-450 text-zinc-300 hover:bg-zinc-900 hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-2">
              <a
                href={getLoginUrl()}
                target="_blank"
                rel="noopener sponsored"
                className="block w-full text-center py-2.5 text-sm font-450 text-zinc-300 hover:text-white"
              >
                Iniciar sesión
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
