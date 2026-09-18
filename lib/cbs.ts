// ── Integración CBS Sports ──────────────────────────────
// Tipos y adaptadores para cuotas, modelos probabilísticos ML y enlaces profundos.

import { SITE } from "./site";

export type MlPrediction = {
  probabilities: {
    home: number; // Ej: 0.52 (52%)
    draw: number; // Ej: 0.26 (26%)
    away: number; // Ej: 0.22 (22%)
  };
  fairOdds: {
    home: number;
    draw: number;
    away: number;
  };
  valueBet?: {
    selection: "home" | "draw" | "away";
    expectedValuePct: number; // Ej: +9.2% EV
    confidence: "alta" | "media" | "moderada";
    recommendedKellyStakePct: number;
  };
  warning?: string | null;
};

export type MarketOption = {
  odds: number;
  prob: number;
  fairOdds: number;
  ev: number;
  kelly: number;
};

export type MatchMarkets = {
  btts?: {
    yes: MarketOption;
    no: MarketOption;
  };
  overUnder25?: {
    over: MarketOption;
    under: MarketOption;
  };
  doubleChance?: {
    "1X": MarketOption;
    "12": MarketOption;
    "X2": MarketOption;
  };
};

export type MatchOdds = {
  id: string;
  league: string;
  category: "all" | "laliga" | "premier" | "seriea" | "bundesliga" | "champions" | "latam" | "live" | string;
  home: string;
  away: string;
  homeShort: string;
  awayShort: string;
  homeColor?: string;
  awayColor?: string;
  startsAt: string; // ISO
  live?: { minute: number; homeScore: number; awayScore: number };
  odds: { home: number; draw: number; away: number };
  movement?: {
    home: "up" | "down" | "flat";
    draw: "up" | "down" | "flat";
    away: "up" | "down" | "flat";
  };
  ml?: MlPrediction;
  markets?: MatchMarkets;
  xg?: { home: number; away: number };
};

export const FALLBACK_ODDS: MatchOdds[] = [
  {
    id: "rm-bar",
    league: "LaLiga · España",
    category: "laliga",
    home: "Real Madrid",
    away: "FC Barcelona",
    homeShort: "RMA",
    awayShort: "FCB",
    homeColor: "#3b82f6",
    awayColor: "#ef4444",
    startsAt: "2026-09-20T19:00:00Z",
    odds: { home: 2.15, draw: 3.40, away: 3.10 },
    movement: { home: "down", draw: "flat", away: "up" },
    ml: {
      probabilities: { home: 0.51, draw: 0.27, away: 0.22 },
      fairOdds: { home: 1.96, draw: 3.70, away: 4.54 },
      valueBet: {
        selection: "home",
        expectedValuePct: 9.65,
        confidence: "alta",
        recommendedKellyStakePct: 2.4,
      },
    },
  },
  {
    id: "city-ars",
    league: "Premier League · Inglaterra",
    category: "live",
    home: "Man. City",
    away: "Arsenal",
    homeShort: "MCI",
    awayShort: "ARS",
    homeColor: "#0ea5e9",
    awayColor: "#dc2626",
    startsAt: "2026-09-21T18:30:00Z",
    live: { minute: 67, homeScore: 1, awayScore: 1 },
    odds: { home: 2.35, draw: 3.25, away: 2.95 },
    movement: { home: "up", draw: "flat", away: "down" },
    ml: {
      probabilities: { home: 0.46, draw: 0.32, away: 0.22 },
      fairOdds: { home: 2.17, draw: 3.12, away: 4.54 },
      valueBet: {
        selection: "home",
        expectedValuePct: 8.28,
        confidence: "alta",
        recommendedKellyStakePct: 1.9,
      },
    },
  },
  {
    id: "liv-bay",
    league: "UEFA Champions League",
    category: "champions",
    home: "Liverpool",
    away: "Bayern Múnich",
    homeShort: "LIV",
    awayShort: "BAY",
    homeColor: "#b91c1c",
    awayColor: "#e11d48",
    startsAt: "2026-09-22T19:00:00Z",
    odds: { home: 2.05, draw: 3.60, away: 3.30 },
    movement: { home: "flat", draw: "up", away: "flat" },
    ml: {
      probabilities: { home: 0.52, draw: 0.25, away: 0.23 },
      fairOdds: { home: 1.92, draw: 4.00, away: 4.35 },
      valueBet: {
        selection: "home",
        expectedValuePct: 6.60,
        confidence: "media",
        recommendedKellyStakePct: 1.6,
      },
    },
  },
  {
    id: "boc-riv",
    league: "Superclásico · Argentina",
    category: "latam",
    home: "Boca Juniors",
    away: "River Plate",
    homeShort: "BOC",
    awayShort: "RIV",
    homeColor: "#1d4ed8",
    awayColor: "#dc2626",
    startsAt: "2026-09-22T21:00:00Z",
    odds: { home: 2.75, draw: 3.00, away: 2.60 },
    movement: { home: "flat", draw: "flat", away: "flat" },
    ml: {
      probabilities: { home: 0.35, draw: 0.38, away: 0.27 },
      fairOdds: { home: 2.85, draw: 2.63, away: 3.70 },
      valueBet: {
        selection: "draw",
        expectedValuePct: 14.0,
        confidence: "alta",
        recommendedKellyStakePct: 2.8,
      },
    },
  },
  {
    id: "atm-sev",
    league: "LaLiga · España",
    category: "laliga",
    home: "Atlético Madrid",
    away: "Sevilla FC",
    homeShort: "ATM",
    awayShort: "SEV",
    homeColor: "#ef4444",
    awayColor: "#cbd5e1",
    startsAt: "2026-09-23T16:15:00Z",
    odds: { home: 1.80, draw: 3.55, away: 4.30 },
    movement: { home: "flat", draw: "flat", away: "flat" },
    ml: {
      probabilities: { home: 0.58, draw: 0.25, away: 0.17 },
      fairOdds: { home: 1.72, draw: 4.00, away: 5.88 },
      valueBet: {
        selection: "home",
        expectedValuePct: 4.40,
        confidence: "media",
        recommendedKellyStakePct: 1.2,
      },
    },
  },
  {
    id: "ame-chi",
    league: "Clásico Nacional · Liga MX",
    category: "latam",
    home: "Club América",
    away: "CD Guadalajara",
    homeShort: "AME",
    awayShort: "GDL",
    homeColor: "#facc15",
    awayColor: "#b91c1c",
    startsAt: "2026-09-23T23:00:00Z",
    odds: { home: 2.20, draw: 3.30, away: 3.05 },
    movement: { home: "down", draw: "flat", away: "up" },
    ml: {
      probabilities: { home: 0.49, draw: 0.29, away: 0.22 },
      fairOdds: { home: 2.04, draw: 3.45, away: 4.54 },
      valueBet: {
        selection: "home",
        expectedValuePct: 7.80,
        confidence: "alta",
        recommendedKellyStakePct: 2.1,
      },
    },
  },
];

function baseAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_CBS_APP_URL ??
    process.env.NEXT_PUBLIC_P50_APP_URL ??
    SITE.appUrl
  ).replace(/\/$/, "");
}

function withTracking(url: string, medium: string, campaign?: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "landing");
    u.searchParams.set("utm_medium", medium);
    u.searchParams.set(
      "utm_campaign",
      campaign ?? process.env.NEXT_PUBLIC_DEFAULT_CAMPAIGN ?? SITE.defaultCampaign
    );
    const aff = process.env.NEXT_PUBLIC_AFFILIATE_ID ?? SITE.affiliateId;
    if (aff) u.searchParams.set("affiliate_id", aff);
    return u.toString();
  } catch {
    return url;
  }
}

export function getSignupUrl(campaign?: string, medium = "cta_hero"): string {
  return withTracking(`${baseAppUrl()}/register`, medium, campaign);
}

export function getLoginUrl(): string {
  return `${baseAppUrl()}/login?redirect=${encodeURIComponent("/deportes/futbol")}`;
}

export function getEventUrl(
  eventId: string,
  medium = "cta_odds",
  campaign?: string
): string {
  return withTracking(`${baseAppUrl()}/evento/${eventId}`, medium, campaign);
}

export type BackendHealth = {
  status: string;
  service: string;
  matches?: number;
  odds_snapshots?: number;
  seasons?: string[];
  leagues?: string[];
  last_match_date?: string;
  data_mode?: string;
  model?: string;
};

export async function getBackendHealth(): Promise<BackendHealth | null> {
  const apiUrl =
    process.env.NEXT_PUBLIC_CBS_API_URL ??
    process.env.NEXT_PUBLIC_P50_API_URL ??
    "http://127.0.0.1:8000/api/v1";
  const baseUrl = apiUrl.replace(/\/api\/v1\/?$/, "");

  try {
    const res = await fetch(`${baseUrl}/health`, {
      next: { revalidate: 15 },
    });
    if (res.ok) {
      return (await res.json()) as BackendHealth;
    }
  } catch {
    // fallback
  }
  return null;
}

export type OddsResult = { data: MatchOdds[]; source: "static" | "api" };

export async function getUpcomingOdds(): Promise<OddsResult> {
  const apiUrl =
    process.env.NEXT_PUBLIC_CBS_API_URL ??
    process.env.NEXT_PUBLIC_P50_API_URL ??
    "http://127.0.0.1:8000/api/v1";
  const apiKey = process.env.CBS_API_KEY ?? process.env.P50_API_KEY;

  if (apiUrl) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) {
        headers["x-api-key"] = apiKey;
      }
      const res = await fetch(`${apiUrl}/odds/upcoming?sport=futbol&limit=8`, {
        headers,
        next: { revalidate: 30 },
      });
      if (res.ok) {
        const data = (await res.json()) as MatchOdds[];
        if (Array.isArray(data) && data.length > 0) {
          return { data, source: "api" };
        }
      }
    } catch {
      // Fallback limpio y silencioso si la API no está disponible
    }
  }

  return { data: FALLBACK_ODDS, source: "static" };
}

