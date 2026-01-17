import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Page from "@/components/layout/Page";
import PageTabs from "@/components/layout/PageTabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileDown, BarChart3, Plus } from "lucide-react";
import { useAuth } from "@/state/auth.jsx";

// ---------- Date helpers ----------
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

// ---------- Re-use chart for single student ----------
function LineChartWithAxes({ points = [], width = 600, height = 220 }) {
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

// ---------- Page ----------
export default function StudentDetailPage() {
  const { studentId } = useParams();
const { activeDistrictId, user } = useAuth();

const nav = useNavigate();

  const canDownloadPdf = user?.role === "Admin";
  const canCreateIncident =
    user?.role === "Admin" || user?.role === "Teacher";
  const canCreateDiscipline = user?.role === "Admin";

  const [from, setFrom] = useState(startOfCurrentYear());
  const [to, setTo] = useState(today());

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [student, setStudent] = useState(null);
  const [allIncidents, setAllIncidents] = useState([]);

  useEffect(() => {
    if (!activeDistrictId || !studentId) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const [studentRes, incidentsRes] = await Promise.all([
          fetch(`/api/students/${studentId}`, {
            headers: {
              "X-District-Id": String(activeDistrictId),
              "Content-Type": "application/json",
            },
          }),
          fetch("/api/incidents", {
            headers: {
              "X-District-Id": String(activeDistrictId),
              "Content-Type": "application/json",
            },
          }),
        ]);

        const sJson = studentRes.ok ? await studentRes.json() : null;
        const iJson = incidentsRes.ok ? await incidentsRes.json() : [];

        if (!alive) return;

        setStudent(sJson);
        setAllIncidents(Array.isArray(iJson) ? iJson : []);
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
  }, [activeDistrictId, studentId]);

  // All incidents for this student
  const studentIncidents = useMemo(() => {
    const idNum = Number(studentId);
    return allIncidents.filter((it) => it.studentId === idNum);
  }, [allIncidents, studentId]);

  // Incidents in date range
  const incidentsInRange = useMemo(() => {
    const fromStr = from;
    const toStr = to;
    return studentIncidents.filter((it) => {
      const day = dayStringFromOccurredAt(it.occurredAt);
      if (!day) return false;
      return day >= fromStr && day <= toStr;
    });
  }, [studentIncidents, from, to]);

  // Chart points per day
  const chartPoints = useMemo(() => {
    const fromDate = parseLocalDay(from);
    const toDate = parseLocalDay(to);
    if (!fromDate || !toDate) return [];

    // 1) Count incidents by day in the range
    const counts = new Map();
    for (const it of incidentsInRange) {
      const key = dayStringFromOccurredAt(it.occurredAt);
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    //    using 0 if that day has no incidents
    const points = [];
    for (
      let d = new Date(fromDate);
      d <= toDate;
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
    ) {
      const key = fmtDay(d); // "YYYY-MM-DD"
      points.push({
        date: key,
        count: counts.get(key) || 0,
      });
    }

    return points;
  }, [incidentsInRange, from, to]);

  // Disciplines / interventions: pull from student.interventions, filtered by date range
  const disciplines = useMemo(() => {
    if (!student || !Array.isArray(student.interventions)) return [];
    const fromStr = from;
    const toStr = to;
    return student.interventions.filter((iv) => {
      const day = String(iv.startDate || "").slice(0, 10);
      if (!day) return false;
      return day >= fromStr && day <= toStr;
    });
  }, [student, from, to]);

    function handleCreateIncident() {
      nav(`/admin/students/${studentId}/incidents/new`);
    }
      async function handleDownloadPdf() {
        if (!activeDistrictId || !studentId) {
          setErr("Missing district or student id for PDF export.");
          return;
        }
        try {
          setErr("");
          const params = new URLSearchParams();
          if (from) params.append("from", from);
          if (to) params.append("to", to);

          const res = await fetch(
            `/api/students/${studentId}/report?${params.toString()}`,
            {
              method: "GET",
              headers: {
                "X-District-Id": String(activeDistrictId),
              },
            }
          );

          if (!res.ok) {
            throw new Error(`Failed to download PDF (HTTP ${res.status})`);
          }

          const blob = await res.blob();
          const url = URL.createObjectURL(blob);

          const fullName = student
            ? `${student.firstName || ""}_${student.lastName || ""}`.trim() ||
              `student_${studentId}`
            : `student_${studentId}`;

          const a = document.createElement("a");
          a.href = url;
          a.download = `${fullName}_behavior_${from || "all"}_${to || "all"}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (e) {
          setErr(String(e.message || e));
        }
      }

      const fullName = student
        ? `${student.firstName || ""} ${student.lastName || ""}`.trim()
        : `Student #${studentId}`;

      return (
          <Page
            title="Student Detail"
            subtitle={fullName}
            actions={
              <div className="flex gap-2">
                {canCreateDiscipline && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      nav(`/admin/students/${studentId}/disciplines/new`)
                    }
                  >
                    <Plus size={16} className="mr-1" />
                    Add Discipline
                  </Button>
                )}

                {canCreateIncident && (
                  <Button onClick={handleCreateIncident}>
                    <Plus size={16} className="mr-1" />
                    Create Incident
                  </Button>
                )}

                {canDownloadPdf && (
                  <Button variant="outline" onClick={handleDownloadPdf}>
                    <FileDown size={16} className="mr-2" />
                    Download PDF
                  </Button>
                )}
              </div>
            }
          >
      <PageTabs
        items={[
          { label: "Reports & Trends", to: "/reports" },
        ]}
      />

      {err && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
          {err}
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Student Overview</span>
            <span className="text-xs text-slate-500 space-x-2">
              <span>Internal ID: {student?.id ?? studentId}</span>
              {student?.studentId && (
                <span className="border-l border-slate-300 pl-2">
                  Student ID: {student.studentId}
                </span>
              )}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-slate-700">Name: </span>
            <span>{fullName}</span>
          </div>
          {student?.grade && (
            <div>
              <span className="font-medium text-slate-700">Grade: </span>
              <span>{student.grade}</span>
            </div>
          )}
          <div className="text-xs text-slate-500">
            <Link to="/admin" className="underline">
              Back to Admin Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>
                Incidents ({from} → {to})
              </span>
              <div className="flex items-center gap-2 text-xs">
                <div>
                  <label className="block text-slate-600 mb-0.5">
                    From
                  </label>
                  <Input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
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
                  />
                </div>
                <Badge variant="outline" className="gap-1 h-9 flex items-center">
                  <BarChart3 size={14} /> Live
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-[220px] mb-4">
              <LineChartWithAxes points={chartPoints} />
            </div>
            <div className="text-xs text-slate-500">
              Total incidents in range:{" "}
              <span className="font-semibold text-slate-700">
                {incidentsInRange.length}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Disciplines / Interventions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="text-xs text-slate-500 mb-2">
              Showing interventions for this student in the selected date range.
            </div>
            {disciplines.length === 0 && (
              <div className="text-xs text-slate-500">
                No disciplines/interventions in the selected range.
              </div>
            )}
            {disciplines.map((d) => (
              <div
                key={d.id}
                className="border rounded-lg px-2 py-1 text-xs mb-1"
              >
                <div className="flex justify-between">
                  <span className="font-semibold">
                    {d.tier ? `Tier ${d.tier}` : "Intervention"}
                  </span>
                  <span>
                    {d.startDate
                      ? new Date(d.startDate).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
                <div className="text-slate-500">
                  {d.strategy || d.description || "—"}
                </div>
                <div className="text-slate-400 mt-0.5">
                  By {d.assignedBy || d.reportedBy || "—"}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            All Incidents for {fullName} (in range)
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b text-slate-600">
              <tr>
                <th className="text-left py-2 pr-2">ID</th>
                <th className="text-left py-2 pr-2">Date</th>
                <th className="text-left py-2 pr-2">Category</th>
                <th className="text-left py-2 pr-2">Severity</th>
                <th className="text-left py-2 pr-2">Description</th>
                <th className="text-left py-2 pr-2">Reported By</th>
              </tr>
            </thead>
            <tbody>
              {incidentsInRange.map((it) => (
                <tr key={it.id} className="border-b last:border-0">
                  <td className="py-1 pr-2">{it.id}</td>
                  <td className="py-1 pr-2">
                    {new Date(it.occurredAt).toLocaleString()}
                  </td>
                  <td className="py-1 pr-2">{it.category}</td>
                  <td className="py-1 pr-2">
                    <Badge variant="outline">{it.severity}</Badge>
                  </td>
                  <td className="py-1 pr-2 max-w-xs whitespace-pre-wrap">
                    {it.description || "—"}
                  </td>
                  <td className="py-1 pr-2">{it.reportedBy || "—"}</td>
                </tr>
              ))}
              {!loading && incidentsInRange.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-4 text-center text-slate-500"
                  >
                    No incidents in this date range.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-4 text-center text-slate-500"
                  >
                    Loading…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </Page>
  );
}
