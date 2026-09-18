"use client";

import React, { useState, useMemo } from "react";
import type {
  MatchOdds,
  BacktestPerformance,
  PaperTradingSummary,
} from "@/lib/cbs";
import { getEventUrl } from "@/lib/cbs";
import { SITE } from "@/lib/site";
import BacktestView from "./BacktestView";
import PaperTradingView from "./PaperTradingView";

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    const isToday = iso.startsWith("2026-09-18");
    const isTomorrow = iso.startsWith("2026-09-19");
    const dayPrefix = isToday ? "Hoy" : isTomorrow ? "Mañana" : `${d.getDate()} Sep`;
    const timeStr = d.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${dayPrefix} · ${timeStr} UTC`;
  } catch {
    return iso;
  }
}

function TrendArrow({ dir }: { dir?: "up" | "down" | "flat" }) {
  if (dir === "up") return <span className="text-emerald-400 text-[10px] ml-0.5">↑</span>;
  if (dir === "down") return <span className="text-rose-400 text-[10px] ml-0.5">↓</span>;
  return null;
}

type MarketType = "1x2" | "btts" | "overUnder25" | "doubleChance";
type RecommendationFilter = "all" | "recommended";
type DayFilter = "all" | "today" | "tomorrow";
type LeagueFilter = "all" | "premier" | "laliga" | "seriea" | "bundesliga";

type SelectedBetDetail = {
  matchId: string;
  market: MarketType;
  marketLabel: string;
  optionKey: string;
  optionLabel: string;
  odds: number;
  prob: number; // 0.0 - 1.0
  fairOdds: number;
  ev: number; // %
  kelly: number; // %
};

function matchHasPositiveEv(m: MatchOdds): boolean {
  if ((m.ml?.valueBet?.expectedValuePct ?? 0) > 0) return true;
  if (m.ml) {
    const evH = (m.ml.probabilities.home * m.odds.home - 1) * 100;
    const evD = (m.ml.probabilities.draw * m.odds.draw - 1) * 100;
    const evA = (m.ml.probabilities.away * m.odds.away - 1) * 100;
    if (evH > 0 || evD > 0 || evA > 0) return true;
  }
  if (m.markets?.btts && (m.markets.btts.yes.ev > 0 || m.markets.btts.no.ev > 0)) return true;
  if (
    m.markets?.overUnder25 &&
    (m.markets.overUnder25.over.ev > 0 || m.markets.overUnder25.under.ev > 0)
  )
    return true;
  if (
    m.markets?.doubleChance &&
    (m.markets.doubleChance["1X"].ev > 0 ||
      m.markets.doubleChance["12"].ev > 0 ||
      m.markets.doubleChance["X2"].ev > 0)
  )
    return true;
  return false;
}

function getLeagueLabel(category: string, league: string): string {
  const l = league.toLowerCase();
  const c = category.toLowerCase();
  if (c === "premier" || l.includes("premier")) return "Premier League";
  if (c === "laliga" || l.includes("laliga")) return "LaLiga";
  if (c === "seriea" || l.includes("serie a") || l.includes("italia")) return "Serie A";
  if (c === "bundesliga" || l.includes("bundesliga") || l.includes("alemania"))
    return "Bundesliga";
  return league.split("·")[0].trim();
}

export default function QuantDashboard({
  initialOdds,
  backtestData,
  paperTradingData,
}: {
  initialOdds: MatchOdds[];
  backtestData?: BacktestPerformance | null;
  paperTradingData?: PaperTradingSummary | null;
}) {
  const [mainView, setMainView] = useState<"live" | "paper" | "backtest">("live");

  const [recommendFilter, setRecommendFilter] = useState<RecommendationFilter>("all");
  const [dayFilter, setDayFilter] = useState<DayFilter>("all");
  const [leagueFilter, setLeagueFilter] = useState<LeagueFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"ev" | "prob" | "date">("ev");

  // Estado para expandir mercados secundarios en partidos individuales
  const [expandedMarkets, setExpandedMarkets] = useState<Record<string, boolean>>({});
  const [stake, setStake] = useState<number>(50);

  const initialSelection = useMemo<SelectedBetDetail>(() => {
    const topMatch =
      initialOdds.find((m) => (m.ml?.valueBet?.expectedValuePct ?? 0) >= 5.0) ??
      initialOdds[0];
    if (topMatch) {
      const sel = topMatch.ml?.valueBet?.selection ?? "home";
      const odds = topMatch.odds[sel];
      const prob = topMatch.ml?.probabilities[sel] ?? 1 / odds;
      const fairOdds = topMatch.ml?.fairOdds[sel] ?? 1 / prob;
      const ev = topMatch.ml?.valueBet?.expectedValuePct ?? ((prob * odds - 1) * 100);
      const kelly = topMatch.ml?.valueBet?.recommendedKellyStakePct ?? 0;
      let label = topMatch.home;
      if (sel === "draw") label = "Empate";
      if (sel === "away") label = topMatch.away;

      return {
        matchId: topMatch.id,
        market: "1x2",
        marketLabel: "1X2",
        optionKey: sel,
        optionLabel: label,
        odds,
        prob,
        fairOdds,
        ev,
        kelly,
      };
    }
    return {
      matchId: "",
      market: "1x2",
      marketLabel: "1X2",
      optionKey: "home",
      optionLabel: "Local",
      odds: 2.0,
      prob: 0.5,
      fairOdds: 2.0,
      ev: 0,
      kelly: 0,
    };
  }, [initialOdds]);

  const [activeSelection, setActiveSelection] = useState<SelectedBetDetail>(initialSelection);

  const selectedMatch = useMemo(() => {
    return initialOdds.find((m) => m.id === activeSelection.matchId) ?? initialOdds[0];
  }, [initialOdds, activeSelection.matchId]);

  const counts = useMemo(() => {
    const recommended = initialOdds.filter((m) => matchHasPositiveEv(m)).length;
    const today = initialOdds.filter((m) => m.startsAt.startsWith("2026-09-18")).length;
    const tomorrow = initialOdds.filter((m) => m.startsAt.startsWith("2026-09-19")).length;
    const premier = initialOdds.filter(
      (m) => m.category === "premier" || m.league.toLowerCase().includes("premier")
    ).length;
    const laliga = initialOdds.filter(
      (m) => m.category === "laliga" || m.league.toLowerCase().includes("laliga")
    ).length;
    const seriea = initialOdds.filter(
      (m) => m.category === "seriea" || m.league.toLowerCase().includes("serie a")
    ).length;
    const bundesliga = initialOdds.filter(
      (m) => m.category === "bundesliga" || m.league.toLowerCase().includes("bundesliga")
    ).length;

    return {
      total: initialOdds.length,
      recommended,
      today,
      tomorrow,
      premier,
      laliga,
      seriea,
      bundesliga,
    };
  }, [initialOdds]);

  const topValueBet = useMemo(() => {
    return [...initialOdds]
      .filter((m) => !!m.ml?.valueBet)
      .sort(
        (a, b) =>
          (b.ml?.valueBet?.expectedValuePct ?? 0) - (a.ml?.valueBet?.expectedValuePct ?? 0)
      )[0];
  }, [initialOdds]);

  const filteredMatches = useMemo(() => {
    return initialOdds
      .filter((m) => {
        if (recommendFilter === "recommended") {
          return matchHasPositiveEv(m);
        }
        return true;
      })
      .filter((m) => {
        if (dayFilter === "today") return m.startsAt.startsWith("2026-09-18");
        if (dayFilter === "tomorrow") return m.startsAt.startsWith("2026-09-19");
        return true;
      })
      .filter((m) => {
        const cat = m.category.toLowerCase();
        const leg = m.league.toLowerCase();
        if (leagueFilter === "premier") return cat === "premier" || leg.includes("premier");
        if (leagueFilter === "laliga") return cat === "laliga" || leg.includes("laliga");
        if (leagueFilter === "seriea") return cat === "seriea" || leg.includes("serie a") || leg.includes("italia");
        if (leagueFilter === "bundesliga") return cat === "bundesliga" || leg.includes("bundesliga") || leg.includes("alemania");
        return true;
      })
      .filter((m) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          m.home.toLowerCase().includes(q) ||
          m.away.toLowerCase().includes(q) ||
          m.league.toLowerCase().includes(q) ||
          (m.homeShort && m.homeShort.toLowerCase().includes(q)) ||
          (m.awayShort && m.awayShort.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === "ev") {
          const evA = a.ml?.valueBet?.expectedValuePct ?? -999;
          const evB = b.ml?.valueBet?.expectedValuePct ?? -999;
          return evB - evA;
        }
        if (sortBy === "prob") {
          const pA = Math.max(a.ml?.probabilities.home ?? 0, a.ml?.probabilities.away ?? 0);
          const pB = Math.max(b.ml?.probabilities.home ?? 0, b.ml?.probabilities.away ?? 0);
          return pB - pA;
        }
        return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      });
  }, [initialOdds, recommendFilter, dayFilter, leagueFilter, searchQuery, sortBy]);

  const handleSelectOption = (
    match: MatchOdds,
    market: MarketType,
    marketLabel: string,
    optionKey: string,
    optionLabel: string,
    odds: number,
    prob: number,
    fairOdds: number,
    ev: number,
    kelly: number
  ) => {
    setActiveSelection({
      matchId: match.id,
      market,
      marketLabel,
      optionKey,
      optionLabel,
      odds,
      prob,
      fairOdds,
      ev,
      kelly,
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedMarkets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const simulatedReturn = (stake * activeSelection.odds).toFixed(2);
  const simulatedNetProfit = (stake * (activeSelection.odds - 1)).toFixed(2);
  const isPositiveEv = activeSelection.ev > 0;
  const evSign = isPositiveEv ? "+" : "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 space-y-5 font-sans font-450">
      {/* Selector de Vistas Principales */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() => setMainView("live")}
            className={`rounded-md px-3 py-1.5 transition-colors cursor-pointer ${
              mainView === "live"
                ? "bg-zinc-100 text-zinc-950 font-750"
                : "border border-zinc-800/80 bg-zinc-900/30 text-zinc-400 hover:text-zinc-200 font-450"
            }`}
          >
            Cuotas en Vivo ({initialOdds.length})
          </button>
          <button
            type="button"
            onClick={() => setMainView("paper")}
            className={`rounded-md px-3 py-1.5 transition-colors cursor-pointer ${
              mainView === "paper"
                ? "bg-zinc-100 text-zinc-950 font-750"
                : "border border-zinc-800/80 bg-zinc-900/30 text-zinc-400 hover:text-zinc-200 font-450"
            }`}
          >
            Paper Trading ({paperTradingData?.pending ?? 3} en juego)
          </button>
          <button
            type="button"
            onClick={() => setMainView("backtest")}
            className={`rounded-md px-3 py-1.5 transition-colors cursor-pointer ${
              mainView === "backtest"
                ? "bg-zinc-100 text-zinc-950 font-750"
                : "border border-zinc-800/80 bg-zinc-900/30 text-zinc-400 hover:text-zinc-200 font-450"
            }`}
          >
            Auditoría Histórica ({backtestData?.summary.total_bets ?? 971})
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono font-450 text-zinc-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span>
            {mainView === "paper"
              ? "Simulación 7 Días · Saldo Ficticio"
              : mainView === "backtest"
              ? "Auditoría Walk-Forward 2024-2026"
              : "Dixon-Coles + xG"}
          </span>
        </div>
      </div>

      {mainView === "paper" ? (
        <PaperTradingView initialData={paperTradingData ?? null} />
      ) : mainView === "backtest" ? (
        <BacktestView backtestData={backtestData ?? null} />
      ) : (
        <>
          {/* Barra Resumen Compacta (1 Sola Línea) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono font-450 text-zinc-400 border-b border-zinc-800/40 pb-3">
            <div className="flex items-center gap-3">
              <span>
                <strong className="font-750 text-zinc-200">{initialOdds.length}</strong> partidos
              </span>
              <span className="text-zinc-600">·</span>
              <span>
                <strong className="font-750 text-emerald-400">{counts.recommended}</strong> con ventaja (+EV)
              </span>
            </div>
            {topValueBet?.ml?.valueBet && (
              <div className="hidden sm:flex items-center gap-1.5 text-[11px]">
                <span className="text-zinc-500 font-450">Mayor valor:</span>
                <span className="font-750 text-zinc-200">{topValueBet.home}</span>
                <span className="text-emerald-400 font-750">
                  +{topValueBet.ml.valueBet.expectedValuePct.toFixed(1)}% EV
                </span>
              </div>
            )}
          </div>

          {/* Barra de Filtros en 1 Sola Línea */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs font-mono font-450">
            {/* Pestañas: Todos vs Solo +EV */}
            <div className="flex items-center gap-1 border border-zinc-800 bg-zinc-900/40 p-0.5 rounded-md">
              <button
                type="button"
                onClick={() => setRecommendFilter("all")}
                className={`rounded px-2.5 py-1 transition-colors cursor-pointer ${
                  recommendFilter === "all"
                    ? "bg-zinc-200 text-zinc-950 font-750"
                    : "text-zinc-400 hover:text-zinc-200 font-450"
                }`}
              >
                Todos ({counts.total})
              </button>
              <button
                type="button"
                onClick={() => setRecommendFilter("recommended")}
                className={`rounded px-2.5 py-1 transition-colors cursor-pointer ${
                  recommendFilter === "recommended"
                    ? "bg-zinc-200 text-zinc-950 font-750"
                    : "text-zinc-400 hover:text-emerald-400 font-450"
                }`}
              >
                Solo +EV ({counts.recommended})
              </button>
            </div>

            {/* Selectores de Fecha y Liga */}
            <div className="flex items-center gap-2">
              <select
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value as DayFilter)}
                aria-label="Filtrar por fecha"
                className="rounded border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs text-zinc-300 focus:border-zinc-700 focus:outline-none cursor-pointer font-450"
              >
                <option value="all">Todas las fechas</option>
                <option value="today">Hoy 18 Sep ({counts.today})</option>
                <option value="tomorrow">Mañana 19 Sep ({counts.tomorrow})</option>
              </select>

              <select
                value={leagueFilter}
                onChange={(e) => setLeagueFilter(e.target.value as LeagueFilter)}
                aria-label="Filtrar por liga"
                className="rounded border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs text-zinc-300 focus:border-zinc-700 focus:outline-none cursor-pointer font-450"
              >
                <option value="all">Todas las ligas</option>
                <option value="premier">Premier League ({counts.premier})</option>
                <option value="laliga">LaLiga ({counts.laliga})</option>
                <option value="seriea">Serie A ({counts.seriea})</option>
                <option value="bundesliga">Bundesliga ({counts.bundesliga})</option>
              </select>
            </div>

            {/* Buscador y Orden */}
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <div className="relative flex-1 sm:w-44">
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded border border-zinc-800 bg-zinc-900/60 px-2 py-1 pl-6 text-xs text-zinc-200 placeholder-zinc-500 focus:border-zinc-700 focus:outline-none font-450"
                />
                <svg
                  className="absolute left-1.5 top-2 h-3 w-3 text-zinc-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "ev" | "prob" | "date")}
                aria-label="Ordenar resultados"
                className="rounded border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-xs text-zinc-300 focus:border-zinc-700 focus:outline-none cursor-pointer font-450"
              >
                <option value="ev">+EV</option>
                <option value="prob">Probabilidad</option>
                <option value="date">Horario</option>
              </select>
            </div>
          </div>

          {/* Grid Principal: Partidos + Calculador */}
          <div className="grid gap-5 lg:grid-cols-12 items-start pt-1">
            {/* Lista de Partidos (7 cols) */}
            <section className="space-y-3 lg:col-span-7">
              {filteredMatches.map((m) => {
                const isMatchSelected = m.id === selectedMatch?.id;
                const hasValue1x2 = !!m.ml?.valueBet && m.ml.valueBet.expectedValuePct >= 5.0;
                const leagueName = getLeagueLabel(m.category, m.league);
                const isExpanded = !!expandedMarkets[m.id];

                return (
                  <article
                    key={m.id}
                    className={`rounded-lg border p-4 transition-colors ${
                      isMatchSelected
                        ? "border-zinc-500 bg-zinc-900/40"
                        : "border-zinc-800/80 bg-zinc-900/15 hover:border-zinc-700 hover:bg-zinc-900/30"
                    }`}
                  >
                    {/* Header Partido */}
                    <div className="flex items-center justify-between text-xs font-mono font-450 text-zinc-400">
                      <span>{leagueName}</span>
                      <div className="flex items-center gap-2">
                        <span>{formatDateTime(m.startsAt)}</span>
                        {hasValue1x2 && (
                          <span className="rounded border border-emerald-500/30 bg-emerald-950/40 px-1.5 py-0.2 text-[10px] font-750 text-emerald-400">
                            +{m.ml!.valueBet!.expectedValuePct.toFixed(1)}% EV
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Equipos */}
                    <div className="mt-1.5 flex items-center justify-between">
                      <h3 className="text-sm font-750 text-zinc-100">
                        {m.home} <span className="text-zinc-500 font-450">vs</span> {m.away}
                      </h3>
                      {m.xg && (
                        <span className="text-[11px] font-mono font-450 text-zinc-400">
                          xG: {m.xg.home.toFixed(2)} - {m.xg.away.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Cuotas 1X2 Directas y Claras */}
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[
                        {
                          key: "home" as const,
                          display: `1 (${m.homeShort || "Local"})`,
                          odds: m.odds.home,
                          prob: m.ml?.probabilities.home ?? 0.33,
                          fair: m.ml?.fairOdds.home ?? 3.0,
                          dir: m.movement?.home,
                        },
                        {
                          key: "draw" as const,
                          display: "X (Empate)",
                          odds: m.odds.draw,
                          prob: m.ml?.probabilities.draw ?? 0.33,
                          fair: m.ml?.fairOdds.draw ?? 3.0,
                          dir: m.movement?.draw,
                        },
                        {
                          key: "away" as const,
                          display: `2 (${m.awayShort || "Visita"})`,
                          odds: m.odds.away,
                          prob: m.ml?.probabilities.away ?? 0.33,
                          fair: m.ml?.fairOdds.away ?? 3.0,
                          dir: m.movement?.away,
                        },
                      ].map((opt) => {
                        const isOptActive =
                          activeSelection.matchId === m.id &&
                          activeSelection.market === "1x2" &&
                          activeSelection.optionKey === opt.key;
                        const evPct = (opt.prob * opt.odds - 1) * 100;
                        const hasEv = evPct > 0;

                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() =>
                              handleSelectOption(
                                m,
                                "1x2",
                                "1X2",
                                opt.key,
                                opt.display,
                                opt.odds,
                                opt.prob,
                                opt.fair,
                                evPct,
                                hasEv ? (m.ml?.valueBet?.recommendedKellyStakePct ?? 1.5) : 0
                              )
                            }
                            className={`rounded border p-2 text-center transition-colors cursor-pointer font-mono ${
                              isOptActive
                                ? "border-zinc-400 bg-zinc-800 text-zinc-100"
                                : hasEv
                                ? "border-emerald-500/40 bg-emerald-950/20 hover:border-emerald-400"
                                : "border-zinc-800/80 bg-zinc-950/50 hover:border-zinc-700"
                            }`}
                          >
                            <span className="block text-[11px] font-sans font-450 text-zinc-400 truncate">
                              {opt.display}
                            </span>
                            <span className="mt-0.5 block text-sm font-750 text-zinc-100">
                              @{opt.odds.toFixed(2)}
                              <TrendArrow dir={opt.dir} />
                            </span>
                            <span className="block text-[10px] font-450 text-zinc-400">
                              {Math.round(opt.prob * 100)}%
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Botón Plegable para Mercados Adicionales */}
                    {(m.markets?.btts || m.markets?.overUnder25) && (
                      <div className="mt-2 text-right">
                        <button
                          type="button"
                          onClick={() => toggleExpand(m.id)}
                          className="text-[11px] font-mono font-450 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                        >
                          {isExpanded ? "Ocultar otros mercados ↑" : "+ Ver BTTS y Goles ↓"}
                        </button>
                      </div>
                    )}

                    {/* Mercados Adicionales (Plegados por defecto para evitar saturación) */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-zinc-800/60 space-y-2.5 font-mono text-xs">
                        {m.markets?.btts && (
                          <div>
                            <span className="text-[10px] font-450 text-zinc-400 uppercase block mb-1">
                              Ambos Marcan (BTTS)
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { key: "yes", label: "Sí", data: m.markets.btts.yes },
                                { key: "no", label: "No", data: m.markets.btts.no },
                              ].map((item) => (
                                <button
                                  key={item.key}
                                  type="button"
                                  onClick={() =>
                                    handleSelectOption(
                                      m,
                                      "btts",
                                      "Ambos Marcan",
                                      item.key,
                                      item.label,
                                      item.data.odds,
                                      item.data.prob,
                                      item.data.fairOdds,
                                      item.data.ev,
                                      item.data.kelly
                                    )
                                  }
                                  className="rounded border border-zinc-800 bg-zinc-950/40 p-1.5 flex justify-between items-center text-xs hover:border-zinc-700"
                                >
                                  <span className="text-zinc-400 font-sans font-450">{item.label}</span>
                                  <span className="font-750 text-zinc-200">@{item.data.odds.toFixed(2)}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {m.markets?.overUnder25 && (
                          <div>
                            <span className="text-[10px] font-450 text-zinc-400 uppercase block mb-1">
                              Total Goles (+/- 2.5)
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { key: "over", label: "+2.5", data: m.markets.overUnder25.over },
                                { key: "under", label: "-2.5", data: m.markets.overUnder25.under },
                              ].map((item) => (
                                <button
                                  key={item.key}
                                  type="button"
                                  onClick={() =>
                                    handleSelectOption(
                                      m,
                                      "overUnder25",
                                      "+/- 2.5 Goles",
                                      item.key,
                                      item.label,
                                      item.data.odds,
                                      item.data.prob,
                                      item.data.fairOdds,
                                      item.data.ev,
                                      item.data.kelly
                                    )
                                  }
                                  className="rounded border border-zinc-800 bg-zinc-950/40 p-1.5 flex justify-between items-center text-xs hover:border-zinc-700"
                                >
                                  <span className="text-zinc-400 font-sans font-450">{item.label}</span>
                                  <span className="font-750 text-zinc-200">@{item.data.odds.toFixed(2)}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}

              {filteredMatches.length === 0 && (
                <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/20 p-8 text-center text-zinc-400">
                  <p className="text-sm font-750 text-zinc-200">
                    Sin partidos para los filtros aplicados
                  </p>
                  <p className="mt-1 text-xs font-450 text-zinc-400 leading-relaxed max-w-md mx-auto">
                    Prueba cambiando el día, la liga o mostrando todos los partidos.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setRecommendFilter("all");
                      setDayFilter("all");
                      setLeagueFilter("all");
                      setSearchQuery("");
                    }}
                    className="mt-3 rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-mono font-450 text-zinc-200 hover:bg-zinc-700 transition cursor-pointer"
                  >
                    Restablecer Filtros
                  </button>
                </div>
              )}
            </section>

            {/* Calculador Lateral Limpio (5 cols, sticky) */}
            <aside className="lg:col-span-5 lg:sticky lg:top-20">
              {selectedMatch ? (
                <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/30 p-4 space-y-3.5 font-mono text-xs">
                  {/* Encabezado */}
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                    <div>
                      <span className="text-[10px] font-mono font-450 uppercase tracking-wider text-zinc-400 block">
                        Cálculo Inmediato
                      </span>
                      <span className="text-xs font-750 text-zinc-200">
                        {selectedMatch.home} vs {selectedMatch.away}
                      </span>
                    </div>
                    <span
                      className={`rounded border px-2 py-0.5 text-xs font-750 ${
                        isPositiveEv
                          ? "border-emerald-500/40 bg-emerald-950/50 text-emerald-400"
                          : "border-zinc-700 bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {evSign}{activeSelection.ev.toFixed(1)}% EV
                    </span>
                  </div>

                  {/* Selección y Cuota */}
                  <div className="flex items-center justify-between font-sans">
                    <div>
                      <span className="text-[10px] font-mono font-450 text-zinc-400 uppercase block">
                        Selección: {activeSelection.marketLabel}
                      </span>
                      <span className="text-xs font-750 text-zinc-100">
                        {activeSelection.optionLabel}
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-[10px] font-450 text-zinc-400 uppercase block">Cuota</span>
                      <span className="text-base font-750 text-zinc-100">
                        @{activeSelection.odds.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Datos Matemáticos */}
                  <div className="rounded border border-zinc-800/80 bg-zinc-950/50 p-2.5 space-y-1 text-[11px] text-zinc-400 font-mono font-450">
                    <div className="flex justify-between">
                      <span>Probabilidad Estimada:</span>
                      <span className="font-750 text-zinc-200">{(activeSelection.prob * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cuota Justa Modelo:</span>
                      <span className="font-750 text-zinc-200">@{activeSelection.fairOdds.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ventaja sobre Casa:</span>
                      <span className={`font-750 ${isPositiveEv ? "text-emerald-400" : "text-rose-400"}`}>
                        {evSign}{activeSelection.ev.toFixed(1)}% EV
                      </span>
                    </div>
                  </div>

                  {/* Simulador de Importe */}
                  <div className="border-t border-zinc-800/80 pt-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-450 text-zinc-400">
                      <span>Importe:</span>
                      <span className="font-750 text-zinc-200">${stake} USD</span>
                    </div>

                    <div className="flex gap-1.5">
                      {[10, 25, 50, 100].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStake(s)}
                          className={`flex-1 rounded border py-1 text-[11px] font-450 transition-colors cursor-pointer ${
                            stake === s
                              ? "border-zinc-400 bg-zinc-800 text-zinc-100 font-750"
                              : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-200"
                          }`}
                        >
                          ${s}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <div className="rounded border border-zinc-800 bg-zinc-950/60 p-2 flex items-center justify-between text-[11px] font-mono">
                        <span className="text-zinc-400 font-450">Retorno Total:</span>
                        <span className="font-750 text-zinc-200">${simulatedReturn} USD</span>
                      </div>
                      <div className="rounded border border-zinc-800 bg-zinc-950/60 p-2 flex items-center justify-between">
                        <span className="text-[11px] font-450 text-zinc-400">Beneficio Neto:</span>
                        <span className="text-sm font-750 text-emerald-400">
                          +${simulatedNetProfit} USD
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Enlace Directo */}
                  <a
                    href={getEventUrl(selectedMatch.id, "dashboard_quick_calc")}
                    target="_blank"
                    rel="noopener sponsored"
                    className="block w-full rounded border border-zinc-700 bg-zinc-100 hover:bg-white text-zinc-950 font-750 py-2 text-center text-xs transition"
                  >
                    Ver Evento en {SITE.brand} · @{activeSelection.odds.toFixed(2)}
                  </a>
                </div>
              ) : (
                <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/20 p-6 text-center text-zinc-400 text-xs font-450">
                  Selecciona una cuota para ver el cálculo.
                </div>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
