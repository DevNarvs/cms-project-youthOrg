import { createContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { AuthService, UserProfile } from '@/services/authService'

export interface AuthContextType {
  user: User | null
  appUser: UserProfile | null
  loading: boolean
  isAdmin: boolean
  isOrganization: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (authUser) {
          setUser(authUser)
          const profile = await AuthService.getUserProfile(authUser.id)
          setAppUser(profile)
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
          setUser(session.user)
          try {
            const profile = await AuthService.getUserProfile(session.user.id)
            setAppUser(profile)
          } catch (error) {
            console.error('Failed to load user profile:', error)
            setAppUser(null)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setAppUser(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    const profile = await AuthService.login({ email, password })
    setAppUser(profile)
  }

  const signOut = async () => {
    await AuthService.logout()
    setUser(null)
    setAppUser(null)
  }

  const updatePassword = async (newPassword: string) => {
    await AuthService.updatePassword(newPassword)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        appUser,
        loading,
        isAdmin: appUser?.role === 'admin',
        isOrganization: appUser?.role === 'organization',
        signIn,
        signOut,
        updatePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
