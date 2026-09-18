import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://cbssports.com"),
  title: `${SITE.brand} | Apuestas Deportivas, Cuotas en Vivo y Modelos ML`,
  description:
    "La casa de apuestas deportivas de alta precisión. Cuotas decimales con margen reducido, predicciones probabilísticas por Machine Learning y retiros instantáneos en menos de 15 min. +18 Juega con responsabilidad.",
  keywords: [
    "apuestas deportivas",
    "CBS Sports",
    "cuotas futbol",
    "value bet",
    "apuestas machine learning",
    "bono bienvenida",
    "apuestas en vivo",
    "LaLiga cuotas",
    "Premier League",
  ],
  authors: [{ name: SITE.brand }],
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: SITE.brand,
    title: `${SITE.brand} | Apuestas Deportivas y Modelos Probabilísticos`,
    description:
      "Cuotas transparentes, análisis de valor (+EV) y bono de bienvenida 100% hasta $100. Crea tu cuenta gratis. +18",
    images: [{ url: "/og-cover.jpg", width: 1200, height: 630, alt: SITE.brand }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.brand} | Apuestas Deportivas y Cuotas en Vivo`,
    description:
      "Cuotas competitivas con margen reducido, predicciones probabilísticas por IA y retiros en minutos. +18",
    images: ["/og-cover.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#070709",
  width: "device-width",
  initialScale: 1,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SportsOrganization",
  name: SITE.brand,
  url: "https://cbssports.com",
  sport: "Fútbol, Baloncesto, Tenis",
  description: "Plataforma de apuestas deportivas online con tecnología de análisis predictivo. Solo +18. Juega con responsabilidad.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans font-450 bg-[#070709] text-zinc-100 selection:bg-lime-400 selection:text-black">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        {children}
      </body>
    </html>
  );
}
