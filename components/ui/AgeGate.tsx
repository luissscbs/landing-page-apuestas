"use client";

import { useCallback, useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { ANALYTICS_EVENTS } from "@/lib/analytics";

export default function AgeGate() {
  const [open, setOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    const onGate = (e: Event) => {
      const href = (e as CustomEvent<{ href: string }>).detail?.href;
      setPendingHref(href ?? null);
      setOpen(true);
    };
    window.addEventListener("p50:age-gate", onGate);
    return () => window.removeEventListener("p50:age-gate", onGate);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setPendingHref(null);
  }, []);

  const confirm = useCallback(() => {
    // Cookie 1 año. Solo en interacción, no bloquea SEO.
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={close}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-900 p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="inline-flex rounded-full border border-white/15 px-3 py-1 text-xs font-750 text-zinc-300">
          +18
        </p>
        <h2 id="agegate-title" className="mt-3 text-xl font-750 text-white">
          ¿Tienes 18 años o más?
        </h2>
        <p className="mt-2 text-sm font-450 leading-6 text-zinc-400">
          Debes confirmar tu edad antes de continuar al registro en P50 Sports.
          Juega con responsabilidad.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            onClick={close}
            className="min-h-[44px] rounded-full border border-white/20 px-4 py-2.5 text-sm font-450 text-white hover:bg-white/10"
          >
            Salir
          </button>
          <button
            onClick={confirm}
            autoFocus
            className="min-h-[44px] rounded-full bg-lime-400 px-4 py-2.5 text-sm font-750 text-zinc-950 hover:bg-lime-300"
          >
            Sí, tengo 18+
          </button>
        </div>
      </div>
    </div>
  );
}
