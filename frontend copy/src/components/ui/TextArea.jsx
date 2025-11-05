import * as React from "react";

export const Textarea = React.forwardRef(function Textarea(
  { className = "", ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={
        "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm " +
        "placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 " +
        "disabled:cursor-not-allowed disabled:opacity-50 " +
        className
      }
      {...props}
    />
  );
});

export default Textarea;
