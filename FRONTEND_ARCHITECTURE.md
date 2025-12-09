# Frontend Architecture Documentation

## Overview
The frontend is built with React 18, TypeScript, Vite, TailwindCSS, and Shadcn/UI. It implements a role-based architecture with separate layouts and routes for Admin, Organization, and Public users.

## Project Structure

```
src/
├── components/               # Reusable UI components
│   ├── layouts/             # Layout components
│   │   ├── AdminLayout.tsx  # Admin dashboard layout
│   │   ├── OrgLayout.tsx    # Organization dashboard layout
│   │   └── PublicLayout.tsx # Public-facing layout
│   ├── Navbar.tsx           # Main navigation component
│   ├── ProtectedRoute.tsx   # Route protection wrapper
│   ├── LoadingSpinner.tsx   # Loading indicator
│   ├── ErrorMessage.tsx     # Error display component
│   └── EmptyState.tsx       # Empty state placeholder
├── contexts/                # React contexts
│   ├── AuthContext.tsx      # Authentication state & methods
│   └── ThemeContext.tsx     # Dynamic theme/palette management
├── hooks/                   # Custom React hooks
│   └── useRequireAuth.ts    # Authentication requirement hook
├── lib/                     # Utilities & configurations
│   ├── supabase.ts         # Supabase client instance
│   └── utils.ts            # Helper functions (cn, etc.)
├── pages/                   # Page components (routes)
│   ├── HomePage.tsx         # Public home page
│   ├── ProgramsPage.tsx     # Public programs listing
│   ├── AboutPage.tsx        # Public about page
│   ├── OrganizationsPage.tsx # Public organizations listing
│   ├── LoginPage.tsx        # Authentication page
│   ├── admin/              # Admin-only pages
│   │   └── AdminDashboard.tsx
│   └── organization/       # Organization-only pages
│       └── OrgDashboard.tsx
├── store/                   # State management (Zustand)
├── types/                   # TypeScript type definitions
│   └── database.ts         # Database schema types
├── App.tsx                  # Root component with routing
├── main.tsx                # Application entry point
└── index.css               # Global styles + Tailwind
```

## Core Architecture Components

### 1. Authentication (AuthContext)

**Location**: `src/contexts/AuthContext.tsx`

Manages authentication state and provides authentication methods throughout the app.

**State:**
- `user`: Current Supabase auth user
- `session`: Current auth session
- `appUser`: User data from `app_users` table (includes role)
- `loading`: Authentication loading state

**Methods:**
- `signIn(email, password)`: Authenticate user
- `signOut()`: End user session
- `isAdmin`: Boolean flag for admin role
- `isOrganization`: Boolean flag for organization role

**Usage:**
```typescript
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, appUser, isAdmin, signOut } = useAuth()

  if (!user) return <div>Please sign in</div>

  return (
    <div>
      Welcome {appUser?.full_name}
      {isAdmin && <AdminControls />}
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

### 2. Theme Management (ThemeContext)

**Location**: `src/contexts/ThemeContext.tsx`

Manages dynamic color theming based on organization branding.

**State:**
- `primaryColor`: Current primary brand color (hex)
- `secondaryColor`: Current secondary brand color (hex)
- `organization`: Current organization data (for org users)

**Methods:**
- `updateTheme(primary, secondary)`: Update color palette

**How it works:**
1. Fetches organization data when organization user logs in
2. Applies organization's colors by updating CSS variables
3. Colors persist across page navigation
4. Converts hex colors to HSL for Tailwind compatibility

**Usage:**
```typescript
import { useTheme } from '@/contexts/ThemeContext'

