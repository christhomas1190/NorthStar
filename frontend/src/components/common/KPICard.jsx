export default function KPICard({ label, value, hint, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow ${className}`}
    >
      <p className="text-slate-500 text-sm">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
      {hint ? <p className="text-xs text-slate-400 mt-1">{hint}</p> : null}
    </button>
  );
}
