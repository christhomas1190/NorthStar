import React from "react";

const Input = React.forwardRef(function Input({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={
        "h-9 w-full rounded-lg px-3 py-2 text-sm " +
        "placeholder-[#9c9788] focus:outline-none focus:ring-2 focus:ring-[#2d5be3] focus:border-[#2d5be3] " +
        className
      }
      style={{
        border: "1.5px solid #ccc8bc",
        background: "#f5f4f0",
        color: "#1a1916",
        fontFamily: "'Outfit', sans-serif",
      }}
      {...props}
    />
  );
});

export { Input };
export default Input;
