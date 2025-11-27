import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// Layout
import AppShell from "@/components/layout/AppShell";
import { Protected, useAuth } from "@/state/auth.jsx";

// Admin
import AdminDashboard from "@/components/admin/AdminDashboard.jsx";
import ImportStudents from "@/components/admin/ImportStudents.jsx";
import DefineBehaviorCategories from "@/components/admin/DefineBehaviorCategories.jsx";
import UserRoleManagement from "@/components/admin/UserRoleManagement.jsx";
import SetEscalationRules from "@/components/admin/SetEscalationRules.jsx";
import ManageIntervention from "@/components/admin/ManageIntervention.jsx";
import TeachersPage from "@/components/admin/TeacherPage.jsx";
import AdminTeacherCreate from "@/components/admin/AdminTeacherCreate.jsx";

// Other sections
import LoginPage from "@/components/auth/LoginPage.jsx";
import ReportsPage from "@/components/reports/ReportsPage.jsx";
import StudentDetailPage from "@/components/student/StudentDetailsPage.jsx";
import TeacherDashboard from "@/components/teacher/TeacherDashboard.jsx";
import CreateIncidentPage from "@/components/incidents/CreateIncidentPage.jsx";


/** Redirect "/" to a sensible home after login; otherwise go to /login */
function HomeRedirect() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Navigate to={user.role === "Teacher" ? "/teacher" : "/admin"} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Root -> role-based home or /login */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Login stays OUTSIDE AppShell (no header before auth) */}
      <Route path="/login" element={<LoginPage />} />

      {/* Admin area (Admin-only) */}
      <Route
        path="/admin"
        element={
          <Protected roles={["Admin"]}>
            <AppShell><AdminDashboard /></AppShell>
          </Protected>
        }
      />
      <Route
        path="/admin/import-students"
        element={
          <Protected roles={["Admin"]}>
            <AppShell><ImportStudents /></AppShell>
          </Protected>
        }
      />
      <Route
        path="/admin/define-behaviors"
        element={
          <Protected roles={["Admin"]}>
            <AppShell><DefineBehaviorCategories /></AppShell>
          </Protected>
        }
      />
      <Route
        path="/admin/user-role-management"
        element={
          <Protected roles={["Admin"]}>
            <AppShell><UserRoleManagement /></AppShell>
          </Protected>
        }
      />
      <Route
        path="/admin/escalation-rules"
        element={
          <Protected roles={["Admin"]}>
            <AppShell><SetEscalationRules /></AppShell>
          </Protected>
        }
      />
      <Route
        path="/admin/interventions"
        element={
          <Protected roles={["Admin"]}>
            <AppShell><ManageIntervention /></AppShell>
          </Protected>
        }
      />

      {/* Teachers CRUD page is admin-only, but if you want counselors too, add them here */}
      <Route
        path="/admin/teachers"
        element={
          <Protected roles={["Admin"]}>
            <AppShell><TeachersPage /></AppShell>
          </Protected>
        }
      />
      <Route
        path="/admin/teachers/new"
        element={
          <Protected roles={["Admin"]}>
            <AppShell><AdminTeacherCreate /></AppShell>
          </Protected>
        }
      />

      <Route
        path="/admin/students/:studentId"
        element={
          <Protected roles={["Admin", "Teacher"]}>
            <AppShell>
              <StudentDetailPage />
            </AppShell>
          </Protected>
        }
      />


      {/* Reports — currently admin-only; widen roles if you like */}
      <Route
        path="/reports"
        element={
          <Protected roles={["Admin"]}>
            <AppShell><ReportsPage /></AppShell>
          </Protected>
        }
      />

      {/* Teacher dashboard — allow Teachers (and Admins if you want to peek) */}
      <Route
        path="/teacher"
        element={
          <Protected roles={["Teacher", "Admin"]}>
            <AppShell><TeacherDashboard /></AppShell>
          </Protected>
        }
      />

      <Route
        path="/admin/students/:studentId/incidents/new"
        element={
          <Protected roles={["Admin", "Teacher"]}>
            <AppShell>
              <CreateIncidentPage />
            </AppShell>
          </Protected>
        }
      />

      {/* Unauthorized helper */}
      <Route
        path="/unauthorized"
        element={<AppShell><div className="p-6">Unauthorized</div></AppShell>}
      />


      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
