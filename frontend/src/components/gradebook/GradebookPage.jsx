import React, { useEffect, useState, useMemo } from "react";
import Page from "@/components/layout/Page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getJSON } from "@/lib/api.js";
import { useAuth } from "@/state/auth.jsx";
import GradeCell from "./GradeCell.jsx";

export default function GradebookPage() {
  const { activeDistrictId } = useAuth();
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [summary, setSummary] = useState([]);
  const [grades, setGrades] = useState({}); // { studentId_assignmentId: GradeDTO }
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [studentGrades, setStudentGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!activeDistrictId) return;
    load();
  }, [activeDistrictId]);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const [studs, asgs, summ] = await Promise.all([
        getJSON("/api/students").catch(() => []),
        getJSON("/api/gradebook/assignments").catch(() => []),
        getJSON("/api/gradebook/summary").catch(() => []),
      ]);
      setStudents(Array.isArray(studs) ? studs : []);
      setAssignments(Array.isArray(asgs) ? asgs : []);
      setSummary(Array.isArray(summ) ? summ : []);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function selectStudent(studentId) {
    setSelectedStudentId(studentId);
    try {
      const gs = await getJSON(`/api/gradebook/students/${studentId}/grades`);
      setStudentGrades(Array.isArray(gs) ? gs : []);
    } catch {
      setStudentGrades([]);
    }
  }

  function handleGradeSaved(studentId, assignmentId, gradeDto) {
    setStudentGrades((prev) => {
      const idx = prev.findIndex((g) => g.assignmentId === assignmentId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = gradeDto;
        return next;
      }
      return [...prev, gradeDto];
    });
    // refresh summary
    getJSON("/api/gradebook/summary").then((s) => setSummary(Array.isArray(s) ? s : [])).catch(() => {});
  }

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const studentSummary = summary.find((s) => s.studentId === selectedStudentId);

  // Group assignments by category
  const byCategory = useMemo(() => {
    const map = {};
    for (const a of assignments) {
      const key = a.categoryName || "Uncategorized";
      if (!map[key]) map[key] = [];
      map[key].push(a);
    }
    return map;
  }, [assignments]);

  const gradesByAssignment = useMemo(() => {
    const m = {};
    for (const g of studentGrades) {
      m[g.assignmentId] = g;
    }
    return m;
  }, [studentGrades]);

  return (
    <Page title="Gradebook" subtitle="Enter and review grades">
      {err && (
        <div style={{ marginBottom: 16, color: "var(--ns-danger)", fontSize: 13 }}>{err}</div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20 }}>
        {/* Student list */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Students</CardTitle>
          </CardHeader>
          <CardContent style={{ padding: "0 0 8px" }}>
            {loading && <p style={{ padding: "12px 16px", fontSize: 13, color: "var(--ns-muted)" }}>Loading…</p>}
            {students.map((s) => {
              const summ = summary.find((x) => x.studentId === s.id);
              const isSelected = s.id === selectedStudentId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectStudent(s.id)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    padding: "9px 16px",
                    border: "none",
                    background: isSelected ? "var(--ns-accent-light, #eff3ff)" : "none",
                    borderLeft: isSelected ? "3px solid var(--ns-accent)" : "3px solid transparent",
                    cursor: "pointer",
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 13,
                    color: isSelected ? "var(--ns-accent)" : "var(--ns-text)",
                    textAlign: "left",
                  }}
                >
                  <span>{s.firstName} {s.lastName}</span>
                  {summ && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "white",
                      background: gradeColor(summ.letterGrade),
                      borderRadius: 4,
                      padding: "1px 6px",
                    }}>
                      {summ.letterGrade} {summ.weightedAverage}%
                    </span>
                  )}
                </button>
              );
            })}
            {!loading && students.length === 0 && (
              <p style={{ padding: "12px 16px", fontSize: 13, color: "var(--ns-muted)" }}>No students.</p>
            )}
          </CardContent>
        </Card>

        {/* Grade entry */}
        <div>
          {!selectedStudentId ? (
            <Card>
              <CardContent style={{ padding: 32, textAlign: "center", color: "var(--ns-muted)", fontSize: 14 }}>
                Select a student to enter grades.
              </CardContent>
            </Card>
          ) : (
            <>
              {studentSummary && (
                <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                  <SummaryChip label="Overall Avg" value={`${studentSummary.weightedAverage}%`} />
                  <SummaryChip label="Letter Grade" value={studentSummary.letterGrade} accent={gradeColor(studentSummary.letterGrade)} />
                  {Object.entries(studentSummary.categoryBreakdown || {}).map(([cat, pct]) => (
                    <SummaryChip key={cat} label={cat} value={`${pct}%`} />
                  ))}
                </div>
              )}

              {Object.entries(byCategory).map(([catName, catAssignments]) => (
                <Card key={catName} style={{ marginBottom: 16 }}>
                  <CardHeader>
                    <CardTitle className="text-sm">{catName}</CardTitle>
                  </CardHeader>
                  <CardContent style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1.5px solid var(--ns-border)" }}>
                          <th style={th}>Assignment</th>
                          <th style={th}>Subject</th>
                          <th style={{ ...th, textAlign: "center" }}>Max</th>
                          <th style={th}>Points Earned</th>
                          <th style={{ ...th, textAlign: "center" }}>Due</th>
                        </tr>
                      </thead>
                      <tbody>
                        {catAssignments.map((a) => {
                          const g = gradesByAssignment[a.id];
                          return (
                            <tr key={a.id} style={{ borderBottom: "1px solid var(--ns-border)" }}>
                              <td style={td}>{a.name}</td>
                              <td style={td}>{a.subject || "—"}</td>
                              <td style={{ ...td, textAlign: "center" }}>{a.maxPoints}</td>
                              <td style={td}>
                                <GradeCell
                                  assignmentId={a.id}
                                  studentId={selectedStudentId}
                                  maxPoints={a.maxPoints}
                                  initialPoints={g?.pointsEarned}
                                  onSaved={(dto) => handleGradeSaved(selectedStudentId, a.id, dto)}
                                />
                              </td>
                              <td style={{ ...td, textAlign: "center" }}>{a.dueDate || "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              ))}

              {assignments.length === 0 && !loading && (
                <Card>
                  <CardContent style={{ padding: 24, textAlign: "center", color: "var(--ns-muted)", fontSize: 13 }}>
                    No assignments yet. <a href="/admin/gradebook/setup" style={{ color: "var(--ns-accent)" }}>Set up assignments →</a>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </Page>
  );
}

function gradeColor(letter) {
  if (!letter) return "#64748b";
  if (letter === "A") return "#16a34a";
  if (letter === "B") return "#2563eb";
  if (letter === "C") return "#d97706";
  if (letter === "D") return "#ea580c";
  return "#dc2626";
}

function SummaryChip({ label, value, accent }) {
  return (
    <div style={{
      background: accent || "var(--ns-surface)",
      border: "1.5px solid var(--ns-border)",
      borderRadius: 8,
      padding: "6px 14px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>
      <span style={{ fontSize: 10, color: accent ? "rgba(255,255,255,0.8)" : "var(--ns-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 700, color: accent ? "white" : "var(--ns-text)", fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
    </div>
  );
}

const th = {
  textAlign: "left",
  padding: "7px 10px",
  fontWeight: 600,
  color: "var(--ns-text2)",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};
const td = { padding: "8px 10px", color: "var(--ns-text)", verticalAlign: "middle" };
