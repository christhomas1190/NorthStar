import AppShell from '@/components/layout/AppShell'
import Sidebar from '@/components/layout/Sidebar'
import AdminDashboard from '@/components/admin/AdminDashboard'

export default function App() {
  return (
    <AppShell sidebar={<Sidebar active="admin" />}>
      <AdminDashboard />
    </AppShell>
  )
}
