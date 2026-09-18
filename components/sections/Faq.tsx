import SectionHeading from "@/components/ui/SectionHeading";
import { SITE } from "@/lib/site";

const FAQS = [
  {
    q: `¿Es legal y seguro apostar en ${SITE.brand}?`,
    a: `${SITE.brand} opera bajo licencias y normativas locales aplicables según la jurisdicción (España DGOJ, Colombia Coljuegos, México SEGOB, y licencias internacionales autorizadas). Todos los fondos de los usuarios están protegidos en cuentas segregadas y las transacciones se realizan bajo cifrado bancario SSL 256-bit. Solo +18.`,
  },
  {
    q: "¿Qué significan los porcentajes de probabilidad y las cuotas de valor (+EV)?",
    a: "Nuestros algoritmos estadísticos (basados en modelos Dixon-Coles y machine learning) analizan millones de datos históricos para calcular la probabilidad matemática real de cada partido. Cuando la cuota de la casa paga más de lo que indica la probabilidad real, se genera una apuesta con Valor Esperado Positivo (+EV).",
  },
  {
    q: "¿Cuánto tardan en procesarse los retiros de saldo?",
    a: "La gran mayoría de los retiros se completan de forma automatizada en menos de 15 a 30 minutos a través de transferencias bancarias directas, tarjetas o billeteras electrónicas, una vez verificada la identidad del usuario (KYC).",
  },
  {
    q: "¿Cómo funciona el bono de bienvenida de $100?",
    a: "Al registrarte y realizar tu primer depósito (mínimo $10 USD), acreditamos un bono del 100% hasta $100 USD. El requisito de apuesta (rollover) es de x8 en cuotas mínimas de 1.80 con una vigencia de 7 días naturales. Todos los términos son públicos y transparentes.",
  },
  {
    q: "¿Cómo garantizan el juego responsable?",
    a: "En tu panel de usuario dispones de herramientas automáticas para fijar límites diarios, semanales o mensuales de depósito, pausas temporales y autoexclusión irreversible. Además, colaboramos activamente con entidades como FEJAR y Gambling Therapy. El juego debe ser siempre entretenimiento.",
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
    <section id="faq" className="bg-[#070709] py-16 md:py-24 border-t border-white/5">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <SectionHeading
          eyebrow="Resolución de Dudas"
          title="Preguntas Frecuentes"
          sub="Todo lo que necesitas saber sobre seguridad, depósitos, retiros y cuotas matemáticas."
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
        />
        <div className="mt-10 space-y-4">
          {FAQS.map((f) => (
            <details
              key={f.q}
              className="group rounded-3xl border border-white/10 bg-zinc-900/60 px-6 py-5 transition-all open:border-lime-400/40 open:bg-zinc-900/90"
            >
              <summary className="cursor-pointer list-none text-base font-750 text-white [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  <span>{f.q}</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-lime-400 font-bold transition-transform group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-4 text-sm font-450 leading-relaxed text-zinc-300">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
