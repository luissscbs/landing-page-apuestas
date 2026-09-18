"use client";

import { useState } from "react";
import SectionHeading from "@/components/ui/SectionHeading";
import CtaButton from "@/components/ui/CtaButton";
import { SITE } from "@/lib/site";

export default function BetCalculator() {
  const [odds, setOdds] = useState<number>(2.25);
  const [stake, setStake] = useState<number>(50);
  const [modelProb, setModelProb] = useState<number>(50); // 50%

  // Cálculos matemáticos cuantitativos
  const bookmakerImpliedProb = (1 / odds) * 100;
  const expectedValuePct = ((modelProb / 100) * odds - 1) * 100;
  const potentialReturn = (stake * odds).toFixed(2);
  const netProfit = (stake * (odds - 1)).toFixed(2);

  // Criterio de Kelly (Quarter Kelly)
  const b = odds - 1;
  const p = modelProb / 100;
  const q = 1 - p;
  const fullKelly = (b * p - q) / b;
  const quarterKellyPct = Math.max(0, fullKelly * 0.25 * 100).toFixed(1);

  const isValueBet = expectedValuePct > 0;

  return (
    <section id="calculadora" className="border-t border-white/5 bg-[#09090d] py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Herramienta Cuantitativa"
          title="Calculadora de Valor Esperado (+EV)"
          sub="Comprueba cómo nuestros modelos de Machine Learning identifican cuotas infravaloradas por el mercado."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:items-center">
          {/* Controles de Entrada */}
          <div className="rounded-3xl border border-white/10 bg-zinc-900/60 p-6 sm:p-8 lg:col-span-6">
            <h3 className="text-lg font-750 text-white">Parámetros de la Apuesta</h3>
            <p className="mt-1 text-xs text-zinc-400">
              Modifica los valores para calcular el retorno y la ventaja matemática frente a la casa.
            </p>

            <div className="mt-6 space-y-5">
              {/* Cuota Decimal */}
              <div>
                <div className="flex justify-between text-xs font-450 text-zinc-300">
                  <label htmlFor="odds-input">Cuota Decimal Ofrecida</label>
                  <span className="font-750 text-lime-400">{odds.toFixed(2)}</span>
                </div>
                <input
                  id="odds-input"
                  type="range"
                  min="1.20"
                  max="6.00"
                  step="0.05"
                  value={odds}
                  onChange={(e) => setOdds(parseFloat(e.target.value))}
                  className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-lime-400"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                  <span>1.20 (Muy probable)</span>
                  <span>3.50</span>
                  <span>6.00 (No favorito)</span>
                </div>
              </div>

              {/* Probabilidad estimada por el modelo ML */}
              <div>
                <div className="flex justify-between text-xs font-450 text-zinc-300">
                  <label htmlFor="prob-input">Probabilidad Real estimada por el Modelo ML</label>
                  <span className="font-750 text-cyan-400">{modelProb}%</span>
                </div>
                <input
                  id="prob-input"
                  type="range"
                  min="15"
                  max="85"
                  step="1"
                  value={modelProb}
                  onChange={(e) => setModelProb(parseInt(e.target.value))}
                  className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-800 accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
                  <span>15%</span>
                  <span>50%</span>
                  <span>85%</span>
                </div>
              </div>

              {/* Monto / Stake */}
              <div>
                <div className="flex justify-between text-xs font-450 text-zinc-300">
                  <label>Monto Apostado ($ USD)</label>
                  <span className="font-750 text-white">${stake}</span>
                </div>
                <div className="mt-2.5 flex gap-2">
                  {[10, 25, 50, 100, 200].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStake(s)}
                      className={`flex-1 rounded-xl py-2 text-xs font-750 transition-all ${
                        stake === s
                          ? "bg-lime-400 text-zinc-950 shadow-[0_0_12px_rgba(163,230,53,0.3)]"
                          : "border border-white/10 bg-zinc-950 text-zinc-400 hover:text-white"
                      }`}
                    >
                      ${s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta de Resultados */}
          <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-zinc-900/90 via-zinc-900/70 to-zinc-950/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl lg:col-span-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <span className="text-xs font-750 uppercase tracking-widest text-zinc-400">
                Diagnóstico Matemático
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-750 ${
                  isValueBet
                    ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/20 border border-rose-500/30 text-rose-300"
                }`}
              >
                {isValueBet ? "⚡ Cuota con Valor (+EV)" : "⚠️ Sin Valor Matemático"}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-zinc-950/80 p-4 border border-white/5">
                <p className="text-xs font-450 text-zinc-400">Valor Esperado (+EV)</p>
                <p
                  className={`mt-1 text-2xl font-750 ${
                    isValueBet ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {expectedValuePct > 0 ? `+${expectedValuePct.toFixed(2)}%` : `${expectedValuePct.toFixed(2)}%`}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500">
                  {isValueBet
                    ? "Rendimiento matemático a largo plazo"
                    : "La casa tiene ventaja en esta cuota"}
                </p>
              </div>

              <div className="rounded-2xl bg-zinc-950/80 p-4 border border-white/5">
                <p className="text-xs font-450 text-zinc-400">Retorno Potencial</p>
                <p className="mt-1 text-2xl font-750 text-lime-400">${potentialReturn}</p>
                <p className="mt-1 text-[11px] text-zinc-400">
                  Beneficio neto: <strong className="text-white">+${netProfit}</strong>
                </p>
              </div>
            </div>

            {/* Comparativa de Probabilidad */}
            <div className="mt-5 rounded-2xl bg-zinc-950/50 p-4 border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Probabilidad implícita en la cuota:</span>
                <span className="font-750 text-white">{bookmakerImpliedProb.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Probabilidad del modelo {SITE.brand}:</span>
                <span className="font-750 text-cyan-400">{modelProb.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-2">
                <span className="text-zinc-400">Recomendación Quarter-Kelly:</span>
                <span className="font-750 text-lime-400">
                  {quarterKellyPct}% del bankroll
                </span>
              </div>
            </div>

            <CtaButton
              medium="cta_calculator"
              className="mt-6 w-full"
            >
              Apostar con Ventaja en {SITE.brand}
            </CtaButton>
          </div>
        </div>
      </div>
    </section>
  );
}
