import React, { useEffect, useRef, useState } from "react";
import { patchJSON, postJSON } from "@/lib/api.js";

/**
 * Inline editable points cell.
 * Props: assignmentId, studentId, maxPoints, initialPoints, onSaved
 */
export default function GradeCell({ assignmentId, studentId, maxPoints, initialPoints, onSaved }) {
  const [value, setValue] = useState(initialPoints != null ? String(initialPoints) : "");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setValue(initialPoints != null ? String(initialPoints) : "");
  }, [initialPoints]);

  async function save() {
    const pts = value.trim() === "" ? null : Number(value);
    if (pts !== null && (isNaN(pts) || pts < 0 || pts > maxPoints)) {
      setValue(initialPoints != null ? String(initialPoints) : "");
      return;
    }
    setSaving(true);
    try {
      const result = await postJSON("/api/gradebook/grades", {
        studentId,
        assignmentId,
        pointsEarned: pts,
      });
      if (onSaved) onSaved(result);
    } catch (e) {
      // revert on error
      setValue(initialPoints != null ? String(initialPoints) : "");
    } finally {
      setSaving(false);
    }
  }

  const pct = value !== "" && maxPoints > 0
    ? Math.round((Number(value) / maxPoints) * 100)
    : null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <input
        ref={inputRef}
        type="number"
        min={0}
        max={maxPoints}
        value={value}
        disabled={saving}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); inputRef.current?.blur(); } }}
        style={{
          width: 52,
          padding: "2px 6px",
          fontSize: 12,
          border: "1.5px solid var(--ns-border2)",
          borderRadius: 6,
          background: saving ? "var(--ns-bg)" : "white",
          fontFamily: "'JetBrains Mono', monospace",
          textAlign: "right",
        }}
        placeholder="—"
      />
      <span style={{ fontSize: 11, color: "var(--ns-muted)", minWidth: 32 }}>
        {pct != null ? `${pct}%` : ""}
      </span>
    </div>
  );
}
