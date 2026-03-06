import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getJSON, postJSON, delJSON } from "@/lib/api.js";

const TODAY = new Date().toISOString().slice(0, 10);

const EMPTY_FORM = {
  studentId: "",
  tier: "Tier 1",
  strategy: "",
  description: "",
  assignedBy: "",
  startDate: TODAY,
  endDate: "",
};

export default function ManageIntervention() {
  const [students, setStudents] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Load all students for the dropdown
  useEffect(() => {
    getJSON("/api/students")
      .then((d) => setStudents(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // Load all interventions on mount
  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoadingList(true);
    try {
      const data = await getJSON("/api/interventions");
      setInterventions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.studentId) {
      alert("Please select a student.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        tier: form.tier,
        strategy: form.strategy.trim(),
        description: form.description.trim(),
        assignedBy: form.assignedBy.trim(),
        startDate: form.startDate,
        endDate: form.endDate || null,
      };
      const saved = await postJSON(`/api/students/${form.studentId}/interventions`, payload);
      setInterventions((prev) => [saved, ...prev]);
      resetForm();
    } catch (err) {
      alert(err?.message || "Could not save intervention.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    if (!confirm("Delete this intervention?")) return;
    try {
      await delJSON(`/api/interventions/${id}`);
      setInterventions((prev) => prev.filter((iv) => iv.id !== id));
    } catch (e) {
      alert(e?.message || "Could not delete intervention.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle>Create Intervention</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Student selector */}
            <div>
              <label className="text-sm font-medium">Student</label>
              <select
                name="studentId"
                value={form.studentId}
                onChange={onChange}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                required
              >
                <option value="">— Select a student —</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                    {s.studentId ? ` (${s.studentId})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Tier */}
              <div>
                <label className="text-sm font-medium">Tier</label>
                <select
                  name="tier"
                  value={form.tier}
                  onChange={onChange}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm"
                >
                  <option value="Tier 1">Tier 1</option>
                  <option value="Tier 2">Tier 2</option>
                  <option value="Tier 3">Tier 3</option>
                </select>
              </div>

              {/* Assigned By */}
              <div>
                <label className="text-sm font-medium">Assigned By</label>
                <Input
                  name="assignedBy"
                  value={form.assignedBy}
                  onChange={onChange}
                  placeholder="Staff member name"
                  required
                />
              </div>
            </div>

            {/* Strategy */}
            <div>
              <label className="text-sm font-medium">Strategy</label>
              <Input
                name="strategy"
                value={form.strategy}
                onChange={onChange}
                placeholder="e.g. Check-in / Check-out, Social skills coaching…"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={onChange}
                placeholder="Detailed notes on the intervention plan…"
                rows={3}
                required
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Start Date */}
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={onChange}
                  required
                />
              </div>

              {/* End Date */}
              <div>
                <label className="text-sm font-medium">End Date (optional)</label>
                <Input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={onChange}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Create Intervention"}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm} disabled={saving}>
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* All interventions list */}
      <Card>
        <CardHeader>
          <CardTitle>All Interventions</CardTitle>
        </CardHeader>

        <CardContent>
          {loadingList ? (
            <div className="text-sm text-slate-600">Loading…</div>
          ) : interventions.length === 0 ? (
            <div className="text-sm text-slate-600">No interventions on record.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600">
                    <th className="py-2 pr-4">Student</th>
                    <th className="py-2 pr-4">Tier</th>
                    <th className="py-2 pr-4">Strategy</th>
                    <th className="py-2 pr-4">Assigned By</th>
                    <th className="py-2 pr-4">Start</th>
                    <th className="py-2 pr-4">End</th>
                    <th className="py-2 pr-4 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {interventions.map((iv) => (
                    <tr key={iv.id} className="border-t">
                      <td className="py-2 pr-4 font-medium">{iv.studentName || `Student #${iv.studentId}`}</td>
                      <td className="py-2 pr-4">{iv.tier}</td>
                      <td className="py-2 pr-4">{iv.strategy}</td>
                      <td className="py-2 pr-4">{iv.assignedBy ?? "—"}</td>
                      <td className="py-2 pr-4">{iv.startDate ?? "—"}</td>
                      <td className="py-2 pr-4">{iv.endDate ?? "—"}</td>
                      <td className="py-2 pr-4">
                        <Button variant="outline" size="sm" onClick={() => onDelete(iv.id)}>
                          Delete
                        </Button>
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
