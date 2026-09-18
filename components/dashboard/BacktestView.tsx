"use client";

import React, { useState } from "react";
import type { BacktestPerformance } from "@/lib/cbs";

export default function BacktestView({
  backtestData,
}: {
  backtestData: BacktestPerformance | null;
}) {
  const [resultFilter, setResultFilter] = useState<"all" | "won" | "lost">("all");

  if (!backtestData) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-12 text-center text-zinc-400 font-sans font-450">
        <p className="text-sm font-750 text-zinc-200">Cargando datos de la auditoría histórica...</p>
        <p className="mt-1 text-xs text-zinc-400">Verifica la conexión con el endpoint de backtest.</p>
      </div>
    );
  }

  const { summary, by_odds, by_league, recent_bets } = backtestData;

  const filteredBets = recent_bets.filter((b) => {
    if (resultFilter === "won" && b.result !== "won") return false;
    if (resultFilter === "lost" && b.result !== "lost") return false;
    return true;
  });

  return (
    <div className="space-y-5 font-sans font-450">
      {/* Resumen Metodológico */}
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[10px] font-mono font-450 text-zinc-300 uppercase">
                Auditoría Walk-Forward
              </span>
              <span className="text-xs font-mono font-450 text-zinc-400">
                1.619 partidos históricos (2024-2026)
              </span>
            </div>
            <h2 className="text-sm font-750 text-zinc-100">
              Rendimiento Histórico y Segmentación por Cuotas
            </h2>
            <p className="text-xs font-450 text-zinc-400 leading-relaxed max-w-3xl">
              El análisis estadístico retrospectivo demuestra que operar en cuotas altas genera pérdidas frente al margen de las casas (<span className="text-rose-400 font-mono">-7.9% ROI</span>). Por contraste, en el rango de <span className="text-zinc-200 font-750">Cuotas Bajas (&lt; 1.80)</span> el modelo genera un <span className="text-emerald-400 font-mono font-750">+5.6% ROI</span> con un <span className="text-zinc-200 font-mono font-750">67.8% de aciertos</span>.
            </p>
          </div>

          <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3 text-center min-w-[180px] shrink-0">
            <span className="block text-[10px] font-mono font-450 uppercase text-zinc-400">Control de Riesgo</span>
            <span className="mt-0.5 block text-base font-750 font-mono text-zinc-200">Shrinkage w=0.15</span>
            <span className="mt-0.5 block text-[11px] font-mono font-450 text-zinc-400">
              Filtro de cuotas dudosas
            </span>
          </div>
        </div>
      </div>

      {/* KPIs Globales */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
          <span className="text-[11px] font-mono font-450 uppercase tracking-wider text-zinc-400">
            Total Operaciones
          </span>
          <div className="mt-1 flex items-baseline gap-1.5 font-mono">
            <span className="text-lg font-750 text-zinc-100">{summary.total_bets}</span>
            <span className="text-[10px] font-450 text-zinc-400">auditadas</span>
          </div>
          <p className="mt-0.5 text-[11px] font-mono font-450 text-zinc-400">Cuota promedio: {summary.avg_odds.toFixed(2)}</p>
        </div>

        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
          <span className="text-[11px] font-mono font-450 uppercase tracking-wider text-zinc-400">
            Tasa de Acierto
          </span>
          <div className="mt-1 flex items-baseline gap-1.5 font-mono">
            <span className="text-lg font-750 text-zinc-100">{summary.win_rate_pct.toFixed(1)}%</span>
            <span className="text-[10px] font-450 text-zinc-400">global</span>
          </div>
          <p className="mt-0.5 text-[11px] font-mono font-450 text-zinc-400">{summary.won} aciertos / {summary.lost} fallos</p>
        </div>

        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
          <span className="text-[11px] font-mono font-450 uppercase tracking-wider text-zinc-400">
            Segmento &lt; 1.80
          </span>
          <div className="mt-1 flex items-baseline gap-1.5 font-mono">
            <span className="text-lg font-750 text-emerald-400">+{by_odds.low.roi_pct.toFixed(1)}%</span>
            <span className="text-[10px] font-450 text-emerald-500/80">ROI</span>
          </div>
          <p className="mt-0.5 text-[11px] font-mono font-450 text-zinc-400">
            {by_odds.low.won} ganadas de {by_odds.low.total_bets}
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
          <span className="text-[11px] font-mono font-450 uppercase tracking-wider text-zinc-400">
            P&L Modelo Crudo
          </span>
          <div className="mt-1 flex items-baseline gap-1.5 font-mono">
            <span className="text-lg font-750 text-rose-400">
              ${summary.net_profit.toLocaleString()}
            </span>
            <span className="text-[10px] font-450 text-rose-500/80">USD</span>
          </div>
          <p className="mt-0.5 text-[11px] font-mono font-450 text-zinc-400">
            Corregido en producción
          </p>
        </div>
      </section>

      {/* Desglose por Rango de Cuotas */}
      <section className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-zinc-800 pb-2.5">
          <h3 className="text-xs font-750 uppercase tracking-wider text-zinc-300">
            Desglose por Tramo de Cuota
          </h3>
          <span className="text-xs font-mono font-450 text-zinc-500">Estrategia base $100</span>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {/* Cuotas Bajas */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-450 text-zinc-300">Cuotas Bajas (&lt; 1.80)</span>
              <span className="rounded border border-emerald-500/30 bg-emerald-950/40 px-1.5 py-0.2 text-[10px] font-mono font-750 text-emerald-400">
                RENTABLE
              </span>
            </div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-base font-750 text-emerald-400">+{by_odds.low.roi_pct.toFixed(1)}% ROI</span>
              <span className="text-xs font-450 text-zinc-300">+${by_odds.low.net_profit.toFixed(0)} USD</span>
            </div>
            <div className="space-y-1 text-xs font-mono font-450 text-zinc-400 border-t border-zinc-800/80 pt-1.5">
              <div className="flex justify-between">
                <span>Operaciones:</span>
                <span className="text-zinc-200 font-750">{by_odds.low.total_bets}</span>
              </div>
              <div className="flex justify-between">
                <span>Aciertos / Fallos:</span>
                <span className="text-zinc-200">{by_odds.low.won} / {by_odds.low.lost}</span>
              </div>
              <div className="flex justify-between">
                <span>Tasa Acierto:</span>
                <span className="text-emerald-400 font-750">{by_odds.low.win_rate_pct.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Cuotas Medias */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-450 text-zinc-300">Cuotas Medias (1.80 - 2.50)</span>
              <span className="rounded border border-zinc-700 bg-zinc-800/60 px-1.5 py-0.2 text-[10px] font-mono font-450 text-zinc-400">
                EQUILIBRADO
              </span>
            </div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-base font-750 text-zinc-300">{by_odds.mid.roi_pct.toFixed(1)}% ROI</span>
              <span className="text-xs font-450 text-zinc-400">${by_odds.mid.net_profit.toFixed(0)} USD</span>
            </div>
            <div className="space-y-1 text-xs font-mono font-450 text-zinc-400 border-t border-zinc-800/80 pt-1.5">
              <div className="flex justify-between">
                <span>Operaciones:</span>
                <span className="text-zinc-200 font-750">{by_odds.mid.total_bets}</span>
              </div>
              <div className="flex justify-between">
                <span>Aciertos / Fallos:</span>
                <span className="text-zinc-200">{by_odds.mid.won} / {by_odds.mid.lost}</span>
              </div>
              <div className="flex justify-between">
                <span>Tasa Acierto:</span>
                <span className="text-zinc-300">{by_odds.mid.win_rate_pct.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Cuotas Altas */}
          <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-450 text-zinc-300">Cuotas Altas (&gt; 2.50)</span>
              <span className="rounded border border-zinc-700 bg-zinc-800/60 px-1.5 py-0.2 text-[10px] font-mono font-450 text-zinc-400">
                NO RECOMENDADO
              </span>
            </div>
            <div className="flex items-baseline justify-between font-mono">
              <span className="text-base font-750 text-rose-400">{by_odds.high.roi_pct.toFixed(1)}% ROI</span>
              <span className="text-xs font-450 text-rose-400">${by_odds.high.net_profit.toFixed(0)} USD</span>
            </div>
            <div className="space-y-1 text-xs font-mono font-450 text-zinc-400 border-t border-zinc-800/80 pt-1.5">
              <div className="flex justify-between">
                <span>Operaciones:</span>
                <span className="text-zinc-200 font-750">{by_odds.high.total_bets}</span>
              </div>
              <div className="flex justify-between">
                <span>Aciertos / Fallos:</span>
                <span className="text-zinc-200">{by_odds.high.won} / {by_odds.high.lost}</span>
              </div>
              <div className="flex justify-between">
                <span>Tasa Acierto:</span>
                <span className="text-rose-400">{by_odds.high.win_rate_pct.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Desglose por Liga */}
      <section className="grid gap-3 sm:grid-cols-2">
        {Object.entries(by_league).map(([code, data]) => {
          const isPremier = code.toLowerCase().includes("e0") || code.toLowerCase().includes("premier");
          const name = isPremier ? "Premier League (Inglaterra)" : "LaLiga (España)";
          return (
            <div key={code} className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3.5 space-y-1.5 font-mono text-xs">
              <div className="flex items-center justify-between text-zinc-300">
                <span className="font-sans font-750 text-zinc-200">{name}</span>
                <span className={`font-750 ${data.roi_pct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {data.roi_pct >= 0 ? "+" : ""}{data.roi_pct.toFixed(1)}% ROI
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 text-zinc-400 font-450">
                <span>Operaciones:</span>
                <span className="text-zinc-200 font-750">{data.total_bets}</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400 font-450">
                <span>Aciertos / Fallos:</span>
                <span className="text-zinc-200">{data.won} Ganadas / {data.lost} Perdidas ({data.win_rate_pct.toFixed(1)}%)</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400 font-450">
                <span>Beneficio Neto:</span>
                <span className={`font-750 ${data.net_profit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {data.net_profit >= 0 ? "+" : ""}${data.net_profit.toLocaleString()} USD
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Tabla Detallada */}
      <section className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-zinc-800 pb-2.5">
          <h3 className="text-xs font-750 uppercase tracking-wider text-zinc-300">
            Registro de Operaciones Auditadas
          </h3>

          <div className="flex items-center gap-1.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => setResultFilter("all")}
              className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                resultFilter === "all"
                  ? "bg-zinc-100 text-zinc-950 font-750"
                  : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 font-450"
              }`}
            >
              Todas ({recent_bets.length})
            </button>
            <button
              type="button"
              onClick={() => setResultFilter("won")}
              className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                resultFilter === "won"
                  ? "bg-zinc-100 text-zinc-950 font-750"
                  : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 font-450"
              }`}
            >
              Acertadas ({recent_bets.filter((b) => b.result === "won").length})
            </button>
            <button
              type="button"
              onClick={() => setResultFilter("lost")}
              className={`rounded-md px-2.5 py-1 transition-colors cursor-pointer ${
                resultFilter === "lost"
                  ? "bg-zinc-100 text-zinc-950 font-750"
                  : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-200 font-450"
              }`}
            >
              Falladas ({recent_bets.filter((b) => b.result === "lost").length})
            </button>
          </div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs font-mono font-450">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] uppercase text-zinc-400">
                <th className="pb-2">Fecha</th>
                <th className="pb-2">Partido</th>
                <th className="pb-2">Liga</th>
                <th className="pb-2">Selección</th>
                <th className="pb-2 text-right">Cuota</th>
                <th className="pb-2 text-right">Prob. ML</th>
                <th className="pb-2 text-center">Estado</th>
                <th className="pb-2 text-right">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filteredBets.map((b) => {
                const isWon = b.result === "won";
                return (
                  <tr key={b.id} className="hover:bg-zinc-800/20">
                    <td className="py-2 text-zinc-400 whitespace-nowrap">{b.date}</td>
                    <td className="py-2 font-sans font-750 text-zinc-100 whitespace-nowrap">{b.match}</td>
                    <td className="py-2 text-zinc-400 uppercase text-[10px]">{b.league}</td>
                    <td className="py-2">
                      <span className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[11px] text-zinc-200">
                        {b.selection === "home" ? "Local" : b.selection === "draw" ? "Empate" : "Visitante"}
                      </span>
                    </td>
                    <td className="py-2 text-right text-zinc-100 font-750">@{b.odds.toFixed(2)}</td>
                    <td className="py-2 text-right text-zinc-300">
                      {(b.prob * 100).toFixed(1)}%
                    </td>
                    <td className="py-2 text-center">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] ${
                          isWon
                            ? "border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 font-750"
                            : "border border-zinc-700 bg-zinc-800 text-zinc-400 font-450"
                        }`}
                      >
                        {isWon ? "ACERTADA" : "FALLADA"}
                      </span>
                    </td>
                    <td className={`py-2 text-right font-750 ${isWon ? "text-emerald-400" : "text-rose-400"}`}>
                      {isWon ? `+$${b.profit.toFixed(0)}` : `-$100`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
