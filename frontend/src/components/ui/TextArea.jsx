import * as React from "react";

export const Textarea = React.forwardRef(function Textarea(
  { className = "", ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={
        "w-full rounded-lg px-4 py-3 text-sm " +
        "placeholder-[#9c9788] focus:outline-none focus:ring-2 focus:ring-[#2d5be3] " +
        "disabled:cursor-not-allowed disabled:opacity-50 " +
        className
      }
      style={{ border: "1.5px solid #ccc8bc", background: "#f5f4f0", color: "#1a1916", fontFamily: "'Outfit', sans-serif" }}
      {...props}
    />
  );
});

export default Textarea;
