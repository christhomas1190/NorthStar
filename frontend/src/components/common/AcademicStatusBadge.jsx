import React from "react";

const CONFIG = {
  ON_TRACK:  { label: "On Track",  bg: "#dcfce7", color: "#166534" },
  DECLINING: { label: "Declining", bg: "#fef9c3", color: "#854d0e" },
  AT_RISK:   { label: "At Risk",   bg: "#fee2e2", color: "#991b1b" },
};

export default function AcademicStatusBadge({ status }) {
  if (!status) return null;
  const cfg = CONFIG[status] || { label: status, bg: "#f1f5f9", color: "#475569" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
        fontFamily: "'Outfit', sans-serif",
        letterSpacing: "0.02em",
      }}
    >
      {cfg.label}
    </span>
  );
}
