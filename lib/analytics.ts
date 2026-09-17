// ── Analytics landing P50 (stub listo para GA4/Mixpanel/PostHog) ──
// FASE 1: emite a window.dataLayer + console.debug en dev.
// FASE 2: conectar proveedor real sin cambiar los call-sites.

export const ANALYTICS_EVENTS = {
  viewHero: "view_hero",
  clickCtaRegistro: "click_cta_registro",
  clickOdds: "click_odds",
  startSignup: "start_signup",
  completeSignup: "complete_signup",
  p50Click: "p50_click",
} as const;

export type AnalyticsEvent =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function track(event: AnalyticsEvent, payload: Record<string, unknown> = {}) {
  if (typeof window !== "undefined") {
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({ event, ...payload });
    if (process.env.NODE_ENV === "development") {
      console.debug(`[analytics] ${event}`, payload);
    }
  }
}

export function trackViewHero(campaign?: string) {
  track(ANALYTICS_EVENTS.viewHero, { campaign });
}

export function trackCtaRegistro(medium: string, campaign?: string) {
  track(ANALYTICS_EVENTS.clickCtaRegistro, { medium, campaign });
  track(ANALYTICS_EVENTS.p50Click, {
    destination: "register",
    medium,
    utm_campaign: campaign,
  });
}

export function trackOddsClick(eventId: string, selection: string, odd: number) {
  track(ANALYTICS_EVENTS.clickOdds, { eventId, selection, odd });
  track(ANALYTICS_EVENTS.p50Click, { destination: "event", eventId });
}
