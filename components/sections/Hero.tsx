"use client";

import { useEffect } from "react";
import CtaButton from "@/components/ui/CtaButton";
import { trackViewHero } from "@/lib/analytics";

export default function Hero({ campaign }: { campaign?: string }) {
  useEffect(() => {
    trackViewHero(campaign);
  }, [campaign]);

  return (
    <section id="inicio" className="relative overflow-hidden bg-zinc-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(163,230,53,0.14),transparent_70%)]"
      />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-14 md:grid-cols-[1.15fr_0.85fr] md:items-center md:px-6 md:pb-24 md:pt-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-1.5 text-xs font-450 text-lime-300">
            <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
            Cuotas actualizadas · Fútbol en vivo
            <span className="font-750 text-zinc-300">+18</span>
          </p>
          <h1 className="mt-5 text-4xl font-750 leading-[1.08] tracking-tight text-white md:text-[56px]">
            Apuestas deportivas con cuotas claras y pagos rápidos
          </h1>
          <p className="mt-4 max-w-xl text-lg font-450 leading-8 text-zinc-400">
            Sigue los grandes partidos, compara cuotas decimales y crea tu
            cuenta gratis en minutos. El registro y los pagos se completan de
            forma segura en P50 Sports.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <CtaButton medium="cta_hero" campaign={campaign} className="w-full sm:w-auto">
              Crear cuenta gratis
            </CtaButton>
            <CtaButton
              variant="ghost"
              destination="event"
              eventId="city-ars"
              medium="cta_hero_secondary"
              campaign={campaign}
              className="w-full sm:w-auto"
            >
              Ver cuotas en vivo
            </CtaButton>
          </div>
          <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm font-450 text-zinc-400">
            <div>
              <dt className="sr-only">Usuarios</dt>
              <dd>
                <span className="font-750 text-white">+120 mil</span> usuarios registrados
              </dd>
            </div>
            <div>
              <dt className="sr-only">Valoración</dt>
              <dd>
                <span className="font-750 text-white">4.8/5</span> valoración media app
              </dd>
            </div>
            <div>
              <dt className="sr-only">Retiros</dt>
              <dd>
                Retiros promedio en <span className="font-750 text-white">menos de 24 h</span>
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-xs font-450 text-zinc-500">
            +18 | Juega con responsabilidad. Sujeto a Términos y Condiciones.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/80 p-6">
          <p className="text-xs font-750 uppercase tracking-[0.18em] text-zinc-400">
            Partido destacado
          </p>
          <p className="mt-2 text-2xl font-750 text-white">
            Real Madrid <span className="font-450 text-zinc-500">vs</span> FC Barcelona
          </p>
          <p className="mt-1 text-sm font-450 text-zinc-400">
            LaLiga · Sábado 19:00 · Cuotas decimales
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { k: "1", v: "2.10" },
              { k: "X", v: "3.40" },
              { k: "2", v: "3.10" },
            ].map((o) => (
              <div key={o.k} className="rounded-xl bg-zinc-950 px-2 py-3">
                <p className="text-xs font-450 text-zinc-500">{o.k}</p>
                <p className="text-xl font-750 text-lime-300">{o.v}</p>
              </div>
            ))}
          </div>
          <CtaButton
            destination="event"
            eventId="rm-bar"
            medium="cta_hero_card"
            campaign={campaign}
            className="mt-5 w-full"
          >
            Apostar en P50
          </CtaButton>
          <p className="mt-3 text-center text-xs font-450 text-zinc-500">
            Serás redirigido a app.p50sports.com · +18
          </p>
        </div>
      </div>

      {/* CTA sticky en mobile */}
      <div className="sticky bottom-0 z-30 border-t border-white/10 bg-zinc-950/90 p-3 backdrop-blur md:hidden">
        <CtaButton medium="cta_hero_sticky" campaign={campaign} className="w-full">
          Crear cuenta gratis · +18
        </CtaButton>
      </div>
    </section>
  );
}
