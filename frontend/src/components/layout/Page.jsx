import React from "react";
import Footer from "@/components/layout/Footer";

export default function Page({ title, subtitle, actions, children }) {
  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", display: "flex", flexDirection: "column", background: "var(--ns-bg)" }}>
      {/* Subbar */}
      {(title || subtitle || actions) && (
        <div
          style={{
            background: "var(--ns-white)",
            borderBottom: "1px solid var(--ns-border)",
            padding: "14px 28px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            flexShrink: 0,
          }}
        >
          {title && (
            <h1
              style={{
                fontFamily: "'Lora', serif",
                fontSize: 22,
                fontWeight: 700,
                color: "var(--ns-text)",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {title}
            </h1>
          )}
          {subtitle && (
            <span
              style={{
                background: "var(--ns-bg)",
                border: "1px solid var(--ns-border)",
                borderRadius: 6,
                padding: "5px 12px",
                fontSize: 12,
                color: "var(--ns-text2)",
              }}
            >
              {subtitle}
            </span>
          )}
          {!subtitle && (
            <span
              style={{
                background: "var(--ns-bg)",
                border: "1px solid var(--ns-border)",
                borderRadius: 6,
                padding: "5px 12px",
                fontSize: 12,
                color: "var(--ns-text2)",
              }}
            >
              📅 {today}
            </span>
          )}
          {actions && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Page body */}
      <div style={{ flex: 1, padding: "24px 28px" }}>
        {children}
      </div>

      <Footer />
    </div>
  );
}
