import React from "react";
import { useNavigate } from "react-router-dom";

export default function NorthStarBrand({ isAdmin = false }) {
  const nav = useNavigate();

  const content = (
    <>
      <div
        style={{
          width: 34,
          height: 34,
          background: "var(--ns-accent)",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        ★
      </div>
      <span
        style={{
          fontFamily: "'Lora', serif",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "-0.5px",
          color: "var(--ns-text)",
        }}
      >
        NorthStar
      </span>
    </>
  );

  if (!isAdmin) {
    return <div style={{ display: "flex", alignItems: "center", gap: 10 }}>{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => nav("/admin")}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }}
      aria-label="Go to Admin Dashboard"
    >
      {content}
    </button>
  );
}
