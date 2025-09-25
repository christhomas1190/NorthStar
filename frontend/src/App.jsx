import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import Sidebar from "@/components/layout/Sidebar";
import AdminDashboard from "@/components/admin/AdminDashboard";
import TeacherDashboard from "@/components/teacher/TeacherDashboard";

export default function App() {
  return (
    <AppShell sidebar={<Sidebar />}>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/reports" element={<div className="rounded-2xl border bg-white p-4">Reports (stub)</div>} />
        {/* add more routes as needed */}
      </Routes>
    </AppShell>
  );
}
