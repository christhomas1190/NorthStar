import React, { useMemo, useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast.jsx";
import Page from "@/components/layout/Page";

// Mock students for now; replace with API later
const mockStudents = [
  { id: "S-10235", name: "Marcus Lee",  tier: "Tier 2", interventions: ["Small group counseling", "Check-in/Check-out"] },
  { id: "S-10236", name: "Sofia Perez", tier: "Tier 3", interventions: ["One-on-one mentoring"] },
  { id: "S-10237", name: "David Chen",  tier: "Tier 1", interventions: ["Classroom participation goals"] },
  { id: "S-10238", name: "Ariana Rivera", tier: "Tier 2", interventions: ["Seat change", "Positive reinforcement plan"] },
];

const behaviorCategories = ["Disruption", "Defiance", "Peer Conflict", "Property Misuse", "Safety Concern", "Other"];

function toLocalInputValue(date = new Date()) {
  const tzOffsetMs = date.getTimezoneOffset() * 60_000;
  const local = new Date(date.getTime() - tzOffsetMs);
  return local.toISOString().slice(0, 16);
}

export default function TeacherDashboard() {
const { push } = useToast();
if (!student) return push("Pick a student first");
push("Draft saved");

  // form state
  const [studentId, setStudentId] = useState("");
  const [category, setCategory] = useState("Disruption");
  const [when, setWhen] = useState(() => toLocalInputValue());
  const [notes, setNotes] = useState("");

  // typeahead state
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setShowResults(false);
    }
    function onKey(e) { if (e.key === "Escape") setShowResults(false); }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // filter results as user types
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return mockStudents.filter(
      (s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
    );
  }, [query]);

  // selected student + admin-controlled tier (read-only)
  const student = useMemo(() => mockStudents.find((s) => s.id === studentId) || null, [studentId]);
  const tier = student ? student.tier : "—";

  function selectStudent(s) {
    setStudentId(s.id);
    setQuery(`${s.name} • ${s.id}`);
    setShowResults(false);
  }

  function onSaveDraft() {
    if (!student) return toast({ description: "Pick a student first" });
    // TODO: POST /incidents/drafts
    toast({ description: "Draft saved" });
  }

  function onSubmit() {
    if (!student) return toast({ description: "Pick a student first" });
    // TODO: POST /incidents
    toast({ description: "Incident submitted" });
    setNotes("");
  }

  return (
     <Page title="Teacher Dashboard" subtitle="Record incidents quickly and accurately">
         <Card className="shadow-sm border-slate-200/70">
          <CardHeader className="pb-0">
            <CardTitle className="sr-only">Record Incident</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Student (typeahead) */}
              <div className="relative" ref={boxRef}>
                <label className="block text-sm font-medium text-slate-700 mb-2">Student</label>
                <Input
                  placeholder="Type a name or student ID…"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowResults(true);
                    setStudentId(""); // clear selection until suggestion is chosen
                  }}
                  onFocus={() => setShowResults(true)}
                />
                {showResults && results.length > 0 && (
                  <div className="absolute z-20 mt-2 w-full rounded-xl border bg-white shadow">
                    {results.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                        onClick={() => selectStudent(s)}
                      >
                        {s.name} • {s.id}
                      </button>
                    ))}
                  </div>
                )}
                {showResults && query && results.length === 0 && (
                  <div className="absolute z-20 mt-2 w-full rounded-xl border bg-white shadow px-3 py-2 text-sm text-slate-500">
                    No matches
                  </div>
                )}
              </div>

              {/* Behavior Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Behavior Category</label>
                <select
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {behaviorCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tier (read-only, admin-controlled) */}
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

              {/* Date & Time */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date & Time</label>
                <input
                  type="datetime-local"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                />
              </div>

              {/* Notes */}
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

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={onSaveDraft}>
                Save Draft
              </Button>
              <Button onClick={onSubmit} disabled={!student}>
                Submit Incident
              </Button>
            </div>

            <p className="mt-4 text-xs text-slate-500">Tier is managed by Admin and cannot be changed here.</p>
          </CardContent>
        </Card>
    </Page>
  );
}
