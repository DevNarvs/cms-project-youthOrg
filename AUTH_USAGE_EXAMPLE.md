# useAuth() Hook - Complete Usage Guide

## Overview

The `useAuth()` hook provides type-safe access to Supabase authentication with extended user profile data from your database.

## Type Definitions

### AppUser Interface (from `app_users` table)

```typescript
export interface UserProfile {
  id: string
  authUid: string           // Supabase auth user ID (camelCase)
  auth_uid: string          // Supabase auth user ID (snake_case) - for convenience
  email: string
  full_name?: string        // Derived from email
  role: 'admin' | 'organization'
  organizationId: string | null      // camelCase
  organization_id: string | null     // snake_case - for convenience
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
```

### AuthContext Type

```typescript
export interface AuthContextType {
  user: User | null                    // Supabase auth User object
  appUser: UserProfile | null          // Your custom profile from app_users table
  loading: boolean
  isAdmin: boolean
  isOrganization: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
}
```

## Basic Usage

### 1. Simple Component Access

```tsx
import { useAuth } from '@/hooks/useAuth'

function UserProfile() {
  const { user, appUser, loading } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user || !appUser) {
    return <div>Not authenticated</div>
  }

  return (
    <div>
      <h1>Welcome {appUser.full_name || appUser.email}</h1>
      <p>Role: {appUser.role}</p>
      <p>Email: {appUser.email}</p>
      {appUser.organization && (
        <p>Organization: {appUser.organization.name}</p>
      )}
    </div>
  )
}
```

### 2. Role-Based Rendering

```tsx
import { useAuth } from '@/hooks/useAuth'

function Dashboard() {
  const { appUser, isAdmin, isOrganization } = useAuth()

  return (
    <div>
      {isAdmin && (
        <div>
          <h2>Admin Dashboard</h2>
          <AdminPanel />
        </div>
      )}

      {isOrganization && (
        <div>
          <h2>Organization Dashboard</h2>
          <OrgPanel organizationId={appUser?.organization_id} />
        </div>
      )}
    </div>
  )
}
```

### 3. Authentication Actions

```tsx
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const { signIn, isAdmin, isOrganization } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await signIn(email, password)

      // Redirect based on role
      if (isAdmin) {
        navigate('/admin')
      } else if (isOrganization) {
        navigate('/organization')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="error">{error}</p>}
      <button type="submit">Sign In</button>
    </form>
  )
}
```

### 4. Sign Out

```tsx
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'

function LogoutButton() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <button onClick={handleLogout}>
      Sign Out
    </button>
  )
}
```

### 5. Protected Route Component

```tsx
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

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Admin required but user is not admin
  if (requireAdmin && appUser?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  // Organization role required but user is not organization
  if (requireOrganization && appUser?.role !== 'organization') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
```

### 6. Accessing Organization Data

```tsx
import { useAuth } from '@/hooks/useAuth'

function OrganizationProfile() {
  const { appUser } = useAuth()

  // Using snake_case (matches database column names)
  const orgId = appUser?.organization_id

  // Or using camelCase
  const orgIdCamel = appUser?.organizationId

  // Both work! They're the same value

  if (!appUser?.organization) {
    return <div>No organization assigned</div>
  }

  return (
    <div>
      <h2>{appUser.organization.name}</h2>
      <p>President: {appUser.organization.president_name}</p>
      <p>Email: {appUser.organization.president_email}</p>
      <p>Phone: {appUser.organization.president_phone}</p>
    </div>
  )
}
```

### 7. Conditional UI Based on Auth State

```tsx
import { useAuth } from '@/hooks/useAuth'
import { Link } from 'react-router-dom'

function Navbar() {
  const { user, appUser, signOut, isAdmin } = useAuth()

  return (
    <nav>
      <div className="logo">
        <Link to="/">My App</Link>
      </div>

      <div className="nav-links">
        {user ? (
          <>
            <span>Hello, {appUser?.full_name || appUser?.email}</span>

            {isAdmin && (
              <Link to="/admin">Admin Panel</Link>
            )}

            <Link to="/dashboard">Dashboard</Link>

            <button onClick={signOut}>
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  )
}
```

### 8. Using in API Calls

```tsx
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

function CreateProgram() {
  const { appUser } = useAuth()

  const handleCreate = async (programData: any) => {
    if (!appUser?.organization_id) {
      throw new Error('No organization associated with user')
    }

    const { data, error } = await supabase
      .from('programs')
      .insert({
        ...programData,
        organization_id: appUser.organization_id,
        created_by: appUser.auth_uid
      })

    if (error) throw error

    return data
  }

  return <ProgramForm onSubmit={handleCreate} />
}
```

