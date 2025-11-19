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

function fmtDay(d) { return new Date(d).toISOString().slice(0,10); }
function today() { return fmtDay(new Date()); }
function daysAgo(n) { return fmtDay(new Date(Date.now() - n*864e5)); }

function niceTicks(max, count=5){
  if (max <= 0) return [0];
  const rough = max / count;
  const pow10 = Math.pow(10, Math.floor(Math.log10(rough)));
  const steps = [1, 2, 2.5, 5, 10].map(s => s*pow10);
  const step = steps.reduce((best,s)=> Math.abs(s-rough)<Math.abs(best-rough)?s:best, steps[0]);
  const ticks = [];
  for (let v=0; v<=max+1e-9; v+=step) ticks.push(Math.round(v));
  if (ticks[ticks.length-1] !== Math.ceil(max)) ticks.push(Math.ceil(max));
  return ticks;
}

function dateTicks(d0, d1, n=6){
  const t0 = +new Date(d0), t1 = +new Date(d1);
  if (t1<=t0) return [new Date(t0)];
  const step = (t1 - t0) / n;
  const out = [];
  for (let i=0;i<=n;i++) out.push(new Date(t0 + i*step));
  return out;
}

function LineChartAxes({ points, from, to, className="" }) {
  const width = 380, height = 220;
  const padL=48, padR=12, padT=16, padB=36;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const xs = points.map(p => +new Date(p.date));
  const ys = points.map(p => p.count ?? 0);
  const xMin = +new Date(from), xMax = +new Date(to);
  const yMax = Math.max(1, ...ys);
  const toX = t => padL + ((t - xMin) / Math.max(1, xMax - xMin)) * innerW;
  const toY = v => padT + innerH - (v / yMax) * innerH;

  const path = points
    .sort((a,b)=> +new Date(a.date) - +new Date(b.date))
    .map((p,i) => `${i?'L':'M'} ${toX(+new Date(p.date))} ${toY(p.count||0)}`)
    .join(" ");

  const yTicks = niceTicks(yMax, 5);
  const xTicks = dateTicks(from, to, 6);

  const [hover, setHover] = useState(null);
  const svgRef = useRef(null);

  function onMove(e){
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const t = xMin + ((x - padL) / innerW) * (xMax - xMin);
    let best = null, bestDist = Infinity;
    for (const p of points){
      const tx = +new Date(p.date);
      const dx = Math.abs(toX(tx) - x);
      if (dx < bestDist){ best = p; bestDist = dx; }
    }
    if (best) setHover({ x: toX(+new Date(best.date)), y: toY(best.count||0), p: best });
  }

  function onLeave(){ setHover(null); }

  return (
    <div className={`relative ${className}`}>
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`}
           className="w-full h-full"
           onMouseMove={onMove} onMouseLeave={onLeave}>
        <rect x="0" y="0" width={width} height={height} rx="12" fill="white" />
        <line x1={padL} y1={padT} x2={padL} y2={padT+innerH} stroke="#e5e7eb"/>
        <line x1={padL} y1={padT+innerH} x2={padL+innerW} y2={padT+innerH} stroke="#e5e7eb"/>

        {yTicks.map((t,i)=>(
          <g key={i}>
            <line x1={padL} x2={padL+innerW} y1={toY(t)} y2={toY(t)} stroke="#f1f5f9"/>
            <text x={padL-6} y={toY(t)+4} textAnchor="end" fontSize="10" fill="#64748b">{t}</text>
          </g>
        ))}

        {xTicks.map((d,i)=>(
          <g key={i}>
            <line y1={padT} y2={padT+innerH} x1={toX(+d)} x2={toX(+d)} stroke="#f1f5f9"/>
            <text y={padT+innerH+14} x={toX(+d)} textAnchor="middle" fontSize="10" fill="#64748b">
              {d.toLocaleDateString(undefined,{month:"short",day:"numeric"})}
            </text>
          </g>
        ))}

        <text x={padL+innerW/2} y={height-4} textAnchor="middle" fontSize="11" fill="#334155">Date</text>
        <text x="14" y={padT+innerH/2} transform={`rotate(-90, 14, ${padT+innerH/2})`} textAnchor="middle" fontSize="11" fill="#334155">
          Incidents
        </text>

        <path d={path} fill="none" stroke="#0f172a" strokeWidth="2"/>
        {points.map((p,i)=>(
          <circle key={i} cx={toX(+new Date(p.date))} cy={toY(p.count||0)} r="2.5" fill="#0f172a" />
        ))}

        {hover && (
          <>
            <line x1={hover.x} x2={hover.x} y1={padT} y2={padT+innerH} stroke="#94a3b8" strokeDasharray="3 3"/>
            <circle cx={hover.x} cy={hover.y} r="4" fill="#0f172a"/>
          </>
        )}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full bg-slate-800 text-white text-xs px-2 py-1 rounded"
          style={{ left: hover.x, top: hover.y }}
        >
          {new Date(hover.p.date).toLocaleDateString()} • {hover.p.count}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  const { activeDistrictId, activeSchoolId } = useAuth();

  // 🔹 Default: last 7 days (today + previous 6 days)
  const [from, setFrom] = useState(daysAgo(6));
  const [to, setTo] = useState(today());
  const [search, setSearch] = useState("");          // student search text
  const [studentIdFilter, setStudentIdFilter] = useState(null); // selected student id
  const [q, setQ] = useState("");                    // free text filter

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [analytics, setAnalytics] = useState({ totalIncidents: 0, byDay: [], byCategory: [], bySeverity: [] });
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
          fetch(`/api/schools/${encodeURIComponent(activeSchoolId)}/analytics/incidents/summary?startDate=${from}&endDate=${to}`, {
            headers: { "X-District-Id": String(activeDistrictId), "Content-Type": "application/json" },
          }),
          fetch("/api/incidents", {
            headers: { "X-District-Id": String(activeDistrictId), "Content-Type": "application/json" },
          }),
          fetch("/api/students", {
            headers: { "X-District-Id": String(activeDistrictId), "Content-Type": "application/json" },
          }),
        ]);

        const analyticsJson = analyticsRes.ok ? await analyticsRes.json() : null;
        const incidentsJson = incidentsRes.ok ? await incidentsRes.json() : [];
        const studentsJson = studentsRes.ok ? await studentsRes.json() : [];

        if (!alive) return;

        setAnalytics({
          totalIncidents: analyticsJson?.totalIncidents ?? 0,
          byDay: Array.isArray(analyticsJson?.byDay) ? analyticsJson.byDay : [],
          byCategory: Array.isArray(analyticsJson?.byCategory) ? analyticsJson.byCategory : [],
          bySeverity: Array.isArray(analyticsJson?.bySeverity) ? analyticsJson.bySeverity : [],
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

    return () => { alive = false; };
  }, [activeDistrictId, activeSchoolId, from, to]);

  const studentNameById = useMemo(() => {
    const map = new Map();
    for (const s of students) map.set(s.id, `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim());
    return map;
  }, [students]);

  useEffect(() => {
    const name = search.trim().toLowerCase();
    if (!name) { setStudentIdFilter(null); return; }
    const hit = students.find(s => (`${s.firstName} ${s.lastName}`).toLowerCase() === name);
    setStudentIdFilter(hit?.id ?? null);
  }, [search, students]);

  const filteredRows = useMemo(() => {
    const fromTs = new Date(from + "T00:00:00Z").getTime();
    const toTs = new Date(to + "T23:59:59Z").getTime();
    const term = q.trim().toLowerCase();
    return incidents
      .filter((it) => {
        if (!it.occurredAt) return false;
        const t = new Date(it.occurredAt).getTime();
        if (t < fromTs || t > toTs) return false;
        if (studentIdFilter && it.studentId !== studentIdFilter) return false;
        return true;
      })
      .map((it) => ({
        id: it.id,
        studentId: it.studentId,
        student: studentNameById.get(it.studentId) || `#${it.studentId}`,
        category: it.category || "—",
        severity: it.severity || "—",
        description: it.description || "—",
        dateISO: it.occurredAt,
        date: new Date(it.occurredAt).toLocaleString(),
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
  }, [incidents, studentNameById, from, to, q, studentIdFilter]);

  function exportCSV() {
    const header = ["id","student","category","severity","description","date","by"].join(",");
    const body = filteredRows.map(r =>
      [r.id, r.student, r.category, r.severity, r.description, r.date, r.by]
        .map(v => `"${String(v).replaceAll('"','""')}"`).join(",")
    ).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `incidents_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const minor = analytics.bySeverity.find(s => (s.severity||"").toLowerCase()==="minor")?.count ?? 0;
  const major = analytics.bySeverity.find(s => (s.severity||"").toLowerCase()==="major")?.count ?? 0;

  // 🔹 Updated preset helper: used by 7 / 14 / 30 / 45 day buttons
  function setPreset(days){
    setFrom(daysAgo(days-1));
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
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">{err}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-3">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base">Filters</CardTitle>
            <Badge variant="outline" className="gap-1">
              <Filter size={14} /> Basic
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
              {/* From / To stay the same, just default to last 7 days now */}
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs text-slate-600 flex items-center gap-1"><CalendarRange size={14}/> From</label>
                <Input type="date" value={from} onChange={e=>setFrom(e.target.value)} />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs text-slate-600 flex items-center gap-1"><CalendarRange size={14}/> To</label>
                <Input type="date" value={to} onChange={e=>setTo(e.target.value)} />
              </div>

              {/* Updated presets: 7, 14, 30, 45 */}
              <div className="sm:col-span-2 flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={()=>setPreset(7)}>Last 7d</Button>
                <Button type="button" variant="outline" onClick={()=>setPreset(14)}>Last 14d</Button>
                <Button type="button" variant="outline" onClick={()=>setPreset(30)}>Last 30d</Button>
                <Button type="button" variant="outline" onClick={()=>setPreset(45)}>Last 45d</Button>
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-xs text-slate-600 flex items-center gap-1"><Search size={14}/> Student</label>
                <Input
                  list="students-dl"
                  placeholder="Type full name to filter (e.g., Ada Lovelace)"
                  value={search}
                  onChange={e=>setSearch(e.target.value)}
                />
                <datalist id="students-dl">
                  {students.map(s=>(
                    <option key={s.id} value={`${s.firstName} ${s.lastName}`} />
                  ))}
                </datalist>
              </div>

              <div className="sm:col-span-3 space-y-1">
                <label className="text-xs text-slate-600">Search (category, description, reporter…)</label>
                <Input placeholder="Free text…" value={q} onChange={e=>setQ(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="self-start">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base">Trend</CardTitle>
            <Badge variant="outline" className="gap-1">
              <BarChart3 size={14} /> {from} → {to}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="w-full h-56">
              <LineChartAxes points={analytics.byDay} from={from} to={to}/>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
              <div><div className="text-slate-500">Incidents</div><div className="font-semibold text-sm">{analytics.totalIncidents}</div></div>
              <div><div className="text-slate-500">Minor</div><div className="font-semibold text-sm">{minor}</div></div>
              <div><div className="text-slate-500">Major</div><div className="font-semibold text-sm">{major}</div></div>
            </div>
          </CardContent>
        </Card>

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
                  {filteredRows.map(r=>(
                    <TR key={r.id} className="border-b last:border-0">
                      <TD className="font-medium text-slate-800">{r.id}</TD>
                      <TD>{r.student}</TD>
                      <TD>{r.category}</TD>
                      <TD><Badge variant="outline">{r.severity}</Badge></TD>
                      <TD className="max-w-[320px] whitespace-pre-wrap">{r.description}</TD>
                      <TD>{r.date}</TD>
                      <TD>{r.by}</TD>
                    </TR>
                  ))}
                  {!loading && filteredRows.length === 0 && (
                    <TR><TD colSpan={7} className="py-6 text-slate-500 text-center">No results for the selected filters.</TD></TR>
                  )}
                  {loading && (
                    <TR><TD colSpan={7} className="py-6 text-slate-500 text-center">Loading…</TD></TR>
                  )}
                </TBody>
              </Table>
            </div>
          </CardContent>
        </Card>

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
