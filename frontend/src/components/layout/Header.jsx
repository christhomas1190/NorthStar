import React, { useEffect, useMemo, useState } from "react";
import { ShieldCheck, LogOut, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/state/auth.jsx";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const {
    user,
    logout,
    activeDistrictId,
    setActiveDistrictId,
    activeSchoolId,
    setActiveSchoolId,
  } = useAuth();
  const nav = useNavigate();

  // 🔍 search + students state
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [studentsLoadedDistrict, setStudentsLoadedDistrict] = useState(null);

  // Load students for the active district (once per district change)
  useEffect(() => {
    if (!activeDistrictId) {
      setStudents([]);
      setStudentsLoadedDistrict(null);
      return;
    }
    if (studentsLoadedDistrict === activeDistrictId) return;

    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/students", {
          headers: {
            "X-District-Id": String(activeDistrictId),
            "Content-Type": "application/json",
          },
        });
        const data = res.ok ? await res.json() : [];
        if (!alive) return;
        setStudents(Array.isArray(data) ? data : []);
        setStudentsLoadedDistrict(activeDistrictId);
      } catch (e) {
        if (!alive) return;
        console.error("Failed to load students for header search:", e);
        setStudents([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [activeDistrictId, studentsLoadedDistrict]);

  // Build filtered suggestions as you type
  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const out = [];
    for (let i = 0; i < students.length; i++) {
      const s = students[i];
      const fullName = `${s.firstName ?? ""} ${s.lastName ?? ""}`
        .trim()
        .toLowerCase();
      const idStr = String(s.studentId ?? s.id ?? "");
      if (fullName.includes(q) || idStr.includes(q)) {
        out.push(s);
        if (out.length >= 8) break;
      }
    }
    return out;
  }, [search, students]);

  function goToStudent(student) {
    if (!student) return;
    nav(`/admin/students/${student.id}`);
    setSearch("");
  }

  function handleSearchSubmit() {
    if (!search.trim()) return;
    if (suggestions.length > 0) {
      goToStudent(suggestions[0]);
    } else {
      window.alert("No student found for that name or ID.");
    }
  }

  return (
    <header className="sticky top-0 z-30 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-slate-900 text-white grid place-content-center font-bold">
            NS
          </div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
            NorthStar
          </h1>
          <Badge variant="secondary" className="ml-2">
            Desktop • v0.1
          </Badge>
        </div>

        <div className="hidden md:flex items-center gap-3 relative">
          {/* Search + suggestions */}
          <div className="relative">
            <Input
              placeholder="Search students by name or ID…"
              className="w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearchSubmit();
                }
              }}
            />
            {search.trim() && suggestions.length > 0 && (
              <div className="absolute mt-1 w-full max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg text-sm z-40">
                {suggestions.map((s) => {
                  const fullName = `${s.firstName ?? ""} ${
                    s.lastName ?? ""
                  }`.trim();
                  const idStr = s.studentId ?? s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex justify-between items-center"
                      onClick={() => goToStudent(s)}
                    >
                      <span className="truncate">
                        {fullName || `Student #${s.id}`}
                      </span>
                      <span className="ml-2 text-xs text-slate-500">
                        ID: {idStr}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Small search button to the right */}
          <Button
            variant="outline"
            className="gap-1 h-9 px-3 text-xs"
            type="button"
            onClick={handleSearchSubmit}
          >
            Search
          </Button>

          {/* Context pickers */}
          <div className="flex items-center gap-2 ml-2">
            <MapPin size={16} className="text-slate-500" />
            <input
              className="h-8 w-20 rounded-lg border border-slate-300 px-2 text-sm"
              type="number"
              value={activeDistrictId || ""}
              onChange={(e) =>
                setActiveDistrictId(Number(e.target.value || 0))
              }
              title="District ID"
              placeholder="Dist"
            />
            <input
              className="h-8 w-20 rounded-lg border border-slate-300 px-2 text-sm"
              type="number"
              value={activeSchoolId || ""}
              onChange={(e) =>
                setActiveSchoolId(Number(e.target.value || 0))
              }
              title="School ID"
              placeholder="School"
            />
          </div>

          {user?.role === "Admin" && (
            <Button
              variant="outline"
              className="gap-2 h-9 px-3 text-xs"
              onClick={() => nav("/admin")}
            >
              <ShieldCheck size={16} />
              Admin
            </Button>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <Badge variant="outline">{user.role}</Badge>
              <span className="text-sm text-slate-600">{user.name}</span>
              <Button
                variant="ghost"
                className="gap-1 h-9 px-2 text-xs"
                onClick={() => {
                  logout();
                  nav("/login");
                }}
              >
                <LogOut size={16} /> Logout
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="h-9 px-3 text-xs"
              onClick={() => nav("/login")}
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
