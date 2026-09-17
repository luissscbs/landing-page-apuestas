---
name: landing-cro
description: Use when creating or optimizing landing page copy, hero, CTAs, SEO meta, analytics and A/B tests for conversion and captación de registros.
---

# Landing CRO - Conversión y Captación

Aplica este skill en cualquier tarea de copy, estructura o experimentación de la landing de P50 Sports.

## Estructura obligatoria de la landing
1. **Hero (above the fold):** propuesta de valor en 1 frase + subheadline + 1 CTA primario ("Regístrate" / "Apuesta ahora") + prueba social (usuarios, rating, logos ligas).
2. **Prueba social:** testimonios, ganadores recientes (sin prometer ganancias), partners.
3. **Beneficios P50:** 3-4 cards (cuotas competitivas, pagos rápidos, app móvil, soporte 24/7).
4. **Cómo funciona:** 3 pasos (Regístrate → Deposita → Apuesta).
5. **Próximos partidos / cuotas destacadas:** conexión con P50 Sports (ver skill `p50-sports-integration`).
6. **Bonos / promos:** con T&C visibles y sin letra pequeña engañosa.
7. **FAQ SEO:** 5-8 preguntas (¿Es legal? ¿Cómo retiro? ¿Edad mínima?).
8. **Footer legal:** +18, juego responsable, enlaces T&C, privacidad, autoexclusión.

## Reglas de copy para apuestas
- CTA siempre con verbo + beneficio: "Crear cuenta gratis", "Ver cuotas en vivo".
- Nunca prometer ganancias: prohibido "gana seguro", "dinero fácil", "100% garantizado".
- Urgencia honesta: "Cuotas del Clásico hasta el domingo" sí, cuenta atrás falsa no.
- Personaliza por tráfico: UTM `?utm_campaign=clasico` → hero del Clásico.

## SEO técnico
- Un `h1` único por página, title 50-60 chars con "apuestas deportivas" + marca P50 Sports.
- Meta description 150-160 chars con CTA.
- Open Graph + Twitter cards con imagen 1200x630.
- Schema.org: `SportsOrganization` + `FAQPage` + `BreadcrumbList`.
- URLs limpias en español: `/apuestas-futbol`, `/bono-bienvenida`.

## Analytics y experimentos
- Eventos obligatorios: `view_hero`, `click_cta_registro`, `click_odds`, `start_signup`, `complete_signup`.
- Usa UTM en todos los CTAs hacia P50: `utm_source=landing&utm_medium=cta_hero&utm_campaign=p50`.
- Propone siempre 2 variantes A/B para hero copy y color/posición CTA.
- Core Web Vitals objetivo: LCP < 2.5s, CLS < 0.1, INP < 200ms.

## Checklist antes de publicar
- [ ] 1 solo CTA primario repetido cada 1-2 pantallas
- [ ] T&C de bonos a 1 clic
- [ ] Aviso +18 visible sin scroll en footer y registro
- [ ] Links a P50 con `rel` correcto y tracking
- [ ] Mobile-first verificado 360px
