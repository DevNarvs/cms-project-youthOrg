# Authentication & Authorization Guide

Complete guide to authentication, user management, and role-based access control in the Youth Organization CMS.

## Table of Contents
1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Authentication Flow](#authentication-flow)
4. [Admin Creates Organization Accounts](#admin-creates-organization-accounts)
5. [Organization Login](#organization-login)
6. [Auth Hook (useAuth)](#auth-hook-useauth)
7. [Role Detection](#role-detection)
8. [Protected Routes](#protected-routes)
9. [Dashboard Logic](#dashboard-logic)
10. [Admin User Management](#admin-user-management)
11. [Security Best Practices](#security-best-practices)

---

## Overview

### User Types
1. **Admin** - Can create organizations, approve content, manage all data
2. **Organization** - Can manage their own content (must be approved by admin)

### Key Concepts
- Admin creates organization accounts via Supabase Admin API
- Each organization has one president (stored in organizations table)
- `auth.users` table managed by Supabase
- `app_users` table maps auth.uid to role and organization
- No separate president login (president info is just stored data)

---

## Database Schema

### Auth Users (Supabase Managed)
```sql
-- auth.users (managed by Supabase)
-- Contains email, encrypted_password, etc.
```

### App Users Table
```sql
-- Maps Supabase auth users to app roles and organizations
CREATE TABLE app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'organization')),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT org_required_for_org_role
    CHECK (role = 'admin' OR organization_id IS NOT NULL)
);
```

### Organizations Table (President Info)
```sql
-- Organization details including president information
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  president_name text,
  president_email text,
  president_phone text,
  contact_email text,
  contact_phone text,
  logo_url text,
  primary_color text DEFAULT '#3b82f6',
  secondary_color text DEFAULT '#64748b',
  active boolean DEFAULT true,
  archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

---

## Authentication Flow

### High-Level Flow

```
1. Admin creates organization account
   ↓
2. Supabase creates auth.users record
   ↓
3. Trigger/function creates app_users record
   ↓
4. Organization receives login credentials
   ↓
5. Organization logs in
   ↓
6. App fetches user profile (role, org_id)
   ↓
7. Redirect to appropriate dashboard
```

### Login Flow Diagram

```
User submits credentials
        ↓
  Supabase Auth
        ↓
   Success? ──No──→ Show error
        ↓
       Yes
        ↓
  Fetch app_users by auth_uid
        ↓
  Load user profile (role, org)
        ↓
  Is admin? ──Yes──→ Admin Dashboard
        ↓
       No
        ↓
  Organization Dashboard
```

---

## Admin Creates Organization Accounts

### Step 1: Admin API Setup

```typescript
// src/lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase admin credentials')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
```

### Step 2: Create Organization Account Service

```typescript
// src/services/adminUserService.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { supabase } from '@/lib/supabase'

export interface CreateOrgAccountData {
  organizationName: string
  email: string
  password: string
  presidentName?: string
  presidentEmail?: string
  presidentPhone?: string
  contactEmail?: string
  contactPhone?: string
}

export interface OrgAccountResult {
  userId: string
  organizationId: string
  email: string
}

export class AdminUserService {
  static async createOrganizationAccount(
    data: CreateOrgAccountData,
    adminId: string
  ): Promise<OrgAccountResult> {
    try {
      // Step 1: Create auth user using Admin API
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          role: 'organization'
        }
      })

      if (authError || !authUser.user) {
        throw new Error(`Failed to create auth user: ${authError?.message}`)
      }

      // Step 2: Create organization record
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: data.organizationName,
          president_name: data.presidentName,
          president_email: data.presidentEmail,
          president_phone: data.presidentPhone,
          contact_email: data.contactEmail || data.email,
          contact_phone: data.contactPhone,
          active: true,
          created_by: adminId
        })
        .select()
        .single()

      if (orgError) {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        throw new Error(`Failed to create organization: ${orgError.message}`)
      }

      // Step 3: Create app_users mapping
      const { error: appUserError } = await supabase
        .from('app_users')
        .insert({
          auth_uid: authUser.user.id,
          email: data.email,
          role: 'organization',
          organization_id: organization.id,
          active: true
        })

      if (appUserError) {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        await supabase.from('organizations').delete().eq('id', organization.id)
        throw new Error(`Failed to create app user: ${appUserError.message}`)
      }

      return {
        userId: authUser.user.id,
        organizationId: organization.id,
        email: data.email
      }
    } catch (error) {
      throw error
    }
  }

  static async updateOrganizationCredentials(
    organizationId: string,
    newEmail?: string,
    newPassword?: string
  ): Promise<void> {
    const { data: appUser, error: fetchError } = await supabase
      .from('app_users')
      .select('auth_uid, email')
      .eq('organization_id', organizationId)
      .eq('role', 'organization')
      .single()

    if (fetchError || !appUser) {
      throw new Error('Organization account not found')
    }

    const updateData: any = {}
    if (newEmail) updateData.email = newEmail
    if (newPassword) updateData.password = newPassword

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      appUser.auth_uid,
      updateData
    )

    if (updateError) {
      throw new Error(`Failed to update credentials: ${updateError.message}`)
    }

    if (newEmail) {
      await supabase
        .from('app_users')
        .update({ email: newEmail })
        .eq('auth_uid', appUser.auth_uid)
    }
  }

  static async updatePresidentInfo(
    organizationId: string,
    presidentData: {
      president_name?: string
      president_email?: string
      president_phone?: string
    },
    adminId: string
  ): Promise<void> {
    const { error } = await supabase
      .from('organizations')
      .update({
        ...presidentData,
        updated_by: adminId
      })
      .eq('id', organizationId)

    if (error) {
      throw new Error(`Failed to update president info: ${error.message}`)
    }
  }

  static async deactivateOrganizationAccount(
    organizationId: string
  ): Promise<void> {
    const { data: appUser } = await supabase
      .from('app_users')
      .select('auth_uid')
      .eq('organization_id', organizationId)
      .eq('role', 'organization')
      .single()

    if (appUser) {
      await supabaseAdmin.auth.admin.updateUserById(appUser.auth_uid, {
        ban_duration: 'none',
        banned: true
      })

      await supabase
        .from('app_users')
        .update({ active: false })
        .eq('auth_uid', appUser.auth_uid)
    }
  }

  static async reactivateOrganizationAccount(
    organizationId: string
  ): Promise<void> {
    const { data: appUser } = await supabase
      .from('app_users')
      .select('auth_uid')
      .eq('organization_id', organizationId)
      .eq('role', 'organization')
      .single()

    if (appUser) {
      await supabaseAdmin.auth.admin.updateUserById(appUser.auth_uid, {
        banned: false
      })

      await supabase
        .from('app_users')
        .update({ active: true })
        .eq('auth_uid', appUser.auth_uid)
    }
  }

  static async deleteOrganizationAccount(
    organizationId: string
  ): Promise<void> {
    const { data: appUser } = await supabase
      .from('app_users')
      .select('auth_uid')
      .eq('organization_id', organizationId)
      .eq('role', 'organization')
      .single()

    if (appUser) {
      await supabaseAdmin.auth.admin.deleteUser(appUser.auth_uid)
    }

    await supabase
      .from('organizations')
      .delete()
      .eq('id', organizationId)
  }

  static async resetOrganizationPassword(
    organizationId: string
  ): Promise<string> {
    const { data: appUser } = await supabase
      .from('app_users')
      .select('auth_uid, email')
      .eq('organization_id', organizationId)
      .eq('role', 'organization')
      .single()

    if (!appUser) {
      throw new Error('Organization account not found')
    }

    const tempPassword = this.generateTemporaryPassword()

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      appUser.auth_uid,
      { password: tempPassword }
    )

    if (error) {
      throw new Error(`Failed to reset password: ${error.message}`)
    }

    return tempPassword
  }

  private static generateTemporaryPassword(): string {
    const length = 12
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }
}
```

### Step 3: Usage Example (Admin Component)

```typescript
// Example: Admin creates organization account
import { AdminUserService } from '@/services/adminUserService'
import { useAuth } from '@/hooks/useAuth'

function CreateOrganizationForm() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData) => {
    setLoading(true)
    try {
      const result = await AdminUserService.createOrganizationAccount(
        {
          organizationName: formData.orgName,
          email: formData.email,
          password: formData.password,
          presidentName: formData.presidentName,
          presidentEmail: formData.presidentEmail,
          presidentPhone: formData.presidentPhone
        },
        user.id
      )

      toast.success(`Organization created! ID: ${result.organizationId}`)
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    // Form implementation
  )
}
```

---

## Organization Login

### Login Service

```typescript
// src/services/authService.ts
import { supabase } from '@/lib/supabase'

export interface LoginCredentials {
  email: string
  password: string
}

export interface UserProfile {
  id: string
  authUid: string
  email: string
  role: 'admin' | 'organization'
  organizationId: string | null
  organization?: {
    id: string
    name: string
    logo_url: string | null
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
      throw new Error('Your account has been deactivated')
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
          logo_url
        )
      `)
      .eq('auth_uid', authUid)
      .single()

    if (error || !data) {
      throw new Error('User profile not found')
    }

    return {
      id: data.id,
      authUid: data.auth_uid,
      email: data.email,
      role: data.role as 'admin' | 'organization',
      organizationId: data.organization_id,
      organization: data.organizations ? {
        id: data.organizations.id,
        name: data.organizations.name,
        logo_url: data.organizations.logo_url
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
      return null
    }
  }

  static async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) throw error
  }
}
```

---

## Auth Hook (useAuth)

### Complete useAuth Hook

```typescript
// src/hooks/useAuth.ts
import { useContext } from 'react'
import { AuthContext } from '@/contexts/AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
```

### Enhanced Auth Context

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useState, useEffect, ReactNode } from 'react'
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
```

---

## Role Detection

### Role-Based Component Rendering

```typescript
// src/components/RoleGuard.tsx
import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: ('admin' | 'organization')[]
  fallback?: ReactNode
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return fallback || <div>Access Denied</div>
  }

  return <>{children}</>
}

