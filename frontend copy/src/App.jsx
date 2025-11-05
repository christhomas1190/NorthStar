// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

// Layout
import AppShell from "@/components/layout/AppShell";

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
import ReportsPage from "@/components/reports/ReportsPage.jsx";
import TeacherDashboard from "@/components/teacher/TeacherDashboard.jsx";

export default function App() {
  return (
    <Routes>
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/admin" replace />} />

      {/* Admin core */}
      <Route path="/admin" element={<AppShell><AdminDashboard /></AppShell>} />
      <Route path="/admin/import-students" element={<AppShell><ImportStudents /></AppShell>} />
      <Route path="/admin/define-behaviors" element={<AppShell><DefineBehaviorCategories /></AppShell>} />
      <Route path="/admin/user-role-management" element={<AppShell><UserRoleManagement /></AppShell>} />
      <Route path="/admin/escalation-rules" element={<AppShell><SetEscalationRules /></AppShell>} />
      <Route path="/admin/interventions" element={<AppShell><ManageIntervention /></AppShell>} />

      {/* Teachers */}
      <Route path="/admin/teachers" element={<AppShell><TeachersPage /></AppShell>} />
      <Route path="/admin/teachers/new" element={<AppShell><AdminTeacherCreate /></AppShell>} />

      {/* Other sections */}
      <Route path="/reports" element={<AppShell><ReportsPage /></AppShell>} />
      <Route path="/teacher" element={<AppShell><TeacherDashboard /></AppShell>} />

      {/* Catch-all -> Admin */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
