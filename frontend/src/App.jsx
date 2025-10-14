import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import AdminDashboard from "@/components/admin/AdminDashboard";
import ImportStudents from "@/components/admin/ImportStudents";
import TeacherDashboard from "@/components/teacher/TeacherDashboard";
import ReportsPage from "@/components/reports/ReportsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />

      {/* Admin routes */}
      <Route path="/admin" element={<AppShell><AdminDashboard /></AppShell>} />
      <Route path="/admin/import-students" element={<AppShell><ImportStudents /></AppShell>} />

      {/* Reports */}
      <Route path="/reports" element={<AppShell><ReportsPage /></AppShell>} />

      {/* Teacher */}
      <Route path="/teacher" element={<AppShell><TeacherDashboard /></AppShell>} />
    </Routes>
  );
}