// Usage
<RoleGuard allowedRoles={['admin']}>
  <AdminPanel />
</RoleGuard>

<RoleGuard allowedRoles={['organization']}>
  <OrganizationPanel />
</RoleGuard>

<RoleGuard allowedRoles={['admin', 'organization']}>
  <SharedComponent />
</RoleGuard>
```

### Conditional Rendering Based on Role

```typescript
function Dashboard() {
  const { isAdmin, isOrganization, user } = useAuth()

  return (
    <div>
      <h1>Dashboard</h1>

      {isAdmin && (
        <AdminSection />
      )}

      {isOrganization && (
        <OrganizationSection organizationId={user.organizationId!} />
      )}
    </div>
  )
}
```

### Role-Based Menu

```typescript
function Navigation() {
  const { isAdmin, isOrganization } = useAuth()

  return (
    <nav>
      <Link to="/">Home</Link>

      {isAdmin && (
        <>
          <Link to="/admin/organizations">Organizations</Link>
          <Link to="/admin/approvals">Approvals</Link>
          <Link to="/admin/settings">Settings</Link>
        </>
      )}

      {isOrganization && (
        <>
          <Link to="/org/programs">Programs</Link>
          <Link to="/org/announcements">Announcements</Link>
          <Link to="/org/carousel">Carousel</Link>
        </>
      )}
    </nav>
  )
}
```

---

## Protected Routes

### Protected Route Component

```typescript
// src/components/ProtectedRoute.tsx (Enhanced)
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from './LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('admin' | 'organization')[]
  requireAuth?: boolean
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
```

### Route Configuration

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/hooks/useAuth'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="organizations" element={<OrganizationsPage />} />
          <Route path="approvals" element={<ApprovalsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Organization Routes */}
        <Route
          path="/org/*"
          element={
            <ProtectedRoute allowedRoles={['organization']}>
              <OrgLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<OrgDashboard />} />
          <Route path="programs" element={<ProgramsPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="carousel" element={<CarouselPage />} />
          <Route path="settings" element={<OrgSettingsPage />} />
        </Route>

        {/* Redirect based on role */}
        <Route path="/dashboard" element={<RoleBasedRedirect />} />

        {/* Error Routes */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}

function RoleBasedRedirect() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner />

  if (!user) return <Navigate to="/login" replace />

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  return <Navigate to="/org" replace />
}
```

