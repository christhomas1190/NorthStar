import React, { useRef, useState } from "react";
import { parseLocalDay } from "@/utils/dateHelpers";
import { niceTicks } from "@/utils/chartHelpers";

function LineChartWithAxes({ points = [], width = 420, height = 220 }) {
  const padLeft = 44,
    padRight = 16,
    padTop = 18,
    padBottom = 36;
  const innerW = Math.max(10, width - padLeft - padRight);
  const innerH = Math.max(10, height - padTop - padBottom);

  // points: [{ date: "YYYY-MM-DD", count: number }]
  const parsed = (points || [])
    .filter((p) => p && p.date && typeof p.count === "number")
    .map((p) => {
      const d = parseLocalDay(p.date); // local calendar day
      return {
        t: d.getTime(),
        c: Number(p.count),
        dateStr: String(p.date).slice(0, 10),
      };
    })
    .sort((a, b) => a.t - b.t);

  if (!parsed.length) {
    return (
      <div className="w-full h-full rounded-xl bg-slate-100 grid place-content-center text-slate-400">
        No data
      </div>
    );
  }

  const xs = parsed.map((p) => p.t);
  const ys = parsed.map((p) => p.c);
  const xMin = Math.min(...xs),
    xMax = Math.max(...xs) + 1;
  const yMax = Math.max(1, Math.max(...ys));
  const yTicks = niceTicks(yMax, 4);

  const toX = (t) =>
    padLeft + ((t - xMin) / (xMax - xMin)) * innerW;
  const toY = (v) =>
    padTop +
    innerH -
    (v / (yTicks[yTicks.length - 1] || 1)) * innerH;

  const path = parsed
    .map((p, i) => `${i ? "L" : "M"} ${toX(p.t)} ${toY(p.c)}`)
    .join(" ");

  const ref = useRef(null);
  const [hover, setHover] = useState(null);

  function onMove(e) {
    const svg = ref.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
    const x = Math.min(padLeft + innerW, Math.max(padLeft, loc.x));
    const targetT = xMin + ((x - padLeft) / innerW) * (xMax - xMin);
    let best = null,
      bestD = Infinity;
    for (const p of parsed) {
      const d = Math.abs(p.t - targetT);
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    setHover(
      best
        ? {
            x: toX(best.t),
            y: toY(best.c),
            t: best.t,
            c: best.c,
            dateStr: best.dateStr,
          }
        : null
    );
  }

  function onLeave() {
    setHover(null);
  }

  const xTicksCount = Math.min(6, parsed.length);
  const xTicks = [];
  for (let i = 0; i < xTicksCount; i++) {
    const idx = Math.round(
      (i / (xTicksCount - 1 || 1)) * (parsed.length - 1)
    );
    const p = parsed[idx];
    xTicks.push({
      t: p.t,
      label: new Date(p.t).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    });
  }

  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      role="img"
      aria-label="Incident trend"
    >
      <rect
        x="0"
        y="0"
        width={width}
        height={height}
        fill="white"
        rx="12"
      />
      <g>
        {yTicks.map((v, i) => (
          <g key={i}>
            <line
              x1={padLeft}
              y1={toY(v)}
              x2={width - padRight}
              y2={toY(v)}
              stroke="rgb(241,245,249)"
              strokeWidth="1"
            />
            <text
              x={padLeft - 8}
              y={toY(v)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="10"
              fill="#64748b"
            >
              {v}
            </text>
          </g>
        ))}
        <line
          x1={padLeft}
          y1={padTop + innerH}
          x2={width - padRight}
          y2={padTop + innerH}
          stroke="#94a3b8"
          strokeWidth="1"
        />
        {xTicks.map((tk, i) => (
          <text
            key={i}
            x={toX(tk.t)}
            y={height - 10}
            textAnchor="middle"
            fontSize="10"
            fill="#64748b"
          >
            {tk.label}
          </text>
        ))}
      </g>

      <path d={path} fill="none" stroke="#0f172a" strokeWidth="2" />
      {parsed.map((p, i) => (
        <circle
          key={i}
          cx={toX(p.t)}
          cy={toY(p.c)}
          r="2.5"
          fill="#0f172a"
        />
      ))}

      {hover && (
        <>
          <line
            x1={hover.x}
            y1={padTop}
            x2={hover.x}
            y2={padTop + innerH}
            stroke="#94a3b8"
            strokeDasharray="3 3"
          />
          <circle
            cx={hover.x}
            cy={hover.y}
            r="4"
            fill="white"
            stroke="#0f172a"
            strokeWidth="2"
          />
          <g
            transform={`translate(${Math.min(
              width - 140,
              Math.max(padLeft, hover.x + 8)
            )}, ${Math.max(
              padTop + 8,
              hover.y - 30
            )})`}
          >
            <rect
              width="132"
              height="36"
              rx="8"
              fill="white"
              stroke="#cbd5e1"
            />
            <text x="8" y="14" fontSize="11" fill="#0f172a">
              {hover.dateStr}
            </text>
            <text x="8" y="26" fontSize="11" fill="#0f172a">
              Incidents: {hover.c}
            </text>
          </g>
        </>
      )}

      <text
        x={padLeft + innerW / 2}
        y={height - 2}
        textAnchor="middle"
        fontSize="11"
        fill="#334155"
      >
        Date
      </text>
      <text
        x="12"
        y={padTop + innerH / 2}
        transform={`rotate(-90, 12, ${padTop + innerH / 2})`}
        textAnchor="middle"
        fontSize="11"
        fill="#334155"
      >
        Count
      </text>
    </svg>
  );
}

export default LineChartWithAxes;
