"use client";

import { trackOddsClick } from "@/lib/analytics";
import { getEventUrl, type MatchOdds } from "@/lib/p50";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Trend({ dir }: { dir?: "up" | "down" | "flat" }) {
  if (dir === "up") return <span className="text-emerald-400">↑</span>;
  if (dir === "down") return <span className="text-rose-400">↓</span>;
  return null;
}

export default function OddsCard({ match }: { match: MatchOdds }) {
  const cells = [
    { key: "1", label: match.home, value: match.odds.home, dir: match.movement?.home },
    { key: "X", label: "Empate", value: match.odds.draw, dir: match.movement?.draw },
    { key: "2", label: match.away, value: match.odds.away, dir: match.movement?.away },
  ] as const;

  return (
    <article className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-450 text-zinc-400">{match.league}</p>
        {match.live ? (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-750 text-red-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            LIVE {match.live.minute}&prime;
          </p>
        ) : (
          <p className="text-xs font-450 text-zinc-500">{formatTime(match.startsAt)}</p>
        )}
      </div>

      <h3 className="mt-3 text-lg font-750 leading-7 text-white">
        {match.home} <span className="font-450 text-zinc-500">vs</span> {match.away}
      </h3>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {cells.map((c) => (
          <a
            key={c.key}
            href={getEventUrl(match.id)}
            target="_blank"
            rel="noopener sponsored"
            onClick={() => trackOddsClick(match.id, c.key, c.value)}
            aria-label={`Apostar a ${c.label} a ${c.value.toFixed(2)} en P50`}
            className="group rounded-xl border border-white/10 bg-zinc-950 px-2 py-3 text-center transition-colors hover:border-lime-400/60 hover:bg-zinc-900"
          >
            <span className="block text-xs font-450 text-zinc-500">{c.key}</span>
            <span className="mt-1 block text-lg font-750 text-white group-hover:text-lime-300">
              {c.value.toFixed(2)} <Trend dir={c.dir} />
            </span>
          </a>
        ))}
      </div>
    </article>
  );
}