export async function getValuePredictions(minEvPct = 5.0): Promise<MatchOdds[]> {
  const apiUrl =
    process.env.NEXT_PUBLIC_CBS_API_URL ??
    process.env.NEXT_PUBLIC_P50_API_URL ??
    "http://127.0.0.1:8000/api/v1";
  const apiKey = process.env.CBS_API_KEY ?? process.env.P50_API_KEY;

  if (apiUrl) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) {
        headers["x-api-key"] = apiKey;
      }
      const res = await fetch(`${apiUrl}/predictions/value?min_ev_pct=${minEvPct}`, {
        headers,
        next: { revalidate: 30 },
      });
      if (res.ok) {
        const data = (await res.json()) as MatchOdds[];
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch {
      // Fallback limpio a filtro local
    }
  }

  return FALLBACK_ODDS.filter(
    (m) => (m.ml?.valueBet?.expectedValuePct ?? 0) >= minEvPct
  );
}

export type BacktestSummary = {
  total_bets: number;
  won: number;
  lost: number;
  win_rate_pct: number;
  win_rate_expected_pct: number;
  total_staked: number;
  net_profit: number;
  roi_pct: number;
  avg_odds: number;
  max_drawdown_pct: number;
};

export type BacktestOddsTier = {
  total_bets: number;
  won: number;
  lost: number;
  win_rate_pct: number;
  win_rate_expected_pct: number;
  total_staked: number;
  net_profit: number;
  roi_pct: number;
  avg_odds: number;
  max_drawdown_pct: number;
};

export type BacktestRecentBet = {
  id: string;
  date: string;
  match: string;
  league: string;
  selection: string;
  odds: number;
  prob: number;
  ev: number;
  result: "won" | "lost";
  profit: number;
  stake_kelly?: number;
  profit_kelly?: number;
  warned?: boolean;
  clv?: number | null;
};

export type BacktestPerformance = {
  params?: Record<string, unknown>;
  summary: BacktestSummary;
  kelly?: Record<string, unknown>;
  production?: Record<string, unknown>;
  clv_mean_pct?: number;
  clv_n?: number;
  by_league: Record<string, BacktestOddsTier>;
  by_odds: {
    low: BacktestOddsTier;
    mid: BacktestOddsTier;
    high: BacktestOddsTier;
  };
  recent_bets: BacktestRecentBet[];
  equity?: number[];
};

export async function getBacktestPerformance(): Promise<BacktestPerformance | null> {
  const apiUrl =
    process.env.NEXT_PUBLIC_CBS_API_URL ??
    process.env.NEXT_PUBLIC_P50_API_URL ??
    "http://127.0.0.1:8000/api/v1";
  const apiKey = process.env.CBS_API_KEY ?? process.env.P50_API_KEY;

  if (apiUrl) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) {
        headers["x-api-key"] = apiKey;
      }
      const res = await fetch(`${apiUrl}/backtest/performance`, {
        headers,
        next: { revalidate: 60 },
      });
      if (res.ok) {
        return (await res.json()) as BacktestPerformance;
      }
    } catch {
      // Fallback limpio
    }
  }
  return null;
}

export type PaperBet = {
  id: string;
  card_id: string;
  match: string;
  league: string;
  league_code: string;
  home: string;
  away: string;
  home_canonical: string;
  away_canonical: string;
  selection: "home" | "draw" | "away" | string;
  odds: number;
  prob: number;
  ev_pct: number;
  confidence: string;
  fair_odds: number;
  stake: number;
  stake_mode: "flat" | "kelly" | string;
  fallback: boolean;
  potential_profit: number;
  starts_at: string;
  placed_at: string;
  status: "PENDING" | "WON" | "LOST" | string;
  result?: string | null;
  profit?: number | null;
  settled_at?: string | null;
  home_score?: number | null;
  away_score?: number | null;
  score_source?: string | null;
};

export type PaperTradingSummary = {
  bankroll: number;
  initial_bankroll: number;
  profit_net: number;
  roi_pct: number;
  total_bets: number;
  won: number;
  lost: number;
  pending: number;
  active_bets: PaperBet[];
  history: PaperBet[];
};

export async function getPaperTradingSummary(): Promise<PaperTradingSummary | null> {
  const apiUrl =
    process.env.NEXT_PUBLIC_CBS_API_URL ??
    process.env.NEXT_PUBLIC_P50_API_URL ??
    "http://127.0.0.1:8000/api/v1";
  const apiKey = process.env.CBS_API_KEY ?? process.env.P50_API_KEY;

  if (apiUrl) {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) {
        headers["x-api-key"] = apiKey;
      }
      const res = await fetch(`${apiUrl}/paper-trading/summary`, {
        headers,
        cache: "no-store",
      });
      if (res.ok) {
        return (await res.json()) as PaperTradingSummary;
      }
    } catch {
      // Fallback limpio
    }
  }
  return null;
}