### 9. Password Update

```tsx
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

function ChangePassword() {
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')

  const { updatePassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirm) {
      setMessage('Passwords do not match')
      return
    }

    try {
      await updatePassword(newPassword)
      setMessage('Password updated successfully')
      setNewPassword('')
      setConfirm('')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Update failed')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        placeholder="New Password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      {message && <p>{message}</p>}
      <button type="submit">Update Password</button>
    </form>
  )
}
```

### 10. TypeScript Type Guards

```tsx
import { useAuth } from '@/hooks/useAuth'

function AdminOnlyFeature() {
  const { appUser, isAdmin } = useAuth()

  // TypeScript knows appUser might be null
  if (!appUser) {
    return null
  }

  // Now appUser is narrowed to UserProfile (not null)
  console.log(appUser.email) // ✅ TypeScript is happy

  // Check admin role
  if (!isAdmin) {
    return <div>Access denied</div>
  }

  // Now we know user is admin
  return (
    <AdminPanel userId={appUser.id} />
  )
}
```

## Available Properties

### From `user` (Supabase Auth User)
- `user.id` - Supabase auth user ID
- `user.email` - User email
- `user.created_at` - Account creation date
- `user.last_sign_in_at` - Last sign in timestamp
- And all other Supabase User properties...

### From `appUser` (Your Database Profile)
- `appUser.id` - Database profile ID
- `appUser.auth_uid` / `appUser.authUid` - Links to Supabase user
- `appUser.email` - User email
- `appUser.full_name` - Display name (derived from email)
- `appUser.role` - 'admin' | 'organization'
- `appUser.organization_id` / `appUser.organizationId` - Organization FK
- `appUser.organization` - Nested organization object (if loaded)
- `appUser.active` - Account active status

### Convenience Booleans
- `isAdmin` - True if appUser.role === 'admin'
- `isOrganization` - True if appUser.role === 'organization'

### State
- `loading` - True while checking authentication

### Methods
- `signIn(email, password)` - Authenticate user
- `signOut()` - Sign out user
- `updatePassword(newPassword)` - Change password

## Common Patterns

### Check if User is Authenticated
```tsx
const { user } = useAuth()
if (user) {
  // User is logged in
}
```

### Check if Profile is Loaded
```tsx
const { appUser } = useAuth()
if (appUser) {
  // Profile data is available
}
```

### Check Role
```tsx
const { isAdmin, isOrganization } = useAuth()

// Or manually:
const { appUser } = useAuth()
if (appUser?.role === 'admin') {
  // User is admin
}
```

### Wait for Auth to Load
```tsx
const { loading, user, appUser } = useAuth()

if (loading) {
  return <LoadingSpinner />
}

// Now user and appUser are definitive
```

## Error Handling

```tsx
const { signIn } = useAuth()

try {
  await signIn(email, password)
  // Success!
} catch (error) {
  if (error instanceof Error) {
    // Handle error messages:
    // - "Invalid email or password"
    // - "Your account has been deactivated"
    // - "User profile not found"
    console.error(error.message)
  }
}
```

## Best Practices

1. **Always check `loading` first**
   ```tsx
   const { loading, user, appUser } = useAuth()
   if (loading) return <Spinner />
   ```

2. **Use optional chaining for appUser properties**
   ```tsx
   appUser?.organization?.name
   ```

3. **Use type guards for TypeScript**
   ```tsx
   if (!appUser) return null
   // Now TypeScript knows appUser is not null
   ```

4. **Prefer convenience booleans for role checks**
   ```tsx
   const { isAdmin } = useAuth() // ✅ Better
   const isAdmin = appUser?.role === 'admin' // ❌ Verbose
   ```

5. **Handle sign-in errors gracefully**
   ```tsx
   try {
     await signIn(email, password)
   } catch (err) {
     setError(err instanceof Error ? err.message : 'Login failed')
   }
   ```

## Integration with App

```tsx
// main.tsx
import { AuthProvider } from '@/contexts/AuthContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)
```

```tsx
// App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminDashboard } from '@/pages/admin/AdminDashboard'
import { OrgDashboard } from '@/pages/organization/OrgDashboard'
import { LoginPage } from '@/pages/LoginPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organization/*"
          element={
            <ProtectedRoute requireOrganization>
              <OrgDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
```

## TypeScript Intellisense

With proper typing, you get full autocomplete:

```tsx
const { appUser } = useAuth()

appUser?.  // ← TypeScript shows all available properties:
           // - id, auth_uid, authUid, email, full_name,
           // - role, organization_id, organizationId,
           // - organization, active
```

---

**You now have a fully typed, production-ready auth system!** ✅
