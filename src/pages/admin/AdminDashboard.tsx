import { AdminLayout } from '@/components/layouts/AdminLayout'
import { Users, Building2, CheckCircle, Clock } from 'lucide-react'

export function AdminDashboard() {
  return (
    <AdminLayout>
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-8">
          Welcome back! Here's an overview of your system.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">0</h3>
            <p className="text-sm text-muted-foreground">Total Organizations</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">0</h3>
            <p className="text-sm text-muted-foreground">Total Users</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">0</h3>
            <p className="text-sm text-muted-foreground">Pending Approvals</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">0</h3>
            <p className="text-sm text-muted-foreground">Approved Content</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <p className="text-muted-foreground">
              Activity feed will be displayed here showing recent actions across the system.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Pending Approvals</h2>
            <p className="text-muted-foreground">
              Content awaiting approval will be listed here for quick access.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
