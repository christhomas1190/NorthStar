import React from "react";

const base = "inline-flex items-center border px-2.5 py-0.5 text-xs font-semibold rounded-[4px]";
const variants = {
  default: "border-transparent bg-[#2d5be3] text-white",
  secondary: "border-transparent bg-[#f5f4f0] text-[#5c5849]",
  outline: "border-[#e2e0d8] text-[#5c5849]",
  success: "border-transparent bg-[#e8f5ee] text-[#2d8c5b]",
  warning: "border-transparent bg-[#fdf3e3] text-[#c97a20]",
  danger: "border-transparent bg-[#fbeaea] text-[#c0392b]",
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
