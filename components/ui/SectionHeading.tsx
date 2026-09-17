export default function SectionHeading({
  eyebrow,
  title,
  sub,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  align?: "center" | "left";
}) {
  const alignCls = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <div className={`max-w-2xl ${alignCls}`}>
      <p className="text-xs font-750 uppercase tracking-[0.18em] text-lime-400">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-750 leading-tight text-white md:text-4xl">
        {title}
      </h2>
      {sub ? (
        <p className="mt-3 text-base font-450 leading-7 text-zinc-400">{sub}</p>
      ) : null}
    </div>
  );
}
