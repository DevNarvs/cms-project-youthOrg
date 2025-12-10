import { createContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { AuthService, UserProfile } from '@/services/authService'

interface AuthContextType {
  user: UserProfile | null
  authUser: User | null
  loading: boolean
  isAdmin: boolean
  isOrganization: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [authUser, setAuthUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (authUser) {
          setAuthUser(authUser)
          const profile = await AuthService.getUserProfile(authUser.id)
          setUser(profile)
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setAuthUser(session.user)
          try {
            const profile = await AuthService.getUserProfile(session.user.id)
            setUser(profile)
          } catch (error) {
            console.error('Failed to load user profile:', error)
            setUser(null)
          }
        } else if (event === 'SIGNED_OUT') {
          setAuthUser(null)
          setUser(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    const profile = await AuthService.login({ email, password })
    setUser(profile)
  }

  const logout = async () => {
    await AuthService.logout()
    setUser(null)
    setAuthUser(null)
  }

  const updatePassword = async (newPassword: string) => {
    await AuthService.updatePassword(newPassword)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        authUser,
        loading,
        isAdmin: user?.role === 'admin',
        isOrganization: user?.role === 'organization',
        login,
        logout,
        updatePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
