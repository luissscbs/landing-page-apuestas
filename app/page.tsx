import AgeGate from "@/components/ui/AgeGate";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import Benefits from "@/components/sections/Benefits";
import BonusBanner from "@/components/sections/BonusBanner";
import Faq from "@/components/sections/Faq";
import FinalCta from "@/components/sections/FinalCta";
import Hero from "@/components/sections/Hero";
import HowItWorks from "@/components/sections/HowItWorks";
import Testimonials from "@/components/sections/Testimonials";
import UpcomingMatches from "@/components/sections/UpcomingMatches";

// FASE 1: landing estática. Sin fetch externo en build.
// FASE 2: personalizar hero por ?utm_campaign=clasico (searchParams)
// y conectar UpcomingMatches a la API P50 (ver lib/p50.ts).
export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-zinc-950 font-sans">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <UpcomingMatches />
        <Benefits />
        <HowItWorks />
        <BonusBanner />
        <Testimonials />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
      <AgeGate />
    </div>
  );
}
