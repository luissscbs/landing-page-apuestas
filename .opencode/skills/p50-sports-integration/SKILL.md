---
name: p50-sports-integration
description: Use when connecting the Next.js landing to the P50 Sports betting project via deep links, auth, live odds API, tracking and env vars.
---

# P50 Sports Integration

Cómo conectar la landing con el proyecto P50 Sports de apuestas deportivas.

## 1. Modelo de integración
La landing **no procesa apuestas ni pagos**. Solo capta y redirige a P50 Sports:
- `P50_APP_URL=https://app.p50sports.com` (prod) / `https://staging.p50sports.com`
- Registro: `{P50_APP_URL}/register?utm_source=landing&utm_medium=cta_hero&utm_campaign={campaign}&affiliate_id={id}`
- Login: `{P50_APP_URL}/login?redirect=/deportes/futbol`
- Apuesta profunda: `{P50_APP_URL}/evento/{eventId}?mercado={marketId}&seleccion={selectionId}`
- Siempre `target="_blank" rel="noopener sponsored"` en CTAs externos.

## 2. Variables de entorno (Next.js)
```env
NEXT_PUBLIC_P50_APP_URL=https://app.p50sports.com
NEXT_PUBLIC_P50_API_URL=https://api.p50sports.com/v1
P50_API_KEY=server-only-no-exponer
NEXT_PUBLIC_AFFILIATE_ID=p50-landing-01
NEXT_PUBLIC_DEFAULT_CAMPAIGN=apertura
```
- Nunca exponer `P50_API_KEY` en cliente. Solo en Route Handlers / Server Components.
- Centralizar en `lib/p50.ts`: `getSignupUrl(campaign)`, `getEventUrl(eventId, ...)`, `getLoginUrl()`.

## 3. API de cuotas (solo lectura)
- Endpoint esperado: `GET {P50_API_URL}/odds/upcoming?sport=futbol&limit=6` con header `x-api-key`.
- Usa `fetch` en Server Component con `next: { revalidate: 30 }` (30s para cuotas).
- Fallback obligatorio si la API cae: muestra 3 partidos estáticos + CTA "Ver todas las cuotas en P50".
- Formato cuota decimal (2.10), nunca americana salvo flag. Muestra movimiento: ↑ ↓.
- No cachear en cliente más de 60s. Añade `Última actualización: hace X s`.

```ts
// lib/p50.ts
export async function getUpcomingOdds() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_P50_API_URL}/odds/upcoming?sport=futbol&limit=6`, {
      headers: { 'x-api-key': process.env.P50_API_KEY! },
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error('p50 down');
    return await res.json();
  } catch {
    return FALLBACK_ODDS; // array estático local
  }
}
```

## 4. Tracking afiliados y analytics
- Propaga `utm_*`, `affiliate_id` y `click_id` de la URL de entrada a todos los links salientes.
- Guarda `click_id` en cookie 30 días para atribución.
- Eventos: `p50_click` con `{ destination, eventId?, utm_campaign }` en GA4 / Mixpanel / PostHog.

## 5. Auth / sesión compartida (si aplica)
- Si P50 expone SSO/JWT: verifica sesión en Route Handler, no en cliente.
- Si usuario ya logueado en P50 (cookie `.p50sports.com`), CTA cambia de "Regístrate" a "Seguir apostando".
- Nunca pedir password ni datos bancarios en la landing. Todo pago/login ocurre en P50.

## 6. Checklist integración
- [ ] Links con UTM + affiliate funcionan en staging y prod
- [ ] Fallback de odds probado con API caída (devtools block request)
- [ ] Sin secretos en bundle cliente (`NEXT_PUBLIC_` auditado)
- [ ] Tiempos: API p95 < 800ms, revalidación 30-60s
