import React from "react";

const Ctx = React.createContext(null);

export function ToastProvider({ children }) {
  const [items, setItems] = React.useState([]);
  const push = (msg) => {
    const id = Math.random().toString(36).slice(2);
    setItems((xs) => [...xs, { id, msg }]);
    setTimeout(() => setItems((xs) => xs.filter(x => x.id !== id)), 2500);
  };
  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {items.map(t => (
          <div key={t.id} className="rounded-xl border bg-white shadow px-3 py-2 text-sm">
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
export function useToast(){ const ctx = React.useContext(Ctx); if(!ctx) throw new Error("Wrap in <ToastProvider>"); return ctx; }