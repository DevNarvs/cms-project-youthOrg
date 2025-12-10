import { supabase } from '@/lib/supabase'

export interface LoginCredentials {
  email: string
  password: string
}

export interface UserProfile {
  id: string
  authUid: string
  auth_uid: string
  email: string
  full_name?: string
  role: 'admin' | 'organization'
  organizationId: string | null
  organization_id: string | null
  organization?: {
    id: string
    name: string
    logo_url: string | null
    president_name: string | null
    president_email: string | null
    president_phone: string | null
  }
  active: boolean
}

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<UserProfile> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    })

    if (authError || !authData.user) {
      throw new Error('Invalid email or password')
    }

    const profile = await this.getUserProfile(authData.user.id)

    if (!profile.active) {
      await supabase.auth.signOut()
      throw new Error('Your account has been deactivated. Please contact support.')
    }

    return profile
  }

  static async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  static async getUserProfile(authUid: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('app_users')
      .select(`
        id,
        auth_uid,
        email,
        role,
        organization_id,
        active,
        organizations (
          id,
          name,
          logo_url,
          president_name,
          president_email,
          president_phone
        )
      `)
      .eq('auth_uid', authUid)
      .maybeSingle()

    if (error || !data) {
      throw new Error('User profile not found')
    }

    const orgData = Array.isArray(data.organizations)
      ? data.organizations[0]
      : data.organizations

    return {
      id: data.id,
      authUid: data.auth_uid,
      auth_uid: data.auth_uid,
      email: data.email,
      full_name: data.email.split('@')[0],
      role: data.role as 'admin' | 'organization',
      organizationId: data.organization_id,
      organization_id: data.organization_id,
      organization: orgData ? {
        id: orgData.id,
        name: orgData.name,
        logo_url: orgData.logo_url,
        president_name: orgData.president_name,
        president_email: orgData.president_email,
        president_phone: orgData.president_phone
      } : undefined,
      active: data.active
    }
  }

  static async getCurrentUser(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    try {
      return await this.getUserProfile(user.id)
    } catch (error) {
      console.error('Failed to load user profile:', error)
      return null
    }
  }

  static async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
  }

  static async updateEmail(newEmail: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      email: newEmail
    })

    if (error) throw error
  }

  static validatePassword(password: string): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}
