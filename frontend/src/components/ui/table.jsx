export function Table({ children, className = "" }) {
  return <table className={`w-full text-sm ${className}`}>{children}</table>;
}
export function THead({ children }) {
  return <thead className="text-[#9c9788]" style={{ borderBottom: "1px solid #e2e0d8" }}>{children}</thead>;
}
export function TBody({ children }) {
  return <tbody className="divide-y">{children}</tbody>;
}
export function TR({ children, className = "" }) {
  return <tr className={className}>{children}</tr>;
}
export function TH({ children }) {
  return <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide">{children}</th>;
}
export function TD({ children }) {
  return <td className="px-3 py-2">{children}</td>;
}
