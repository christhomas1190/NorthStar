import React, { useEffect, useMemo, useRef, useState } from "react";
import Page from "@/components/layout/Page";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BarChart3, X } from "lucide-react";
import { useAuth } from "@/state/auth.jsx";

/* ---------- Date helpers ---------- */
function fmtDay(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function startOfCurrentYear() {
  const d = new Date();
  return `${d.getFullYear()}-01-01`;
}
function today() {
  return fmtDay(new Date());
}
function dayStringFromOccurredAt(iso) {
  if (!iso) return null;
  return String(iso).slice(0, 10);
}
function parseLocalDay(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).slice(0, 10);
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function niceTicks(max, count = 4) {
  if (max <= 0) return [0];
  const nice = (x) => {
    const exp = Math.floor(Math.log10(x));
    const f = x / Math.pow(10, exp);
    let nf;
    if (f < 1.5) nf = 1;
    else if (f < 3) nf = 2;
    else if (f < 7) nf = 5;
    else nf = 10;
    return nf * Math.pow(10, exp);
  };
  const step = nice(max / count);
  const ticks = [];
  for (let v = 0; v <= max + 1e-9; v += step) ticks.push(Math.round(v));
  if (ticks[ticks.length - 1] !== max) ticks.push(Math.round(max));
  return Array.from(new Set(ticks)).sort((a, b) => a - b);
}

/* ---------- Line chart component ---------- */
function LineChartWithAxes({ points = [], width = 900, height = 260 }) {
  const padLeft = 44,
    padRight = 16,
    padTop = 18,
    padBottom = 36;
  const innerW = Math.max(10, width - padLeft - padRight);
  const innerH = Math.max(10, height - padTop - padBottom);

  const parsed = (points || [])
    .filter((p) => p && p.date && typeof p.count === "number")
    .map((p) => {
      const d = parseLocalDay(p.date);
      return { t: d.getTime(), c: Number(p.count), dateStr: p.date };
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
    >
      <rect x="0" y="0" width={width} height={height} fill="white" rx="12" />

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

/* ---------- Teacher dashboard page ---------- */
export default function TeacherDashboard() {
  const { activeDistrictId } = useAuth();

  const [from, setFrom] = useState(startOfCurrentYear());
  const [to, setTo] = useState(today());

  const [allIncidents, setAllIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // search / filter by student
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    if (!activeDistrictId) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch("/api/incidents", {
          headers: {
            "X-District-Id": String(activeDistrictId),
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error(`Failed to load incidents (${res.status})`);
        const json = await res.json();
        if (!alive) return;
        setAllIncidents(Array.isArray(json) ? json : []);
      } catch (e) {
        if (!alive) return;
        setErr(String(e.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [activeDistrictId]);

  async function runSearch(value) {
    if (!activeDistrictId) return;
    const q = value.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(
        `/api/students?size=50`, // backend can ignore q; we'll filter here
        {
          headers: {
            "X-District-Id": String(activeDistrictId),
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];

      const needle = q.toLowerCase();
      const filtered = [];
      for (let i = 0; i < list.length; i++) {
        const s = list[i];
        const first = (s.firstName || "").toLowerCase();
        const last = (s.lastName || "").toLowerCase();
        const sid = (s.studentId || "").toLowerCase();
        if (
          first.includes(needle) ||
          last.includes(needle) ||
          sid.includes(needle)
        ) {
          filtered.push(s);
        }
      }

      setSearchResults(filtered);
    } catch (e) {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }
  function onSearchChange(e) {
    const value = e.target.value;
    setSearch(value);
    runSearch(value);
  }

  function onPickStudent(s) {
    setSelectedStudent(s);
    setSearch(`${s.firstName} ${s.lastName} (${s.studentId ?? "ID " + s.id})`);
    setSearchResults([]);
  }

  function clearStudent() {
    setSelectedStudent(null);
    setSearch("");
    setSearchResults([]);
  }

  // filter incidents by date (and student if selected)
  const incidentsInRange = useMemo(() => {
    const fromStr = from;
    const toStr = to;
    return allIncidents.filter((it) => {
      const day = dayStringFromOccurredAt(it.occurredAt);
      if (!day) return false;
      if (day < fromStr || day > toStr) return false;
      if (selectedStudent && it.studentId !== selectedStudent.id) return false;
      return true;
    });
  }, [allIncidents, from, to, selectedStudent]);

  const chartPoints = useMemo(() => {
    const counts = new Map();
    for (const it of incidentsInRange) {
      const key = dayStringFromOccurredAt(it.occurredAt);
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }, [incidentsInRange]);

  return (
    <Page
      title="Teacher Dashboard"
      subtitle="View incident trends by date and student"
    >
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 size={18} />
              <span>Behavior Trends</span>
            </span>
            <div className="flex flex-wrap gap-3 text-xs items-end">
              <div>
                <label className="block text-slate-600 mb-0.5">
                  From
                </label>
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="h-8"
                />
              </div>
              <div>
                <label className="block text-slate-600 mb-0.5">
                  To
                </label>
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="h-8"
                />
              </div>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {err && (
            <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
              {err}
            </div>
          )}

          {/* Search bar just for this page */}
          <div className="max-w-xl mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Filter by student (optional)
            </label>
            <div className="relative">
              <Input
                placeholder="Type a student name or ID…"
                value={search}
                onChange={onSearchChange}
              />
              {selectedStudent && (
                <button
                  type="button"
                  onClick={clearStudent}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Leave blank to see all incidents. Type at least 2 characters to search.
            </div>

            {/* Dropdown results */}
            {searchLoading && (
              <div className="mt-2 text-xs text-slate-500">Searching…</div>
            )}
            {!searchLoading && searchResults.length > 0 && (
              <div className="mt-2 border rounded-lg max-h-56 overflow-auto bg-white shadow-sm">
                {searchResults.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b last:border-b-0"
                    onClick={() => onPickStudent(s)}
                  >
                    <div className="font-medium">
                      {s.firstName} {s.lastName}
                    </div>
                    <div className="text-xs text-slate-500">
                      Student ID: {s.studentId ?? "—"}
                      {s.grade ? <> · Grade {s.grade}</> : null}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-full h-[260px] mb-4">
            <LineChartWithAxes points={chartPoints} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <div>
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {incidentsInRange.length}
              </span>{" "}
              incident(s) from {from} to {to}
              {selectedStudent && (
                <>
                  {" "}
                  for{" "}
                  <span className="font-semibold text-slate-700">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </span>
                </>
              )}
              {!selectedStudent && " for all students"}
              .
            </div>
            <Badge variant="outline" className="gap-1 h-7 flex items-center">
              <BarChart3 size={14} />
              Live
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Page>
  );
}
