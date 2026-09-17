import CtaButton from "@/components/ui/CtaButton";
import OddsCard from "@/components/ui/OddsCard";
import SectionHeading from "@/components/ui/SectionHeading";
import { getUpcomingOdds } from "@/lib/p50";

export const revalidate = 30;

export default async function UpcomingMatches() {
  const { data, source } = await getUpcomingOdds();

  return (
    <section id="cuotas" className="bg-zinc-950 py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Cuotas destacadas"
          title="Próximos partidos"
          sub="Cuotas decimales de ejemplo. Al conectar la API de P50 se actualizarán solas cada 30 segundos."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((m) => (
            <OddsCard key={m.id} match={m} />
          ))}
        </div>
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-xs font-450 text-zinc-500">
            {source === "static"
              ? "Datos de muestra · Última actualización: ahora mismo · La API en vivo se conecta en fase 2"
              : "En vivo desde P50 · Actualizado hace pocos segundos"}
          </p>
          <CtaButton destination="event" eventId={data[0]?.id ?? "rm-bar"} medium="cta_odds_section">
            Ver todas las cuotas en P50
          </CtaButton>
        </div>
      </div>
    </section>
  );
}
