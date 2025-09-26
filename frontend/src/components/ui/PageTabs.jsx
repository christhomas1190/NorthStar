import React from "react";
import { NavLink, useLocation } from "react-router-dom";

export default function PageTabs({ items }) {
  const { pathname } = useLocation();
  return (
    <nav className="mt-2 mb-4">
      <div className="inline-flex gap-2 rounded-2xl border bg-white p-1 text-sm">
        {items.map(({ label, to, isActive }) => {
          const active = isActive ? isActive(pathname) : pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={`px-4 py-2 rounded-xl transition-colors ${
                active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
