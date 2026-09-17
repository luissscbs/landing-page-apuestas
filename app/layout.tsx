import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter variable (100-900). Diseño usa 450 (regular) y 750 (bold).
// next/font auto-hospeda y evita layout shift (display: swap).
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://p50sports.com"),
  title: "P50 Sports | Apuestas deportivas y cuotas en vivo",
  description:
    "Apuesta al fútbol con cuotas competitivas, pagos rápidos y bono de bienvenida. Regístrate gratis en P50 Sports. +18 Juega con responsabilidad.",
  keywords: [
    "apuestas deportivas",
    "P50 Sports",
    "cuotas fútbol",
    "bono bienvenida",
    "apuestas en vivo",
  ],
  authors: [{ name: "P50 Sports" }],
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "P50 Sports",
    title: "P50 Sports | Apuestas deportivas y cuotas en vivo",
    description:
      "Cuotas competitivas, pagos rápidos y bono de bienvenida. Crear cuenta gratis. +18",
    images: [{ url: "/og-cover.jpg", width: 1200, height: 630, alt: "P50 Sports" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "P50 Sports | Apuestas deportivas y cuotas en vivo",
    description:
      "Cuotas competitivas, pagos rápidos y bono de bienvenida. Crear cuenta gratis. +18",
    images: ["/og-cover.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SportsOrganization",
  name: "P50 Sports",
  url: "https://p50sports.com",
  sport: "Fútbol",
  description: "Apuestas deportivas online. Solo +18. Juega con responsabilidad.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans font-450 bg-zinc-950 text-zinc-50">
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
