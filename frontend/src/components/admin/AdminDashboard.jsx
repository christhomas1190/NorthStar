import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Page from "@/components/layout/Page";
import PageTabs from "@/components/layout/PageTabs";
import { Clock, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import KPICard from "@/components/common/KPICard";
import { useAuth } from "@/state/auth.jsx";

function last30() {
  const end = new Date();
  const start = new Date(Date.now() - 29 * 864e5);
  const fmt = (d) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

function LineChartInline({ points = [], className = "" }) {
  const width = 420, height = 120, pad = 12;
  if (!points.length) {
    return (
      <div className="h-36 w-full rounded-xl bg-slate-100 grid place-content-center text-slate-400">
        No data
      </div>
    );
  }
  const xs = points.map((p) => new Date(p.date).getTime());
  const ys = points.map((p) => p.count);
  const xMin = Math.min(...xs), xMax = Math.max(...xs) || (xMin + 1);
  const yMin = 0, yMax = Math.max(1, Math.max(...ys));
  const toX = (t) => pad + ((t - xMin) / (xMax - xMin)) * (width - pad * 2);
  const toY = (v) => height - pad - ((v - yMin) / (yMax - yMin)) * (height - pad * 2);
  const d = points.map((p, i) => `${i ? "L" : "M"} ${toX(new Date(p.date).getTime())} ${toY(p.count)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`w-full h-36 ${className}`}>
      <rect x="0" y="0" width={width} height={height} fill="rgb(248,250,252)" rx="12" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" />
      {points.map((p, i) => (
        <circle key={i} cx={toX(new Date(p.date).getTime())} cy={toY(p.count)} r="2.5" fill="currentColor" />
      ))}
    </svg>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { activeDistrictId, activeSchoolId } = useAuth();
  const [{ start, end }] = useState(() => last30());

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [students, setStudents] = useState([]);
  const [analytics, setAnalytics] = useState({ totalIncidents: 0, byDay: [], bySeverity: [] });
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    if (!activeDistrictId || !activeSchoolId) return;
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const [studentsRes, analyticsRes, incidentsRes] = await Promise.all([
          fetch("/api/students", {
            headers: { "X-District-Id": String(activeDistrictId), "Content-Type": "application/json" },
          }),
          fetch(`/api/schools/${encodeURIComponent(activeSchoolId)}/analytics/incidents/summary?startDate=${start}&endDate=${end}`, {
            headers: { "X-District-Id": String(activeDistrictId), "Content-Type": "application/json" },
          }),
          fetch("/api/incidents", {
            headers: { "X-District-Id": String(activeDistrictId), "Content-Type": "application/json" },
          }),
        ]);

        const studentsJson = studentsRes.ok ? await studentsRes.json() : [];
        const analyticsJson = analyticsRes.ok ? await analyticsRes.json() : null;
        const incidentsJson = incidentsRes.ok ? await incidentsRes.json() : [];

        if (!alive) return;

        setStudents(Array.isArray(studentsJson) ? studentsJson.filter(s => s.schoolId === activeSchoolId) : []);
        setAnalytics({
          totalIncidents: analyticsJson?.totalIncidents ?? 0,
          byDay: Array.isArray(analyticsJson?.byDay) ? analyticsJson.byDay : [],
          bySeverity: Array.isArray(analyticsJson?.bySeverity) ? analyticsJson.bySeverity : [],
        });

        const recent = (Array.isArray(incidentsJson) ? incidentsJson : [])
          .filter(it => !!it.occurredAt)
          .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
          .slice(0, 15)
          .map(it => ({
            id: it.id,
            student: "",
            tier: it.severity,
            date: new Date(it.occurredAt).toLocaleString(),
            by: it.reportedBy || "—",
          }));
        setIncidents(recent);
      } catch (e) {
        if (!alive) return;
        setErr(String(e.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [activeDistrictId, activeSchoolId, start, end]);

  const minor = useMemo(() => analytics.bySeverity.find(s => (s.severity || "").toLowerCase() === "minor")?.count ?? 0, [analytics]);
  const major = useMemo(() => analytics.bySeverity.find(s => (s.severity || "").toLowerCase() === "major")?.count ?? 0, [analytics]);

  const KPI_ITEMS = [
    { label: "Active Students", value: students.length, hint: `School ${activeSchoolId}` },
    { label: "Incidents (30d)", value: analytics.totalIncidents, hint: `${start} → ${end}` },
    { label: "Minor (30d)", value: minor, hint: "By severity" },
    { label: "Major (30d)", value: major, hint: "By severity" },
  ];

  const tiers = [
    { name: "Tier 1", desc: "Universal supports", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { name: "Tier 2", desc: "Targeted small-group supports", color: "bg-amber-50 text-amber-700 border-amber-200" },
    { name: "Tier 3", desc: "Intensive individualized supports", color: "bg-rose-50 text-rose-700 border-rose-200" },
  ];

  return (
    <Page title="Admin Dashboard" subtitle="School overview & quick actions">
      <PageTabs items={[{ label: "Admin Dashboard", to: "/admin" }, { label: "Reports & Trends", to: "/reports" }]} />

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
              {KPI_ITEMS.map((k) => <KPICard key={k.label} {...k} />)}
            </div>

            <div className="mt-6 rounded-2xl border p-4">
              <div className="flex items-center justify-between">
                <div><p className="text-sm text-slate-500">30-Day Incident Trend</p></div>
                <Button variant="outline" size="sm" onClick={() => navigate("/reports")}>Open Full Analytics</Button>
              </div>
              <div className="mt-3">
                <LineChartInline points={analytics.byDay} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Quick Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 mb-6">
              <Button variant="outline" className="justify-between rounded-2xl border border-slate-300 bg-white hover:bg-slate-50" onClick={() => navigate("/admin/define-behaviors")}>Define Behavior Categories ▸</Button>
              <Button variant="outline" className="justify-between rounded-2xl border border-slate-300 bg-white hover:bg-slate-50" onClick={() => navigate("/admin/interventions")}>Manage Interventions ▸</Button>
              <Button variant="outline" className="justify-between rounded-2xl border border-slate-300 bg-white hover:bg-slate-50" onClick={() => navigate("/admin/escalation-rules")}>Set Escalation Rules ▸</Button>
              <Button variant="outline" className="justify-between rounded-2xl border border-slate-300 bg-white hover:bg-slate-50" onClick={() => navigate("/admin/user-role-management")}>User & Student Management ▸</Button>
              <Button variant="outline" className="justify-between rounded-2xl border border-slate-300 bg-white hover:bg-slate-50" onClick={() => navigate("/admin/import-students")}>Import Students ▸</Button>
            </div>

            <div className="mt-5 rounded-2xl border p-3 text-xs text-slate-600 flex items-start gap-2">
              <Clock size={14} className="mt-0.5" />
              <div className="w-full">
                <p className="font-medium">Recent Activity</p>
                <div className="mt-2 max-h-28 overflow-auto rounded-lg bg-slate-50 p-2 border text-[11px]">
                  {loading && <div className="text-slate-500">Loading…</div>}
                  {!loading && incidents.length === 0 && <div className="text-slate-500">No recent activity.</div>}
                  {incidents.map((it) => (
                    <div key={it.id} className="flex items-center justify-between py-1">
                      <span className="truncate">
                        [{it.date}] <b>{it.by}</b> recorded incident <b>{it.id}</b> {it.student ? <>for <b>{it.student}</b></> : null}
                      </span>
                      <Badge variant="outline" className="ml-2">{it.tier || "—"}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {tiers.map((t) => (
          <Card key={t.name} className={`border ${t.color} shadow-sm`}>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Tag size={16} /> {t.name}</CardTitle></CardHeader>
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
