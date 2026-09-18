import AgeGate from "@/components/ui/AgeGate";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import Benefits from "@/components/sections/Benefits";
import BetCalculator from "@/components/sections/BetCalculator";
import BonusBanner from "@/components/sections/BonusBanner";
import Faq from "@/components/sections/Faq";
import FinalCta from "@/components/sections/FinalCta";
import Hero from "@/components/sections/Hero";
import HowItWorks from "@/components/sections/HowItWorks";
import Testimonials from "@/components/sections/Testimonials";
import UpcomingMatches from "@/components/sections/UpcomingMatches";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-[#070709] font-sans antialiased selection:bg-lime-400 selection:text-black">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <UpcomingMatches />
        <BetCalculator />
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
