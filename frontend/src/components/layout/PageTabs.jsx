import React from "react";
import { NavLink, useLocation } from "react-router-dom";

export default function PageTabs({ items }) {
  const { pathname } = useLocation();
  return (
    <nav style={{ marginTop: 8, marginBottom: 16 }}>
      <div
        style={{
          display: "inline-flex",
          gap: 4,
          background: "var(--ns-white)",
          border: "1.5px solid var(--ns-border)",
          borderRadius: 10,
          padding: 4,
        }}
      >
        {items.map(({ label, to, isActive }) => {
          const active = isActive ? isActive(pathname) : pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              style={{
                padding: "6px 16px",
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                transition: "all 0.15s",
                background: active ? "var(--ns-accent)" : "transparent",
                color: active ? "white" : "var(--ns-text2)",
              }}
            >
              {label}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
