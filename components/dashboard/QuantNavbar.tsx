"use client";

import React from "react";
import type { BackendHealth } from "@/lib/cbs";

export default function QuantNavbar({ health }: { health: BackendHealth | null }) {
  const isOnline = health?.status === "ok";

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-700 bg-zinc-900 text-xs font-750 text-zinc-100 tracking-tight">
            CQ
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-sm font-750 tracking-tight text-zinc-100">
              CBS Quant
            </span>
            <span className="text-[11px] font-mono font-450 text-zinc-400 hidden sm:inline">
              v0.2 · Probabilidades & Cuotas
            </span>
          </div>
        </div>

        {/* Pipeline Status */}
        <div className="flex items-center gap-2.5">
          {health?.matches && (
            <div className="hidden md:flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/50 px-2.5 py-1 text-xs text-zinc-400">
              <span className="text-zinc-500">Muestra:</span>
              <span className="font-mono text-zinc-200" suppressHydrationWarning>
                {health.matches} partidos
              </span>
            </div>
          )}

          <div className="hidden lg:flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/50 px-2.5 py-1 text-xs text-zinc-400">
            <span className="text-zinc-500">Modelo:</span>
            <span className="text-zinc-200">Dixon-Coles + xG</span>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 px-2.5 py-1 text-xs">
            {isOnline ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-zinc-300 font-mono text-[11px]">Backend Activo</span>
              </>
            ) : (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                <span className="text-zinc-400 font-mono text-[11px]">Desconectado</span>
              </>
            )}
          </div>

          <a
            href="http://127.0.0.1:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/40 px-2.5 py-1 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors font-mono text-[11px]"
          >
            <span>API Docs</span>
            <svg className="h-3 w-3 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}
