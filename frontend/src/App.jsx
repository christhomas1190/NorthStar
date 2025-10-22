import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import AdminDashboard from "@/components/admin/AdminDashboard";
import ImportStudents from "@/components/admin/ImportStudents";
import TeacherDashboard from "@/components/teacher/TeacherDashboard";
import ReportsPage from "@/components/reports/ReportsPage";
import DefineBehaviorCategories from "@/components/admin/DefineBehaviorCategories";
import UserRoleManagement from "@/components/admin/UserRoleManagement";
import SetEscalationRules from "@/components/admin/SetEscalationRules.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/admin" element={<AppShell><AdminDashboard /></AppShell>} />
      <Route path="/admin/import-students" element={<AppShell><ImportStudents /></AppShell>} />
      <Route path="/admin/define-behaviors" element={<AppShell><DefineBehaviorCategories /></AppShell>} />
      <Route path="/admin/user-role-management" element={<AppShell><UserRoleManagement /></AppShell>} />
      <Route path="/admin/escalation-rules" element={<AppShell><SetEscalationRules /></AppShell>} />
      <Route path="/reports" element={<AppShell><ReportsPage /></AppShell>} />
      <Route path="/teacher" element={<AppShell><TeacherDashboard /></AppShell>} />
    </Routes>
  );
}
