"use client";

import { useCallback, useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { ANALYTICS_EVENTS } from "@/lib/analytics";
import { SITE } from "@/lib/site";

export default function AgeGate() {
  const [open, setOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    const onGate = (e: Event) => {
      const href = (e as CustomEvent<{ href: string }>).detail?.href;
      setPendingHref(href ?? null);
      setOpen(true);
    };
    window.addEventListener("cbs:age-gate", onGate);
    window.addEventListener("p50:age-gate", onGate);
    return () => {
      window.removeEventListener("cbs:age-gate", onGate);
      window.removeEventListener("p50:age-gate", onGate);
    };
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setPendingHref(null);
  }, []);

  const confirm = useCallback(() => {
    // Cookie 1 año. Solo tras confirmación activa, no penaliza SEO
    document.cookie = "age_verified=1; path=/; max-age=31536000; SameSite=Lax";
    track(ANALYTICS_EVENTS.startSignup, { via: "age_gate" });
    const href = pendingHref;
    close();
    if (href) window.open(href, "_blank", "noopener");
  }, [pendingHref, close]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="agegate-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={close}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-white/15 bg-zinc-900/95 p-6 text-center shadow-2xl backdrop-blur"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-400/10 border border-lime-400/30 text-lime-400 font-750 text-base">
          +18
        </div>
        <h2 id="agegate-title" className="mt-4 text-xl font-750 text-white">
          Verificación de Mayoría de Edad
        </h2>
        <p className="mt-2 text-sm font-450 leading-6 text-zinc-400">
          Debes ser mayor de 18 años para acceder a los mercados y promociones de {SITE.brand}.
          Las apuestas son entretenimiento. Juega con responsabilidad.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={close}
            className="min-h-[44px] rounded-full border border-white/20 px-4 py-2.5 text-sm font-450 text-zinc-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            Salir
          </button>
          <button
            onClick={confirm}
            autoFocus
            className="min-h-[44px] rounded-full bg-lime-400 px-4 py-2.5 text-sm font-750 text-zinc-950 hover:bg-lime-300 hover:shadow-[0_0_20px_rgba(163,230,53,0.4)] transition-all"
          >
            Soy mayor de 18
          </button>
        </div>
      </div>
    </div>
  );
}
