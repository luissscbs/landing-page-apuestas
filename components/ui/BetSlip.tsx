"use client";

import React from "react";
import { useBetSlip } from "@/context/BetSlipContext";
import { getEventUrl } from "@/lib/cbs";
import { trackOddsClick } from "@/lib/analytics";
import { SITE } from "@/lib/site";

export default function BetSlip() {
  const {
    activeBet,
    isOpen,
    isMinimized,
    stake,
    setStake,
    clearBet,
    setIsMinimized,
  } = useBetSlip();

  if (!activeBet || !isOpen) return null;

  const potentialReturn = (stake * activeBet.odds).toFixed(2);
  const netProfit = (stake * (activeBet.odds - 1)).toFixed(2);
  const impliedPct = (activeBet.impliedProb * 100).toFixed(1);
  const modelPct = (activeBet.modelProb * 100).toFixed(1);
  const evSign = activeBet.expectedValuePct > 0 ? "+" : "";
  const evText = `${evSign}${activeBet.expectedValuePct.toFixed(1)}% EV`;

  // Si está minimizado, mostramos un pill discreto en la esquina inferior
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-3 rounded-full border border-lime-400/50 bg-zinc-950/95 px-5 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl hover:border-lime-400 transition-all hover:scale-105"
        >
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-lime-400" />
          </span>
          <div className="text-left">
            <span className="block text-[11px] font-750 uppercase tracking-wider text-lime-400">
              Boleto Activo · 1 Selección
            </span>
            <span className="block text-xs font-750 text-white">
              {activeBet.selectionLabel} @ {activeBet.odds.toFixed(2)} ({evText})
            </span>
          </div>
          <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-750 text-zinc-300">
            Abrir
          </span>
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Boleto de Apuesta Inteligente"
      className="fixed bottom-3 right-3 z-50 w-[calc(100vw-24px)] sm:w-96 max-h-[92vh] overflow-y-auto rounded-3xl border border-white/20 bg-zinc-950/95 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl transition-all animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      {/* Header del Boleto */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-lime-400/20 text-lime-400">
            ⚡
          </div>
          <div>
            <h3 className="text-xs font-750 uppercase tracking-wider text-white">
              Asesor de Apuesta IA
            </h3>
            <p className="text-[10px] text-zinc-400">Cálculo Dixon-Coles & Kelly</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            aria-label="Minimizar boleto"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
            title="Minimizar"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={clearBet}
            aria-label="Cerrar y vaciar boleto"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-rose-400 transition-colors"
            title="Cerrar"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tarjeta del Partido y Selección */}
      <div className="mt-3.5 rounded-2xl border border-white/10 bg-zinc-900/70 p-3.5">
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span>{activeBet.match.league}</span>
          <button
            type="button"
            onClick={clearBet}
            className="text-zinc-500 hover:text-rose-400 transition-colors"
          >
            Borrar
          </button>
        </div>

        <div className="mt-1 text-sm font-750 text-white">
          {activeBet.match.home} <span className="text-zinc-500">vs</span> {activeBet.match.away}
        </div>

        <div className="mt-2.5 flex items-center justify-between rounded-xl bg-zinc-950/80 p-2.5 border border-white/5">
          <div>
            <span className="block text-[10px] uppercase font-750 text-zinc-400">
              Tu Selección
            </span>
            <span className="text-sm font-750 text-lime-300">
              {activeBet.selectionLabel}
            </span>
          </div>
          <div className="text-right">
            <span className="block text-[10px] uppercase font-750 text-zinc-400">
              Cuota Decimal
            </span>
            <span className="text-base font-900 text-white">
              {activeBet.odds.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Diagnóstico Cuantitativo del Modelo ML */}
      <div className="mt-3 rounded-2xl border border-white/10 bg-zinc-900/50 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-750 text-zinc-300">Diagnóstico del Modelo</span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-750 border ${
              activeBet.isPositiveEv
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                : "bg-rose-500/20 border-rose-500/40 text-rose-300"
            }`}
          >
            {activeBet.isPositiveEv ? `⚡ ${evText}` : `⚠️ ${evText}`}
          </span>
        </div>

        {/* Comparativa de Probabilidad */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-zinc-400">
            <span>Probabilidad real estimada (IA):</span>
            <span className="font-750 text-cyan-300">{modelPct}%</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Probabilidad implícita de la casa:</span>
            <span className="font-750 text-zinc-300">{impliedPct}%</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Cuota justa estimada (Fair Odds):</span>
            <span className="font-750 text-white">{activeBet.fairOdds.toFixed(2)}</span>
          </div>
        </div>

        {/* Barra Visual comparativa */}
        <div className="space-y-1">
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              style={{ width: `${Math.min(100, activeBet.modelProb * 100)}%` }}
              className={`transition-all ${activeBet.isPositiveEv ? "bg-lime-400" : "bg-amber-400"}`}
              title={`Modelo: ${modelPct}%`}
            />
          </div>
          <p className="text-[10px] text-zinc-400 leading-tight">
            {activeBet.isPositiveEv ? (
              <span className="text-emerald-300">
                ✓ <strong>Ventaja matemática:</strong> La casa paga cuota {activeBet.odds.toFixed(2)} cuando el modelo estima {activeBet.fairOdds.toFixed(2)}.
              </span>
            ) : (
              <span className="text-amber-300">
                ! <strong>Sin valor matemático:</strong> La cuota de la casa tiene un margen negativo respecto al modelo.
              </span>
            )}
          </p>
        </div>

        {/* Recomendación Criterio de Kelly */}
        <div className="rounded-xl bg-zinc-950/70 p-2 border border-white/5 text-[11px] text-zinc-300 flex items-center justify-between">
          <span>Sugerencia Quarter-Kelly:</span>
          <span className="font-750 text-lime-400">
            {activeBet.recommendedKellyStakePct > 0
              ? `${activeBet.recommendedKellyStakePct}% del bankroll`
              : "0% (No recomendada)"}
          </span>
        </div>
      </div>

      {/* Simulador de Importe / Stake */}
      <div className="mt-3.5 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-750 text-zinc-300">Monto a Simular ($ USD):</span>
          <span className="font-900 text-lime-400">${stake}</span>
        </div>

        <div className="flex gap-1.5">
          {[10, 25, 50, 100].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStake(s)}
              className={`flex-1 rounded-xl py-1.5 text-xs font-750 transition-all ${
                stake === s
                  ? "bg-lime-400 text-zinc-950 shadow-[0_0_12px_rgba(163,230,53,0.3)]"
                  : "border border-white/10 bg-zinc-900/80 text-zinc-400 hover:text-white"
              }`}
            >
              ${s}
            </button>
          ))}
        </div>

        {/* Entrada directa personalizada */}
        <input
          type="range"
          min="5"
          max="250"
          step="5"
          value={stake}
          onChange={(e) => setStake(Number(e.target.value))}
          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-lime-400"
        />

        {/* Retorno y Beneficio Neto */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-zinc-900/90 p-3 border border-white/5">
          <div>
            <span className="block text-[10px] text-zinc-400">Retorno Total</span>
            <span className="text-lg font-900 text-lime-400">${potentialReturn}</span>
          </div>
          <div className="text-right">
            <span className="block text-[10px] text-zinc-400">Ganancia Neta</span>
            <span className="text-lg font-900 text-emerald-300">+${netProfit}</span>
          </div>
        </div>
      </div>

      {/* Botón de Acción Principal para Ejecutar */}
      <div className="mt-4 space-y-2">
        <a
          href={getEventUrl(activeBet.match.id, "cta_betslip_execute")}
          target="_blank"
          rel="noopener sponsored"
          onClick={() => trackOddsClick(activeBet.match.id, activeBet.selection, activeBet.odds)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-lime-400 via-lime-400 to-emerald-400 px-4 py-3 text-center text-sm font-900 text-zinc-950 shadow-[0_0_20px_rgba(163,230,53,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(163,230,53,0.5)] active:scale-95"
        >
          <span>Apostar en {SITE.brand}</span>
          <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs font-900">
            Cuota {activeBet.odds.toFixed(2)}
          </span>
        </a>

        <p className="text-center text-[10px] text-zinc-500">
          Redirección segura a evento oficial · Mayores de 18 años
        </p>
      </div>
    </aside>
  );
}
