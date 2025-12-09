import { OrgLayout } from '@/components/layouts/OrgLayout'
import { Image, FileText, Calendar, File, CheckCircle, Clock } from 'lucide-react'

export function OrgDashboard() {
  return (
    <OrgLayout>
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground mb-8">
          Welcome back! Manage your organization's content here.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Image className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">0</h3>
            <p className="text-sm text-muted-foreground">Carousel Items</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">0</h3>
            <p className="text-sm text-muted-foreground">Announcements</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">0</h3>
            <p className="text-sm text-muted-foreground">Programs</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <File className="h-6 w-6 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-1">0</h3>
            <p className="text-sm text-muted-foreground">Files</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Pending Approval</h2>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Content waiting for admin approval will be listed here.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Recently Approved</h2>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-muted-foreground">
              Your recently approved content will appear here.
            </p>
          </div>
        </div>
      </div>
    </OrgLayout>
  )
}
