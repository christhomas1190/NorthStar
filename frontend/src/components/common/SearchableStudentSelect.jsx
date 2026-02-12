import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function SearchableStudentSelect({
  students = [],
  value = null,
  onChange,
  placeholder = "Search student name…",
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = (q || "").trim().toLowerCase();
    if (!query) return students;

    const out = [];
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const full =
        `${s?.lastName || ""}, ${s?.firstName || ""} ${s?.grade ? `(${s.grade})` : ""}`.toLowerCase();

      if (full.includes(query)) out.push(s);
    }
    return out;
  }, [q, students]);

  function pickStudent(s) {
    setQ("");
    if (onChange) onChange(s);
  }

  return (
    <div className="space-y-2">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
      />

      {!!q.trim() && (
        <Card className="max-h-64 overflow-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-2 py-2 text-sm text-slate-500">No matches.</div>
          ) : (
            <div className="space-y-1">
              {filtered.map((s) => {
                const label = `${s.lastName}, ${s.firstName}${s.grade ? ` (Grade ${s.grade})` : ""}`;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => pickStudent(s)}
                    className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-slate-100"
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {value ? (
        <div className="text-sm text-slate-600">
          Selected: <span className="font-medium">{value.lastName}, {value.firstName}</span>
        </div>
      ) : (
        <div className="text-sm text-slate-500">Select a student to continue.</div>
      )}
    </div>
  );
}
