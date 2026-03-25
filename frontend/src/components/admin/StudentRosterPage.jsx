import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Page from "@/components/layout/Page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/state/auth.jsx";
import { getJSON, putJSON, delJSON } from "@/lib/api.js";
import AcademicStatusBadge from "@/components/common/AcademicStatusBadge.jsx";

export default function StudentRosterPage() {
  const { activeDistrictId, user } = useAuth();
  const canEdit = user?.role === "Admin";

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", grade: "" });

  async function loadStudents() {
    setLoading(true);
    setErr("");
    try {
      const data = await getJSON("/api/students");
      setStudents(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!activeDistrictId) return;
    loadStudents();
  }, [activeDistrictId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return students;
    return students.filter((s) => {
      const name = `${s.firstName || ""} ${s.lastName || ""}`.toLowerCase();
      const sid = (s.studentId || "").toLowerCase();
      return name.includes(q) || sid.includes(q);
    });
  }, [students, search]);

  function startEdit(s) {
    setEditingId(s.id);
    setEditForm({ firstName: s.firstName || "", lastName: s.lastName || "", grade: s.grade || "" });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(s) {
    try {
      await putJSON(`/api/students/${s.id}`, {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        grade: editForm.grade,
        districtId: activeDistrictId,
        schoolId: s.schoolId,
      });
      setEditingId(null);
      await loadStudents();
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  async function handleDelete(s) {
    if (!window.confirm(`Delete ${s.firstName} ${s.lastName}? This cannot be undone.`)) return;
    try {
      await delJSON(`/api/students/${s.id}`);
      await loadStudents();
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  return (
    <Page title="Students" subtitle="All enrolled students">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Student Roster</span>
            <Input
              placeholder="Search by name or student ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 h-8 text-sm"
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {err && (
            <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
              {err}
            </div>
          )}
          <table className="w-full text-sm">
            <thead className="border-b text-slate-600">
              <tr>
                <th className="text-left py-2 pr-4">Name</th>
                <th className="text-left py-2 pr-4">Grade</th>
                <th className="text-left py-2 pr-4">Student ID</th>
                {user?.hasAcademicTrend && <th className="text-left py-2 pr-4">Academic Status</th>}
                {canEdit && <th className="text-left py-2">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={(canEdit ? 4 : 3) + (user?.hasAcademicTrend ? 1 : 0)} className="py-4 text-center text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={(canEdit ? 4 : 3) + (user?.hasAcademicTrend ? 1 : 0)} className="py-4 text-center text-slate-500">
                    No students found.
                  </td>
                </tr>
              )}
              {filtered.map((s) =>
                editingId === s.id ? (
                  <tr key={s.id} className="border-b last:border-0 bg-slate-50">
                    <td className="py-2 pr-4">
                      <div className="flex gap-2">
                        <Input
                          value={editForm.firstName}
                          onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                          placeholder="First name"
                          className="h-7 text-xs w-28"
                        />
                        <Input
                          value={editForm.lastName}
                          onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                          placeholder="Last name"
                          className="h-7 text-xs w-28"
                        />
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      <Input
                        value={editForm.grade}
                        onChange={(e) => setEditForm((f) => ({ ...f, grade: e.target.value }))}
                        placeholder="Grade"
                        className="h-7 text-xs w-20"
                      />
                    </td>
                    <td className="py-2 pr-4 text-slate-500 text-xs">{s.studentId || "—"}</td>
                    {user?.hasAcademicTrend && <td className="py-2 pr-4">—</td>}
                    <td className="py-2">
                      <div className="flex gap-2">
                        <Button size="sm" className="h-7 text-xs" onClick={() => saveEdit(s)}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-slate-50">
                    <td className="py-2 pr-4">
                      <Link
                        to={`/admin/students/${s.id}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {s.firstName} {s.lastName}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">{s.grade || "—"}</td>
                    <td className="py-2 pr-4 text-slate-500">{s.studentId || "—"}</td>
                    {user?.hasAcademicTrend && (
                      <td className="py-2 pr-4">
                        <AcademicStatusBadge status={s.academicStatus} />
                      </td>
                    )}
                    {canEdit && (
                      <td className="py-2">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => startEdit(s)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                            onClick={() => handleDelete(s)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              )}
            </tbody>
          </table>
          {!loading && (
            <div className="mt-3 text-xs text-slate-500">
              {filtered.length} of {students.length} student{students.length !== 1 ? "s" : ""}
            </div>
          )}
        </CardContent>
      </Card>
    </Page>
  );
}
