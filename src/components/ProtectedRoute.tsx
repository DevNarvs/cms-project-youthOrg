import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean
  requireOrganization?: boolean
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  requireOrganization = false,
}: ProtectedRouteProps) {
  const { user, appUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && appUser?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  if (requireOrganization && appUser?.role !== 'organization') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
