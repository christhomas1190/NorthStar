import React, { useMemo, useState } from "react";
import Page from "@/components/layout/Page";
import PageTabs from "@/components/layout/PageTabs";
import { useAuth } from "@/state/auth.jsx";

const NAME_FORMATS = [
  { id: "FIRST_LAST", label: "First Last (e.g., Ada Lovelace)" },
  { id: "LAST_COMMA_FIRST", label: "Last, First (e.g., Lovelace, Ada)" },
  { id: "TSV_FIRST_LAST", label: "Tab/CSV: First  Last (2 cols)" },
  { id: "TSV_LAST_FIRST", label: "Tab/CSV: Last  First (2 cols)" },
  { id: "TSV_FIRST_LAST_ID", label: "Tab/CSV: First  Last  StudentID (3 cols)" },
  { id: "TSV_LAST_FIRST_ID", label: "Tab/CSV: Last  First  StudentID (3 cols)" },
];

function trimAll(x = "") {
  return x.replace(/\s+/g, " ").trim();
}

function splitCSVorTSV(line) {
  if (line.includes("\t")) return line.split("\t").map((s) => s.trim());
  if (line.includes(",")) return line.split(",").map((s) => s.trim());
  return line.split(/\s{2,}|\s/).map((s) => s.trim());
}

function parseLine(line, format) {
  const raw = line.trim();
  if (!raw) return null;

  switch (format) {
    case "FIRST_LAST": {
      const parts = raw.split(/\s+/);
      if (parts.length < 2) return null;
      const first = parts.slice(0, -1).join(" ");
      const last = parts[parts.length - 1];
      return { firstName: trimAll(first), lastName: trimAll(last) };
    }
    case "LAST_COMMA_FIRST": {
      const m = raw.split(",");
      if (m.length < 2) return null;
      const last = m[0];
      const first = m.slice(1).join(",");
      return { firstName: trimAll(first), lastName: trimAll(last) };
    }
    case "TSV_FIRST_LAST": {
      const cols = splitCSVorTSV(raw);
      if (cols.length < 2) return null;
      return { firstName: trimAll(cols[0]), lastName: trimAll(cols[1]) };
    }
    case "TSV_LAST_FIRST": {
      const cols = splitCSVorTSV(raw);
      if (cols.length < 2) return null;
      return { firstName: trimAll(cols[1]), lastName: trimAll(cols[0]) };
    }
    case "TSV_FIRST_LAST_ID": {
      const cols = splitCSVorTSV(raw);
      if (cols.length < 3) return null;
      return {
        firstName: trimAll(cols[0]),
        lastName: trimAll(cols[1]),
        studentId: trimAll(cols[2]),
      };
    }
    case "TSV_LAST_FIRST_ID": {
      const cols = splitCSVorTSV(raw);
      if (cols.length < 3) return null;
      return {
        firstName: trimAll(cols[1]),
        lastName: trimAll(cols[0]),
        studentId: trimAll(cols[2]),
      };
    }
    default:
      return null;
  }
}

function validateRow(r) {
  const errors = {};
  if (!trimAll(r.firstName)) errors.firstName = "First required";
  if (!trimAll(r.lastName)) errors.lastName = "Last required";
  if (!trimAll(r.grade)) errors.grade = "Grade required";
  if (!trimAll(r.studentId)) errors.studentId = "Student ID required";
  return errors;
}

function newId() {
  return (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)).slice(0, 8);
}

