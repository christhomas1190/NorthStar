import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const AuthCtx = React.createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = React.useState(() => localStorage.getItem("ns_token") || "");
  const [user, setUser] = React.useState(() => {
    try {
      const raw = localStorage.getItem("ns_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      localStorage.removeItem("ns_user");
      return null;
    }
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
    // Try real backend with Basic Auth
    const basicToken = "Basic " + btoa(username + ":" + password);
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: basicToken },
      });
      if (res.ok) {
        const data = await res.json();
        const realUser = {
          id: data.username,
          name: data.name,
          role: data.role,
          districtId: data.districtId,
          schoolId: data.schoolId,
          mustChangePassword: data.mustChangePassword === true,
          hasGradebook: data.hasGradebook === true,
          hasAcademicTrend: data.hasAcademicTrend === true,
        };
        localStorage.setItem("ns_token", basicToken);
        localStorage.setItem("ns_user", JSON.stringify(realUser));
        setToken(basicToken);
        setUser(realUser);
        if (data.districtId) setActiveDistrictId(data.districtId);
        if (data.schoolId) setActiveSchoolId(data.schoolId);
        return { ok: true, role: data.role };
      }
      if (res.status === 401) return { ok: false, error: "Invalid credentials" };
    } catch (_) {
      // Backend not running — fall through to mock
    }

    // Mock fallback (backend offline)
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
      mustChangePassword: false,
    };
    localStorage.setItem("ns_token", basicToken);
    localStorage.setItem("ns_user", JSON.stringify(fakeUser));
    setToken(basicToken);
    setUser(fakeUser);
    setActiveDistrictId(fakeUser.districtId);
    setActiveSchoolId(fakeUser.schoolId);
    return { ok: true };
  }

  function logout() {
    localStorage.removeItem("ns_token");
    localStorage.removeItem("ns_user");
    setToken(""); setUser(null);
  }

  function updateToken(newToken) {
    localStorage.setItem("ns_token", newToken);
    setToken(newToken);
  }

  function clearMustChangePassword() {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, mustChangePassword: false };
      localStorage.setItem("ns_user", JSON.stringify(updated));
      return updated;
    });
  }

  const value = React.useMemo(() => ({
    token, user, login, logout,
    activeDistrictId, setActiveDistrictId,
    activeSchoolId, setActiveSchoolId,
    updateToken, clearMustChangePassword,
  }), [token, user, activeDistrictId, activeSchoolId]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthCtx);
  if (!ctx) throw new Error("Wrap app in <AuthProvider>");
  return ctx;
}

export function Protected({ roles, feature, children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  if (feature && !user[feature]) return <Navigate to="/unauthorized" replace />;
  return children;
}
