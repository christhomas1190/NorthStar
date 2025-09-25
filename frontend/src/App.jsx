import React from "react";
import AppShell from '@/components/layout/AppShell'
import Sidebar from '@/components/layout/Sidebar'
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import AdminDashboard from "@/components/admin/AdminDashboard.jsx";
import TeacherDashboard from "@/components/teacher/TeacherDashboard.jsx";

const currentUser = { id: "t_45", role: "teacher" };

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={currentUser.role === "admin" ? "/admin" : "/teacher"} replace />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
      </Routes>
    </Router>
  );
}