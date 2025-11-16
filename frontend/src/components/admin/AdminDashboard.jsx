// src/components/admin/AdminDashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Page from "@/components/layout/Page";
import PageTabs from "@/components/layout/PageTabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Clock, Tag, BarChart3 } from "lucide-react";
import KPICard from "@/components/common/KPICard";
import { useAuth } from "@/state/auth.jsx";

function fmtDay(d) { return new Date(d).toISOString().slice(0, 10); }
function today() { return fmtDay(new Date()); }
function thirtyDaysAgo() { return fmtDay(new Date(Date.now() - 29 * 864e5)); }

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

function LineChartWithAxes({ points = [], width = 420, height = 220 }) {
  const padLeft = 44, padRight = 16, padTop = 18, padBottom = 36;
  const innerW = Math.max(10, width - padLeft - padRight);
  const innerH = Math.max(10, height - padTop - padBottom);

  const parsed = (points || [])
    .filter(p => p && p.date && typeof p.count === "number")
    .map(p => ({ t: new Date(p.date).getTime(), c: Number(p.count) }))
    .sort((a, b) => a.t - b.t);

  if (!parsed.length) {
    return (
      <div className="w-full h-full rounded-xl bg-slate-100 grid place-content-center text-slate-400">
        No data
      </div>
    );
  }

  const xs = parsed.map(p => p.t);
  const ys = parsed.map(p => p.c);
  const xMin = Math.min(...xs), xMax = Math.max(...xs) + 1;
  const yMax = Math.max(1, Math.max(...ys));
  const yTicks = niceTicks(yMax, 4);
  const toX = (t) => padLeft + ((t - xMin) / (xMax - xMin)) * innerW;
  const toY = (v) => padTop + innerH - (v / (yTicks[yTicks.length - 1] || 1)) * innerH;
  const path = parsed.map((p, i) => `${i ? "L" : "M"} ${toX(p.t)} ${toY(p.c)}`).join(" ");

  const ref = useRef(null);
  const [hover, setHover] = useState(null);

  function onMove(e) {
    const svg = ref.current;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const loc = pt.matrixTransform(svg.getScreenCTM().inverse());
    const x = Math.min(padLeft + innerW, Math.max(padLeft, loc.x));
    const targetT = xMin + ((x - padLeft) / innerW) * (xMax - xMin);
    let best = null, bestD = Infinity;
    for (const p of parsed) {
      const d = Math.abs(p.t - targetT);
      if (d < bestD) { bestD = d; best = p; }
    }
    setHover(best ? { x: toX(best.t), y: toY(best.c), t: best.t, c: best.c } : null);
  }
  function onLeave() { setHover(null); }

  const xTicksCount = Math.min(6, parsed.length);
  const xTicks = [];
  for (let i = 0; i < xTicksCount; i++) {
    const idx = Math.round((i / (xTicksCount - 1 || 1)) * (parsed.length - 1));
    const p = parsed[idx];
    xTicks.push({ t: p.t, label: new Date(p.t).toLocaleDateString(undefined, { month: "short", day: "numeric" }) });
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
      <rect x="0" y="0" width={width} height={height} fill="white" rx="12" />
      <g>
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={padLeft} y1={toY(v)} x2={width - padRight} y2={toY(v)} stroke="rgb(241,245,249)" strokeWidth="1" />
            <text x={padLeft - 8} y={toY(v)} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="#64748b">
              {v}
            </text>
          </g>
        ))}
        <line x1={padLeft} y1={padTop + innerH} x2={width - padRight} y2={padTop + innerH} stroke="#94a3b8" strokeWidth="1" />
        {xTicks.map((tk, i) => (
          <text key={i} x={toX(tk.t)} y={height - 10} textAnchor="middle" fontSize="10" fill="#64748b">
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
          <line x1={hover.x} y1={padTop} x2={hover.x} y2={padTop + innerH} stroke="#94a3b8" strokeDasharray="3 3" />
          <circle cx={hover.x} cy={hover.y} r="4" fill="white" stroke="#0f172a" strokeWidth="2" />
          <g transform={`translate(${Math.min(width - 140, Math.max(padLeft, hover.x + 8))}, ${Math.max(padTop + 8, hover.y - 30)})`}>
            <rect width="132" height="36" rx="8" fill="white" stroke="#cbd5e1" />
            <text x="8" y="14" fontSize="11" fill="#0f172a">{new Date(hover.t).toLocaleString()}</text>
            <text x="8" y="26" fontSize="11" fill="#0f172a">Incidents: {hover.c}</text>
          </g>
        </>
      )}
      <text x={padLeft + innerW / 2} y={height - 2} textAnchor="middle" fontSize="11" fill="#334155">Date</text>
      <text x="12" y={padTop + innerH / 2} transform={`rotate(-90, 12, ${padTop + innerH / 2})`} textAnchor="middle" fontSize="11" fill="#334155">
        Count
      </text>
    </svg>
  );
}