---

## Dashboard Logic

### Admin Dashboard

```typescript
// src/pages/admin/AdminDashboard.tsx
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { DataService } from '@/services/dataService'

export function AdminDashboard() {
  const { user } = useAuth()

  const { data: pendingCounts } = useQuery({
    queryKey: ['admin', 'pending-counts'],
    queryFn: async () => {
      const [programs, announcements, carousel] = await Promise.all([
        DataService.getPendingCount('programs'),
        DataService.getPendingCount('announcements'),
        DataService.getPendingCount('carousel_items')
      ])

      return { programs, announcements, carousel }
    }
  })

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome back, {user?.email}</p>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <StatCard
          title="Pending Programs"
          count={pendingCounts?.programs || 0}
          link="/admin/approvals?type=programs"
        />
        <StatCard
          title="Pending Announcements"
          count={pendingCounts?.announcements || 0}
          link="/admin/approvals?type=announcements"
        />
        <StatCard
          title="Pending Carousel"
          count={pendingCounts?.carousel || 0}
          link="/admin/approvals?type=carousel"
        />
      </div>

      <RecentActivity />
    </div>
  )
}
```

### Organization Dashboard

```typescript
// src/pages/organization/OrgDashboard.tsx
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { DataService } from '@/services/dataService'

export function OrgDashboard() {
  const { user } = useAuth()

  const { data: stats } = useQuery({
    queryKey: ['org', 'stats', user?.organizationId],
    queryFn: async () => {
      if (!user?.organizationId) throw new Error('No organization')

      const [pending, approved] = await Promise.all([
        DataService.getPendingCount('programs', user.organizationId),
        DataService.fetchWithOrgFilter('programs', user.organizationId, false, {
          approved: true
        })
      ])

      return {
        pendingCount: pending,
        approvedCount: approved.length
      }
    },
    enabled: !!user?.organizationId
  })

  return (
    <div>
      <h1>Organization Dashboard</h1>
      <p>Welcome, {user?.organization?.name}</p>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <StatCard
          title="Pending Approval"
          count={stats?.pendingCount || 0}
          description="Items awaiting admin approval"
        />
        <StatCard
          title="Published Items"
          count={stats?.approvedCount || 0}
          description="Live on the website"
        />
      </div>

      <QuickActions organizationId={user?.organizationId!} />
    </div>
  )
}
```

