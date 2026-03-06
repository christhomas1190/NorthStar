import React, { useEffect, useMemo, useState } from "react";
import Page from "@/components/layout/Page";
import PageTabs from "@/components/layout/PageTabs";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BarChart3, AlertTriangle } from "lucide-react";

import { useAuth } from "@/state/auth.jsx";
import { getJSON } from "@/lib/api.js";

import {
  daysAgo,
  today,
  dayStringFromOccurredAt,
  parseLocalDay,
  fmtDay,
} from "@/utils/dateHelpers";

import LineChartWithAxes from "@/components/common/LineChartWithAxes";
import DashboardOverviewCard from "@/components/admin/DashOverviewCard";
import QuickActionsCard from "@/components/admin/QuickActionsCard";
import RecentActivity from "@/components/admin/RecentActivity";
import TierCardsRow from "@/components/admin/TierCardsRow";

export default function AdminDashboard() {
  const { activeDistrictId, activeSchoolId } = useAuth();

  const [from, setFrom] = useState(daysAgo(6));
  const [to, setTo] = useState(today());

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
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!activeDistrictId || !activeSchoolId) return;

    let alive = true;

    (async () => {
      setLoading(true);
      setErr("");

      try {
        const [analyticsJson, incidentsJson, studentsJson, alertsJson] = await Promise.all([
          getJSON(`/api/schools/${encodeURIComponent(activeSchoolId)}/analytics/incidents/summary?startDate=${from}&endDate=${to}`).catch(() => null),
          getJSON("/api/incidents").catch(() => []),
          getJSON("/api/students").catch(() => []),
          getJSON(`/api/escalation-rules/alerts?schoolId=${activeSchoolId}`).catch(() => []),
        ]);

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
        setAlerts(Array.isArray(alertsJson) ? alertsJson : []);
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

  const incidentsInRange = useMemo(() => {
    if (!incidents.length) return [];
    const fromStr = from;
    const toStr = to;

    return incidents.filter((it) => {
      const day = dayStringFromOccurredAt(it.occurredAt);
      if (!day) return false;
      return day >= fromStr && day <= toStr;
    });
  }, [incidents, from, to]);

  const computedByDay = useMemo(() => {
    const fromDate = parseLocalDay(from);
    const toDate = parseLocalDay(to);
    if (!fromDate || !toDate) return [];

    const counts = new Map();

    for (let i = 0; i < incidentsInRange.length; i++) {
      const it = incidentsInRange[i];
      const key = dayStringFromOccurredAt(it.occurredAt);
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const points = [];
    for (
      let d = new Date(fromDate);
      d <= toDate;
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
    ) {
      const key = fmtDay(d);
      points.push({ date: key, count: counts.get(key) || 0 });
    }

    return points;
  }, [incidentsInRange, from, to]);

  const severityCounts = useMemo(() => {
    const out = { minor: 0, major: 0 };

    for (let i = 0; i < incidentsInRange.length; i++) {
      const it = incidentsInRange[i];
      const sev = (it.severity || "").toLowerCase();
      if (sev === "minor") out.minor++;
      if (sev === "major") out.major++;
    }

    return out;
  }, [incidentsInRange]);

  const totalIncidentsRange = analytics.totalIncidents || incidentsInRange.length;

  const minor =
    analytics.bySeverity.find((s) => (s.severity || "").toLowerCase() === "minor")
      ?.count ?? severityCounts.minor;

  const major =
    analytics.bySeverity.find((s) => (s.severity || "").toLowerCase() === "major")
      ?.count ?? severityCounts.major;

  const recentFeed = useMemo(() => {
    const studentMap = new Map(students.map((s) => [s.id, `${s.firstName} ${s.lastName}`]));
    return (incidents || [])
      .filter((it) => !!it.occurredAt)
      .map((it) => ({
        id: it.id,
        studentId: it.studentId,
        studentName: studentMap.get(it.studentId) ?? "Unknown",
        category: it.category,
        severity: it.severity,
        when: new Date(it.occurredAt).toLocaleString(),
        by: it.reportedBy || "—",
      }))
      .sort((a, b) => new Date(b.when) - new Date(a.when))
      .slice(0, 12);
  }, [incidents, students]);

  const KPIS = [
    { label: "Active Students", value: students.length, hint: "Current tenant" },
    { label: "Incidents (range)", value: totalIncidentsRange, hint: `${from} → ${to}` },
    { label: "Minor", value: minor, hint: "In range" },
    { label: "Major", value: major, hint: "In range" },
  ];

  function setPreset(days) {
    setFrom(daysAgo(days - 1));
    setTo(today());
  }

  return (
    <Page title="Admin Dashboard" subtitle="School overview & quick actions">
      <PageTabs
        items={[
          { label: "Admin Dashboard", to: "/admin" },
          { label: "Reports & Trends", to: "/reports" },
          { label: "Discipline", to: "/admin/disciplines/new" },
        ]}
      />

      {err && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
          {err}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <DashboardOverviewCard kpis={KPIS}>
          <div className="w-full">
            <div className="mx-auto w-full max-w-[860px]">
              <div className="mt-6 rounded-2xl border p-4">
              <div>
                <p className="text-sm text-slate-500">Incident Trend</p>
                <p className="text-xs text-slate-400">
                  {from} → {to}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-end gap-2">
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

                <div className="flex flex-wrap gap-1 text-[11px]">
                  <Button type="button" variant="outline" className="h-7 px-2" onClick={() => setPreset(7)}>
                    Last 7d
                  </Button>
                  <Button type="button" variant="outline" className="h-7 px-2" onClick={() => setPreset(14)}>
                    Last 14d
                  </Button>
                  <Button type="button" variant="outline" className="h-7 px-2" onClick={() => setPreset(30)}>
                    Last 30d
                  </Button>
                  <Button type="button" variant="outline" className="h-7 px-2" onClick={() => setPreset(45)}>
                    Last 45d
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-3 w-full h-[240px]">
              <LineChartWithAxes points={computedByDay} width={720} height={240} />
            </div>
           </div>
          </div>
         </DashboardOverviewCard>

        <div className="xl:col-span-1 flex flex-col gap-6 items-center">
          <div className="w-full max-w-[420px]">
            <QuickActionsCard />
          </div>
          <div className="w-full max-w-[420px]">
            <RecentActivity items={recentFeed} />
          </div>
        </div>

      </div>

      <TierCardsRow />

      {alerts.length > 0 && (
        <div
          className="mt-6 rounded-xl p-4"
          style={{ border: "1.5px solid var(--ns-border)", background: "var(--ns-white)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} style={{ color: "#d97706" }} />
            <p className="font-semibold text-sm" style={{ fontFamily: "'Lora', serif", color: "var(--ns-text)" }}>
              Escalation Alerts
            </p>
          </div>
          <div className="space-y-2">
            {alerts.map((a) => (
              <div
                key={a.studentId}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                style={{ border: "1px solid var(--ns-border)", background: "var(--ns-bg)" }}
              >
                <span className="font-medium" style={{ color: "var(--ns-text)" }}>{a.studentName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--ns-text2)" }}>
                    {a.effectiveCautionCount} incidents
                  </span>
                  <span
                    className="rounded-[4px] px-2 py-0.5 text-xs font-semibold"
                    style={{
                      background: a.status === "ESCALATED" ? "#fee2e2" : "#fef3c7",
                      color: a.status === "ESCALATED" ? "#b91c1c" : "#92400e",
                    }}
                  >
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Page>
  );
}
