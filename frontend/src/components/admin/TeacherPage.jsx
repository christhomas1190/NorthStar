import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Page from "@/components/layout/Page";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/state/auth.jsx";

export default function TeacherPage() {
  const navigate = useNavigate();
  const { activeDistrictId, activeSchoolId } = useAuth();

  // ---- student search state ----
  const [q, setQ] = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  // ---- existing teacher management state ----
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    districtId: "",
    schoolId: "",
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // ---------- Student search logic ----------
  async function searchStudents(query) {
    if (!activeDistrictId) {
      setSearchError("Select a district first.");
      setStudentResults([]);
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setStudentResults([]);
      setSearchError("");
      return;
    }

    setSearchLoading(true);
    setSearchError("");
    try {
      const res = await fetch(
        `/api/students?q=${encodeURIComponent(trimmed)}&size=10`,
        {
          headers: {
            "X-District-Id": String(activeDistrictId),
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.ok) {
        throw new Error(`Failed to search students (${res.status})`);
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setStudentResults(list);
    } catch (e) {
      setStudentResults([]);
      setSearchError(String(e.message || e));
    } finally {
      setSearchLoading(false);
    }
  }

  function onSearchChange(e) {
    const value = e.target.value;
    setQ(value);
    searchStudents(value);
  }

  function onPickStudent(s) {
    navigate(`/admin/students/${s.id}`); // numeric DB id
  }

  // ---------- Existing teacher management logic ----------
  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/teachers");
      if (!res.ok) throw new Error(`Failed to load teachers (${res.status})`);
      const data = await res.json();
      const list = [];
      for (let i = 0; i < data.length; i++) list.push(data[i]);
      setTeachers(list);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(t) {
    setEditingId(t.id);
    setEditForm({
      firstName: t.firstName || "",
      lastName: t.lastName || "",
      email: t.email || "",
      districtId: t.districtId ?? activeDistrictId ?? "",
      schoolId: t.schoolId ?? activeSchoolId ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({
      firstName: "",
      lastName: "",
      email: "",
      districtId: "",
      schoolId: "",
    });
  }

  function onEditChange(e) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim(),
        districtId: Number(editForm.districtId),
        schoolId: Number(editForm.schoolId),
      };

      const res = await fetch(`/api/teachers/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok)
        throw new Error((await res.text()) || `Failed to save (${res.status})`);
      await load();
      cancelEdit();
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setSaving(false);
    }
  }

  async function removeTeacher(id) {
    setDeletingId(id);
    setError("");
    try {
      const res = await fetch(`/api/teachers/${id}`, { method: "DELETE" });
      if (!res.ok)
        throw new Error((await res.text()) || `Failed to delete (${res.status})`);
      await load();
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Page
      title="Teacher Tools"
      subtitle="Search students and manage teacher accounts"
    >
      {/* --- Centered student search card --- */}
      <Card className="mb-8 max-w-xl mx-auto mt-4">
        <CardHeader>
          <CardTitle className="text-base text-center">Find a Student</CardTitle>
        </CardHeader>
        <CardContent>
          {searchError && (
            <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
              {searchError}
            </div>
          )}

          <div className="max-w-xl mx-auto">
            <label className="block text-sm font-medium text-slate-700 mb-1 text-center">
              Search by name or student ID
            </label>
            <Input
              placeholder="Start typing a student name or ID…"
              value={q}
              onChange={onSearchChange}
            />
          </div>

          <div className="mt-3 text-xs text-slate-500 text-center">
            Type at least 2 characters. Click a student to open their detail page.
          </div>

          <div className="mt-4 border rounded-lg max-h-64 overflow-auto">
            {searchLoading && (
              <div className="px-3 py-2 text-sm text-slate-500">Searching…</div>
            )}
            {!searchLoading && studentResults.length === 0 && q.trim().length >= 2 && (
              <div className="px-3 py-2 text-sm text-slate-500">
                No students found for “{q.trim()}”.
              </div>
            )}
            {!searchLoading &&
              studentResults.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b last:border-b-0"
                  onClick={() => onPickStudent(s)}
                >
                  <div className="font-medium">
                    {s.firstName} {s.lastName}
                  </div>
                  <div className="text-xs text-slate-500">
                    Student ID: {s.studentId ?? "—"}
                    {s.grade ? <> · Grade {s.grade}</> : null}
                  </div>
                </button>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* --- Existing teacher management card --- */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-base">Teachers</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load}>
              Refresh
            </Button>
            <Button onClick={() => navigate("/admin/teachers/new")}>
              + Add Teacher
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : teachers.length === 0 ? (
            <div className="text-sm text-slate-500">
              No teachers yet. Click <b>+ Add Teacher</b> to create one.
            </div>
          ) : (
            <div className="divide-y">
              {teachers.map((t) => (
                <div key={t.id} className="py-3">
                  {editingId === t.id ? (
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          name="firstName"
                          placeholder="First name"
                          value={editForm.firstName}
                          onChange={onEditChange}
                          required
                        />
                        <Input
                          name="lastName"
                          placeholder="Last name"
                          value={editForm.lastName}
                          onChange={onEditChange}
                          required
                        />
                      </div>
                      <Input
                        name="email"
                        type="email"
                        placeholder="Email"
                        value={editForm.email}
                        onChange={onEditChange}
                        required
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          name="districtId"
                          type="number"
                          placeholder="District ID"
                          value={editForm.districtId}
                          onChange={onEditChange}
                          required
                        />
                        <Input
                          name="schoolId"
                          type="number"
                          placeholder="School ID"
                          value={editForm.schoolId}
                          onChange={onEditChange}
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={saveEdit} disabled={saving}>
                          {saving ? "Saving..." : "Save"}
                        </Button>
                        <Button variant="outline" onClick={cancelEdit}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {t.firstName} {t.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t.email}
                          {t.username ? (
                            <>
                              {" "}
                              · <span className="font-mono">{t.username}</span>
                            </>
                          ) : null}
                          {t.districtId ? <> · Dist #{t.districtId}</> : null}
                          {t.schoolId ? <> · School #{t.schoolId}</> : null}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => startEdit(t)}>
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => removeTeacher(t.id)}
                          disabled={deletingId === t.id}
                        >
                          {deletingId === t.id ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Page>
  );
}
