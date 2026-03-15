import React, { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/state/auth.jsx";
import NorthStarBrand from "@/components/layout/NorthStarBrand";
import { getJSON } from "@/lib/api.js";

const ADMIN_NAV = [
  { label: "Dashboard", to: "/admin", exact: true },
  { label: "Teachers", to: "/admin/teachers" },
  { label: "Discipline", to: "/admin/disciplines/new" },
  { label: "Reports", to: "/reports" },
];

const TEACHER_NAV = [
  { label: "Dashboard", to: "/teacher", exact: true },
];

export default function Header() {
  const { user, logout, activeDistrictId, setActiveDistrictId, activeSchoolId, setActiveSchoolId } = useAuth();
  const nav = useNavigate();

  const [search, setSearch] = useState("");
  const [students, setStudents] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!activeDistrictId) { setStudents([]); return; }
    let alive = true;
    (async () => {
      try {
        const data = await getJSON("/api/students");
        if (!alive) return;
        setStudents(Array.isArray(data) ? data : []);
      } catch {
        if (alive) setStudents([]);
      }
    })();
    return () => { alive = false; };
  }, [activeDistrictId]);

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    const out = [];
    for (const s of students) {
      const fullName = `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim().toLowerCase();
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
    setShowDropdown(false);
  }

  function handleSearchSubmit() {
    if (!search.trim()) return;
    if (suggestions.length > 0) goToStudent(suggestions[0]);
    else window.alert("No student found for that name or ID.");
  }

  const navLinks = user?.role === "Admin" ? ADMIN_NAV : user?.role === "Teacher" ? TEACHER_NAV : [];

  const userInitials = user?.name
    ? user.name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <header
      style={{
        background: "var(--ns-white)",
        borderBottom: "2px solid var(--ns-border)",
        padding: "0 28px",
        display: "flex",
        alignItems: "center",
        height: 60,
        gap: 0,
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Logo */}
      <div style={{ marginRight: 28 }}>
        <NorthStarBrand isAdmin={user?.role === "Admin"} />
      </div>

      {/* Top Nav */}
      <nav style={{ display: "flex", alignItems: "stretch", height: "100%", gap: 0 }}>
        {navLinks.map(({ label, to, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              fontSize: 13,
              fontWeight: 500,
              color: isActive ? "var(--ns-accent)" : "var(--ns-text2)",
              textDecoration: "none",
              borderBottom: isActive ? "2px solid var(--ns-accent)" : "2px solid transparent",
              marginBottom: -2,
              transition: "all 0.15s",
              cursor: "pointer",
              whiteSpace: "nowrap",
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Right side */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
        {/* Search */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "var(--ns-bg)",
              border: "1.5px solid var(--ns-border2)",
              borderRadius: 8,
              padding: "6px 10px",
              gap: 6,
              minWidth: 240,
            }}
          >
            <span style={{ color: "var(--ns-muted)", fontSize: 13 }}>🔍</span>
            <input
              style={{
                border: "none",
                background: "transparent",
                fontFamily: "'Outfit', sans-serif",
                fontSize: 13,
                color: "var(--ns-text)",
                outline: "none",
                flex: 1,
              }}
              placeholder="Search students…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearchSubmit(); } }}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              onFocus={() => setShowDropdown(true)}
            />
            <button
              type="button"
              onClick={handleSearchSubmit}
              style={{
                background: "var(--ns-accent)",
                color: "white",
                border: "none",
                borderRadius: 6,
                padding: "3px 10px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              Go
            </button>
          </div>

          {showDropdown && search.trim() && suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: 4,
                background: "var(--ns-white)",
                border: "1.5px solid var(--ns-border)",
                borderRadius: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                zIndex: 50,
                maxHeight: 240,
                overflowY: "auto",
              }}
            >
              {suggestions.map((s) => {
                const fullName = `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim();
                const idStr = s.studentId ?? s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onMouseDown={() => goToStudent(s)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                      color: "var(--ns-text)",
                      fontFamily: "'Outfit', sans-serif",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--ns-bg)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                  >
                    <span>{fullName || `Student #${s.id}`}</span>
                    <span style={{ color: "var(--ns-muted)", fontSize: 11 }}>ID: {idStr}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* District / School pickers (compact, hidden text inputs) */}
        <div style={{ display: "flex", gap: 6 }}>
          <input
            style={{
              height: 32,
              width: 70,
              borderRadius: 6,
              border: "1.5px solid var(--ns-border2)",
              padding: "0 8px",
              fontSize: 12,
              fontFamily: "'Outfit', sans-serif",
              color: "var(--ns-text2)",
              background: "var(--ns-surface)",
            }}
            type="number"
            value={activeDistrictId || ""}
            onChange={(e) => setActiveDistrictId(e.target.value ? Number(e.target.value) : null)}
            title="District ID"
            placeholder="District"
          />
          <input
            style={{
              height: 32,
              width: 70,
              borderRadius: 6,
              border: "1.5px solid var(--ns-border2)",
              padding: "0 8px",
              fontSize: 12,
              fontFamily: "'Outfit', sans-serif",
              color: "var(--ns-text2)",
              background: "var(--ns-surface)",
            }}
            type="number"
            value={activeSchoolId || ""}
            onChange={(e) => setActiveSchoolId(e.target.value ? Number(e.target.value) : null)}
            title="School ID"
            placeholder="School"
          />
        </div>

        {/* User pill */}
        {user && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--ns-surface)",
              border: "1px solid var(--ns-border)",
              borderRadius: 20,
              padding: "4px 12px 4px 5px",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                background: "var(--ns-accent)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 11,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {userInitials}
            </div>
            <span style={{ fontSize: 13, color: "var(--ns-text)", fontWeight: 500 }}>
              {user.name || user.role}
            </span>
            <button
              type="button"
              onClick={() => { logout(); nav("/login"); }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--ns-muted)",
                display: "flex",
                alignItems: "center",
                padding: "2px 0 2px 4px",
              }}
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}

        {!user && (
          <button
            type="button"
            onClick={() => nav("/login")}
            style={{
              background: "transparent",
              border: "1.5px solid var(--ns-border2)",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              color: "var(--ns-text2)",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}
