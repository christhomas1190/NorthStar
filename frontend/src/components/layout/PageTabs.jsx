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
        {items.map(({ label, to, isActive, badge }) => {
          const active = isActive ? isActive(pathname) : pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              style={{ position: "relative", display: "inline-block", textDecoration: "none" }}
            >
              <span
                style={{
                  display: "inline-block",
                  padding: "6px 16px",
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: 500,
                  transition: "all 0.15s",
                  background: active ? "var(--ns-accent)" : "transparent",
                  color: active ? "white" : "var(--ns-text2)",
                }}
              >
                {label}
              </span>
              {badge > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    minWidth: 18,
                    height: 18,
                    borderRadius: 9,
                    background: "#dc2626",
                    color: "white",
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                    lineHeight: 1,
                    boxShadow: "0 0 0 2px var(--ns-white)",
                    pointerEvents: "none",
                  }}
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
