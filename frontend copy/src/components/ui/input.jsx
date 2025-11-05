import React from "react";

const Input = React.forwardRef(function Input({ className = "", ...props }, ref) {
  return (
    <input
      ref={ref}
      className={
        "h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm " +
        "placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 " +
        className
      }
      {...props}
    />
  );
});

export { Input };
export default Input;