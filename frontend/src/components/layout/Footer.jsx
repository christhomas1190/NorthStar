import React from "react";

export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--ns-white)",
        borderTop: "1.5px solid var(--ns-border)",
        padding: "0 28px",
        height: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 22,
            height: 22,
            background: "var(--ns-accent)",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            fontSize: 12,
          }}
        >
          ★
        </div>
        <span style={{ fontSize: 12, color: "var(--ns-text2)" }}>
          <strong>NorthStar</strong> &mdash; Helping schools stay true to what matters most — students.
        </span>
      </div>
      <div style={{ fontSize: 11, color: "var(--ns-muted)" }}>
        NorthStar · v1.0.0
      </div>
    </footer>
  );
}