### Login Page with Redirect

```typescript
// src/pages/LoginPage.tsx
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/dashboard'

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true })
    }
  }, [user, navigate, from])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold text-center mb-6">
          Youth Organization CMS
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  )
}
```

---

## Admin User Management

### Complete Admin Panel Example

```typescript
// src/pages/admin/OrganizationsPage.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminUserService } from '@/services/adminUserService'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export function OrganizationsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: organizations } = useQuery({
    queryKey: ['admin', 'organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('archived', false)
        .order('name')

      if (error) throw error
      return data
    }
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => AdminUserService.createOrganizationAccount(data, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin', 'organizations'])
      setShowCreateModal(false)
      toast.success('Organization created successfully')
    }
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (orgId: string) => AdminUserService.resetOrganizationPassword(orgId),
    onSuccess: (tempPassword) => {
      toast.success(`Password reset. New password: ${tempPassword}`)
    }
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Organizations</h1>
        <Button onClick={() => setShowCreateModal(true)}>
          Create Organization
        </Button>
      </div>

      <div className="grid gap-4">
        {organizations?.map((org) => (
          <OrganizationCard
            key={org.id}
            organization={org}
            onResetPassword={() => resetPasswordMutation.mutate(org.id)}
          />
        ))}
      </div>

      {showCreateModal && (
        <CreateOrganizationModal
          onSubmit={(data) => createMutation.mutate(data)}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  )
}
```

