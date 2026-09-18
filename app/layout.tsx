import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: `CBS Quant | Panel de Predicciones ML & Cuotas de Valor`,
  description:
    "Interfaz gráfica de predicciones cuantitativas, modelos probabilísticos Dixon-Coles y detección de apuestas con valor (+EV).",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#070709",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans font-450 bg-[#070709] text-zinc-100 selection:bg-lime-400 selection:text-black">
        {children}
      </body>
    </html>
  );
}
