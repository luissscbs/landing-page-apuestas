"use client";

import React, { useState } from "react";
import type { PaperTradingSummary, PaperBet } from "@/lib/cbs";

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const day = d.getDate();
    const isToday = iso.startsWith("2026-09-18");
    const isTomorrow = iso.startsWith("2026-09-19");
    const dayPrefix = isToday ? "Hoy" : isTomorrow ? "Mañana" : `${day} Sep`;
    const timeStr = d.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dayPrefix} · ${timeStr} UTC`;
  } catch {
    return iso;
  }
}

export default function PaperTradingView({
  initialData,
}: {
  initialData: PaperTradingSummary | null;
}) {
  const [data, setData] = useState<PaperTradingSummary | null>(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSettling, setIsSettling] = useState(false);
  const [settleMsg, setSettleMsg] = useState<string | null>(null);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/paper-trading/summary", {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Error silencioso
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSettle = async () => {
    setIsSettling(true);
    setSettleMsg(null);
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/paper-trading/settle?days_from=7", {
        method: "POST",
      });
      if (res.ok) {
        const json = await res.json();
        setSettleMsg(
          `Liquidación procesada: ${json.settled_count ?? 0} liquidados, ${json.pending_count ?? 0} pendientes.`
        );
        await refreshData();
      } else {
        setSettleMsg("Error al conectar con la API de resultados.");
      }
    } catch {
      setSettleMsg("Error de conexión con el backend.");
    } finally {
      setIsSettling(false);
    }
  };

  const bankroll = data?.bankroll ?? 1000.0;
  const initialBankroll = data?.initial_bankroll ?? 1000.0;
  const profitNet = data?.profit_net ?? 0.0;
  const roiPct = data?.roi_pct ?? 0.0;
  const activeBets: PaperBet[] = data?.active_bets ?? [];
  const historyBets: PaperBet[] = data?.history ?? [];

  return (
    <div className="space-y-4 font-sans font-450">
      {/* Header Panel */}
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-750 tracking-tight text-zinc-100">
                Simulación Paper Trading
              </h2>
              <span className="rounded border border-zinc-700 bg-zinc-800/80 px-2 py-0.5 text-[10px] font-mono font-450 text-zinc-300 uppercase">
                Saldo Ficticio
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-450 max-w-2xl leading-relaxed">
              Prueba empírica de 7 días sin capital real. Al concluir cada jornada se consultan los
              marcadores oficiales, se calcula el P&L exacto y se recalibran los coeficientes
              Dixon-Coles con los resultados finalizados.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-mono font-450 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition disabled:opacity-50 cursor-pointer"
            >
              {isRefreshing ? "Actualizando..." : "Sincronizar"}
            </button>
            <button
              onClick={handleSettle}
              disabled={isSettling}
              className="rounded-md border border-zinc-700 bg-zinc-100 px-3 py-1.5 text-xs font-750 text-zinc-950 hover:bg-white transition disabled:opacity-50 cursor-pointer"
            >
              {isSettling ? "Consultando..." : "Liquidar y Recalibrar"}
            </button>
          </div>
        </div>

        {settleMsg && (
          <div className="mt-3 rounded border border-zinc-800 bg-zinc-900/80 p-2.5 text-xs font-mono font-450 text-zinc-300">
            {settleMsg}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
          <span className="text-[11px] font-mono font-450 uppercase tracking-wider text-zinc-400">
            Bankroll Virtual
          </span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-lg font-750 font-mono text-zinc-100">
              ${bankroll.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-mono font-450 text-zinc-500">USD</span>
          </div>
          <p className="mt-0.5 text-[11px] font-mono font-450 text-zinc-500">Base: ${initialBankroll.toFixed(2)}</p>
        </div>

        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
          <span className="text-[11px] font-mono font-450 uppercase tracking-wider text-zinc-400">
            P&L Ficticio
          </span>
          <div className="mt-1 flex items-baseline gap-1.5 font-mono">
            <span
              className={`text-lg font-750 ${
                profitNet >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {profitNet >= 0 ? `+$${profitNet.toFixed(2)}` : `-$${Math.abs(profitNet).toFixed(2)}`}
            </span>
            <span
              className={`text-xs font-450 ${
                roiPct >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              ({roiPct >= 0 ? `+${roiPct.toFixed(1)}%` : `${roiPct.toFixed(1)}%`})
            </span>
          </div>
          <p className="mt-0.5 text-[11px] font-mono font-450 text-zinc-500">Retorno acumulado</p>
        </div>

        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
          <span className="text-[11px] font-mono font-450 uppercase tracking-wider text-zinc-400">
            En Juego
          </span>
          <div className="mt-1 flex items-baseline gap-1.5 font-mono">
            <span className="text-lg font-750 text-zinc-100">
              {activeBets.length}
            </span>
            <span className="text-[10px] font-450 text-zinc-400">pendientes</span>
          </div>
          <p className="mt-0.5 text-[11px] font-mono font-450 text-zinc-500">$50 USD ficticios c/u</p>
        </div>

        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-3">
          <span className="text-[11px] font-mono font-450 uppercase tracking-wider text-zinc-400">
            Aciertos / Total
          </span>
          <div className="mt-1 flex items-baseline gap-1.5 font-mono">
            <span className="text-lg font-750 text-zinc-100">
              {data?.won ?? 0} / {data?.total_bets ?? 0}
            </span>
            <span className="text-[10px] font-450 text-zinc-400">resueltas</span>
          </div>
          <p className="mt-0.5 text-[11px] font-mono font-450 text-zinc-500">Falladas: {data?.lost ?? 0}</p>
        </div>
      </div>

      {/* Apuestas Activas */}
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-750 uppercase tracking-wider text-zinc-300">
            Apuestas Ficticias Pendientes ({activeBets.length})
          </h3>
          <span className="text-[11px] font-mono font-450 text-zinc-400">
            Rango cuotas: 1.50 - 5.00
          </span>
        </div>

        {activeBets.length === 0 ? (
          <div className="rounded border border-zinc-800/60 bg-zinc-950/40 p-6 text-center text-xs font-450 text-zinc-400">
            No hay apuestas ficticias pendientes.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {activeBets.map((b) => {
              const selLabel =
                b.selection === "home"
                  ? `Victoria ${b.home}`
                  : b.selection === "away"
                  ? `Victoria ${b.away}`
                  : "Empate";

              return (
                <div
                  key={b.id}
                  className="rounded-lg border border-zinc-800/80 bg-zinc-950/50 p-3 flex flex-col justify-between space-y-2.5"
                >
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono font-450 text-zinc-400 mb-1">
                      <span>{b.league}</span>
                      <span className="rounded border border-zinc-700/60 bg-zinc-800/60 px-1.5 py-0.2 text-[10px] text-zinc-300">
                        PENDIENTE
                      </span>
                    </div>

                    <div className="text-xs font-750 text-zinc-100">
                      {b.home} <span className="text-zinc-500 font-450">vs</span> {b.away}
                    </div>
                    <div className="text-[11px] font-mono font-450 text-zinc-400 mt-0.5">
                      {formatDateTime(b.starts_at)}
                    </div>

                    <div className="mt-2 rounded border border-zinc-800/60 bg-zinc-900/40 p-2 space-y-1 text-xs font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 font-sans font-450">Selección:</span>
                        <span className="font-750 text-zinc-200">{selLabel}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 font-450">Cuota:</span>
                        <span className="font-750 text-zinc-100">@{b.odds.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 font-450">Prob. Modelo:</span>
                        <span className="font-450 text-zinc-300">{(b.prob * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-800/80 pt-2 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-[10px] font-450 text-zinc-400 block uppercase">Stake</span>
                      <span className="font-750 text-zinc-200">${b.stake.toFixed(0)} USD</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-450 text-zinc-400 block uppercase">Ganancia Potencial</span>
                      <span className="text-emerald-400 font-750">
                        +${b.potential_profit.toFixed(2)} USD
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Flujo de Recalibración */}
      <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4 space-y-2.5">
        <h4 className="text-[11px] font-mono font-450 uppercase tracking-wider text-zinc-400">
          Mecanismo de Recalibración Continua
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="rounded border border-zinc-800/60 bg-zinc-950/40 p-2.5 space-y-1">
            <span className="font-mono text-[11px] text-zinc-400 font-750 block">01 / Selección</span>
            <div className="font-750 text-zinc-200">Cuotas Reales</div>
            <p className="text-zinc-400 font-450 text-[11px] leading-relaxed">
              Filtro de partidos con cuotas moderadas (1.50 - 5.00) y colocación de $50 USD virtuales.
            </p>
          </div>
          <div className="rounded border border-zinc-800/60 bg-zinc-950/40 p-2.5 space-y-1">
            <span className="font-mono text-[11px] text-zinc-400 font-750 block">02 / Marcadores</span>
            <div className="font-750 text-zinc-200">Resultados Oficiales</div>
            <p className="text-zinc-400 font-450 text-[11px] leading-relaxed">
              Consulta automatizada a Scores API al finalizar cada encuentro de la jornada.
            </p>
          </div>
          <div className="rounded border border-zinc-800/60 bg-zinc-950/40 p-2.5 space-y-1">
            <span className="font-mono text-[11px] text-zinc-400 font-750 block">03 / Balance</span>
            <div className="font-750 text-zinc-200">Liquidación P&L</div>
            <p className="text-zinc-400 font-450 text-[11px] leading-relaxed">
              Ajuste de saldo virtual y cálculo de tasa de acierto y rendimiento real del modelo.
            </p>
          </div>
          <div className="rounded border border-zinc-800/60 bg-zinc-950/40 p-2.5 space-y-1">
            <span className="font-mono text-[11px] text-zinc-400 font-750 block">04 / Modelo</span>
            <div className="font-750 text-zinc-200">Reentreno fit_all()</div>
            <p className="text-zinc-400 font-450 text-[11px] leading-relaxed">
              Inyección de marcadores en el histórico para recalibrar los ratings de ataque y defensa.
            </p>
          </div>
        </div>
      </div>

      {/* Historial de Liquidaciones Anteriores */}
      {historyBets.length > 0 && (
        <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4">
          <h3 className="text-xs font-750 uppercase tracking-wider text-zinc-300 mb-2.5">
            Historial de Liquidaciones ({historyBets.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono font-450">
              <thead className="border-b border-zinc-800 text-[10px] uppercase text-zinc-400">
                <tr>
                  <th className="pb-2">Partido</th>
                  <th className="pb-2">Selección</th>
                  <th className="pb-2">Cuota</th>
                  <th className="pb-2">Estado</th>
                  <th className="pb-2 text-right">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {historyBets.map((hb) => (
                  <tr key={hb.id}>
                    <td className="py-2 text-zinc-100 font-750">{hb.match}</td>
                    <td className="py-2 text-zinc-300">{hb.selection}</td>
                    <td className="py-2">@{hb.odds.toFixed(2)}</td>
                    <td className="py-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] ${
                          hb.result === "WON"
                            ? "border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 font-750"
                            : "border border-zinc-700 bg-zinc-800 text-zinc-400 font-450"
                        }`}
                      >
                        {hb.result}
                      </span>
                    </td>
                    <td
                      className={`py-2 text-right font-750 ${
                        (hb.profit ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {(hb.profit ?? 0) >= 0 ? `+$${hb.profit?.toFixed(2)}` : `-$${Math.abs(hb.profit ?? 0).toFixed(2)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
