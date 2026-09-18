"use client";

import { useEffect, useState } from "react";
import CtaButton from "@/components/ui/CtaButton";
import { trackViewHero, trackOddsClick } from "@/lib/analytics";
import type { MatchOdds } from "@/lib/cbs";
import { SITE } from "@/lib/site";
import { useBetSlip } from "@/context/BetSlipContext";

export default function Hero({
  campaign,
  featuredMatch,
}: {
  campaign?: string;
  featuredMatch?: MatchOdds;
}) {
  const { selectBet } = useBetSlip();
  const [selectedPick, setSelectedPick] = useState<"home" | "draw" | "away">("home");
  const [stake, setStake] = useState<number>(25);

  useEffect(() => {
    trackViewHero(campaign);
  }, [campaign]);

  const handleSelectAndOpen = (pick: "home" | "draw" | "away") => {
    setSelectedPick(pick);
    const rawMatch: MatchOdds = featuredMatch ?? {
      id: "rm-bar",
      league: "LaLiga · España",
      category: "laliga",
      home: "Real Madrid",
      away: "FC Barcelona",
      homeShort: "RMA",
      awayShort: "FCB",
      startsAt: "2026-09-20T19:00:00Z",
      odds: { home: 2.15, draw: 3.40, away: 3.10 },
      ml: {
        probabilities: { home: 0.512, draw: 0.268, away: 0.220 },
        fairOdds: { home: 1.96, draw: 3.73, away: 4.55 },
        valueBet: {
          selection: "home",
          expectedValuePct: 9.6,
          confidence: "alta",
          recommendedKellyStakePct: 2.4,
        },
      },
    };
    selectBet(rawMatch, pick);
  };

  // Datos del partido estelar en Hero (conectado al Backend FastAPI o fallback)
  const match = featuredMatch
    ? {
        id: featuredMatch.id,
        home: featuredMatch.home,
        away: featuredMatch.away,
        league: featuredMatch.league,
        odds: featuredMatch.odds,
        ml: {
          prob: featuredMatch.ml
            ? `${(featuredMatch.ml.probabilities.home * 100).toFixed(1)}%`
            : "51.2%",
          ev: featuredMatch.ml?.valueBet
            ? `+${featuredMatch.ml.valueBet.expectedValuePct.toFixed(1)}% EV`
            : "+9.6% EV",
          fairOdds: featuredMatch.ml
            ? featuredMatch.ml.fairOdds.home.toFixed(2)
            : "1.96",
        },
      }
    : {
        id: "rm-bar",
        home: "Real Madrid",
        away: "FC Barcelona",
        league: "LaLiga · Sábado 19:00",
        odds: { home: 2.15, draw: 3.40, away: 3.10 },
        ml: {
          prob: "51.2%",
          ev: "+9.6% EV",
          fairOdds: "1.96",
        },
      };

  const currentOdds = match.odds[selectedPick];
  const potentialReturn = (stake * currentOdds).toFixed(2);
  const netProfit = (stake * (currentOdds - 1)).toFixed(2);

  return (
    <section id="inicio" className="relative overflow-hidden bg-[#070709] pt-8 pb-16 md:py-24">
      {/* Resplandor y malla de fondo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(163,230,53,0.18),transparent_75%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.03] sports-grid"
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 md:grid-cols-[1.15fr_0.85fr] md:items-center md:px-6">
        {/* Columna Izquierda: Mensaje y Propuesta de Valor */}
        <div>
          {/* Badge de confianza */}
          <div className="inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 px-3.5 py-1.5 text-xs font-750 text-lime-300 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-400" />
            </span>
            <span>Cuotas Algorítmicas con IA · Margen Reducido</span>
            <span className="rounded-full bg-zinc-900/80 px-1.5 py-0.5 text-[10px] text-zinc-300">
              +18
            </span>
          </div>

          <h1 className="mt-5 text-4xl font-750 leading-[1.06] tracking-tight text-white sm:text-5xl md:text-[58px]">
            Apuestas deportivas impulsadas por{" "}
            <span className="bg-gradient-to-r from-lime-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
              probabilidad real
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-lg font-450 leading-relaxed text-zinc-300">
            Compara cuotas decimales calculadas por modelos predictivos, descubre
            apuestas con valor matemático positivo (<strong className="text-lime-300 font-750">+EV</strong>) y
            disfruta de pagos transparentes en <strong className="text-white font-750">{SITE.brand}</strong>.
          </p>

          {/* Botones de acción principales */}
          <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
            <CtaButton
              medium="cta_hero"
              campaign={campaign}
              variant="accent"
              className="w-full text-base sm:w-auto shadow-xl"
            >
              Duplicar mi depósito (Bono 100%)
            </CtaButton>
            <CtaButton
              variant="ghost"
              destination="event"
              eventId={match.id}
              medium="cta_hero_secondary"
              campaign={campaign}
              className="w-full text-base sm:w-auto"
            >
              Explorar Cuotas en Vivo
            </CtaButton>
          </div>

          {/* Métricas clave de credibilidad */}
          <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-left">
            <div>
              <dt className="text-xs font-450 text-zinc-400">Margen promedio</dt>
              <dd className="mt-1 text-xl font-750 text-white tracking-tight">
                &lt; 3.2%{" "}
                <span className="block text-[11px] font-450 text-lime-400">Cuotas más altas</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-450 text-zinc-400">Retiros de saldo</dt>
              <dd className="mt-1 text-xl font-750 text-white tracking-tight">
                &lt; 15 min{" "}
                <span className="block text-[11px] font-450 text-emerald-400">Instantáneo</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs font-450 text-zinc-400">Apostadores activos</dt>
              <dd className="mt-1 text-xl font-750 text-white tracking-tight">
                +140k{" "}
                <span className="block text-[11px] font-450 text-zinc-400">En España & Latam</span>
              </dd>
            </div>
          </dl>

          <p className="mt-4 text-xs font-450 text-zinc-500">
            Solo mayores de 18 años. Juega con responsabilidad. Sujeto a Términos y Condiciones.
          </p>
        </div>

        {/* Columna Derecha: Tarjeta Interactiva de Partido & Simulador */}
        <div className="relative">
          <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-zinc-900/90 to-zinc-950/95 p-6 shadow-2xl backdrop-blur-xl">
            {/* Header de la tarjeta */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[11px] font-750 uppercase tracking-widest text-lime-400">
                  ⚡ Oportunidad de Valor (+EV)
                </span>
                <p className="text-xs font-450 text-zinc-400">{match.league}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-xs font-750 text-emerald-300">
                {match.ml.ev}
              </span>
            </div>

            {/* Enfrentamiento */}
            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="flex-1 text-left">
                <p className="text-xs text-zinc-400">Local</p>
                <p className="text-lg font-750 text-white">{match.home}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-750 text-zinc-400">
                VS
              </div>
              <div className="flex-1 text-right">
                <p className="text-xs text-zinc-400">Visitante</p>
                <p className="text-lg font-750 text-white">{match.away}</p>
              </div>
            </div>

            {/* Selector de cuotas 1X2 interactivo */}
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                { key: "home", label: "1 (Local)", value: match.odds.home, badge: "Value Pick" },
                { key: "draw", label: "X (Empate)", value: match.odds.draw },
                { key: "away", label: "2 (Visita)", value: match.odds.away },
              ].map((pick) => {
                const active = selectedPick === pick.key;
                return (
                  <button
                    key={pick.key}
                    type="button"
                    onClick={() => {
                      trackOddsClick(match.id, pick.key, pick.value);
                      handleSelectAndOpen(pick.key as "home" | "draw" | "away");
                    }}
                    className={`relative rounded-2xl border p-3 transition-all cursor-pointer ${
                      active
                        ? "border-lime-400 bg-lime-400/20 shadow-[0_0_15px_rgba(163,230,53,0.35)] scale-[1.02]"
                        : "border-white/10 bg-zinc-950/80 hover:border-white/20 hover:bg-zinc-900"
                    }`}
                  >
                    {pick.badge && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-lime-400 px-1.5 py-0.2 text-[9px] font-900 uppercase tracking-tighter text-zinc-950">
                        {pick.badge}
                      </span>
                    )}
                    <span className="block text-xs font-450 text-zinc-400">
                      {pick.label}
                    </span>
                    <span
                      className={`mt-1 block text-xl font-750 ${
                        active ? "text-lime-300" : "text-white"
                      }`}
                    >
                      {pick.value.toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Insight de Machine Learning */}
            <div className="mt-4 rounded-xl border border-white/5 bg-zinc-950/70 p-3 text-xs">
              <div className="flex items-center justify-between text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  Probabilidad estimada por modelo:
                </span>
                <span className="font-750 text-cyan-300">{match.ml.prob}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-zinc-400">
                <span>Cuota justa estimada (Fair odds):</span>
                <span className="font-750 text-white">{match.ml.fairOdds}</span>
              </div>
            </div>

            {/* Selector interactivo de monto / stake */}
            <div className="mt-5 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Simular apuesta:</span>
                <div className="flex gap-1.5">
                  {[10, 25, 50, 100].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStake(s)}
                      className={`rounded-lg px-2 py-0.5 text-xs font-750 transition-colors ${
                        stake === s
                          ? "bg-white text-zinc-950"
                          : "bg-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      ${s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Retorno potencial dinámico */}
              <div className="mt-3 flex items-baseline justify-between rounded-xl bg-zinc-950 p-3">
                <div>
                  <span className="text-xs text-zinc-400">Retorno potencial:</span>
                  <p className="text-2xl font-750 text-lime-400">${potentialReturn}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-500">Ganancia neta:</span>
                  <p className="text-sm font-750 text-emerald-400">+${netProfit}</p>
                </div>
              </div>
            </div>

            {/* CTA para abrir el Boleto con Asesor IA */}
            <button
              type="button"
              onClick={() => handleSelectAndOpen(selectedPick)}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-lime-400 via-lime-400 to-emerald-400 px-6 py-3.5 text-base font-900 text-zinc-950 shadow-[0_0_25px_rgba(163,230,53,0.35)] transition-all hover:scale-[1.02] hover:shadow-[0_0_35px_rgba(163,230,53,0.55)] active:scale-95 cursor-pointer"
            >
              <span>Abrir Boleto IA · Cuota {currentOdds.toFixed(2)}</span>
              <span className="text-xs font-750 bg-black/20 rounded-full px-2 py-0.5">
                {match.ml.ev}
              </span>
            </button>

            <p className="mt-2.5 text-center text-[11px] text-zinc-500">
              Redirección cifrada a la plataforma oficial de {SITE.brand} · +18
            </p>
          </div>
        </div>
      </div>

      {/* CTA flotante persistente en mobile */}
      <div className="sticky bottom-0 z-30 border-t border-white/10 bg-[#070709]/95 p-3 backdrop-blur md:hidden">
        <CtaButton medium="cta_hero_sticky" campaign={campaign} className="w-full">
          Crear cuenta y recibir bono · +18
        </CtaButton>
      </div>
    </section>
  );
}