export default function ImportStudents() {
  const { activeDistrictId, activeSchoolId } = useAuth();

  async function postStudent(body) {
    const res = await fetch("/api/students", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-District-Id": String(activeDistrictId),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(txt || `HTTP ${res.status}`);
    }
    return res.json();
  }

  const [single, setSingle] = useState({
    firstName: "",
    lastName: "",
    grade: "",
    studentId: "",
  });
  const [singleStatus, setSingleStatus] = useState(null);

  const [raw, setRaw] = useState("");
  const [format, setFormat] = useState(NAME_FORMATS[0].id);
  const [defaultGrade, setDefaultGrade] = useState("");
  const [rows, setRows] = useState([]);

  const parsed = useMemo(() => {
    const lines = raw.split(/\r?\n/);
    const out = [];
    for (const line of lines) {
      const p = parseLine(line, format);
      if (!p) continue;
      out.push({
        firstName: p.firstName || "",
        lastName: p.lastName || "",
        studentId: p.studentId || "",
        grade: defaultGrade || "",
      });
    }
    return out;
  }, [raw, format, defaultGrade]);

  function loadPreview() {
    const withErrors = parsed.map((r) => {
      const withId = { ...r, studentId: trimAll(r.studentId) || newId() };
      return {
        ...withId,
        _errors: validateRow(withId),
        _result: null,
      };
    });
    setRows(withErrors);
  }

  function updateCell(idx, field, value) {
    setRows((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      copy[idx]._errors = validateRow(copy[idx]);
      return copy;
    });
  }

  async function submitSingle(e) {
    e.preventDefault();
    setSingleStatus(null);

    const payload = {
      firstName: trimAll(single.firstName),
      lastName: trimAll(single.lastName),
      grade: trimAll(single.grade),
      studentId: trimAll(single.studentId) || newId(),
      schoolId: activeSchoolId,
    };
    const errs = validateRow(payload);
    if (Object.keys(errs).length) {
      setSingleStatus({ ok: false, message: "Please fill all required fields." });
      return;
    }
    try {
      await postStudent(payload);
      setSingle({ firstName: "", lastName: "", grade: "", studentId: "" });
      setSingleStatus({ ok: true, message: "Student added." });
    } catch (err) {
      setSingleStatus({ ok: false, message: String(err.message || err) });
    }
  }

  async function submitAll() {
    const validated = rows.map((r) => {
      const filled = { ...r, studentId: trimAll(r.studentId) || newId() };
      return { ...filled, _errors: validateRow(filled) };
    });
    setRows(validated);
    const hasErrors = validated.some((r) => Object.keys(r._errors || {}).length);
    if (hasErrors) return;

    const results = await Promise.allSettled(
      validated.map((r) =>
        postStudent({
          firstName: trimAll(r.firstName),
          lastName: trimAll(r.lastName),
          grade: trimAll(r.grade),
          studentId: trimAll(r.studentId),
          schoolId: activeSchoolId,
        })
      )
    );

    setRows((prev) =>
      prev.map((r, i) => ({
        ...r,
        _result:
          results[i].status === "fulfilled"
            ? { ok: true, id: results[i].value?.id }
            : { ok: false, error: results[i].reason?.message || "Failed" },
      }))
    );
  }

  return (
    <Page title="User & Role Management" subtitle="Add users and define roles & permissions">
      <PageTabs
        items={[
          { label: "Admin Dashboard", to: "/admin" },
          { label: "User & Role Management", to: "/admin/user-role-management" },
          { label: "Import Students", to: "/admin/import-students" },
        ]}
      />

      <div className="space-y-8">
        <header>
          <h1 className="text-2xl font-semibold">Import Students</h1>
          <p className="text-sm text-gray-500">
            Add one student or paste a list to create many at once.
          </p>
        </header>

        <section className="border rounded-xl p-4 space-y-4 bg-white">
          <h2 className="text-lg font-medium">Add a single student</h2>
          <form onSubmit={submitSingle} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              className="border rounded px-3 py-2"
              placeholder="First Name"
              value={single.firstName}
              onChange={(e) => setSingle((s) => ({ ...s, firstName: e.target.value }))}
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Last Name"
              value={single.lastName}
              onChange={(e) => setSingle((s) => ({ ...s, lastName: e.target.value }))}
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Grade"
              value={single.grade}
              onChange={(e) => setSingle((s) => ({ ...s, grade: e.target.value }))}
            />
            <input
              className="border rounded px-3 py-2"
              placeholder="Student ID (school ID)"
              value={single.studentId}
              onChange={(e) => setSingle((s) => ({ ...s, studentId: e.target.value }))}
            />
            <div className="col-span-full">
              <button type="submit" className="px-4 py-2 rounded-lg bg-black text-white">
                Add Student
              </button>
              {singleStatus && (
                <span
                  className={`ml-3 text-sm ${
                    singleStatus.ok ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {singleStatus.message}
                </span>
              )}
            </div>
          </form>
        </section>

        <section className="border rounded-xl p-4 space-y-4 bg-white">
          <h2 className="text-lg font-medium">Bulk add from list</h2>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Paste names here</label>
              <textarea
                className="w-full border rounded px-3 py-2 h-40"
                placeholder={`One per line. Examples:\nAda Lovelace\nLovelace, Ada\nGrace\tHopper\tA12345 (tab-separated with StudentID)`}
                value={raw}
                onChange={(e) => setRaw(e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Name format</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
              >
                {NAME_FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>

              <label className="text-sm font-medium">Default Grade (optional)</label>
              <input
                className="w-full border rounded px-3 py-2"
                placeholder="e.g., 8"
                value={defaultGrade}
                onChange={(e) => setDefaultGrade(e.target.value)}
              />

              <button
                type="button"
                onClick={loadPreview}
                className="w-full px-4 py-2 rounded-lg bg-black text-white"
              >
                Load Preview
              </button>
            </div>
          </div>

          {rows.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left px-3 py-2 border">First Name</th>
                    <th className="text-left px-3 py-2 border">Last Name</th>
                    <th className="text-left px-3 py-2 border">Grade</th>
                    <th className="text-left px-3 py-2 border">Student ID</th>
                    <th className="text-left px-3 py-2 border">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const e = r._errors || {};
                    return (
                      <tr key={i} className="odd:bg-white even:bg-gray-50 align-top">
                        <td className="px-3 py-2 border">
                          <input
                            className={`w-full border rounded px-2 py-1 ${e.firstName ? "border-red-500" : ""}`}
                            value={r.firstName}
                            onChange={(ev) => updateCell(i, "firstName", ev.target.value)}
                          />
                          {e.firstName && (
                            <div className="text-xs text-red-700 mt-1">{e.firstName}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 border">
                          <input
                            className={`w-full border rounded px-2 py-1 ${e.lastName ? "border-red-500" : ""}`}
                            value={r.lastName}
                            onChange={(ev) => updateCell(i, "lastName", ev.target.value)}
                          />
                          {e.lastName && (
                            <div className="text-xs text-red-700 mt-1">{e.lastName}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 border">
                          <input
                            className={`w-full border rounded px-2 py-1 ${e.grade ? "border-red-500" : ""}`}
                            placeholder={defaultGrade || "e.g., 8"}
                            value={r.grade}
                            onChange={(ev) => updateCell(i, "grade", ev.target.value)}
                          />
                          {e.grade && <div className="text-xs text-red-700 mt-1">{e.grade}</div>}
                        </td>
                        <td className="px-3 py-2 border">
                          <input
                            className={`w-full border rounded px-2 py-1 ${e.studentId ? "border-red-500" : ""}`}
                            placeholder="A12345 or auto"
                            value={r.studentId}
                            onChange={(ev) => updateCell(i, "studentId", ev.target.value)}
                          />
                          {e.studentId && (
                            <div className="text-xs text-red-700 mt-1">{e.studentId}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 border text-sm">
                          {r._result ? (
                            r._result.ok ? (
                              <span className="text-green-700">
                                Created (id: {r._result.id ?? "—"})
                              </span>
                            ) : (
                              <span className="text-red-700">
                                {r._result.error || "Failed"}
                              </span>
                            )
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-black text-white"
                  onClick={submitAll}
                >
                  Submit {rows.length} student{rows.length !== 1 ? "s" : ""}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg border"
                  onClick={() => setRows([])}
                >
                  Clear Preview
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </Page>
  );
}
