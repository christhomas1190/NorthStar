import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useAuth } from "@/state/auth.jsx";

export default function CreateDisciplinePage() {
  const nav = useNavigate();
  const { activeDistrictId, activeSchoolId } = useAuth();

  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentsError, setStudentsError] = useState("");

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [form, setForm] = useState({
    tier: "",
    strategy: "",
    description: "",
    assignedBy: "",
    startDate: "",
    endDate: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Load students for current district + school
  useEffect(() => {
    if (!activeDistrictId || !activeSchoolId) {
      setLoadingStudents(false);
      setStudentsError(
        "Select a district and school before creating a discipline."
      );
      setStudents([]);
      setSelectedStudentId("");
      return;
    }

    let alive = true;

    (async () => {
      setLoadingStudents(true);
      setStudentsError("");
      try {
        const res = await fetch(`/api/schools/${activeSchoolId}/students`, {
          headers: {
            "X-District-Id": String(activeDistrictId),
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to load students (HTTP ${res.status})`);
        }

        const data = await res.json();
        if (!alive) return;

        const list = Array.isArray(data) ? data : [];
        setStudents(list);

        if (list.length > 0) {
          setSelectedStudentId(String(list[0].id));
        } else {
          setSelectedStudentId("");
        }
      } catch (err) {
        if (!alive) return;
        setStudentsError(String(err.message || err));
      } finally {
        if (alive) setLoadingStudents(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [activeDistrictId, activeSchoolId]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      if (!activeDistrictId || !activeSchoolId) {
        throw new Error("Missing district or school. Select both first.");
      }

      if (!selectedStudentId) {
        throw new Error("Please select a student.");
      }

      const res = await fetch(
        `/api/students/${selectedStudentId}/interventions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-District-Id": String(activeDistrictId),
          },
          body: JSON.stringify({
            tier: form.tier || null,
            strategy: form.strategy || null,
            description: form.description || null,
            assignedBy: form.assignedBy || null,
            startDate: form.startDate || null,
            endDate: form.endDate || null,
          }),
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to create discipline (HTTP ${res.status})`);
      }

      nav(`/admin/students/${selectedStudentId}`);
    } catch (err) {
      console.error(err);
      setError(String(err.message || err));
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    nav("/admin");
  }

  const missingContext = !activeDistrictId || !activeSchoolId;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Create Discipline / Intervention
          </CardTitle>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 text-sm">
            {/* Student selector */}
            <div>
              <label className="block font-medium mb-1">Student</label>

              {missingContext && (
                <p className="text-xs text-red-600 mb-1">
                  Select a district and school in the header before creating a
                  discipline.
                </p>
              )}

              {studentsError && !missingContext && (
                <p className="text-xs text-red-600 mb-1">
                  {studentsError}
                </p>
              )}

              {loadingStudents && !missingContext ? (
                <p className="text-xs text-slate-500">Loading students…</p>
              ) : !missingContext && students.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No students found for this school.
                </p>
              ) : !missingContext ? (
                <select
                  className="w-full text-sm border rounded-md px-2 py-1.5"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  <option value="" disabled>
                    Select a student…
                  </option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} (ID: {s.id})
                    </option>
                  ))}
                </select>
              ) : null}
            </div>

            {error && (
              <p className="text-xs text-red-600">
                {error}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Tier</label>
                <Input
                  name="tier"
                  value={form.tier}
                  onChange={handleChange}
                  placeholder="1, 2, 3..."
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Assigned By</label>
                <Input
                  name="assignedBy"
                  value={form.assignedBy}
                  onChange={handleChange}
                  placeholder="Admin / Dean name"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1">
                Strategy / Intervention
              </label>
              <Input
                name="strategy"
                value={form.strategy}
                onChange={handleChange}
                placeholder="Check-in/check-out, small group counseling..."
              />
            </div>

            <div>
              <label className="block font-medium mb-1">
                Description / Notes
              </label>
              <Textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="Add context, goals, and any important details..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Start Date</label>
                <Input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block font-medium mb-1">End Date</label>
                <Input
                  type="date"
                  name="endDate"
                  value={form.endDate}
                  onChange={handleChange}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                submitting || loadingStudents || missingContext || !selectedStudentId
              }
            >
              {submitting ? "Saving..." : "Save Discipline"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
