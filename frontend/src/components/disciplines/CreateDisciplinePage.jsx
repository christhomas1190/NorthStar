import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function CreateDisciplinePage() {
  const { studentId } = useParams();
  const districtId = Number(localStorage.getItem("districtId")) || 1;

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [form, setForm] = useState({
    tier: "TIER_1",
    strategy: "",
    description: "",
    assignedBy: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
  });

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  const canSubmit = useMemo(() => {
    if (!studentId) return false;
    if (!form.strategy.trim()) return false;
    if (!form.description.trim()) return false;
    if (!form.assignedBy.trim()) return false;
    if (!form.startDate) return false;
    return true;
  }, [form, studentId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setSuccessMessage("");

    try {
      const payload = {
        tier: form.tier.trim(),
        strategy: form.strategy.trim(),
        description: form.description.trim(),
        assignedBy: form.assignedBy.trim(),
        startDate: form.startDate,
        endDate: form.endDate || null,
        createdAt: null,
      };

      const res = await fetch(`/api/students/${studentId}/interventions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-District-Id": districtId,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Failed to create discipline (HTTP ${res.status}): ${msg}`);
      }

      setSuccessMessage("Intervention created successfully.");

      setForm((f) => ({
        ...f,
        strategy: "",
        description: "",
        endDate: "",
      }));
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to create discipline.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Discipline / Intervention</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {successMessage && (
            <div className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="text-sm font-medium">Strategy</label>
              <Input
                name="strategy"
                value={form.strategy}
                onChange={onChange}
                placeholder="Check-in / Check-out"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description / Notes</label>
              <Textarea
                name="description"
                value={form.description}
                onChange={onChange}
                placeholder="Describe the discipline, expectations, and follow-up…"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium">Assigned By</label>
              <Input
                name="assignedBy"
                value={form.assignedBy}
                onChange={onChange}
                placeholder="Admin name"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <Button type="submit" disabled={saving || !canSubmit}>
                {saving ? "Saving…" : "Create"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
