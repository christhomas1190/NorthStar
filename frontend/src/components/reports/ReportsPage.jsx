// src/components/reports/ReportsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import Page from "@/components/layout/Page";
import PageTabs from "@/components/layout/PageTabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { FileDown, Filter, BarChart3 } from "lucide-react";
import { useAuth } from "@/state/auth.jsx";

/* ──────────────────────────────────────────────────────────────
   Helpers: date formatting + default range (last 30 days)
   ────────────────────────────────────────────────────────────── */
function fmtDay(d) { return new Date(d).toISOString().slice(0, 10); }
function today() { return fmtDay(new Date()); }
function thirtyDaysAgo() { return fmtDay(new Date(Date.now() - 29 * 864e5)); }

/* ──────────────────────────────────────────────────────────────
   Tiny inline SVG line chart (no external libs; compact footprint)
   ────────────────────────────────────────────────────────────── */
function LineChartInline({ points = [], className = "" }) {
  const width = 320, height = 160, pad = 12;
  if (!points.length) {
    return (
      <div className="w-full h-full rounded-xl bg-slate-100 grid place-content-center text-slate-400">
        No data
      </div>
    );
  }
  const xs = points.map(p => new Date(p.date).getTime());
  const ys = points.map(p => p.count);
  const xMin = Math.min(...xs), xMax = Math.max(...xs) || (xMin + 1);
  const yMin = 0, yMax = Math.max(1, Math.max(...ys));
  const toX = t => pad + ((t - xMin) / (xMax - xMin)) * (width - pad * 2);
  const toY = v => height - pad - ((v - yMin) / (yMax - yMin)) * (height - pad * 2);
  const d = points.map((p, i) => `${i ? "L" : "M"} ${toX(new Date(p.date).getTime())} ${toY(p.count)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`w-full h-full ${className}`}>
      <rect x="0" y="0" width={width} height={height} fill="rgb(248,250,252)" rx="12" />
      <path d={d} fill="none" stroke="currentColor" strokeWidth="2" />
      {points.map((p, i) => (
        <circle key={i} cx={toX(new Date(p.date).getTime())} cy={toY(p.count)} r="2.5" fill="currentColor" />
      ))}
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────
   Reports Page
   ────────────────────────────────────────────────────────────── */
export default function ReportsPage() {
  /* Tenant context (district + school) */
  const { activeDistrictId, activeSchoolId } = useAuth();

  /* Filters */
  const [from, setFrom] = useState(thirtyDaysAgo());
  const [to, setTo] = useState(today());
  const [q, setQ] = useState("");

  /* Loading + error */
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  /* Data state */
  const [analytics, setAnalytics] = useState({ totalIncidents: 0, byDay: [], byCategory: [], bySeverity: [] });
  const [incidents, setIncidents] = useState([]);
  const [students, setStudents] = useState([]);

  /* ─── Fetch analytics + incidents + students on mount / filter change ─── */
  useEffect(() => {
    if (!activeDistrictId || !activeSchoolId) return;
    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");
      try {
        const [analyticsRes, incidentsRes, studentsRes] = await Promise.all([
          fetch(
            `/api/schools/${encodeURIComponent(activeSchoolId)}/analytics/incidents/summary?startDate=${from}&endDate=${to}`,
            { headers: { "X-District-Id": String(activeDistrictId), "Content-Type": "application/json" } }
          ),
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

  /* Student name lookup map */
  const studentNameById = useMemo(() => {
    const map = new Map();
    for (const s of students) map.set(s.id, `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim());
    return map;
  }, [students]);

  /* Apply filters + shape rows for the table */
  const filteredRows = useMemo(() => {
    const fromTs = new Date(from + "T00:00:00Z").getTime();
    const toTs = new Date(to + "T23:59:59Z").getTime();
    const term = q.trim().toLowerCase();
    return incidents
      .filter((it) => {
        if (!it.occurredAt) return false;
        const t = new Date(it.occurredAt).getTime();
        return t >= fromTs && t <= toTs;
      })
      .map((it) => ({
        id: it.id,
        student: studentNameById.get(it.studentId) || `#${it.studentId}`,
        category: it.category || "—",
        severity: it.severity || "—",
        date: new Date(it.occurredAt).toLocaleString(),
        by: it.reportedBy || "—",
      }))
      .filter((r) => {
        if (!term) return true;
        return (
          r.student.toLowerCase().includes(term) ||
          r.category.toLowerCase().includes(term) ||
          String(r.id).toLowerCase().includes(term) ||
          r.by.toLowerCase().includes(term) ||
          r.severity.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [incidents, studentNameById, from, to, q]);

  /* Export CSV of currently-filtered rows */
  function exportCSV() {
    const header = ["id", "student", "category", "severity", "date", "by"].join(",");
    const body = filteredRows
      .map((r) =>
        [r.id, r.student, r.category, r.severity, r.date, r.by]
          .map((v) => `"${String(v).replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `incidents_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* Derived severity counts for the mini-cards under the chart */
  const minor = analytics.bySeverity.find((s) => (s.severity || "").toLowerCase() === "minor")?.count ?? 0;
  const major = analytics.bySeverity.find((s) => (s.severity || "").toLowerCase() === "major")?.count ?? 0;

  /* ──────────────────────────────────────────────────────────────
     Render
     ────────────────────────────────────────────────────────────── */
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
      {/* Top nav tabs under the header */}
      <PageTabs
        items={[
          { label: "Admin Dashboard", to: "/admin" },
          { label: "Reports & Trends", to: "/reports" },
        ]}
      />

      {/* Error banner */}
      {err && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">{err}</div>
      )}

      {/* Page grid: Filters row, then 2-column content (Trend+Exports | Results) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Filters (full-width) ── */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="text-base">Filters</CardTitle>
            <Badge variant="outline" className="gap-1">
              <Filter size={14} /> Basic
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-600">From</label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">To</label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-600">Search</label>
                <Input placeholder="Student, category, ID, reporter…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Two-column content after Filters ── */}
        <div className="lg:col-span-3 grid lg:grid-cols-[360px_1fr] gap-6 items-start">
          {/* LEFT COLUMN: Trend (compact) + Exports (fills remaining) */}
          <div className="flex flex-col gap-6 h-[600px]">
            {/* Trend */}
            <Card className="self-start">
              <CardHeader className="flex items-center justify-between">
                <CardTitle className="text-base">Trend</CardTitle>
                <Badge variant="outline" className="gap-1">
                  <BarChart3 size={14} /> Last 30d
                </Badge>
              </CardHeader>
              <CardContent>
                {/* Compact, fixed-height chart */}
                <div className="w-full h-40">
                  <LineChartInline points={analytics.byDay} />
                </div>

                {/* Mini stats under chart */}
                <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <div className="text-slate-500">Incidents</div>
                    <div className="font-semibold text-sm">{analytics.totalIncidents}</div>
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

            {/* Exports (fills the rest of the left column; scrolls if needed) */}
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <CardTitle className="text-base">Exports</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3 overflow-auto">
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

          {/* RIGHT COLUMN: Results (fixed height, internal scroll) */}
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="text-base">Results</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 min-h-0">
              <div className="h-full overflow-y-auto">
                <Table>
                  <THead>
                    <TR className="text-left text-slate-600 border-b sticky top-0 bg-white">
                      <TH className="py-3">Incident</TH>
                      <TH className="py-3">Student</TH>
                      <TH className="py-3">Category</TH>
                      <TH className="py-3">Severity</TH>
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
                        <TD><Badge variant="outline">{r.severity}</Badge></TD>
                        <TD>{r.date}</TD>
                        <TD>{r.by}</TD>
                      </TR>
                    ))}
                    {!loading && filteredRows.length === 0 && (
                      <TR>
                        <TD colSpan={6} className="py-6 text-slate-500 text-center">
                          No results for the selected filters.
                        </TD>
                      </TR>
                    )}
                    {loading && (
                      <TR>
                        <TD colSpan={6} className="py-6 text-slate-500 text-center">
                          Loading…
                        </TD>
                      </TR>
                    )}
                  </TBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Page>
  );
}
