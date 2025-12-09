# Youth Organization CMS - Setup Guide

## Project Overview
A fully dynamic, content-managed website for youth organizations built with:
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS + Shadcn/UI
- **Backend**: Supabase (Auth, Postgres, Storage, Realtime)

## Tech Stack Details

### Core Framework
- **React 18.2** - Latest stable React with concurrent features
- **TypeScript 5.2** - Type safety and enhanced DX
- **Vite 5.1** - Lightning-fast HMR and optimized builds

### Styling
- **TailwindCSS 3.4** - Utility-first CSS framework
- **Shadcn/UI** - Beautifully designed components built with Radix UI
- **CSS Variables** - Dynamic color palette management
- **tailwindcss-animate** - Pre-built animations

### Backend & Data
- **Supabase Client 2.39** - Real-time database, auth, and storage
- **React Query 5.24** - Server state management and caching
- **Zustand 4.5** - Lightweight client state management

### Routing & Navigation
- **React Router DOM 6.22** - Client-side routing with nested routes

### UI Components (Radix UI Primitives)
- Dialog, Dropdown Menu, Select, Switch, Tabs
- Toast notifications, Tooltips, Labels
- All components are accessible and customizable

### Utilities
- **clsx + tailwind-merge** - Efficient className management
- **class-variance-authority** - Component variant styling
- **lucide-react** - Modern icon library
- **date-fns** - Date manipulation and formatting

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
The `.env` file is already configured with Supabase credentials:
```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

## Project Structure

```
youth-organization-cms/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── ui/             # Shadcn/UI components
│   ├── pages/              # Page components (routes)
│   ├── lib/                # Utilities and configurations
│   │   ├── supabase.ts    # Supabase client setup
│   │   └── utils.ts       # Helper functions (cn, etc.)
│   ├── hooks/              # Custom React hooks
│   ├── store/              # Zustand state stores
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # Root component with routing
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles + Tailwind
├── public/                 # Static assets
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── components.json         # Shadcn/UI configuration
```

## Key Configuration Files

### Tailwind Config (tailwind.config.js)
- Uses CSS variables for dynamic theming
- Supports light/dark mode
- Configured for Shadcn/UI components
- Custom color palette via HSL variables

### TypeScript Config (tsconfig.json)
- Strict mode enabled
- Path aliases: `@/*` maps to `./src/*`
- Modern ES2020 target

### Vite Config (vite.config.ts)
- React plugin configured
- Path alias resolution
- Optimized for development and production

## CSS Variables for Color Palette

The color system uses HSL CSS variables for easy customization:

```css
:root {
  --primary: 221.2 83.2% 53.3%;      /* Main brand color */
  --secondary: 210 40% 96.1%;        /* Secondary actions */
  --accent: 210 40% 96.1%;           /* Highlights */
  --destructive: 0 84.2% 60.2%;      /* Errors/delete actions */
  --muted: 210 40% 96.1%;            /* Disabled/subtle elements */
  --background: 0 0% 100%;            /* Page background */
  --foreground: 222.2 84% 4.9%;      /* Main text color */
  --border: 214.3 31.8% 91.4%;       /* Border color */
  --radius: 0.5rem;                   /* Border radius */
}
```

### Customizing Colors
Admin users will be able to modify these CSS variables dynamically to match their organization's branding.

## User Roles

### Admin
- Manages all content and users
- Controls color palette/theming
- Approves organization content
- Full system access

### Organization (Logged-in Account)
- Created by Admin
- Can create, edit, and archive their own content
- Content is editable until approved
- Approved content becomes locked/read-only

## Next Steps

Section 1 is complete. The project is ready for:
- Section 2: Database schema and Supabase setup
- Section 3: Authentication system
- Section 4: Admin dashboard
- Section 5: Organization portal
- Section 6: Content management features

## Development Workflow

1. **Run dev server**: `npm run dev`
2. **Check types**: `npm run build` (runs tsc)
3. **Lint code**: `npm run lint`
4. **Preview production**: `npm run preview`

## Rationale

### Why React Query?
- Automatic caching and revalidation
- Optimistic updates
- Perfect for Supabase real-time data

### Why Zustand?
- Minimal boilerplate
- No context providers needed
- Great for UI state (theme, modals, etc.)

### Why Shadcn/UI?
- Copy-paste components (no package bloat)
- Full customization
- Built on Radix UI (accessible)
- Works perfectly with Tailwind

### Why CSS Variables?
- Runtime theming without rebuilds
- Admin can change colors dynamically
- Persists to Supabase for each org

## Ready for Development
All dependencies installed. Folder structure created. Configuration complete.
