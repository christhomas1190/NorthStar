import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Page from "@/components/layout/Page";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getJSON } from "@/lib/api.js";

export default function TeacherStatsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getJSON("/api/teachers/stats");
        const sorted = [...(Array.isArray(data) ? data : [])].sort(
          (a, b) => (b.totalCautions || 0) - (a.totalCautions || 0)
        );
        setStats(sorted);
      } catch (e) {
        setError(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Page
      title="Teacher Stats"
      subtitle="Caution counts by teacher"
      actions={
        <Button variant="outline" onClick={() => navigate("/admin/teachers")}>
          ← Teachers
        </Button>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ranked by Total Cautions</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="text-sm text-slate-500 py-4">Loading…</div>
          ) : stats.length === 0 ? (
            <div className="text-sm text-slate-500 py-4">No data yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b text-slate-600">
                <tr>
                  <th className="text-left py-2 pr-4">Rank</th>
                  <th className="text-left py-2 pr-4">Teacher</th>
                  <th className="text-left py-2 pr-4">Username</th>
                  <th className="text-left py-2 pr-4">Total Cautions</th>
                  <th className="text-left py-2 pr-4">Top Category</th>
                  <th className="text-left py-2 pr-4">Most Cautioned Student</th>
                  <th className="text-left py-2"></th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s, idx) => (
                  <tr key={s.teacherId} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2 pr-4 text-slate-500">{idx + 1}</td>
                    <td className="py-2 pr-4 font-medium">
                      <Link
                        to={`/admin/teachers/${s.teacherId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {s.teacherName}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs text-slate-600">
                      {s.userName}
                    </td>
                    <td className="py-2 pr-4 font-semibold">{s.totalCautions}</td>
                    <td className="py-2 pr-4">
                      {s.mostCommonCategory ? (
                        <span>
                          {s.mostCommonCategory}{" "}
                          <span className="text-slate-500 text-xs">
                            ({s.mostCommonCategoryCount})
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-4">
                      {s.mostCautionedStudentId ? (
                        <Link
                          to={`/admin/students/${s.mostCautionedStudentId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {s.mostCautionedStudentName}{" "}
                          <span className="text-slate-500 text-xs">
                            ({s.mostCautionedStudentCount})
                          </span>
                        </Link>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/teachers/${s.teacherId}`)}
                      >
                        View
                      </Button>
                    </td>
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
