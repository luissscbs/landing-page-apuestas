"use client";

import React, { createContext, useContext, useState, useMemo, useCallback } from "react";
import type { MatchOdds } from "@/lib/cbs";

export type BetSelection = "home" | "draw" | "away";

export type ActiveBet = {
  match: MatchOdds;
  selection: BetSelection;
  selectionLabel: string;
  odds: number;
  modelProb: number; // 0.0 - 1.0
  impliedProb: number; // 0.0 - 1.0
  expectedValuePct: number; // ej: +12.5%
  isPositiveEv: boolean;
  fairOdds: number;
  recommendedKellyStakePct: number;
};

type BetSlipContextType = {
  activeBet: ActiveBet | null;
  isOpen: boolean;
  isMinimized: boolean;
  stake: number;
  selectBet: (match: MatchOdds, selection: BetSelection) => void;
  clearBet: () => void;
  setStake: (stake: number) => void;
  setIsOpen: (isOpen: boolean) => void;
  setIsMinimized: (isMinimized: boolean) => void;
  toggleOpen: () => void;
};

const BetSlipContext = createContext<BetSlipContextType | undefined>(undefined);

export function BetSlipProvider({ children }: { children: React.ReactNode }) {
  const [activeBet, setActiveBet] = useState<ActiveBet | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [stake, setStake] = useState<number>(25);

  const selectBet = useCallback((match: MatchOdds, selection: BetSelection) => {
    const odds = match.odds[selection];
    const impliedProb = 1 / odds;

    // Obtener probabilidad del modelo si existe, o usar heurística
    const modelProb = match.ml?.probabilities
      ? match.ml.probabilities[selection]
      : impliedProb;

    const expectedValuePct = (modelProb * odds - 1) * 100;
    const isPositiveEv = expectedValuePct > 0;

    const fairOdds = match.ml?.fairOdds
      ? match.ml.fairOdds[selection]
      : Number((1 / Math.max(0.01, modelProb)).toFixed(2));

    // Quarter-Kelly calculation
    const b = odds - 1;
    const p = modelProb;
    const q = 1 - p;
    const fullKelly = b > 0 ? (b * p - q) / b : 0;
    const recommendedKellyStakePct = Math.min(
      3.0,
      Math.max(0, Number((fullKelly * 0.25 * 100).toFixed(1)))
    );

    let selectionLabel = match.home;
    if (selection === "draw") selectionLabel = "Empate";
    if (selection === "away") selectionLabel = match.away;

    setActiveBet({
      match,
      selection,
      selectionLabel,
      odds,
      modelProb,
      impliedProb,
      expectedValuePct,
      isPositiveEv,
      fairOdds,
      recommendedKellyStakePct,
    });

    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const clearBet = useCallback(() => {
    setActiveBet(null);
    setIsOpen(false);
  }, []);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) setIsMinimized(false);
      return !prev;
    });
  }, []);

  const value = useMemo(
    () => ({
      activeBet,
      isOpen,
      isMinimized,
      stake,
      selectBet,
      clearBet,
      setStake,
      setIsOpen,
      setIsMinimized,
      toggleOpen,
    }),
    [activeBet, isOpen, isMinimized, stake, selectBet, clearBet, toggleOpen]
  );

  return (
    <BetSlipContext.Provider value={value}>{children}</BetSlipContext.Provider>
  );
}

export function useBetSlip() {
  const context = useContext(BetSlipContext);
  if (!context) {
    throw new Error("useBetSlip debe usarse dentro de un BetSlipProvider");
  }
  return context;
}
