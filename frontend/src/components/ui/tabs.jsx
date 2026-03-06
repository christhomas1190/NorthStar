import React from "react";

const TabsCtx = React.createContext(null);

export function Tabs({ value, defaultValue, onValueChange, className = "", children }) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue);
  const current = isControlled ? value : internal;
  const setValue = (v) => {
    if (!isControlled) setInternal(v);
    onValueChange?.(v);
  };
  const idBase = React.useId();

  return (
    <TabsCtx.Provider value={{ value: current, setValue, idBase }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  );
}

export function TabsList({ className = "", children, ...props }) {
  return (
    <div
      role="tablist"
      className={`inline-grid gap-0 rounded-xl bg-white p-1 text-sm ${className}`}
      style={{ border: "1.5px solid #e2e0d8" }}
      {...props}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className = "", children, ...props }) {
  const ctx = React.useContext(TabsCtx);
  if (!ctx) throw new Error("TabsTrigger must be used within <Tabs>");
  const selected = ctx.value === value;

  return (
    <button
      role="tab"
      id={`${ctx.idBase}-${value}-tab`}
      aria-selected={selected}
      aria-controls={`${ctx.idBase}-${value}-panel`}
      onClick={() => ctx.setValue(value)}
      className={`px-3 py-2 transition-colors rounded-lg
        ${selected ? "bg-[#2d5be3] text-white" : "text-[#5c5849] hover:bg-[#f5f4f0] hover:text-[#2d5be3]"}
        ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className = "", children, ...props }) {
  const ctx = React.useContext(TabsCtx);
  if (!ctx) throw new Error("TabsContent must be used within <Tabs>");
  const selected = ctx.value === value;
  return (
    <div
      role="tabpanel"
      id={`${ctx.idBase}-${value}-panel`}
      aria-labelledby={`${ctx.idBase}-${value}-tab`}
      hidden={!selected}
      className={className}
      {...props}
    >
      {selected ? children : null}
    </div>
  );
}

export default { Tabs, TabsList, TabsTrigger, TabsContent };
