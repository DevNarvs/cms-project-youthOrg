import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function useRequireAuth(requiredRole?: 'admin' | 'organization') {
  const { user, appUser, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login', { replace: true })
      } else if (requiredRole && appUser?.role !== requiredRole) {
        navigate('/', { replace: true })
      }
    }
  }, [user, appUser, loading, requiredRole, navigate])

  return { user, appUser, loading }
}
