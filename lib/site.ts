export const SITE = {
  brand: "P50 Sports",
  tagline: "Apuestas deportivas",
  supportEmail: "ayuda@p50sports.com",
  defaultCampaign: process.env.NEXT_PUBLIC_DEFAULT_CAMPAIGN ?? "apertura",
  affiliateId: process.env.NEXT_PUBLIC_AFFILIATE_ID ?? "p50-landing-01",
  p50AppUrl:
    process.env.NEXT_PUBLIC_P50_APP_URL ?? "https://app.p50sports.com",
} as const;

export const NAV_LINKS = [
  { label: "Cuotas", href: "#cuotas" },
  { label: "Beneficios", href: "#beneficios" },
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Bono", href: "#bono" },
  { label: "FAQ", href: "#faq" },
] as const;

export const LEGAL_LINKS = [
  { label: "Términos", href: "/terminos" },
  { label: "Privacidad", href: "/privacidad" },
  { label: "Juego responsable", href: "/juego-responsable" },
] as const;

export const FOOTER_DISCLAIMER =
  "+18. Juega con responsabilidad. El juego puede generar adicción. Las apuestas son entretenimiento, no una forma de ganar dinero. Consulta Términos y Condiciones. Si necesitas ayuda, contacta con centros de atención al jugador de tu país.";
