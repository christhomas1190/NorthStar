import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Page from "@/components/layout/Page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/state/auth.jsx";
import { getJSON } from "@/lib/api.js";

export default function ViewerDashboard() {
  const { activeDistrictId } = useAuth();

  const [students, setStudents] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!activeDistrictId) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const [sData, iData] = await Promise.all([
          getJSON("/api/students").catch(() => []),
          getJSON("/api/incidents").catch(() => []),
        ]);
        if (!alive) return;
        setStudents(Array.isArray(sData) ? sData : []);
        setIncidents(Array.isArray(iData) ? iData : []);
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

  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return students;
    return students.filter((s) => {
      const name = `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase();
      const sid = (s.studentId || "").toLowerCase();
      return name.includes(q) || sid.includes(q);
    });
  }, [students, search]);

  const studentMap = useMemo(() => {
    const m = new Map();
    for (const s of students) m.set(s.id, s);
    return m;
  }, [students]);

  const recentIncidents = useMemo(() => {
    return [...incidents]
      .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
      .slice(0, 20);
  }, [incidents]);

  function studentName(studentId) {
    const s = studentMap.get(studentId);
    if (!s) return `#${studentId}`;
    return `${s.firstName || ""} ${s.lastName || ""}`.trim() || `#${studentId}`;
  }

  return (
    <Page title="Viewer Dashboard" subtitle="Read-only access">
      {err && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
          {err}
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Students</span>
            <Input
              placeholder="Search by name or student ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 h-8 text-sm"
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-slate-600">
              <tr>
                <th className="text-left py-2 pr-4">Name</th>
                <th className="text-left py-2 pr-4">Grade</th>
                <th className="text-left py-2">Student ID</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-slate-500">
                    No students found.
                  </td>
                </tr>
              )}
              {filteredStudents.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="py-2 pr-4">
                    <Link
                      to={`/viewer/students/${s.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {s.firstName} {s.lastName}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">{s.grade || "—"}</td>
                  <td className="py-2">{s.studentId || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-slate-600">
              <tr>
                <th className="text-left py-2 pr-4">Date</th>
                <th className="text-left py-2 pr-4">Student</th>
                <th className="text-left py-2 pr-4">Category</th>
                <th className="text-left py-2 pr-4">Severity</th>
                <th className="text-left py-2">Reported By</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && recentIncidents.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500">
                    No incidents found.
                  </td>
                </tr>
              )}
              {recentIncidents.map((it) => (
                <tr key={it.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="py-2 pr-4 text-xs">
                    {it.occurredAt ? new Date(it.occurredAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-2 pr-4">{studentName(it.studentId)}</td>
                  <td className="py-2 pr-4">{it.category || "—"}</td>
                  <td className="py-2 pr-4">
                    <Badge variant="outline">{it.severity || "—"}</Badge>
                  </td>
                  <td className="py-2">{it.reportedBy || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </Page>
  );
}
