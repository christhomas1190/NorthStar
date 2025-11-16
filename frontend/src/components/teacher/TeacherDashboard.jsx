import React, { useEffect, useRef, useState, useMemo } from "react";
import Page from "@/components/layout/Page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getJSON, postJSON } from "@/lib/api";
import { useAuth } from "@/state/auth.jsx";

const behaviorCategories = [
  "Disruption",
  "Defiance",
  "Peer Conflict",
  "Property Misuse",
  "Safety Concern",
  "Other",
];

const severities = ["Minor", "Major"];

// For <input type="datetime-local" />
function toLocalInputValue(date = new Date()) {
  const off = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - off);
  return local.toISOString().slice(0, 16);
}

// Convert local input value back to UTC ISO for the API
function localInputToUtcIso(localValue) {
  const d = new Date(localValue);
  return d.toISOString();
}

// Build a "reportedBy" value from the logged-in account (username-style)
function deriveReportedBy(user) {
  if (!user) return "";

  // Prefer explicit username-like fields
  let username =
    user.username ||
    user.userName ||
    null;

  // Fall back to email local-part if present
  if (!username && user.email) {
    username = String(user.email).split("@")[0];
  }

  // Last resort: name/fullName
  if (!username) {
    username = user.name || user.fullName || "";
  }

  return String(username).trim(); // e.g. "cthomas"
}

export default function TeacherDashboard() {
  const { user } = useAuth();

  // ---- form state ----
  const [studentId, setStudentId] = useState(null); // numeric DB id
  const [pickedLabel, setPickedLabel] = useState(""); // readonly label like "Name • Sxxxxx"
  const [category, setCategory] = useState("Disruption");
  const [severity, setSeverity] = useState("Minor");
  const [reportedBy, setReportedBy] = useState(() => deriveReportedBy(user));
  const [when, setWhen] = useState(() => toLocalInputValue());
  const [notes, setNotes] = useState("");

  // ---- search state ----
  const [q, setQ] = useState("");
  const [students, setStudents] = useState([]); // full list from backend
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // ---- UX state ----
  const [msg, setMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const boxRef = useRef(null);

  // keep reportedBy in sync with current user if it's empty
  useEffect(() => {
    const next = deriveReportedBy(user);
    if (!next) return;
    setReportedBy((prev) => prev || next);
  }, [user]);

  // Close typeahead on click-outside or ESC
  useEffect(() => {
    function onDocClick(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    function onEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  // Load all students once; filter client-side (case-insensitive)
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await getJSON("/api/students");
        if (!alive) return;
        setStudents(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setMsg(`Could not load students: ${String(e.message || e)}`);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Case-insensitive filtering by name or ID
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return students
      .filter((s) => {
        const first = (s.firstName || "").toLowerCase();
        const last = (s.lastName || "").toLowerCase();
        const full = `${first} ${last}`.trim();
        const schoolId = String(s.studentId || "").toLowerCase();
        const dbId = String(s.id || "").toLowerCase();

        return (
          first.includes(term) ||
          last.includes(term) ||
          full.includes(term) ||
          schoolId.includes(term) ||
          dbId.includes(term)
        );
      })
      .slice(0, 10); // cap suggestions
  }, [q, students]);

  // Auto-clear feedback after a moment
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 4000);
    return () => clearTimeout(t);
  }, [msg]);

  const tier = "—";

  function selectStudent(s) {
    setStudentId(s.id);
    setPickedLabel(`${s.firstName} ${s.lastName} • ${s.studentId}`);
    setQ("");
    setOpen(false);
  }

  function resetForm() {
    setStudentId(null);
    setPickedLabel("");
    setCategory("Disruption");
    setSeverity("Minor");
    setReportedBy(deriveReportedBy(user));
    setWhen(toLocalInputValue());
    setNotes("");
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
    setSubmitting(true);
    try {
      const fallbackReporter = deriveReportedBy(user) || "unknown";
      const body = {
        studentId,
        category,
        description: notes.trim(),
        severity,
        reportedBy: reportedBy.trim() || fallbackReporter,
        occurredAt: localInputToUtcIso(when),
      };
      const created = await postJSON("/api/incidents", body);
      setMsg(`Incident #${created.id} saved.`);
      resetForm();
    } catch (e) {
      setMsg(`Failed to submit: ${String(e.message || e)}`);
    } finally {
      setSubmitting(false);
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
                    <div className="px-3 py-2 text-sm text-slate-500">Loading students…</div>
                  )}
                  {!loading && q && results.length === 0 && (
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
                placeholder="e.g., auto-filled from your account"
                value={reportedBy}
                onChange={(e) => setReportedBy(e.target.value)}
              />
            </div>

            {/* Time of Incident */}
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
            <Button
              onClick={onSubmit}
              disabled={submitting || !studentId || !notes.trim()}
              title={!studentId ? "Pick a student first" : undefined}
            >
              {submitting ? "Saving..." : "Submit Incident"}
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
