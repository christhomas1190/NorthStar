import React, { useEffect, useMemo, useRef, useState } from "react";
import Page from "@/components/layout/Page";
import PageTabs from "@/components/layout/PageTabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { FileDown, Filter, BarChart3, CalendarRange, Search } from "lucide-react";
import { useAuth } from "@/state/auth.jsx";

// ---------- Date helpers (LOCAL calendar days, no UTC shift) ----------

// Convert Date -> "YYYY-MM-DD" using local time
function fmtDay(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function today() {
  return fmtDay(new Date());
}

// start = today - n, end = today
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return fmtDay(d);
}

// take an ISO datetime or date string and return "YYYY-MM-DD"
function dayStringFromOccurredAt(iso) {
  if (!iso) return null;
  return String(iso).slice(0, 10); // ignore time + timezone
}

// parse "YYYY-MM-DD" into a LOCAL Date (no UTC shift)
function parseLocalDay(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).slice(0, 10);
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function niceTicks(max, count = 5) {
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

// ---------- Chart (same behavior as AdminDashboard) ----------

function LineChartWithAxes({ points = [], width = 380, height = 220, className = "" }) {
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
      <div className={`w-full h-full rounded-xl bg-slate-100 grid place-content-center text-slate-400 ${className}`}>
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
    <div className={`relative ${className}`}>
      <svg
        ref={ref}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        role="img"
        aria-label="Incident trend"
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
          <circle key={i} cx={toX(p.t)} cy={toY(p.c)} r="2.5" fill="#0f172a" />
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
              )}, ${Math.max(padTop + 8, hover.y - 30)})`}
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
          Incidents
        </text>
      </svg>
    </div>
  );
}

// ---------- Main Reports page ----------

export default function ReportsPage() {
  const { activeDistrictId, activeSchoolId } = useAuth();

  // Default: last 7 days (today + previous 6 days)
  const [from, setFrom] = useState(daysAgo(6));
  const [to, setTo] = useState(today());
  const [search, setSearch] = useState(""); // student search text
  const [studentIdFilter, setStudentIdFilter] = useState(null);
  const [q, setQ] = useState(""); // free text filter

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [analytics, setAnalytics] = useState({
    totalIncidents: 0,
    byDay: [],
    byCategory: [],
    bySeverity: [],
  });
  const [incidents, setIncidents] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (!activeDistrictId || !activeSchoolId) return;
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const [analyticsRes, incidentsRes, studentsRes] = await Promise.all([
          fetch(
            `/api/schools/${encodeURIComponent(
              activeSchoolId
            )}/analytics/incidents/summary?startDate=${from}&endDate=${to}`,
            {
              headers: {
                "X-District-Id": String(activeDistrictId),
                "Content-Type": "application/json",
              },
            }
          ),
          fetch("/api/incidents", {
            headers: {
              "X-District-Id": String(activeDistrictId),
              "Content-Type": "application/json",
            },
          }),
          fetch("/api/students", {
            headers: {
              "X-District-Id": String(activeDistrictId),
              "Content-Type": "application/json",
            },
          }),
        ]);

        const analyticsJson = analyticsRes.ok ? await analyticsRes.json() : null;
        const incidentsJson = incidentsRes.ok ? await incidentsRes.json() : [];
        const studentsJson = studentsRes.ok ? await studentsRes.json() : [];

        if (!alive) return;

        setAnalytics({
          totalIncidents: analyticsJson?.totalIncidents ?? 0,
          byDay: Array.isArray(analyticsJson?.byDay) ? analyticsJson.byDay : [],
          byCategory: Array.isArray(analyticsJson?.byCategory)
            ? analyticsJson.byCategory
            : [],
          bySeverity: Array.isArray(analyticsJson?.bySeverity)
            ? analyticsJson.bySeverity
            : [],
        });

        setIncidents(Array.isArray(incidentsJson) ? incidentsJson : []);
        setStudents(Array.isArray(studentsJson) ? studentsJson : []);
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
  }, [activeDistrictId, activeSchoolId, from, to]);

  const studentNameById = useMemo(() => {
    const map = new Map();
    for (const s of students) {
      map.set(
        s.id,
        `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim()
      );
    }
    return map;
  }, [students]);

  useEffect(() => {
    const name = search.trim().toLowerCase();
    if (!name) {
      setStudentIdFilter(null);
      return;
    }
    const hit = students.find(
      (s) => (`${s.firstName} ${s.lastName}`).toLowerCase() === name
    );
    setStudentIdFilter(hit?.id ?? null);
  }, [search, students]);

  // Incidents in selected date range (and optionally by student)
  const incidentsInRange = useMemo(() => {
    if (!incidents.length) return [];
    const fromStr = from;
    const toStr = to;
    return incidents.filter((it) => {
      const day = dayStringFromOccurredAt(it.occurredAt);
      if (!day) return false;
      if (day < fromStr || day > toStr) return false;
      if (studentIdFilter && it.studentId !== studentIdFilter) return false;
      return true;
    });
  }, [incidents, from, to, studentIdFilter]);

  // Trend data computed from incidentsInRange (local calendar days)
  const computedByDay = useMemo(() => {
    const counts = new Map();
    for (const it of incidentsInRange) {
      const key = dayStringFromOccurredAt(it.occurredAt); // "YYYY-MM-DD"
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }, [incidentsInRange]);

  // Severity counts in current range
  const severityCounts = useMemo(() => {
    const out = { minor: 0, major: 0 };
    for (const it of incidentsInRange) {
      const sev = (it.severity || "").toLowerCase();
      if (sev === "minor") out.minor++;
      if (sev === "major") out.major++;
    }
    return out;
  }, [incidentsInRange]);

  const totalIncidentsRange =
    analytics.totalIncidents ||
    computedByDay.reduce((sum, p) => sum + p.count, 0);

  const minor =
    analytics.bySeverity.find(
      (s) => (s.severity || "").toLowerCase() === "minor"
    )?.count ?? severityCounts.minor;

  const major =
    analytics.bySeverity.find(
      (s) => (s.severity || "").toLowerCase() === "major"
    )?.count ?? severityCounts.major;

  // Table rows: incidents in range + text filter
  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return incidentsInRange
      .map((it) => ({
        id: it.id,
        studentId: it.studentId,
        student: studentNameById.get(it.studentId) || `#${it.studentId}`,
        category: it.category || "—",
        severity: it.severity || "—",
        description: it.description || "—",
        dateISO: it.occurredAt,
        date: it.occurredAt ? new Date(it.occurredAt).toLocaleString() : "—",
        by: it.reportedBy || "—",
      }))
      .filter((r) => {
        if (!term) return true;
        return (
          r.student.toLowerCase().includes(term) ||
          r.category.toLowerCase().includes(term) ||
          r.description.toLowerCase().includes(term) ||
          String(r.id).toLowerCase().includes(term) ||
          r.by.toLowerCase().includes(term) ||
          r.severity.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO));
  }, [incidentsInRange, studentNameById, q]);

  function exportCSV() {
    const header = ["id", "student", "category", "severity", "description", "date", "by"].join(",");
    const body = filteredRows
      .map((r) =>
        [r.id, r.student, r.category, r.severity, r.description, r.date, r.by]
          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([header + "\n" + body], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `incidents_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function setPreset(days) {
    setFrom(daysAgo(days - 1));
    setTo(today());
  }

  return (
    <Page
      title="Reports & Trends"
      subtitle="Filters, trends, and exports for incidents"
      actions={
        <Button variant="outline" onClick={exportCSV}>
          <FileDown size={16} className="mr-2" /> Export CSV
        </Button>
      }
    >
      <PageTabs
        items={[
          { label: "Admin Dashboard", to: "/admin" },
          { label: "Reports & Trends", to: "/reports" },
        ]}
      />

      {err && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
          {err}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base">Filters</CardTitle>
            <Badge variant="outline" className="gap-1">
              <Filter size={14} /> Basic
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs text-slate-600 flex items-center gap-1">
                  <CalendarRange size={14} /> From
                </label>
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs text-slate-600 flex items-center gap-1">
                  <CalendarRange size={14} /> To
                </label>
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreset(7)}
                >
                  Last 7d
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreset(14)}
                >
                  Last 14d
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreset(30)}
                >
                  Last 30d
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPreset(45)}
                >
                  Last 45d
                </Button>
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-xs text-slate-600 flex items-center gap-1">
                  <Search size={14} /> Student
                </label>
                <Input
                  list="students-dl"
                  placeholder="Type full name to filter (e.g., Ada Lovelace)"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <datalist id="students-dl">
                  {students.map((s) => (
                    <option
                      key={s.id}
                      value={`${s.firstName} ${s.lastName}`}
                    />
                  ))}
                </datalist>
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-xs text-slate-600">
                  Search (category, description, reporter…)
                </label>
                <Input
                  placeholder="Free text…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trend chart */}
        <Card className="self-start">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base">Trend</CardTitle>
            <Badge variant="outline" className="gap-1">
              <BarChart3 size={14} /> {from} → {to}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="w-full h-56">
              <LineChartWithAxes
                points={computedByDay.length ? computedByDay : analytics.byDay}
                width={380}
                height={220}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
              <div>
                <div className="text-slate-500">Incidents</div>
                <div className="font-semibold text-sm">
                  {totalIncidentsRange}
                </div>
              </div>
              <div>
                <div className="text-slate-500">Minor</div>
                <div className="font-semibold text-sm">{minor}</div>
              </div>
              <div>
                <div className="text-slate-500">Major</div>
                <div className="font-semibold text-sm">{major}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Results</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[560px] overflow-y-auto">
              <Table>
                <THead>
                  <TR className="text-left text-slate-600 border-b sticky top-0 bg-white">
                    <TH className="py-3">Incident</TH>
                    <TH className="py-3">Student</TH>
                    <TH className="py-3">Category</TH>
                    <TH className="py-3">Severity</TH>
                    <TH className="py-3">Description</TH>
                    <TH className="py-3">Date</TH>
                    <TH className="py-3">By</TH>
                  </TR>
                </THead>
                <TBody>
                  {filteredRows.map((r) => (
                    <TR key={r.id} className="border-b last:border-0">
                      <TD className="font-medium text-slate-800">{r.id}</TD>
                      <TD>{r.student}</TD>
                      <TD>{r.category}</TD>
                      <TD>
                        <Badge variant="outline">{r.severity}</Badge>
                      </TD>
                      <TD className="max-w-[320px] whitespace-pre-wrap">
                        {r.description}
                      </TD>
                      <TD>{r.date}</TD>
                      <TD>{r.by}</TD>
                    </TR>
                  ))}
                  {!loading && filteredRows.length === 0 && (
                    <TR>
                      <TD
                        colSpan={7}
                        className="py-6 text-slate-500 text-center"
                      >
                        No results for the selected filters.
                      </TD>
                    </TR>
                  )}
                  {loading && (
                    <TR>
                      <TD
                        colSpan={7}
                        className="py-6 text-slate-500 text-center"
                      >
                        Loading…
                      </TD>
                    </TR>
                  )}
                </TBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Exports card */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Exports</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={exportCSV}>
              <FileDown size={16} className="mr-2" /> CSV (incidents)
            </Button>
            <Button variant="outline" disabled>
              <FileDown size={16} className="mr-2" /> PDF (coming soon)
            </Button>
            <Button variant="outline" disabled>
              <FileDown size={16} className="mr-2" /> XLSX (coming soon)
            </Button>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
