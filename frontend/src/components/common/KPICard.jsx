export default function KPICard({ label, value, hint, onClick }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={[
        "w-full text-left rounded-xl bg-white p-5",
        onClick ? "transition-shadow hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2d5be3]" : "",
      ].join(" ")}
    >
      <div className="text-sm" style={{ color: "var(--ns-text2)" }}>{label}</div>
      <div className="mt-1 text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Lora', serif", color: "var(--ns-text)" }}>{value}</div>
      {hint ? <div className="mt-1 text-sm" style={{ color: "var(--ns-muted)" }}>{hint}</div> : null}
    </Comp>
  );
}