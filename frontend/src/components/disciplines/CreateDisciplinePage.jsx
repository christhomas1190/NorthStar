import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import SearchableStudentSelect from "@/components/common/SearchableStudentSelect";
import { useAuth } from "@/state/auth.jsx";

export default function CreateDisciplinePage() {
  const { activeDistrictId } = useAuth();

  const params = useParams();
  const [sp, setSp] = useSearchParams();

  // studentId can come from:
  // 1) a param route (if you ever use /admin/disciplines/new/:studentId)
  // 2) query string (?studentId=123)
  const studentIdFromUrl = params.studentId ?? sp.get("studentId") ?? "";

  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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

  // ✅ load students only if we need the picker
  useEffect(() => {
    if (!activeDistrictId) return;

    // If studentId is already known, don't fetch the student list
    if (studentIdFromUrl) return;

    let alive = true;

    (async () => {
      try {
        const res = await fetch("/api/students", {
          headers: {
            "X-District-Id": String(activeDistrictId),
            "Content-Type": "application/json",
          },
        });

        const json = res.ok ? await res.json() : [];
        if (!alive) return;

        setStudents(Array.isArray(json) ? json : []);
      } catch (e) {
        if (!alive) return;
        setErrorMessage(String(e.message || e));
      }
    })();

    return () => {
      alive = false;
    };
  }, [activeDistrictId, studentIdFromUrl]);

  // ✅ if they pick a student, put it into the URL so the "header behavior" stays consistent
  function onPickStudent(s) {
    setSelectedStudent(s);
    setSp((prev) => {
      const next = new URLSearchParams(prev);
      next.set("studentId", String(s.id));
      return next;
    });
  }

  const effectiveStudentId = studentIdFromUrl || (selectedStudent?.id ? String(selectedStudent.id) : "");

  const canSubmit = useMemo(() => {
    if (!effectiveStudentId) return false;
    if (!form.strategy.trim()) return false;
    if (!form.description.trim()) return false;
    if (!form.assignedBy.trim()) return false;
    if (!form.startDate) return false;
    return true;
  }, [form, effectiveStudentId]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

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

      const res = await fetch(`/api/students/${effectiveStudentId}/interventions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-District-Id": String(activeDistrictId),
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
      setErrorMessage(err?.message || "Failed to create discipline.");
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

          {errorMessage && (
            <div className="rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {errorMessage}
            </div>
          )}

          {/* ✅ SHOW ONLY when coming from AdminDashboard Discipline tab (no studentId in URL) */}
          {!studentIdFromUrl && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Student</label>
              <SearchableStudentSelect
                students={students}
                value={selectedStudent}
                onChange={onPickStudent}
                placeholder="Search student name…"
              />
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
                <Input type="date" name="endDate" value={form.endDate} onChange={onChange} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving || !canSubmit}>
                {saving ? "Saving…" : "Create"}
              </Button>

              {!effectiveStudentId ? (
                <span className="text-xs text-slate-500">Select a student to enable Create.</span>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
