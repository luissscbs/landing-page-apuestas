export const SITE = {
  brand: "CBS Sports",
  shortBrand: "CBS",
  tagline: "Apuestas deportivas y análisis predictivo",
  supportEmail: "ayuda@cbssports.com",
  defaultCampaign: process.env.NEXT_PUBLIC_DEFAULT_CAMPAIGN ?? "apertura",
  affiliateId: process.env.NEXT_PUBLIC_AFFILIATE_ID ?? "cbs-landing-01",
  appUrl: process.env.NEXT_PUBLIC_CBS_APP_URL ?? "https://app.cbssports.com",
  apiUrl: process.env.NEXT_PUBLIC_CBS_API_URL ?? "https://api.cbssports.com/v1",
} as const;

export const NAV_LINKS = [
  { label: "Cuotas en Vivo", href: "#cuotas" },
  { label: "Calculadora +EV", href: "#calculadora" },
  { label: "Tecnología & Ventajas", href: "#beneficios" },
  { label: "Cómo Funciona", href: "#como-funciona" },
  { label: "Bono $100", href: "#bono" },
  { label: "FAQ", href: "#faq" },
] as const;

export const LEGAL_LINKS = [
  { label: "Términos y Condiciones", href: "/terminos" },
  { label: "Política de Privacidad", href: "/privacidad" },
  { label: "Juego Responsable (+18)", href: "/juego-responsable" },
] as const;

export const FOOTER_DISCLAIMER =
  "+18. Juega con responsabilidad. El juego puede generar adicción. Las apuestas son una forma de entretenimiento deportivo, no un método de inversión ni una fuente garantizada de ingresos. Consulta Términos y Condiciones. Si necesitas ayuda, recurre a centros oficiales de atención al jugador.";
