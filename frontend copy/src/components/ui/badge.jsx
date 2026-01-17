import React from "react";

const base = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium";
const variants = {
  default: "border-transparent bg-slate-900 text-white",
  secondary: "border-transparent bg-slate-100 text-slate-900",
  outline: "border-slate-300 text-slate-700",
  success: "border-transparent bg-emerald-100 text-emerald-800",
  warning: "border-transparent bg-amber-100 text-amber-800",
  danger: "border-transparent bg-rose-100 text-rose-800",
};

function Badge({ variant = "default", className = "", children, ...props }) {
  return (
    <span className={[base, variants[variant] || variants.default, className].join(" ")} {...props}>
      {children}
    </span>
  );
}

export { Badge };
export default Badge;