import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Page from "@/components/layout/Page";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/state/auth.jsx";
import { getJSON, postJSON, putJSON, delJSON } from "@/lib/api.js";

const EMPTY_ADMIN_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  userName: "",
  permissionTag: "ADMIN",
};

export default function TeacherPage() {
  const navigate = useNavigate();
  const { activeDistrictId, activeSchoolId, user } = useAuth();

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
  const [promotingId, setPromotingId] = useState(null);

  // Admin creation form
  const [adminForm, setAdminForm] = useState(EMPTY_ADMIN_FORM);
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState(null);

  // Admin list
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [deletingAdminId, setDeletingAdminId] = useState(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await getJSON("/api/teachers");
      const list = [];
      for (let i = 0; i < data.length; i++) list.push(data[i]);
      setTeachers(list);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function loadAdmins() {
    setAdminsLoading(true);
    try {
      const data = await getJSON("/api/admin");
      setAdmins(Array.isArray(data) ? data : []);
    } catch (_) {
      // silently ignore
    } finally {
      setAdminsLoading(false);
    }
  }

  useEffect(() => { load(); loadAdmins(); }, []);

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
    setEditForm({ firstName: "", lastName: "", email: "", districtId: "", schoolId: "" });
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
      await putJSON(`/api/teachers/${editingId}`, payload);
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
      await delJSON(`/api/teachers/${id}`);
      await load();
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setDeletingId(null);
    }
  }

  async function promoteTeacher(id) {
    if (!window.confirm("Promote this teacher to admin? They will be removed from the teachers list.")) return;
    setPromotingId(id);
    setError("");
    try {
      await postJSON(`/api/teachers/${id}/promote-to-admin`, {});
      await load();
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setPromotingId(null);
    }
  }

  function onAdminFormChange(e) {
    const { name, value } = e.target;
    setAdminForm((prev) => ({ ...prev, [name]: value }));
  }

  async function createAdmin(e) {
    e.preventDefault();
    setAdminSaving(true);
    setAdminFeedback(null);
    try {
      const payload = {
        ...adminForm,
        districtId: activeDistrictId,
        schoolId: activeSchoolId,
      };
      await postJSON("/api/admin", payload);
      setAdminForm(EMPTY_ADMIN_FORM);
      setAdminFeedback({ type: "ok", msg: `Admin account created. Default password: Admin!2025#` });
      await loadAdmins();
    } catch (e) {
      setAdminFeedback({ type: "err", msg: String(e.message || e) });
    } finally {
      setAdminSaving(false);
    }
  }

  return (
    <Page title="Teachers" subtitle="Manage teacher accounts">
      {/* Teacher list */}
      <Card className="mb-6">
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-base">Teachers</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load}>Refresh</Button>
            <Button variant="outline" onClick={() => navigate("/admin/teacher-stats")}>Stats</Button>
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
                        <Input name="firstName" placeholder="First name" value={editForm.firstName} onChange={onEditChange} required />
                        <Input name="lastName" placeholder="Last name" value={editForm.lastName} onChange={onEditChange} required />
                      </div>
                      <Input name="email" type="email" placeholder="Email" value={editForm.email} onChange={onEditChange} required />
                      <div className="grid grid-cols-2 gap-3">
                        <Input name="districtId" type="number" placeholder="District ID" value={editForm.districtId} onChange={onEditChange} required />
                        <Input name="schoolId" type="number" placeholder="School ID" value={editForm.schoolId} onChange={onEditChange} required />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={saveEdit} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
                        <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{t.firstName} {t.lastName}</div>
                        <div className="text-sm text-muted-foreground">
                          {t.email}
                          {t.username ? <> · <span className="font-mono">{t.username}</span></> : null}
                          {t.districtId ? <> · Dist #{t.districtId}</> : null}
                          {t.schoolId ? <> · School #{t.schoolId}</> : null}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => navigate(`/admin/teachers/${t.id}`)}>View</Button>
                        <Button variant="outline" onClick={() => startEdit(t)}>Edit</Button>
                        <Button
                          variant="outline"
                          className="border-amber-300 text-amber-700 hover:bg-amber-50"
                          onClick={() => promoteTeacher(t.id)}
                          disabled={promotingId === t.id}
                        >
                          {promotingId === t.id ? "Promoting…" : "Promote to Admin"}
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

      {/* Create Admin Account */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Create Admin Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={createAdmin} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input name="firstName" placeholder="First name" value={adminForm.firstName} onChange={onAdminFormChange} required />
              <Input name="lastName" placeholder="Last name" value={adminForm.lastName} onChange={onAdminFormChange} required />
            </div>
            <Input name="email" type="email" placeholder="Email" value={adminForm.email} onChange={onAdminFormChange} required />
            <Input name="userName" placeholder="Username" value={adminForm.userName} onChange={onAdminFormChange} required />
            <Input name="permissionTag" placeholder="Permission Tag" value={adminForm.permissionTag} onChange={onAdminFormChange} required />

            {adminFeedback && (
              <div className={`rounded-lg px-3 py-2 text-sm ${adminFeedback.type === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                {adminFeedback.msg}
              </div>
            )}

            <Button type="submit" disabled={adminSaving}>
              {adminSaving ? "Creating…" : "Create Admin"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Admin list */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="text-base">Admins</CardTitle>
          <Button variant="outline" onClick={loadAdmins}>Refresh</Button>
        </CardHeader>
        <CardContent>
          {adminsLoading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : admins.length === 0 ? (
            <div className="text-sm text-slate-500">No admins found.</div>
          ) : (
            <div className="divide-y">
              {admins.map((a) => {
                const isSelf = user && a.userName === user.id;
                return (
                  <div key={a.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{a.firstName} {a.lastName}</div>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-mono">{a.userName}</span>
                        {a.email ? <> · {a.email}</> : null}
                        {a.permissionTag ? <> · {a.permissionTag}</> : null}
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      disabled={isSelf || deletingAdminId === a.id}
                      title={isSelf ? "Cannot delete your own account" : "Delete admin"}
                      onClick={async () => {
                        if (!window.confirm(`Delete admin "${a.userName}"?`)) return;
                        setDeletingAdminId(a.id);
                        try {
                          await delJSON(`/api/admin/${a.id}`);
                          await loadAdmins();
                        } catch (e) {
                          setError(String(e.message || e));
                        } finally {
                          setDeletingAdminId(null);
                        }
                      }}
                    >
                      {deletingAdminId === a.id ? "Deleting…" : isSelf ? "You" : "Delete"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </Page>
  );
}
