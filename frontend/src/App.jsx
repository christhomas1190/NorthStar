import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import AdminDashboard from "@/components/admin/AdminDashboard";
import TeacherDashboard from "@/components/teacher/TeacherDashboard";
import ReportsPage from "@/components/reports/ReportsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />

      {/* Match the reference: no sidebar on these */}
      <Route path="/admin" element={<AppShell><AdminDashboard /></AppShell>} />
      <Route path="/reports" element={<AppShell><ReportsPage /></AppShell>} />

      {/* Teacher stays a separate route; no pill tabs here */}
      <Route path="/teacher" element={<AppShell><TeacherDashboard /></AppShell>} />
    </Routes>
  );
}

