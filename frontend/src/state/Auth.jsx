import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const AuthCtx = React.createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = React.useState(() => localStorage.getItem("ns_token") || "");
  const [user, setUser] = React.useState(() => {
    const raw = localStorage.getItem("ns_user");
    return raw ? JSON.parse(raw) : null;
  });

  // NEW: persist active district/school (used for X-District-Id and bodies)
  const [activeDistrictId, setActiveDistrictId] = React.useState(() =>
    Number(localStorage.getItem("ns_active_district") || 1)
  );
  const [activeSchoolId, setActiveSchoolId] = React.useState(() =>
    Number(localStorage.getItem("ns_active_school") || 1)
  );

  React.useEffect(() => {
    localStorage.setItem("ns_active_district", String(activeDistrictId || ""));
  }, [activeDistrictId]);
  React.useEffect(() => {
    localStorage.setItem("ns_active_school", String(activeSchoolId || ""));
  }, [activeSchoolId]);

  async function login({ username, password, roleOverride }) {
    // Try real backend if present
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json(); // {token, user:{id,name,role,districtId,schoolId?}}
        localStorage.setItem("ns_token", data.token);
        localStorage.setItem("ns_user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        if (data.user?.districtId) setActiveDistrictId(data.user.districtId);
        if (data.user?.schoolId) setActiveSchoolId(data.user.schoolId);
        return { ok: true };
      }
    } catch (_) {}

    // Mock: accept anything; choose role; default to district 1 / school 1
    const role =
      roleOverride ||
      (username?.toLowerCase().startsWith("admin") ? "Admin" :
       username?.toLowerCase().startsWith("teacher") ? "Teacher" : "Viewer");
    const fakeUser = {
      id: "u_" + Math.random().toString(36).slice(2, 8),
      name: username || "user",
      role,
      districtId: 1,
      schoolId: 1,
    };
    const fakeToken = "mock_" + Math.random().toString(36).slice(2);
    localStorage.setItem("ns_token", fakeToken);
    localStorage.setItem("ns_user", JSON.stringify(fakeUser));
    setToken(fakeToken);
    setUser(fakeUser);
    setActiveDistrictId(fakeUser.districtId);
    setActiveSchoolId(fakeUser.schoolId);
    return { ok: true, mock: true };
  }

  function logout() {
    localStorage.removeItem("ns_token");
    localStorage.removeItem("ns_user");
    setToken(""); setUser(null);
  }

  const value = React.useMemo(() => ({
    token, user, login, logout,
    activeDistrictId, setActiveDistrictId,
    activeSchoolId, setActiveSchoolId,
  }), [token, user, activeDistrictId, activeSchoolId]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthCtx);
  if (!ctx) throw new Error("Wrap app in <AuthProvider>");
  return ctx;
}

export function Protected({ roles, children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}
