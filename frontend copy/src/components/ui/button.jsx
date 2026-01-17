import React from "react";

const base =
  "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium " +
  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 " +
  "disabled:opacity-50 disabled:pointer-events-none";

const variants = {
  default: "bg-slate-900 text-white hover:bg-slate-800",
  outline: "border border-slate-300 text-slate-900 hover:bg-slate-50",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
  ghost: "text-slate-900 hover:bg-slate-100",
  destructive: "bg-rose-600 text-white hover:bg-rose-500",
};

const sizes = {
  sm: "h-8 px-3 text-xs rounded-lg",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base rounded-2xl",
};

const Spinner = () => (
  <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4 animate-spin" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" fill="none" />
  </svg>
);

const Button = React.forwardRef(function Button(
  { className = "", variant = "default", size = "md", as: Comp = "button", loading = false, children, ...props },
  ref
) {
  const classes = [base, variants[variant] || variants.default, sizes[size] || sizes.md, className].join(" ");
  return (
    <Comp ref={ref} className={classes} {...props}>
      {loading ? <Spinner /> : null}
      {children}
    </Comp>
  );
});

export { Button };
export default Button;