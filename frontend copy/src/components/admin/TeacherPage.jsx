import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Page from "@/components/layout/Page";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function TeacherPage() {
  const navigate = useNavigate();

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ firstName: "", lastName: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/teachers");
      if (!res.ok) throw new Error(`Failed to load teachers (${res.status})`);
      const data = await res.json();
      const list = [];
      for (let i = 0; i < data.length; i++) {
        list.push(data[i]);
      }
      setTeachers(list);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function startEdit(t) {
    setEditingId(t.id);
    setEditForm({
      firstName: t.firstName || "",
      lastName: t.lastName || "",
      email: t.email || "",
    });
  }
  function cancelEdit() {
    setEditingId(null);
    setEditForm({ firstName: "", lastName: "", email: "" });
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
      const res = await fetch(`/api/teachers/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error((await res.text()) || `Failed to save (${res.status})`);
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
      if (!res.ok) throw new Error((await res.text()) || `Failed to delete (${res.status})`);
      await load();
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Page title="Teachers" subtitle="Manage teacher accounts">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-base">Teachers</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load}>Refresh</Button>
            <Button onClick={() => navigate("/admin/teachers/new")}>+ Add Teacher</Button>
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
                          {t.username ? <> · <span className="font-mono">{t.username}</span></> : null}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => startEdit(t)}>Edit</Button>
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
