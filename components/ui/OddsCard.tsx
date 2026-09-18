"use client";

import { trackOddsClick } from "@/lib/analytics";
import { type MatchOdds } from "@/lib/cbs";
import { useBetSlip, type BetSelection } from "@/context/BetSlipContext";

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function Trend({ dir }: { dir?: "up" | "down" | "flat" }) {
  if (dir === "up") return <span className="text-emerald-400 font-bold ml-1">↑</span>;
  if (dir === "down") return <span className="text-rose-400 font-bold ml-1">↓</span>;
  return null;
}

export default function OddsCard({ match }: { match: MatchOdds }) {
  const { selectBet, activeBet } = useBetSlip();

  const cells = [
    { key: "1", selection: "home" as BetSelection, label: match.home, value: match.odds.home, dir: match.movement?.home },
    { key: "X", selection: "draw" as BetSelection, label: "Empate", value: match.odds.draw, dir: match.movement?.draw },
    { key: "2", selection: "away" as BetSelection, label: match.away, value: match.odds.away, dir: match.movement?.away },
  ] as const;

  const valueBetSelection = match.ml?.valueBet?.selection;
  const isMatchActive = activeBet?.match.id === match.id;

  return (
    <article className="group relative flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 p-5 transition-all duration-200 hover:border-lime-400/40 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
      {/* Cabecera: Liga y Estado */}
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-450 tracking-wide text-zinc-400">
            {match.league}
          </span>
          {match.live ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-[11px] font-750 text-red-400">
              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-red-500" />
              EN VIVO {match.live.minute}&prime; · {match.live.homeScore} - {match.live.awayScore}
            </span>
          ) : (
            <span className="text-xs font-450 text-zinc-500">{formatTime(match.startsAt)}</span>
          )}
        </div>

        {/* Equipos */}
        <div className="mt-3.5 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-750 text-white group-hover:text-lime-300 transition-colors">
              {match.home}
            </h3>
            <h4 className="text-base font-750 text-white">
              {match.away}
            </h4>
          </div>
          {match.ml?.valueBet && (
            <button
              type="button"
              onClick={() => selectBet(match, match.ml!.valueBet!.selection)}
              className="text-right cursor-pointer group/badge"
              title="Abrir recomendación de valor en el boleto"
            >
              <span className="inline-block rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-750 text-emerald-300 group-hover/badge:bg-emerald-500/30 group-hover/badge:border-emerald-400 transition-all">
                ⚡ +{match.ml.valueBet.expectedValuePct.toFixed(1)}% EV
              </span>
            </button>
          )}
        </div>

        {/* Barra de Probabilidad Estimada por IA */}
        {match.ml && (
          <div className="mt-3 rounded-xl bg-zinc-950/60 p-2 border border-white/5">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
              <span>IA Prob: 1 ({Math.round(match.ml.probabilities.home * 100)}%)</span>
              <span>X ({Math.round(match.ml.probabilities.draw * 100)}%)</span>
              <span>2 ({Math.round(match.ml.probabilities.away * 100)}%)</span>
            </div>
            <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                style={{ width: `${match.ml.probabilities.home * 100}%` }}
                className="bg-lime-400"
                title={`Local: ${Math.round(match.ml.probabilities.home * 100)}%`}
              />
              <div
                style={{ width: `${match.ml.probabilities.draw * 100}%` }}
                className="bg-zinc-500"
                title={`Empate: ${Math.round(match.ml.probabilities.draw * 100)}%`}
              />
              <div
                style={{ width: `${match.ml.probabilities.away * 100}%` }}
                className="bg-cyan-400"
                title={`Visitante: ${Math.round(match.ml.probabilities.away * 100)}%`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Botones de Cuotas 1X2 Interactivos */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {cells.map((c) => {
          const isValue = valueBetSelection === c.selection;
          const isSelected = isMatchActive && activeBet?.selection === c.selection;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => {
                trackOddsClick(match.id, c.key, c.value);
                selectBet(match, c.selection);
              }}
              aria-label={`Apostar a ${c.label} con cuota ${c.value.toFixed(2)}`}
              className={`relative rounded-2xl border px-2 py-3 text-center transition-all cursor-pointer ${
                isSelected
                  ? "border-lime-400 bg-lime-400/20 shadow-[0_0_15px_rgba(163,230,53,0.35)] scale-[1.02]"
                  : isValue
                  ? "border-emerald-500/50 bg-emerald-950/20 hover:border-lime-400 hover:bg-zinc-900"
                  : "border-white/10 bg-zinc-950/80 hover:border-white/20 hover:bg-zinc-900"
              }`}
            >
              {isSelected ? (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-lime-400 px-1.5 py-0.2 text-[8px] font-900 uppercase text-zinc-950">
                  En Boleto
                </span>
              ) : isValue ? (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-emerald-400 px-1.5 py-0.2 text-[8px] font-900 uppercase text-zinc-950">
                  Value Pick
                </span>
              ) : null}
              <span className="block text-[11px] font-450 text-zinc-400">{c.key}</span>
              <span
                className={`mt-0.5 block text-lg font-750 transition-colors ${
                  isSelected ? "text-lime-300" : "text-white group-hover/btn:text-lime-300"
                }`}
              >
                {c.value.toFixed(2)}
                <Trend dir={c.dir} />
              </span>
            </button>
          );
        })}
      </div>
    </article>
  );
}
