import React, { useEffect, useMemo, useState } from "react";

const PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 14 days", days: 14 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 45 days", days: 45 },
];

// helper: convert Date → "YYYY-MM-DD"
function toInputDate(d) {
  return d.toISOString().slice(0, 10);
}

// helper: last N days inclusive (end = today, start = today-(N-1))
function lastNDaysRange(days) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  return { start: toInputDate(start), end: toInputDate(end) };
}

/**
 * Props:
 * - onChange({ startDate, endDate })     // called whenever range changes
 * - initialDays (optional)              // default preset days (default 7)
 */
export default function DateRangeControls({ onChange, initialDays = 7 }) {
  const [mode, setMode] = useState("preset"); // "preset" | "custom"
  const [presetDays, setPresetDays] = useState(initialDays);

  // local state for custom inputs
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // compute the active range
  const range = useMemo(() => {
    if (mode === "custom" && customStart && customEnd) {
      return { startDate: customStart, endDate: customEnd };
    }
    const { start, end } = lastNDaysRange(presetDays);
    return { startDate: start, endDate: end };
  }, [mode, presetDays, customStart, customEnd]);

  // notify parent when range changes
  useEffect(() => {
    if (onChange) onChange(range);
  }, [range, onChange]);

  // when switching modes, initialize custom inputs from current preset
  useEffect(() => {
    if (mode === "custom" && (!customStart || !customEnd)) {
      const { start, end } = lastNDaysRange(presetDays);
      setCustomStart(start);
      setCustomEnd(end);
    }
  }, [mode, presetDays, customStart, customEnd]);

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs md:text-sm">
      {/* Mode toggle */}
      <div className="inline-flex rounded-full border border-slate-200 overflow-hidden">
        <button
          type="button"
          className={
            "px-3 py-1 " +
            (mode === "preset"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-700")
          }
          onClick={() => setMode("preset")}
        >
          Presets
        </button>
        <button
          type="button"
          className={
            "px-3 py-1 border-l border-slate-200 " +
            (mode === "custom"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-700")
          }
          onClick={() => setMode("custom")}
        >
          Custom
        </button>
      </div>

      {/* Preset buttons */}
      {mode === "preset" && (
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => setPresetDays(p.days)}
              className={
                "px-3 py-1 rounded-full border text-xs md:text-sm " +
                (presetDays === p.days
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50")
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Custom date pickers */}
      {mode === "custom" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500">From</span>
          <input
            type="date"
            className="border rounded-lg px-2 py-1 text-xs md:text-sm"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            className="border rounded-lg px-2 py-1 text-xs md:text-sm"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
          />
        </div>
      )}

      {/* Current range label */}
      <span className="text-slate-400 ml-auto">
        Showing {range.startDate} → {range.endDate}
      </span>
    </div>
  );
}
