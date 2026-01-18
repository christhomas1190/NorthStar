import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DefineBehaviorCategories() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    severity: "MINOR",
    tier: "TIER_1",
    description: "",
    schoolId: Number(localStorage.getItem("schoolId")) || 1,

  });

  const BASE_URL = "/api/behavior-categories";
  const districtId = Number(localStorage.getItem("districtId")) || 1;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(BASE_URL, {
          headers: {
            "X-District-Id": districtId,
          },
        });

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(`Load failed (${res.status}): ${msg}`);
        }

        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        alert("Failed to load behavior categories.");
      } finally {
        setLoading(false);
      }
    })();
  }, [districtId]);

  function resetForm() {
    setEditId(null);
    setForm({
      name: "",
      severity: "MINOR",
      tier: "TIER_1",
      description: "",
      schoolId: Number(localStorage.getItem("schoolId")) || 1,

    });
  }

  function onChange(e) {
    const { name, value, type } = e.target;
    setForm((f) => ({
      ...f,
      [name]: type === "number" ? Number(value) : value,
    }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const method = editId ? "PUT" : "POST";
      const url = editId ? `${BASE_URL}/${editId}` : BASE_URL;

      const payload = {
        name: form.name.trim(),
        severity: form.severity,
        tier: form.tier,
        description: form.description?.trim() || "",
        schoolId: Number(form.schoolId),
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "X-District-Id": districtId,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Save failed (${res.status}): ${msg}`);
      }

      const saved = await res.json();

      setItems((prev) => {
        if (editId) return prev.map((it) => (it.id === editId ? saved : it));
        return [saved, ...prev];
      });

      resetForm();
      alert("Behavior category saved.");
    } catch (err) {
      console.error(err);
      alert(err?.message || "Could not save behavior category.");
    } finally {
      setSaving(false);
    }
  }

  function onEdit(item) {
    setEditId(item.id);
    setForm({
      name: item.name ?? "",
      severity: item.severity ?? "MINOR",
      tier: item.tier ?? "TIER_1",
      description: item.description ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onDelete(id) {
    if (!confirm("Delete this behavior category?")) return;

    try {
      const res = await fetch(`${BASE_URL}/${id}`, {
        method: "DELETE",
        headers: {
          "X-District-Id": districtId,
        },
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Delete failed (${res.status}): ${msg}`);
      }

      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (e) {
      console.error(e);
      alert(e?.message || "Could not delete behavior category.");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {editId ? "Edit Behavior Category" : "Create Behavior Category"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="Disruption"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">School Id</label>
              <Input
                name="schoolId"
                type="number"
                value={form.schoolId}
                onChange={onChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium">Severity</label>
                <select
                  name="severity"
                  value={form.severity}
                  onChange={onChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="MINOR">Minor</option>
                  <option value="MAJOR">Major</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Tier</label>
                <select
                  name="tier"
                  value={form.tier}
                  onChange={onChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="TIER_1">Tier 1</option>
                  <option value="TIER_2">Tier 2</option>
                  <option value="TIER_3">Tier 3</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  placeholder="Short guidance for staff…"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editId ? "Update Category" : "Create Category"}
              </Button>

              {editId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel Edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Behavior Categories</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-sm text-slate-600">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-slate-600">No categories yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Severity</th>
                    <th className="py-2 pr-4">Tier</th>
                    <th className="py-2 pr-4">Description</th>
                    <th className="py-2 pr-4 w-40">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-t">
                      <td className="py-2 pr-4">{it.name}</td>
                      <td className="py-2 pr-4">{it.severity}</td>
                      <td className="py-2 pr-4">{it.tier}</td>
                      <td className="py-2 pr-4">{it.description}</td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => onEdit(it)}>
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => onDelete(it.id)}>
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