export default function AdminDashboard() {
  const { activeDistrictId, activeSchoolId } = useAuth();

  const [from, setFrom] = useState(thirtyDaysAgo());
  const [to, setTo] = useState(today());

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

  const minor = analytics.bySeverity.find((s) => (s.severity || "").toLowerCase() === "minor")?.count ?? 0;
  const major = analytics.bySeverity.find((s) => (s.severity || "").toLowerCase() === "major")?.count ?? 0;

  const recentFeed = useMemo(() => {
    return (incidents || [])
      .filter(it => !!it.occurredAt)
      .map(it => ({
        id: it.id,
        studentId: it.studentId,
        category: it.category,
        severity: it.severity,
        when: new Date(it.occurredAt).toLocaleString(),
        by: it.reportedBy || "—",
        label: `[${new Date(it.occurredAt).toLocaleDateString()}] ${it.category} (${it.severity})`,
      }))
      .sort((a, b) => new Date(b.when) - new Date(a.when))
      .slice(0, 12);
  }, [incidents]);

  const KPIS = [
    { label: "Active Students", value: students.length, hint: "Current tenant" },
    { label: "Incidents (range)", value: analytics.totalIncidents, hint: `${from} → ${to}` },
    { label: "Minor", value: minor, hint: "In range" },
    { label: "Major", value: major, hint: "In range" },
  ];

  const tierCards = [
    { name: "Tier 1", desc: "Universal supports", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { name: "Tier 2", desc: "Targeted small-group supports", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { name: "Tier 3", desc: "Intensive individualized supports", color: "bg-rose-50 text-rose-700 border-rose-200" },
  ];

  const btnCls = "justify-between rounded-2xl border border-slate-300 bg-white hover:bg-slate-50";

  return (
    <Page title="Admin Dashboard" subtitle="School overview & quick actions">
      <PageTabs
        items={[
          { label: "Admin Dashboard", to: "/admin" },
          { label: "Reports & Trends", to: "/reports" },
        ]}
      />

      {err && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">{err}</div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">School Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {KPIS.map((k) => (<KPICard key={k.label} {...k} />))}
            </div>

            <div className="mt-6 rounded-2xl border p-4">
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm text-slate-500">Incident Trend</p>
                  <p className="text-xs text-slate-400">{from} → {to}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600">From</label>
                    <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-600">To</label>
                    <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                  </div>
                  <Badge variant="outline" className="gap-1 h-9 flex items-center">
                    <BarChart3 size={14} /> Live
                  </Badge>
                </div>
              </div>

              <div className="mt-3 w-full h-[240px]">
                <LineChartWithAxes points={analytics.byDay} width={720} height={240} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 mb-6">
              <Button variant="outline" className={btnCls} onClick={() => (window.location.href = "/admin/define-behaviors")}>
                Define Behavior Categories ▸
              </Button>
              <Button variant="outline" className={btnCls} onClick={() => (window.location.href = "/admin/interventions")}>
                Manage Interventions ▸
              </Button>
              <Button variant="outline" className={btnCls} onClick={() => (window.location.href = "/admin/escalation-rules")}>
                Set Escalation Rules ▸
              </Button>
              <Button variant="outline" className={btnCls} onClick={() => (window.location.href = "/admin/user-role-management")}>
                User & Student Management ▸
              </Button>
              <Button variant="outline" className={btnCls} onClick={() => (window.location.href = "/admin/import-students")}>
                Import Students ▸
              </Button>
            </div>

            <div className="mt-5 rounded-2xl border p-3 text-xs text-slate-600 flex items-start gap-2">
              <Clock size={14} className="mt-0.5" />
              <div className="w-full">
                <p className="font-medium">Recent Activity</p>
                <div className="mt-2 max-h-40 overflow-auto rounded-lg bg-slate-50 p-2 border text-[11px]">
                  {recentFeed.map((it) => (
                    <div key={it.id} className="flex items-center justify-between py-1">
                      <span className="truncate">
                        [{it.when}] <b>{it.by}</b> recorded <b>{it.category}</b> ({it.severity}) for student #{it.studentId} (id {it.id})
                      </span>
                    </div>
                  ))}
                  {recentFeed.length === 0 && (
                    <div className="py-2 text-slate-500">No recent incidents in range.</div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {tierCards.map((t) => (
          <Card key={t.name} className={`border ${t.color} shadow-sm`}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Tag size={16} /> {t.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm opacity-80">{t.desc}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline">Examples</Badge>
                <Badge variant="outline">Entry Criteria</Badge>
                <Badge variant="outline">Progress Monitor</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Page>
  );
}
