import QuantNavbar from "@/components/dashboard/QuantNavbar";
import QuantDashboard from "@/components/dashboard/QuantDashboard";
import {
  getUpcomingOdds,
  getBackendHealth,
  getBacktestPerformance,
  getPaperTradingSummary,
} from "@/lib/cbs";

export default async function Home() {
  const [{ data: oddsData }, health, backtestData, paperTradingData] = await Promise.all([
    getUpcomingOdds(),
    getBackendHealth(),
    getBacktestPerformance(),
    getPaperTradingSummary(),
  ]);

  return (
    <div className="flex min-h-full flex-col bg-zinc-950 font-sans antialiased selection:bg-zinc-800 selection:text-zinc-100">
      <QuantNavbar health={health} />
      <main className="flex-1">
        <QuantDashboard
          initialOdds={oddsData}
          backtestData={backtestData}
          paperTradingData={paperTradingData}
        />
      </main>
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-5 text-center text-xs font-mono text-zinc-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <span>CBS Quant · Modelo Estadístico y Probabilidad Deportiva</span>
          <span>Dixon-Coles + xG · Premier, LaLiga, Serie A, Bundesliga</span>
        </div>
      </footer>
    </div>
  );
}


