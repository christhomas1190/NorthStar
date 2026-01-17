export function Table({ children, className = "" }) {
  return <table className={`w-full text-sm ${className}`}>{children}</table>;
}
export function THead({ children }) {
  return <thead className="bg-slate-50 text-slate-600">{children}</thead>;
}
export function TBody({ children }) {
  return <tbody className="divide-y">{children}</tbody>;
}
export function TR({ children, className = "" }) {
  return <tr className={className}>{children}</tr>;
}
export function TH({ children }) {
  return <th className="px-3 py-2 text-left">{children}</th>;
}
export function TD({ children }) {
  return <td className="px-3 py-2">{children}</td>;
}
