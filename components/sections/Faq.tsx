import SectionHeading from "@/components/ui/SectionHeading";

const FAQS = [
  {
    q: "¿Es legal apostar en P50 Sports?",
    a: "P50 opera según la licencia de cada país. Verifica que el operador esté autorizado en tu jurisdicción (España DGOJ, Colombia Coljuegos, México SEGOB, Argentina por provincia) antes de registrarte. Solo +18.",
  },
  {
    q: "¿Cuál es la edad mínima?",
    a: "18 años en todos los mercados. Pedimos verificación de edad antes de redirigirte al registro y nunca dirigimos publicidad a menores.",
  },
  {
    q: "¿Cómo retiro mis fondos?",
    a: "Los retiros se hacen en la app segura de P50 Sports, nunca en esta landing. El promedio es menor a 24 h según el método de pago.",
  },
  {
    q: "¿Cómo funciona el bono de bienvenida?",
    a: "Bono 100% hasta $100 con rollover x8 en cuotas ≥1.80, válido 7 días y depósito mínimo $10. Solo +18. Lee los T&C completos a un clic.",
  },
  {
    q: "¿Las cuotas de esta página están en vivo?",
    a: "En fase 1 mostramos cuotas de ejemplo. En fase 2 se conectarán a la API de P50 con actualización cada 30 segundos y aviso de última actualización.",
  },
  {
    q: "¿Qué hago si el juego deja de ser divertido?",
    a: "Usa límites de depósito y autoexclusión en P50 o contacta centros de ayuda de tu país. Ver página de Juego responsable. El juego es entretenimiento, no una fuente de ingresos.",
  },
];

export const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

export default function Faq() {
  return (
    <section id="faq" className="bg-zinc-950 py-16 md:py-20">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <SectionHeading
          eyebrow="FAQ"
          title="Preguntas frecuentes"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
        />
        <div className="mt-8 space-y-3">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-white/10 bg-zinc-900 px-5 py-4"
            >
              <summary className="cursor-pointer list-none text-[15px] font-750 text-white [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {f.q}
                  <span className="text-lime-400 transition-transform group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 text-sm font-450 leading-6 text-zinc-400">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
