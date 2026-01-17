export default function KPICard({ label, value, hint, onClick }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={[
        "w-full text-left rounded-3xl border border-slate-200 bg-white p-5 shadow-sm",
        onClick ? "transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-300" : "",
      ].join(" ")}
    >
      <div className="text-slate-500 text-sm">{label}</div>
      <div className="mt-1 text-3xl font-semibold tracking-tight">{value}</div>
      {hint ? <div className="mt-1 text-slate-400 text-sm">{hint}</div> : null}
    </Comp>
  );
}