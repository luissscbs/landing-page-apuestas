---
name: landing-frontend-nextjs
description: Use when building the P50 Sports landing UI with Next.js App Router, Tailwind, responsive odds cards, forms, performance and Core Web Vitals.
---

# Landing Frontend Next.js + Tailwind

Guía de implementación para la landing de P50 Sports.

## 1. Stack y estructura
- Next.js 14+ App Router + TypeScript + Tailwind CSS.
- Estructura:
```
app/
  layout.tsx (SEO, fonts, GA4)
  page.tsx (composición landing)
  (legal)/terminos/page.tsx, juego-responsable/page.tsx
components/
  Hero.tsx, OddsCard.tsx, UpcomingMatches.tsx, BonusBanner.tsx
  Faq.tsx, AgeGate.tsx, CtaButton.tsx, Navbar.tsx, Footer.tsx
lib/
  p50.ts (URLs, fetch odds, UTM helpers)
  analytics.ts (eventos)
```

## 2. Componentes clave apuestas
- `CtaButton`: props `variant (primary/ghost)`, `destination (register|login|event)`, `campaign`. Aplica tracking + UTM automáticamente.
- `OddsCard`: equipo local/visita, hora, liga, 3 botones 1X2 con cuota decimal, estado live (pulse rojo + minuto).
- `UpcomingMatches`: Server Component con `revalidate=30`, skeleton loading, fallback estático si falla `getUpcomingOdds()` (ver skill `p50-sports-integration`).
- `AgeGate`: modal al primer `click_cta_registro` si no hay cookie `age_verified=1`. No bloquear SEO (solo en interacción).
- `BonusBanner`: monto + 3 bullets T&C + link "Ver T&C".

## 3. Tailwind / UX
- Mobile-first: diseña a 360px, luego `md:` y `lg:`.
- Hero: `min-h-[90svh]`, headline 36-56px, CTA sticky en mobile (`fixed bottom-0 md:static`).
- Dark sport theme recomendado: bg zinc-950, acento lime-400/emerald-400, cards zinc-900 con border white/10.
- Foco visible, contraste AA, botones min 44px, `aria-label` en cuotas ("Apostar a Real Madrid a 2.10 en P50").
- Imágenes: `next/image` con `priority` solo en hero, `sizes` correcto, avif/webp.

## 4. Performance y SEO
- Fonts con `next/font`, `display: swap`. Sin Google Fonts por `<link>` bloqueante.
- `generateMetadata()` por página: title, description, canonical, openGraph, robots.
- JSON-LD en `layout`: `SportsOrganization (P50 Sports)` + `FAQPage`.
- Evita client components innecesarios: hero estático = server, solo odds ticker/live = client.
- Objetivos: bundle inicial < 200KB JS, LCP < 2.5s, imágenes < 200KB.

## 5. Formularios y captación
- No pidas password/tarjeta en landing. Solo email/telefono opcional para pre-registro → redirige a P50 para completar.
- Validación con `zod` + server action, honeypot anti-spam, mensaje éxito con CTA a P50.
- Checkbox +18 + T&C obligatorio, no premarcado.

## 6. Comandos y QA
```bash
npx create-next-app@latest . --typescript --tailwind --app --eslint
npm run dev
npm run build && npm start
npx lighthouse http://localhost:3000 --view
```
- Checklist: responsive 360/768/1280, teclado + lector pantalla, API caída con fallback, links P50 con UTM, `npm run build` sin errores TS/ESLint.

Combina siempre con `landing-cro` para copy y `apuestas-responsables` para textos legales.
