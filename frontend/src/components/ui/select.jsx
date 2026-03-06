import React from "react";

const SelectCtx = React.createContext(null);

export function Select({ value, defaultValue, onValueChange, className = "", children }) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const [open, setOpen] = React.useState(false);
  const [labelMap] = React.useState(() => new Map());
  const containerRef = React.useRef(null);

  const current = isControlled ? value : internal;
  const setValue = (v) => {
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
  };

  React.useEffect(() => {
    function onDoc(e) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onDoc);
      document.addEventListener("touchstart", onDoc, { passive: true });
      return () => {
        document.removeEventListener("mousedown", onDoc);
        document.removeEventListener("touchstart", onDoc);
      };
    }
  }, [open]);

  return (
    <SelectCtx.Provider value={{ value: current, setValue, open, setOpen, labelMap }}>
      <div ref={containerRef} className={`relative ${className}`}>{children}</div>
    </SelectCtx.Provider>
  );
}

export function SelectTrigger({ className = "", children, ...props }) {
  const ctx = React.useContext(SelectCtx);
  if (!ctx) throw new Error("SelectTrigger must be used within <Select>");
  return (
    <button
      type="button"
      role="combobox"
      aria-expanded={ctx.open}
      onClick={() => ctx.setOpen(!ctx.open)}
      className={`h-9 w-full rounded-lg px-3 text-sm text-left focus:outline-none focus:ring-2 focus:ring-[#2d5be3] ${className}`}
      style={{ border: "1.5px solid #ccc8bc", background: "#f5f4f0", color: "#1a1916", fontFamily: "'Outfit', sans-serif" }}
      {...props}
    >
      <div className="flex items-center justify-between">{children}<svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 ml-2"><path d="M5 7l5 6 5-6" fill="currentColor"/></svg></div>
    </button>
  );
}

export function SelectValue({ placeholder }) {
  const ctx = React.useContext(SelectCtx);
  if (!ctx) throw new Error("SelectValue must be used within <Select>");
  const label = ctx.labelMap.get(ctx.value) ?? ctx.value;
  return <span className="truncate">{label || placeholder || "Select…"}</span>;
}

export function SelectContent({ className = "", children, ...props }) {
  const ctx = React.useContext(SelectCtx);
  if (!ctx) throw new Error("SelectContent must be used within <Select>");
  if (!ctx.open) return null;
  return (
    <div
      role="listbox"
      className={`absolute z-50 mt-2 w-full rounded-xl bg-white p-1 ${className}`}
      style={{ border: "1.5px solid #e2e0d8", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
      {...props}
    >
      {children}
    </div>
  );
}

export function SelectItem({ value, className = "", children, ...props }) {
  const ctx = React.useContext(SelectCtx);
  if (!ctx) throw new Error("SelectItem must be used within <Select>");
  const selected = ctx.value === value;

  React.useEffect(() => {
    const label = typeof children === "string" ? children : (Array.isArray(children) ? children.join(" ") : value);
    ctx.labelMap.set(value, label);
    return () => { ctx.labelMap.delete(value); };
  }, [value, children]);

  return (
    <div
      role="option"
      aria-selected={selected}
      onClick={() => { ctx.setValue(value); ctx.setOpen(false); }}
      className={`cursor-pointer select-none rounded-lg px-3 py-2 text-sm
                  hover:bg-[#f5f4f0] ${selected ? "bg-[#eef1fc] text-[#2d5be3]" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
