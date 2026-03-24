import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Page from "@/components/layout/Page";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getJSON } from "@/lib/api.js";

function fmtDay(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function today() { return fmtDay(new Date()); }
function thirtyDaysAgo() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return fmtDay(d);
}

export default function ActivityFeedPage() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [tierChanges, setTierChanges] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [from, setFrom] = useState(thirtyDaysAgo());
  const [to, setTo] = useState(today());
  const [studentFilter, setStudentFilter] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [inc, dis, tc, stu] = await Promise.all([
          getJSON("/api/incidents").catch(() => []),
          getJSON("/api/interventions").catch(() => []),
          getJSON("/api/tier-history").catch(() => []),
          getJSON("/api/students").catch(() => []),
        ]);
        if (!alive) return;
        setIncidents(Array.isArray(inc) ? inc : []);
        setDisciplines(Array.isArray(dis) ? dis : []);
        setTierChanges(Array.isArray(tc) ? tc : []);
        setStudents(Array.isArray(stu) ? stu : []);
      } catch (e) {
        if (!alive) return;
        setError(String(e.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Build student name map
  const studentMap = useMemo(() => {
    const m = {};
    for (const s of students) {
      m[s.id] = `${s.firstName || ""} ${s.lastName || ""}`.trim();
    }
    return m;
  }, [students]);

  // Merge all events
  const allEvents = useMemo(() => {
    const evts = [];
    for (const it of incidents) {
      evts.push({
        type: "incident",
        date: it.occurredAt,
        dateStr: it.occurredAt ? String(it.occurredAt).slice(0, 10) : "",
        studentId: it.studentId,
        studentName: studentMap[it.studentId] || `Student #${it.studentId}`,
        details: `${it.category || "—"} · ${it.severity || "—"}`,
        by: it.reportedBy || "—",
        id: `inc-${it.id}`,
      });
    }
    for (const d of disciplines) {
      evts.push({
        type: "discipline",
        date: d.startDate,
        dateStr: d.startDate ? String(d.startDate).slice(0, 10) : "",
        studentId: d.studentId,
        studentName: d.studentName || studentMap[d.studentId] || `Student #${d.studentId}`,
        details: `${d.tier ? d.tier.replace("_", " ").replace("TIER", "Tier") : "Intervention"} · ${d.strategy || "—"}`,
        by: d.assignedBy || "—",
        id: `dis-${d.id}`,
      });
    }
    for (const tc of tierChanges) {
      evts.push({
        type: "tier-change",
        date: tc.changedAt,
        dateStr: tc.changedAt ? String(tc.changedAt).slice(0, 10) : "",
        studentId: tc.studentId,
        studentName: tc.studentName || studentMap[tc.studentId] || `Student #${tc.studentId}`,
        details: `${tc.fromTier ? tc.fromTier + " → " : "Initial: "}${tc.toTier || "—"}`,
        by: tc.changedBy || "—",
        id: `tc-${tc.id}`,
      });
    }
    return evts.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date) - new Date(a.date);
    });
  }, [incidents, disciplines, tierChanges, studentMap]);

  const filtered = useMemo(() => {
    const lc = studentFilter.toLowerCase();
    return allEvents.filter((e) => {
      if (e.dateStr && from && e.dateStr < from) return false;
      if (e.dateStr && to && e.dateStr > to) return false;
      if (lc && !e.studentName.toLowerCase().includes(lc)) return false;
      return true;
    });
  }, [allEvents, from, to, studentFilter]);

  function typeBadge(type) {
    if (type === "incident") return <Badge className="bg-rose-100 text-rose-700 border-rose-200 rounded-[4px]">Incident</Badge>;
    if (type === "discipline") return <Badge className="bg-amber-100 text-amber-700 border-amber-200 rounded-[4px]">Discipline</Badge>;
    if (type === "tier-change") return <Badge className="bg-blue-100 text-blue-700 border-blue-200 rounded-[4px]">Tier Change</Badge>;
    return <Badge variant="outline">{type}</Badge>;
  }

  return (
    <Page
      title="Activity Feed"
      subtitle="All incidents, disciplines & tier changes"
      actions={
        <Button variant="outline" onClick={() => navigate("/admin")}>
          ← Dashboard
        </Button>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-slate-600 mb-1">From</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">To</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs text-slate-600 mb-1">Student name</label>
              <Input
                placeholder="Filter by student…"
                value={studentFilter}
                onChange={(e) => setStudentFilter(e.target.value)}
              />
            </div>
            <div className="text-sm text-slate-500 self-end pb-1">
              {filtered.length} event{filtered.length !== 1 ? "s" : ""}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Events</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="text-sm text-slate-500 py-4">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-slate-500 py-4">No events in this range.</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="border-b text-slate-600">
                <tr>
                  <th className="text-left py-2 pr-3">Type</th>
                  <th className="text-left py-2 pr-3">Date</th>
                  <th className="text-left py-2 pr-3">Student</th>
                  <th className="text-left py-2 pr-3">Details</th>
                  <th className="text-left py-2">By</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-1.5 pr-3">{typeBadge(e.type)}</td>
                    <td className="py-1.5 pr-3 whitespace-nowrap text-slate-600">
                      {e.date ? new Date(e.date).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-1.5 pr-3">
                      {e.studentId ? (
                        <Link
                          to={`/admin/students/${e.studentId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {e.studentName}
                        </Link>
                      ) : (
                        e.studentName
                      )}
                    </td>
                    <td className="py-1.5 pr-3 max-w-xs">{e.details}</td>
                    <td className="py-1.5 text-slate-600">{e.by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </Page>
  );
}
