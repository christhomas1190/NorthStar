import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Page from "@/components/layout/Page";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export default function TeacherDetailPage() {
  const { teacherId } = useParams();
  const navigate = useNavigate();

  const [teacher, setTeacher] = useState(null);
  const [stats, setStats] = useState(null);
  const [allIncidents, setAllIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [from, setFrom] = useState(thirtyDaysAgo());
  const [to, setTo] = useState(today());

  useEffect(() => {
    if (!teacherId) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [t, s, inc] = await Promise.all([
          getJSON(`/api/teachers/${teacherId}`).catch(() => null),
          getJSON(`/api/teachers/${teacherId}/stats`).catch(() => null),
          getJSON(`/api/teachers/${teacherId}/incidents`).catch(() => []),
        ]);
        if (!alive) return;
        setTeacher(t);
        setStats(s);
        setAllIncidents(Array.isArray(inc) ? inc : []);
      } catch (e) {
        if (!alive) return;
        setError(String(e.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [teacherId]);

  const incidentsInRange = useMemo(() => {
    return allIncidents.filter((it) => {
      if (!it.occurredAt) return false;
      const day = String(it.occurredAt).slice(0, 10);
      return day >= from && day <= to;
    });
  }, [allIncidents, from, to]);

  const teacherName = teacher
    ? `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim()
    : `Teacher #${teacherId}`;

  return (
    <Page
      title="Teacher Detail"
      subtitle={teacherName}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/teacher-stats")}>
            ← All Stats
          </Button>
          <Button variant="outline" onClick={() => navigate("/admin/teachers")}>
            Teachers
          </Button>
        </div>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-slate-500 py-4">Loading…</div>
      ) : (
        <>
          {/* Teacher info card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Teacher Info</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div><span className="font-medium text-slate-700">Name: </span>{teacherName}</div>
              {teacher?.email && (
                <div><span className="font-medium text-slate-700">Email: </span>{teacher.email}</div>
              )}
              {teacher?.userName && (
                <div>
                  <span className="font-medium text-slate-700">Username: </span>
                  <span className="font-mono">{teacher.userName}</span>
                </div>
              )}
              {teacher?.districtId && (
                <div><span className="font-medium text-slate-700">District ID: </span>{teacher.districtId}</div>
              )}
            </CardContent>
          </Card>

          {/* Stats row */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-5 pb-4 text-center">
                  <div className="text-3xl font-bold text-slate-800">{stats.totalCautions}</div>
                  <div className="text-xs text-slate-500 mt-1">Total Cautions</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-4 text-center">
                  <div className="text-lg font-semibold text-slate-800 truncate">
                    {stats.mostCommonCategory || "—"}
                  </div>
                  {stats.mostCommonCategoryCount > 0 && (
                    <div className="text-xs text-slate-500">{stats.mostCommonCategoryCount} incidents</div>
                  )}
                  <div className="text-xs text-slate-500 mt-1">Top Category</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-5 pb-4 text-center">
                  {stats.mostCautionedStudentId ? (
                    <Link
                      to={`/admin/students/${stats.mostCautionedStudentId}`}
                      className="text-blue-600 hover:underline text-sm font-semibold"
                    >
                      {stats.mostCautionedStudentName}
                    </Link>
                  ) : (
                    <div className="text-sm text-slate-400">—</div>
                  )}
                  {stats.mostCautionedStudentCount > 0 && (
                    <div className="text-xs text-slate-500">{stats.mostCautionedStudentCount} incidents</div>
                  )}
                  <div className="text-xs text-slate-500 mt-1">Most Cautioned Student</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Incidents table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between flex-wrap gap-2">
                <span>Incidents Reported</span>
                <div className="flex items-center gap-2 text-xs">
                  <div>
                    <label className="block text-slate-600 mb-0.5">From</label>
                    <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-0.5">To</label>
                    <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b text-slate-600">
                  <tr>
                    <th className="text-left py-2 pr-3">Date</th>
                    <th className="text-left py-2 pr-3">Student</th>
                    <th className="text-left py-2 pr-3">Category</th>
                    <th className="text-left py-2 pr-3">Severity</th>
                    <th className="text-left py-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {incidentsInRange.map((it) => (
                    <tr key={it.id} className="border-b last:border-0">
                      <td className="py-1 pr-3 whitespace-nowrap">
                        {new Date(it.occurredAt).toLocaleDateString()}
                      </td>
                      <td className="py-1 pr-3">
                        <Link
                          to={`/admin/students/${it.studentId}`}
                          className="text-blue-600 hover:underline"
                        >
                          #{it.studentId}
                        </Link>
                      </td>
                      <td className="py-1 pr-3">{it.category}</td>
                      <td className="py-1 pr-3">
                        <Badge variant="outline">{it.severity}</Badge>
                      </td>
                      <td className="py-1 max-w-xs whitespace-pre-wrap">{it.description || "—"}</td>
                    </tr>
                  ))}
                  {incidentsInRange.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-500">
                        No incidents in this date range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </Page>
  );
}