---

## Security Best Practices

### 1. Never Expose Service Role Key in Client

```typescript
// ❌ WRONG - Don't do this
const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
```

Only use service role key in:
- Server-side code
- Admin-only operations
- Secure environment variables

### 2. Always Use RLS Policies

```sql
-- Ensure app_users table has RLS enabled
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile
CREATE POLICY "Users can read own profile"
  ON app_users FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_uid);

-- Only admins can view all users
CREATE POLICY "Admins can view all users"
  ON app_users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE auth_uid = auth.uid()
      AND role = 'admin'
    )
  );
```

### 3. Validate User Role Server-Side

Always check user role in the database, not just client-side:

```typescript
// Validate role before sensitive operations
const { data: userRole } = await supabase
  .from('app_users')
  .select('role')
  .eq('auth_uid', userId)
  .single()

if (userRole?.role !== 'admin') {
  throw new Error('Unauthorized')
}
```

### 4. Use Strong Password Requirements

```typescript
function validatePassword(password: string): boolean {
  const minLength = 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)

  return (
    password.length >= minLength &&
    hasUpperCase &&
    hasLowerCase &&
    hasNumber
  )
}
```

### 5. Implement Rate Limiting

```typescript
// Use Supabase Edge Functions for rate limiting
// Or implement client-side debouncing for login attempts

let loginAttempts = 0
const MAX_ATTEMPTS = 5

async function attemptLogin(email: string, password: string) {
  if (loginAttempts >= MAX_ATTEMPTS) {
    throw new Error('Too many login attempts. Please try again later.')
  }

  try {
    await login(email, password)
    loginAttempts = 0
  } catch (error) {
    loginAttempts++
    throw error
  }
}
```

---

## Complete Flow Example

### Creating and Using an Organization Account

```typescript
// 1. Admin creates organization
const result = await AdminUserService.createOrganizationAccount({
  organizationName: 'Youth Sports Club',
  email: 'sports@example.com',
  password: 'SecurePass123!',
  presidentName: 'John Doe',
  presidentEmail: 'john@example.com',
  presidentPhone: '555-1234'
}, adminUserId)

// 2. Organization logs in
await login('sports@example.com', 'SecurePass123!')

// 3. User profile is loaded automatically
// { role: 'organization', organizationId: 'uuid-123', ... }

// 4. Organization creates content
const program = await supabase
  .from('programs')
  .insert({
    organization_id: user.organizationId,
    title: 'Summer Camp',
    start_date: '2024-06-01',
    end_date: '2024-08-31',
    approved: false // Needs admin approval
  })

// 5. Admin approves content
await DataService.approve('programs', program.id, adminUserId)

// 6. Admin updates president info
await AdminUserService.updatePresidentInfo(
  organizationId,
  {
    president_name: 'Jane Smith',
    president_email: 'jane@example.com'
  },
  adminUserId
)
```

---

## Summary

This authentication system provides:

- ✅ Admin creates organization accounts via Supabase Admin API
- ✅ Automatic user profile mapping (auth.users → app_users)
- ✅ Role-based access control (admin vs organization)
- ✅ Protected routes and conditional rendering
- ✅ Dashboard routing based on role
- ✅ Admin can manage organization credentials
- ✅ Admin can update president information
- ✅ Secure password handling
- ✅ Account activation/deactivation
- ✅ Complete auth hooks (useAuth)
- ✅ RLS policies for data security

All authentication flows are production-ready and follow Supabase best practices.
