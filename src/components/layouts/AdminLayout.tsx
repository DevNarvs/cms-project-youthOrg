import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  FileText,
  Image,
  Calendar,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminLayoutProps {
  children: ReactNode
}

const adminNavItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/organizations', label: 'Organizations', icon: Building2 },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/carousel', label: 'Carousel', icon: Image },
  { to: '/admin/announcements', label: 'Announcements', icon: FileText },
  { to: '/admin/programs', label: 'Programs', icon: Calendar },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation()
  const { appUser, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-bold text-primary">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">{appUser?.full_name}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Link
            to="/"
            className="flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors mb-2"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span>View Public Site</span>
          </Link>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
