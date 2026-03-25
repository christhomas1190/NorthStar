import React, { useEffect, useState } from "react";
import Page from "@/components/layout/Page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getJSON, postJSON, putJSON, delJSON } from "@/lib/api.js";

export default function GradebookSetupPage() {
  const [categories, setCategories] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  // Category form
  const [catForm, setCatForm] = useState({ name: "", weightPercent: "" });
  const [editingCatId, setEditingCatId] = useState(null);

  // Assignment form
  const [asgForm, setAsgForm] = useState({ name: "", subject: "", dueDate: "", maxPoints: "", categoryId: "" });
  const [editingAsgId, setEditingAsgId] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const [cats, asgs] = await Promise.all([
        getJSON("/api/gradebook/categories"),
        getJSON("/api/gradebook/assignments"),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setAssignments(Array.isArray(asgs) ? asgs : []);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  // --- categories ---
  async function saveCategory(e) {
    e.preventDefault();
    try {
      const body = { name: catForm.name, weightPercent: Number(catForm.weightPercent) };
      if (editingCatId) {
        await putJSON(`/api/gradebook/categories/${editingCatId}`, body);
      } else {
        await postJSON("/api/gradebook/categories", body);
      }
      setCatForm({ name: "", weightPercent: "" });
      setEditingCatId(null);
      await load();
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  async function deleteCategory(id) {
    if (!window.confirm("Delete this category?")) return;
    try {
      await delJSON(`/api/gradebook/categories/${id}`);
      await load();
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  // --- assignments ---
  async function saveAssignment(e) {
    e.preventDefault();
    try {
      const body = {
        name: asgForm.name,
        subject: asgForm.subject || null,
        dueDate: asgForm.dueDate || null,
        maxPoints: Number(asgForm.maxPoints),
        categoryId: Number(asgForm.categoryId),
      };
      if (editingAsgId) {
        await putJSON(`/api/gradebook/assignments/${editingAsgId}`, body);
      } else {
        await postJSON("/api/gradebook/assignments", body);
      }
      setAsgForm({ name: "", subject: "", dueDate: "", maxPoints: "", categoryId: asgForm.categoryId });
      setEditingAsgId(null);
      await load();
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  async function deleteAssignment(id) {
    if (!window.confirm("Delete this assignment?")) return;
    try {
      await delJSON(`/api/gradebook/assignments/${id}`);
      await load();
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  const totalWeight = categories.reduce((s, c) => s + (c.weightPercent || 0), 0);

  return (
    <Page title="Gradebook Setup" subtitle="Manage your categories and assignments">
      {err && (
        <div style={{ marginBottom: 16, color: "var(--ns-danger)", fontSize: 13 }}>{err}</div>
      )}

      {/* Categories */}
      <Card style={{ marginBottom: 24 }}>
        <CardHeader>
          <CardTitle className="text-base">
            Grade Categories
            <span style={{ marginLeft: 12, fontSize: 12, fontWeight: 400, color: totalWeight === 100 ? "var(--ns-success)" : "var(--ns-warning)" }}>
              Total weight: {totalWeight}%{totalWeight !== 100 ? " (should be 100%)" : " ✓"}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveCategory} style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <Input
              placeholder="Category name"
              value={catForm.name}
              onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
              className="h-8 text-sm w-40"
              required
            />
            <Input
              type="number"
              placeholder="Weight %"
              min={1}
              max={100}
              value={catForm.weightPercent}
              onChange={(e) => setCatForm((f) => ({ ...f, weightPercent: e.target.value }))}
              className="h-8 text-sm w-24"
              required
            />
            <Button size="sm" className="h-8 text-xs" type="submit">
              {editingCatId ? "Update" : "Add"}
            </Button>
            {editingCatId && (
              <Button size="sm" variant="outline" className="h-8 text-xs" type="button"
                onClick={() => { setEditingCatId(null); setCatForm({ name: "", weightPercent: "" }); }}>
                Cancel
              </Button>
            )}
          </form>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid var(--ns-border)" }}>
                <th style={th}>Name</th>
                <th style={{ ...th, textAlign: "center" }}>Weight</th>
                <th style={th} />
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid var(--ns-border)" }}>
                  <td style={td}>{c.name}</td>
                  <td style={{ ...td, textAlign: "center" }}>{c.weightPercent}%</td>
                  <td style={{ ...td }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Button size="sm" variant="outline" className="h-7 text-xs"
                        onClick={() => { setEditingCatId(c.id); setCatForm({ name: c.name, weightPercent: String(c.weightPercent) }); }}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-rose-600 border-rose-200"
                        onClick={() => deleteCategory(c.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && categories.length === 0 && (
                <tr><td colSpan={3} style={{ padding: "12px", textAlign: "center", color: "var(--ns-muted)" }}>No categories yet.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Assignments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveAssignment} style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <Input
              placeholder="Assignment name"
              value={asgForm.name}
              onChange={(e) => setAsgForm((f) => ({ ...f, name: e.target.value }))}
              className="h-8 text-sm w-44"
              required
            />
            <Input
              placeholder="Subject (optional)"
              value={asgForm.subject}
              onChange={(e) => setAsgForm((f) => ({ ...f, subject: e.target.value }))}
              className="h-8 text-sm w-32"
            />
            <Input
              type="date"
              value={asgForm.dueDate}
              onChange={(e) => setAsgForm((f) => ({ ...f, dueDate: e.target.value }))}
              className="h-8 text-sm w-36"
            />
            <Input
              type="number"
              placeholder="Max pts"
              min={1}
              value={asgForm.maxPoints}
              onChange={(e) => setAsgForm((f) => ({ ...f, maxPoints: e.target.value }))}
              className="h-8 text-sm w-24"
              required
            />
            <select
              value={asgForm.categoryId}
              onChange={(e) => setAsgForm((f) => ({ ...f, categoryId: e.target.value }))}
              required
              style={{ height: 32, padding: "0 8px", borderRadius: 6, border: "1.5px solid var(--ns-border2)", fontSize: 13, fontFamily: "'Outfit', sans-serif" }}
            >
              <option value="">Category…</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <Button size="sm" className="h-8 text-xs" type="submit">
              {editingAsgId ? "Update" : "Add"}
            </Button>
            {editingAsgId && (
              <Button size="sm" variant="outline" className="h-8 text-xs" type="button"
                onClick={() => { setEditingAsgId(null); setAsgForm({ name: "", subject: "", dueDate: "", maxPoints: "", categoryId: "" }); }}>
                Cancel
              </Button>
            )}
          </form>
          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid var(--ns-border)" }}>
                <th style={th}>Name</th>
                <th style={th}>Subject</th>
                <th style={th}>Category</th>
                <th style={{ ...th, textAlign: "center" }}>Max Pts</th>
                <th style={th}>Due</th>
                <th style={th} />
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => (
                <tr key={a.id} style={{ borderBottom: "1px solid var(--ns-border)" }}>
                  <td style={td}>{a.name}</td>
                  <td style={td}>{a.subject || "—"}</td>
                  <td style={td}>{a.categoryName || "—"}</td>
                  <td style={{ ...td, textAlign: "center" }}>{a.maxPoints}</td>
                  <td style={td}>{a.dueDate || "—"}</td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Button size="sm" variant="outline" className="h-7 text-xs"
                        onClick={() => {
                          setEditingAsgId(a.id);
                          setAsgForm({
                            name: a.name,
                            subject: a.subject || "",
                            dueDate: a.dueDate || "",
                            maxPoints: String(a.maxPoints),
                            categoryId: String(a.categoryId || ""),
                          });
                        }}>
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-rose-600 border-rose-200"
                        onClick={() => deleteAssignment(a.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && assignments.length === 0 && (
                <tr><td colSpan={6} style={{ padding: "12px", textAlign: "center", color: "var(--ns-muted)" }}>No assignments yet.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </Page>
  );
}

const th = {
  textAlign: "left",
  padding: "8px 10px",
  fontWeight: 600,
  color: "var(--ns-text2)",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};
const td = { padding: "9px 10px", color: "var(--ns-text)", verticalAlign: "middle" };
