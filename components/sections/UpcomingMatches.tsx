"use client";

import { useState } from "react";
import CtaButton from "@/components/ui/CtaButton";
import OddsCard from "@/components/ui/OddsCard";
import SectionHeading from "@/components/ui/SectionHeading";
import { FALLBACK_ODDS, type MatchOdds } from "@/lib/cbs";
import { SITE } from "@/lib/site";

const CATEGORIES = [
  { id: "all", label: "Todos los partidos" },
  { id: "value", label: "Top Picks +EV" },
  { id: "live", label: "En Vivo" },
  { id: "laliga", label: "LaLiga" },
  { id: "premier", label: "Premier League" },
  { id: "champions", label: "Champions" },
  { id: "latam", label: "Sudamérica / MX" },
] as const;

export default function UpcomingMatches({
  initialOdds = FALLBACK_ODDS,
  oddsSource = "static",
}: {
  initialOdds?: MatchOdds[];
  oddsSource?: "static" | "api";
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredMatches = initialOdds.filter((m) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "value") return !!m.ml?.valueBet && m.ml.valueBet.expectedValuePct > 0;
    if (selectedCategory === "live") return !!m.live;
    return m.category === selectedCategory;
  });

  return (
    <section id="cuotas" className="bg-[#070709] py-16 md:py-24 border-t border-white/5">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Mercados & Algoritmos"
          title="Cuotas en Vivo y Oportunidades de Valor"
          sub="Cuotas calculadas con margen ultra bajo y contrastadas contra nuestros modelos de probabilidad predictiva."
        />

        {/* Indicador de conexión con Backend FastAPI */}
        <div className="mt-4 flex items-center justify-end">
          {oddsSource === "api" ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-750 text-emerald-300 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span>API FastAPI conectada (:8000) · Algoritmos Dixon-Coles</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/50 px-3 py-1 text-xs font-450 text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
              <span>Modo catálogo de respaldo (Fallback)</span>
            </div>
          )}
        </div>

        {/* Barra de Filtros por Competición */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-750 transition-all ${
                  active
                    ? "bg-lime-400 text-zinc-950 shadow-[0_0_15px_rgba(163,230,53,0.3)]"
                    : "border border-white/10 bg-zinc-900/60 text-zinc-400 hover:border-white/20 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Grilla de Tarjetas de Partidos */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMatches.map((m) => (
            <OddsCard key={m.id} match={m} />
          ))}
        </div>

        {filteredMatches.length === 0 && (
          <div className="my-10 rounded-2xl border border-white/10 bg-zinc-900/40 p-8 text-center text-zinc-400">
            No hay eventos en vivo en esta categoría en este momento. Consulta las demás ligas.
          </div>
        )}

        {/* Footer de la sección */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-xs font-450 text-zinc-500">
            Actualización de cuotas cada 30 segundos · Modelos de predicción Poisson & Dixon-Coles
          </p>
          <CtaButton
            destination="event"
            eventId={initialOdds[0]?.id ?? "rm-bar"}
            medium="cta_odds_section"
            className="px-8"
          >
            Ver más de 400 partidos en {SITE.brand}
          </CtaButton>
        </div>
      </div>
    </section>
  );
}