function BrandedComponent() {
  const { primaryColor, organization } = useTheme()

  return (
    <div>
      <h1 style={{ color: primaryColor }}>{organization?.name}</h1>
    </div>
  )
}
```

### 3. Protected Routes

**Location**: `src/components/ProtectedRoute.tsx`

Wrapper component that enforces authentication and role requirements.

**Props:**
- `requireAdmin`: Only allow admin users
- `requireOrganization`: Only allow organization users
- `children`: Protected content

**Features:**
- Shows loading spinner while checking auth
- Redirects to `/login` if not authenticated
- Redirects to `/` if role requirement not met

**Usage:**
```typescript
<Route
  path="/admin"
  element={
    <ProtectedRoute requireAdmin>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
```

## Routing Structure

### Public Routes (No Authentication Required)
- `/` - Home page
- `/programs` - Programs listing
- `/about` - About page
- `/organizations` - Organizations directory
- `/login` - Sign in page

### Admin Routes (Admin Role Required)
- `/admin` - Admin dashboard
- `/admin/organizations` - Manage organizations
- `/admin/users` - Manage users
- `/admin/carousel` - Manage carousel items
- `/admin/announcements` - Manage announcements
- `/admin/programs` - Manage programs
- `/admin/settings` - System settings

### Organization Routes (Organization Role Required)
- `/dashboard` - Organization dashboard
- `/dashboard/carousel` - Manage carousel items
- `/dashboard/announcements` - Manage announcements
- `/dashboard/programs` - Manage programs
- `/dashboard/files` - Manage files

## Layout Components

### AdminLayout

**Purpose**: Provides consistent layout for admin pages with sidebar navigation.

**Features:**
- Vertical sidebar with admin navigation items
- Active route highlighting
- User profile display
- Sign out button
- Link to public site

**Navigation Items:**
- Dashboard
- Organizations
- Users
- Carousel
- Announcements
- Programs
- Settings

### OrgLayout

**Purpose**: Provides consistent layout for organization pages with sidebar navigation.

**Features:**
- Vertical sidebar with organization navigation items
- Organization logo and name display
- Active route highlighting
- User profile display
- Sign out button
- Link to public site

**Navigation Items:**
- Dashboard
- Carousel Items
- Announcements
- Programs
- Files

### PublicLayout

**Purpose**: Provides consistent layout for public-facing pages.

**Features:**
- Top navigation bar (Navbar component)
- Footer with copyright
- Responsive design
- Dynamic theming support

## App.tsx Structure

```typescript
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>              {/* Authentication context */}
          <ThemeProvider>           {/* Theme/palette context */}
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />

              {/* Protected admin routes */}
              <Route path="/admin" element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } />

              {/* Protected organization routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute requireOrganization>
                  <OrgDashboard />
                </ProtectedRoute>
              } />
            </Routes>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
```

**Provider Hierarchy:**
1. QueryClientProvider - React Query for server state
2. BrowserRouter - Routing
3. AuthProvider - Authentication state
4. ThemeProvider - Dynamic theming (requires auth context)

## State Management Strategy

### Server State (React Query)
- Use for all database queries
- Automatic caching and revalidation
- Optimistic updates
- Background refetching

**Example:**
```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

function ProgramsList() {
  const { data, isLoading } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data } = await supabase
        .from('programs')
        .select('*')
        .eq('approved', true)
        .eq('archived', false)
      return data
    }
  })

  if (isLoading) return <LoadingSpinner />

  return <div>{/* render programs */}</div>
}
```

### Global State (Context API)
- Authentication state (AuthContext)
- Theme/palette state (ThemeContext)
- Persist minimal global state
- Avoid prop drilling

### Local State (useState/useReducer)
- Form inputs
- UI toggles
- Component-specific state

### Optional: Zustand for Complex UI State
- Modal open/close state
- Multi-step form state
- Complex UI interactions

## Common Components

### LoadingSpinner
Simple loading indicator for async operations.

**Usage:**
```typescript
if (isLoading) return <LoadingSpinner />
```

### ErrorMessage
Styled error message display with icon.

**Usage:**
```typescript
{error && <ErrorMessage message={error.message} />}
```

### EmptyState
Placeholder for empty data states with optional action.

**Usage:**
```typescript
<EmptyState
  icon={<FileText className="h-12 w-12" />}
  title="No programs yet"
  description="Create your first program to get started"
  action={<Button onClick={handleCreate}>Create Program</Button>}
/>
```

## Styling Approach

### TailwindCSS
- Utility-first CSS framework
- Custom design system via `tailwind.config.js`
- Responsive design with breakpoints
- Dark mode support via CSS variables

### CSS Variables
Dynamic theming through HSL color variables:
```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96.1%;
  /* ... */
}
```

### Class Composition
Use the `cn()` utility for conditional classes:
```typescript
import { cn } from '@/lib/utils'

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  isDisabled && 'disabled-classes'
)} />
```

## Navigation Flow

### Unauthenticated User
1. Visits any public page → Allowed
2. Visits protected page → Redirected to `/login`
3. Signs in → Redirected based on role:
   - Admin → `/admin`
   - Organization → `/dashboard`

### Admin User
1. Full access to all pages
2. Can manage all organizations and content
3. Can approve/reject content

### Organization User
1. Access to public pages
2. Access to their own dashboard
3. Can create/edit their own content
4. Cannot edit approved content
5. Cannot see other organizations' data

## Security Considerations

### Client-Side
- Protected routes prevent unauthorized access
- Role checks before rendering admin features
- Redirect unauthorized users appropriately

### Server-Side (Supabase RLS)
- All security enforced via Row Level Security policies
- Client-side checks are for UX only
- Never trust client-side authorization
- Always verify permissions on server

## Best Practices

### Component Organization
1. Keep components small and focused
2. Extract reusable logic into custom hooks
3. Use composition over inheritance
4. Co-locate related files

### Performance
1. Use React Query for server state
2. Implement proper loading states
3. Lazy load route components if needed
4. Optimize images and assets

### Type Safety
1. Define proper TypeScript interfaces
2. Use database types from `database.ts`
3. Avoid `any` types
4. Type all function parameters and returns

### Error Handling
1. Display user-friendly error messages
2. Log errors for debugging
3. Provide fallback UI for errors
4. Handle loading and error states

## Next Steps for Development

### Immediate
1. Implement specific admin pages (organizations, users, etc.)
2. Implement specific organization pages (carousel, announcements, etc.)
3. Add form validation
4. Implement file upload functionality

### Future
1. Add real-time subscriptions for live updates
2. Implement search and filtering
3. Add pagination for large datasets
4. Implement data export functionality
5. Add more comprehensive error boundaries
