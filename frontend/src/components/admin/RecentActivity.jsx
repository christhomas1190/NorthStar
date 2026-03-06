import React from "react";
import { Clock } from "lucide-react";

export default function RecentActivity({ items }) {
  return (
    <div
      className="mt-5 w-full max-w-[420px] mx-auto rounded-xl p-4 text-xs"
      style={{ border: "1.5px solid var(--ns-border)", background: "var(--ns-white)", color: "var(--ns-text2)" }}
    >
      {/* Header Row */}
      <div className="flex items-center gap-2 mb-3">
        <Clock size={16} style={{ color: "var(--ns-accent)" }} />
        <p className="font-semibold text-sm" style={{ fontFamily: "'Lora', serif", color: "var(--ns-text)" }}>Recent Activity</p>
      </div>

      {/* Activity Box */}
      <div className="max-h-48 overflow-auto rounded-lg p-3 text-[12px]" style={{ background: "var(--ns-bg)", border: "1px solid var(--ns-border)" }}>
        {items.length === 0 && (
          <div className="py-3 text-center" style={{ color: "var(--ns-muted)" }}>
            No recent incidents in range.
          </div>
        )}

        {items.map((it) => (
          <div
            key={it.id}
            className="py-2 last:border-b-0"
            style={{ borderBottom: "1px solid var(--ns-border)" }}
          >
            <div style={{ color: "var(--ns-muted)" }}>
              [{it.when}]
            </div>

            <div className="mt-1">
              <span className="font-medium">{it.by}</span>{" "}
              recorded{" "}
              <span className="font-semibold">{it.category}</span>{" "}
              <span style={{ color: "var(--ns-text2)" }}>
                ({it.severity})
              </span>
            </div>

            <div style={{ color: "var(--ns-muted)" }}>
              {it.studentName}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
