import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button.jsx";

// Mock students + categories for visual stub; swap with API later
const mockStudents = [
  { id: "S-10235", name: "Marcus Lee", tier: "Tier 2", interventions: ["Small group counseling", "Check-in/Check-out"] },
  { id: "S-10236", name: "Sofia Perez", tier: "Tier 3", interventions: ["One-on-one mentoring"] },
  { id: "S-10237", name: "David Chen", tier: "Tier 1", interventions: ["Classroom participation goals"] },
];
const behaviorCategories = [
  "Disruption",
  "Defiance",
  "Peer Conflict",
  "Property Misuse",
  "Safety Concern",
  "Other",
];

export default function TeacherDashboard() {
  // form state
  const [studentId, setStudentId] = useState(mockStudents[0].id);
  const [category, setCategory] = useState("Disruption");
  const [notes, setNotes] = useState("");
  const [when, setWhen] = useState(() => new Date().toISOString().slice(0, 16)); // yyyy-MM-ddTHH:mm

  // Derived: selected student and ADMIN-SET TIER (read-only)
  const student = useMemo(
    () => mockStudents.find((s) => s.id === studentId) || mockStudents[0],
    [studentId]
  );
  const tier = student.tier; // ← Admin-controlled, not editable here

  const onSaveDraft = () => {
    console.log("Draft saved", { studentId, category, tier, when, notes });
  };
  const onSubmit = () => {
    console.log("Incident submitted", { studentId, category, tier, when, notes });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-slate-50/60">
      <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        <h1 className="text-xl font-semibold text-slate-900 mb-3">Teacher Dashboard</h1>

        <Card className="shadow-sm border-slate-200/70">
          <CardHeader className="pb-0"></CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Row 1: Student / Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Student</label>
                <select
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                >
                  {mockStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} • {s.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Behavior Category</label>
                <select
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {behaviorCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Row 2: Tier (READ-ONLY) / Date & Time */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tier</label>
                <div
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700"
                  aria-readonly
                  title="Tier is set by Admin"
                >
                  {tier}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                />
              </div>

              {/* Row 3: Notes (full width) */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
                <textarea
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm h-32 resize-vertical focus:outline-none focus:ring-2 focus:ring-slate-300"
                  placeholder="What happened? What was the context?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Footer actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={onSaveDraft}>Save Draft</Button>
              <Button onClick={onSubmit}>Submit Incident</Button>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Tier is managed by Admin and cannot be changed here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
