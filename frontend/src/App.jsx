import { Routes, Route, Navigate } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import AdminDashboard from "@/components/admin/AdminDashboard";
import ImportStudents from "@/components/admin/ImportStudents";
import TeacherDashboard from "@/components/teacher/TeacherDashboard";
import ReportsPage from "@/components/reports/ReportsPage";
import DefineBehaviorCategories from "@/components/admin/DefineBehaviorCategories";

// Temporary placeholders until those pages exist
const ManageInterventionsPage = () => <div>Manage Interventions Page</div>;
const EscalationRulesPage = () => <div>Escalation Rules Page</div>;
const UserRoleManagementPage = () => <div>User Role Management Page</div>;
const ComplianceExportPage = () => <div>Compliance Export Page</div>;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />

      {/* Admin routes */}
      <Route path="/admin" element={<AppShell><AdminDashboard /></AppShell>} />
      <Route path="/admin/import-students" element={<AppShell><ImportStudents /></AppShell>} />
      <Route path="/admin/define-behaviors" element={<AppShell><DefineBehaviorCategories /></AppShell>} />
{/*       <Route path="/admin/interventions" element={<AppShell><ManageInterventionsPage /></AppShell>} /> */}
{/*       <Route path="/admin/escalation-rules" element={<AppShell><EscalationRulesPage /></AppShell>} /> */}
      <Route path="/admin/users" element={<AppShell><UserRoleManagementPage /></AppShell>} />
{/*       <Route path="/admin/compliance-export" element={<AppShell><ComplianceExportPage /></AppShell>} /> */}

      {/* Reports */}
      <Route path="/reports" element={<AppShell><ReportsPage /></AppShell>} />

      {/* Teacher */}
      <Route path="/teacher" element={<AppShell><TeacherDashboard /></AppShell>} />
    </Routes>
  );
}
