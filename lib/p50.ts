// ── Integración P50 Sports ──────────────────────────────
// FASE 1 (actual): landing 100% estática. Sin llamadas API.
// getUpcomingOdds() devuelve FALLBACK_ODDS local.
// FASE 2 (futura): descomentar el bloque fetch con revalidate 30s
// y P50_API_KEY solo en servidor. Ver skill p50-sports-integration.

export type MatchOdds = {
  id: string;
  league: string;
  home: string;
  away: string;
  startsAt: string; // ISO
  live?: { minute: number };
  odds: { home: number; draw: number; away: number };
  movement?: { home: "up" | "down" | "flat"; draw: "up" | "down" | "flat"; away: "up" | "down" | "flat" };
};

// 6 partidos estáticos de ejemplo. Cuotas decimales realistas.
// Al conectar la API, este array queda como fallback si la API cae.
export const FALLBACK_ODDS: MatchOdds[] = [
  {
    id: "rm-bar",
    league: "LaLiga · España",
    home: "Real Madrid",
    away: "FC Barcelona",
    startsAt: "2026-09-20T19:00:00Z",
    odds: { home: 2.1, draw: 3.4, away: 3.1 },
    movement: { home: "down", draw: "flat", away: "up" },
  },
  {
    id: "atm-sev",
    league: "LaLiga · España",
    home: "Atlético",
    away: "Sevilla",
    startsAt: "2026-09-21T16:15:00Z",
    odds: { home: 1.85, draw: 3.5, away: 4.2 },
    movement: { home: "flat", draw: "flat", away: "flat" },
  },
  {
    id: "city-ars",
    league: "Premier · Inglaterra",
    home: "Man. City",
    away: "Arsenal",
    startsAt: "2026-09-21T18:30:00Z",
    live: { minute: 63 },
    odds: { home: 2.4, draw: 3.2, away: 2.9 },
    movement: { home: "up", draw: "flat", away: "down" },
  },
  {
    id: "boc-riv",
    league: "Liga Profesional · AR",
    home: "Boca Juniors",
    away: "River Plate",
    startsAt: "2026-09-22T21:00:00Z",
    odds: { home: 2.75, draw: 3.0, away: 2.6 },
    movement: { home: "flat", draw: "flat", away: "flat" },
  },
  {
    id: "ame-chi",
    league: "Liga MX · México",
    home: "América",
    away: "Chivas",
    startsAt: "2026-09-22T23:00:00Z",
    odds: { home: 2.2, draw: 3.3, away: 3.0 },
    movement: { home: "down", draw: "flat", away: "flat" },
  },
  {
    id: "nac-mil",
    league: "Liga BetPlay · CO",
    home: "Atl. Nacional",
    away: "Millonarios",
    startsAt: "2026-09-23T00:30:00Z",
    odds: { home: 2.5, draw: 3.1, away: 2.8 },
    movement: { home: "flat", draw: "flat", away: "flat" },
  },
];

function baseAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_P50_APP_URL ?? "https://app.p50sports.com"
  ).replace(/\/$/, "");
}

function withTracking(url: string, medium: string, campaign?: string): string {
  const u = new URL(url);
  u.searchParams.set("utm_source", "landing");
  u.searchParams.set("utm_medium", medium);
  u.searchParams.set(
    "utm_campaign",
    campaign ?? process.env.NEXT_PUBLIC_DEFAULT_CAMPAIGN ?? "apertura"
  );
  const aff = process.env.NEXT_PUBLIC_AFFILIATE_ID;
  if (aff) u.searchParams.set("affiliate_id", aff);
  return u.toString();
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

export type OddsResult = { data: MatchOdds[]; source: "static" | "api" };

export async function getUpcomingOdds(): Promise<OddsResult> {
  // FASE 1: estático. Sin fetch, build y deploy deterministas.
  return { data: FALLBACK_ODDS, source: "static" };

  // ── FASE 2: conectar API P50 (descomentar al integrar) ──
  // try {
  //   const res = await fetch(
  //     `${process.env.NEXT_PUBLIC_P50_API_URL}/odds/upcoming?sport=futbol&limit=6`,
  //     {
  //       headers: { "x-api-key": process.env.P50_API_KEY! },
  //       next: { revalidate: 30 },
  //     }
  //   );
  //   if (!res.ok) throw new Error("p50 down");
  //   const data = (await res.json()) as MatchOdds[];
  //   return { data, source: "api" };
  // } catch {
  //   return { data: FALLBACK_ODDS, source: "static" };
  // }
}
