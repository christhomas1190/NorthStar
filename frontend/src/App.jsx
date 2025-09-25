import AppShell from '@/components/layout/AppShell'
import Sidebar from '@/components/layout/Sidebar'
import AdminDashboard from '@/components/admin/AdminDashboard'
export default function App() {
  return (
      <Router>
        <Routes>
          {/* Role-based routing */}
          <Route path="/" element={<Navigate to={currentUser.role === "admin" ? "/admin" : "/teacher"} replace />} />

          {/* Admin-only */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Teacher-only */}
          <Route path="/teacher" element={<TeacherConsole />} />

          {/* Later: add /student/:id for student viewer?? */}
        </Routes>
      </Router>
    );
  }