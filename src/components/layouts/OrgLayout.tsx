import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/contexts/ThemeContext'
import {
  LayoutDashboard,
  Image,
  FileText,
  Calendar,
  File,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface OrgLayoutProps {
  children: ReactNode
}

const orgNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/dashboard/carousel', label: 'Carousel Items', icon: Image },
  { to: '/dashboard/announcements', label: 'Announcements', icon: FileText },
  { to: '/dashboard/programs', label: 'Programs', icon: Calendar },
  { to: '/dashboard/files', label: 'Files', icon: File },
]

export function OrgLayout({ children }: OrgLayoutProps) {
  const location = useLocation()
  const { appUser, signOut } = useAuth()
  const { organization } = useTheme()

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          {organization?.logo_url && (
            <img
              src={organization.logo_url}
              alt={organization.name}
              className="h-12 w-auto mb-2"
            />
          )}
          <h1 className="text-xl font-bold text-primary">
            {organization?.name || 'Organization Dashboard'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{appUser?.full_name}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {orgNavItems.map((item) => {
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
