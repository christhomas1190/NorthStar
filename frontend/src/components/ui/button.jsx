import React from "react";

const base =
  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium " +
  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2d5be3] " +
  "disabled:opacity-50 disabled:pointer-events-none";

const variants = {
  default: "bg-[#2d5be3] text-white hover:bg-[#2449c9]",
  outline: "border border-[#ccc8bc] text-[#5c5849] hover:border-[#2d5be3] hover:text-[#2d5be3] bg-transparent",
  secondary: "bg-[#f5f4f0] border border-[#e2e0d8] text-[#5c5849] hover:bg-[#e2e0d8]",
  ghost: "text-[#5c5849] hover:bg-[#f5f4f0] border border-transparent",
  destructive: "bg-[#c0392b] text-white hover:bg-[#a93226]",
};

const sizes = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-9 px-4 text-sm",
  lg: "h-11 px-5 text-base rounded-xl",
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
