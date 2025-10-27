// src/pages/TeacherDashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import Page from "@/components/layout/Page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getJSON, postJSON } from "@/lib/api"; // <-- use our helpers

const behaviorCategories = [
  "Disruption",
  "Defiance",
  "Peer Conflict",
  "Property Misuse",
  "Safety Concern",
  "Other",
];

const severities = ["Minor", "Major"];

function toLocalInputValue(date = new Date()) {
  // for <input type="datetime-local" />
  const off = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - off);
  return local.toISOString().slice(0, 16);
}

function localInputToUtcIso(localValue) {
  // localValue example: "2025-10-26T14:05"
  const d = new Date(localValue);
  return d.toISOString(); // UTC
}

export default function TeacherDashboard() {
  // form state
  const [studentId, setStudentId] = useState(null); // numeric DB id
  const [pickedLabel, setPickedLabel] = useState(""); // "Name • Sxxxxx"
  const [category, setCategory] = useState("Disruption");
  const [severity, setSeverity] = useState("Minor");
  const [reportedBy, setReportedBy] = useState("t_22 (Mr. Hill)");
  const [when, setWhen] = useState(() => toLocalInputValue());
  const [notes, setNotes] = useState("");

  // search state
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]); // [{id, firstName, lastName, studentId, grade}]
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(""); // lightweight feedback

  // click-outside to close suggestions
  useEffect(() => {
    const onDocClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  // debounce search
  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        // hits StudentController#list(q,..)
        const data = await getJSON(`/api/students?q=${encodeURIComponent(q.trim())}&size=10`);
        // data: List<StudentDTO>
        setResults(data || []);
      } catch (e) {
        setResults([]);
        setMsg(`Search failed: ${String(e.message || e)}`);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const tier = "—"; // (optional) if you later expose tier on StudentDTO, show it here

  function selectStudent(s) {
    setStudentId(s.id); // numeric DB id used by IncidentDTO.studentId
    setPickedLabel(`${s.firstName} ${s.lastName} • ${s.studentId}`);
    setQ("");
    setOpen(false);
  }

  async function onSubmit() {
    setMsg("");
    if (!studentId) {
      setMsg("Pick a student first.");
      return;
    }
    if (!notes.trim()) {
      setMsg("Please add a brief description of the incident.");
      return;
    }
    try {
      const body = {
        studentId,                          // Long (DB id)
        category,                           // String
        description: notes.trim(),          // String -> IncidentDTO.description
        severity,                           // "Minor" | "Major"
        reportedBy: reportedBy.trim() || "unknown",
        occurredAt: localInputToUtcIso(when),
      };
      // Option A: POST /api/incidents
      const created = await postJSON("/api/incidents", body);
      setMsg(`Incident #${created.id} saved.`);
      setNotes("");
    } catch (e) {
      setMsg(`Failed to submit: ${String(e.message || e)}`);
    }
  }

  return (
    <Page title="Teacher Dashboard" subtitle="Record incidents quickly and accurately">
      <Card className="shadow-sm border-slate-200/70">
        <CardHeader className="pb-0">
          <CardTitle className="sr-only">Record Incident</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Student search/typeahead */}
            <div className="relative" ref={boxRef}>
              <label className="block text-sm font-medium text-slate-700 mb-2">Student</label>
              <Input
                placeholder="Type a name or school ID…"
                value={q || pickedLabel}
                onChange={(e) => {
                  setPickedLabel("");
                  setStudentId(null);
                  setQ(e.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
              />
              {open && (q || loading) && (
                <div className="absolute z-20 mt-2 w-full rounded-xl border bg-white shadow max-h-72 overflow-auto">
                  {loading && (
                    <div className="px-3 py-2 text-sm text-slate-500">Searching…</div>
                  )}
                  {!loading && results.length === 0 && (
                    <div className="px-3 py-2 text-sm text-slate-500">No matches</div>
                  )}
                  {!loading &&
                    results.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                        onClick={() => selectStudent(s)}
                      >
                        {s.firstName} {s.lastName} • {s.studentId}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Behavior Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Behavior Category
              </label>
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

            {/* Severity */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Severity</label>
              <select
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                {severities.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Reported By */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Reported By</label>
              <Input
                placeholder="e.g., t_22 (Mr. Hill)"
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
              />
            </div>

            {/* Date & Time (local) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Time of Incident
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
              />
            </div>

            {/* Notes -> description */}
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
            <Button
              onClick={onSubmit}
              disabled={!studentId || !notes.trim()}
              title={!studentId ? "Pick a student first" : undefined}
            >
              Submit Incident
            </Button>
          </div>

          {msg && <p className="mt-4 text-sm text-slate-600">{msg}</p>}
          <p className="mt-4 text-xs text-slate-500">
            Tier is managed by Admin and cannot be changed here.
          </p>
        </CardContent>
      </Card>
    </Page>
  );
}
