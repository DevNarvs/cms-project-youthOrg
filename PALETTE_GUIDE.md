# Dynamic Color Palette Guide

Complete guide to managing and applying dynamic color palettes in the Youth Organization CMS.

## Table of Contents
1. [Overview](#overview)
2. [Color Palette Schema](#color-palette-schema)
3. [Storage Strategy](#storage-strategy)
4. [Palette Context](#palette-context)
5. [Admin Interface](#admin-interface)
6. [Applying Colors Dynamically](#applying-colors-dynamically)
7. [CSS Variables System](#css-variables-system)
8. [Tailwind Integration](#tailwind-integration)
9. [ShadCN Component Styling](#shadcn-component-styling)
10. [Runtime Updates](#runtime-updates)
11. [Best Practices](#best-practices)

---

## Overview

### Goals
- Admin can customize site colors without code changes
- Colors stored as JSON in Supabase Storage
- Site applies palette via CSS variables
- Changes reflect immediately without page reload
- Compatible with Tailwind and ShadCN components

### Architecture

```
Admin Updates Palette
        ↓
Upload JSON to Supabase Storage
        ↓
PaletteContext fetches JSON
        ↓
Inject CSS variables into <style> tag
        ↓
Components use CSS variables
        ↓
Runtime updates propagate instantly
```

---

## Color Palette Schema

### JSON Structure

```json
{
  "version": "1.0.0",
  "name": "Default Theme",
  "colors": {
    "primary": {
      "50": "#eff6ff",
      "100": "#dbeafe",
      "200": "#bfdbfe",
      "300": "#93c5fd",
      "400": "#60a5fa",
      "500": "#3b82f6",
      "600": "#2563eb",
      "700": "#1d4ed8",
      "800": "#1e40af",
      "900": "#1e3a8a",
      "950": "#172554"
    },
    "secondary": {
      "50": "#f8fafc",
      "100": "#f1f5f9",
      "200": "#e2e8f0",
      "300": "#cbd5e1",
      "400": "#94a3b8",
      "500": "#64748b",
      "600": "#475569",
      "700": "#334155",
      "800": "#1e293b",
      "900": "#0f172a",
      "950": "#020617"
    },
    "accent": {
      "50": "#fdf4ff",
      "100": "#fae8ff",
      "200": "#f5d0fe",
      "300": "#f0abfc",
      "400": "#e879f9",
      "500": "#d946ef",
      "600": "#c026d3",
      "700": "#a21caf",
      "800": "#86198f",
      "900": "#701a75",
      "950": "#4a044e"
    },
    "neutral": {
      "50": "#fafafa",
      "100": "#f5f5f5",
      "200": "#e5e5e5",
      "300": "#d4d4d4",
      "400": "#a3a3a3",
      "500": "#737373",
      "600": "#525252",
      "700": "#404040",
      "800": "#262626",
      "900": "#171717",
      "950": "#0a0a0a"
    },
    "success": {
      "50": "#f0fdf4",
      "100": "#dcfce7",
      "200": "#bbf7d0",
      "300": "#86efac",
      "400": "#4ade80",
      "500": "#22c55e",
      "600": "#16a34a",
      "700": "#15803d",
      "800": "#166534",
      "900": "#14532d",
      "950": "#052e16"
    },
    "warning": {
      "50": "#fffbeb",
      "100": "#fef3c7",
      "200": "#fde68a",
      "300": "#fcd34d",
      "400": "#fbbf24",
      "500": "#f59e0b",
      "600": "#d97706",
      "700": "#b45309",
      "800": "#92400e",
      "900": "#78350f",
      "950": "#451a03"
    },
    "error": {
      "50": "#fef2f2",
      "100": "#fee2e2",
      "200": "#fecaca",
      "300": "#fca5a5",
      "400": "#f87171",
      "500": "#ef4444",
      "600": "#dc2626",
      "700": "#b91c1c",
      "800": "#991b1b",
      "900": "#7f1d1d",
      "950": "#450a0a"
    }
  },
  "semantic": {
    "background": "#ffffff",
    "foreground": "#0a0a0a",
    "card": "#ffffff",
    "cardForeground": "#0a0a0a",
    "popover": "#ffffff",
    "popoverForeground": "#0a0a0a",
    "muted": "#f5f5f5",
    "mutedForeground": "#737373",
    "border": "#e5e5e5",
    "input": "#e5e5e5",
    "ring": "#3b82f6"
  },
  "metadata": {
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z",
    "author": "Admin"
  }
}
```

### TypeScript Types

```typescript
// src/types/palette.ts
export interface ColorShades {
  50: string
  100: string
  200: string
  300: string
  400: string
  500: string
  600: string
  700: string
  800: string
  900: string
  950: string
}

export interface SemanticColors {
  background: string
  foreground: string
  card: string
  cardForeground: string
  popover: string
  popoverForeground: string
  muted: string
  mutedForeground: string
  border: string
  input: string
  ring: string
}

export interface ColorPalette {
  version: string
  name: string
  colors: {
    primary: ColorShades
    secondary: ColorShades
    accent: ColorShades
    neutral: ColorShades
    success: ColorShades
    warning: ColorShades
    error: ColorShades
  }
  semantic: SemanticColors
  metadata: {
    createdAt: string
    updatedAt: string
    author: string
  }
}
```

---

## Storage Strategy

### Supabase Storage Setup

```typescript
// File location in Supabase Storage
const PALETTE_BUCKET = 'public-assets'
const PALETTE_PATH = 'config/color-palette.json'

// Storage structure
/*
public-assets/
  └── config/
      └── color-palette.json
*/
```

### Palette Service

```typescript
// src/services/paletteService.ts
import { supabase } from '@/lib/supabase'
import type { ColorPalette } from '@/types/palette'

export class PaletteService {
  private static BUCKET = 'public-assets'
  private static PATH = 'config/color-palette.json'

  static async getPalette(): Promise<ColorPalette> {
    const { data, error } = await supabase.storage
      .from(this.BUCKET)
      .download(this.PATH)

    if (error) {
      console.error('Failed to fetch palette:', error)
      return this.getDefaultPalette()
    }

    const text = await data.text()
    return JSON.parse(text) as ColorPalette
  }

  static async updatePalette(
    palette: ColorPalette,
    userId: string
  ): Promise<void> {
    palette.metadata.updatedAt = new Date().toISOString()
    palette.metadata.author = userId

    const blob = new Blob([JSON.stringify(palette, null, 2)], {
      type: 'application/json'
    })

    const { error } = await supabase.storage
      .from(this.BUCKET)
      .upload(this.PATH, blob, {
        upsert: true,
        contentType: 'application/json'
      })

    if (error) {
      throw new Error(`Failed to update palette: ${error.message}`)
    }
  }

  static async uploadPalette(file: File, userId: string): Promise<void> {
    const text = await file.text()
    const palette = JSON.parse(text) as ColorPalette

    palette.metadata.updatedAt = new Date().toISOString()
    palette.metadata.author = userId

    await this.updatePalette(palette, userId)
  }

  static async exportPalette(): Promise<Blob> {
    const palette = await this.getPalette()
    return new Blob([JSON.stringify(palette, null, 2)], {
      type: 'application/json'
    })
  }

  static getDefaultPalette(): ColorPalette {
    return {
      version: '1.0.0',
      name: 'Default Theme',
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554'
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        },
        accent: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
          950: '#4a044e'
        },
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a'
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16'
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03'
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a'
        }
      },
      semantic: {
        background: '#ffffff',
        foreground: '#0a0a0a',
        card: '#ffffff',
        cardForeground: '#0a0a0a',
        popover: '#ffffff',
        popoverForeground: '#0a0a0a',
        muted: '#f5f5f5',
        mutedForeground: '#737373',
        border: '#e5e5e5',
        input: '#e5e5e5',
        ring: '#3b82f6'
      },
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: 'System'
      }
    }
  }

  static validatePalette(palette: any): palette is ColorPalette {
    if (!palette.version || !palette.name || !palette.colors) {
      return false
    }

    const requiredColors = ['primary', 'secondary', 'accent', 'neutral', 'success', 'warning', 'error']
    for (const color of requiredColors) {
      if (!palette.colors[color]) return false
    }

    const requiredShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']
    for (const color of requiredColors) {
      for (const shade of requiredShades) {
        if (!palette.colors[color][shade]) return false
      }
    }

    return true
  }
}
```

---

## Palette Context

### PaletteContext Implementation

```typescript
// src/contexts/PaletteContext.tsx
import { createContext, useEffect, useState, ReactNode } from 'react'
import { PaletteService } from '@/services/paletteService'
import type { ColorPalette } from '@/types/palette'

interface PaletteContextType {
  palette: ColorPalette
  loading: boolean
  updatePalette: (palette: ColorPalette, userId: string) => Promise<void>
  refreshPalette: () => Promise<void>
  exportPalette: () => Promise<void>
}

export const PaletteContext = createContext<PaletteContextType | undefined>(undefined)

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [palette, setPalette] = useState<ColorPalette>(PaletteService.getDefaultPalette())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPalette()
  }, [])

  useEffect(() => {
    if (palette) {
      applyPalette(palette)
    }
  }, [palette])

  const loadPalette = async () => {
    try {
      const data = await PaletteService.getPalette()
      setPalette(data)
    } catch (error) {
      console.error('Failed to load palette:', error)
    } finally {
      setLoading(false)
    }
  }

  const updatePalette = async (newPalette: ColorPalette, userId: string) => {
    await PaletteService.updatePalette(newPalette, userId)
    setPalette(newPalette)
  }

  const refreshPalette = async () => {
    setLoading(true)
    await loadPalette()
  }

  const exportPalette = async () => {
    const blob = await PaletteService.exportPalette()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `palette-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <PaletteContext.Provider
      value={{
        palette,
        loading,
        updatePalette,
        refreshPalette,
        exportPalette
      }}
    >
      {children}
    </PaletteContext.Provider>
  )
}

function applyPalette(palette: ColorPalette) {
  const root = document.documentElement
  const style = document.getElementById('dynamic-palette') || document.createElement('style')

  if (!style.id) {
    style.id = 'dynamic-palette'
    document.head.appendChild(style)
  }

  const cssVariables: string[] = [':root {']

  Object.entries(palette.colors).forEach(([colorName, shades]) => {
    Object.entries(shades).forEach(([shade, value]) => {
      cssVariables.push(`  --color-${colorName}-${shade}: ${value};`)
    })
  })

  Object.entries(palette.semantic).forEach(([key, value]) => {
    const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
    cssVariables.push(`  --color-${kebabKey}: ${value};`)
  })

  cssVariables.push('}')

  style.textContent = cssVariables.join('\n')
}
```

### usePalette Hook

```typescript
// src/hooks/usePalette.ts
import { useContext } from 'react'
import { PaletteContext } from '@/contexts/PaletteContext'

export function usePalette() {
  const context = useContext(PaletteContext)

  if (!context) {
    throw new Error('usePalette must be used within PaletteProvider')
  }

  return context
}

// Usage examples:
// const { palette, updatePalette } = usePalette()
// const primaryColor = palette.colors.primary[500]
```

---

## Admin Interface

### PaletteManager Component

```typescript
// src/components/features/PaletteManager.tsx
import { useState } from 'react'
import { usePalette } from '@/hooks/usePalette'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Label } from '@/components/ui/Label'
import type { ColorPalette, ColorShades } from '@/types/palette'

export function PaletteManager() {
  const { palette, updatePalette, exportPalette, refreshPalette } = usePalette()
  const { user } = useAuth()
  const [editedPalette, setEditedPalette] = useState<ColorPalette>(palette)
  const [saving, setSaving] = useState(false)
  const [activeColor, setActiveColor] = useState<keyof ColorPalette['colors']>('primary')

  const handleColorChange = (shade: keyof ColorShades, value: string) => {
    setEditedPalette(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [activeColor]: {
          ...prev.colors[activeColor],
          [shade]: value
        }
      }
    }))
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      await updatePalette(editedPalette, user.id)
      alert('Palette saved successfully!')
    } catch (error) {
      alert(`Failed to save palette: ${error}`)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setEditedPalette(palette)
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    try {
      const text = await file.text()
      const imported = JSON.parse(text) as ColorPalette
      setEditedPalette(imported)
    } catch (error) {
      alert('Invalid palette file')
    }
  }

  const colorNames: Array<keyof ColorPalette['colors']> = [
    'primary',
    'secondary',
    'accent',
    'neutral',
    'success',
    'warning',
    'error'
  ]

  const shades: Array<keyof ColorShades> = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Color Palette Manager</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportPalette}>
            Export
          </Button>
          <label>
            <Button variant="outline" as="span">
              Import
            </Button>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
          </label>
          <Button variant="outline" onClick={refreshPalette}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex gap-4 border-b pb-2">
        {colorNames.map(name => (
          <button
            key={name}
            onClick={() => setActiveColor(name)}
            className={`px-4 py-2 rounded transition capitalize ${
              activeColor === name
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 capitalize">
          {activeColor} Color Shades
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {shades.map(shade => (
            <div key={shade}>
              <Label htmlFor={`${activeColor}-${shade}`}>
                Shade {shade}
              </Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id={`${activeColor}-${shade}`}
                  type="color"
                  value={editedPalette.colors[activeColor][shade]}
                  onChange={(e) => handleColorChange(shade, e.target.value)}
                  className="w-16 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={editedPalette.colors[activeColor][shade]}
                  onChange={(e) => handleColorChange(shade, e.target.value)}
                  className="flex-1 font-mono text-sm"
                  placeholder="#000000"
                />
              </div>
              <div
                className="h-8 rounded mt-2 border"
                style={{ backgroundColor: editedPalette.colors[activeColor][shade] }}
              />
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={handleReset}>
          Reset Changes
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Palette'}
        </Button>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Preview</h3>
        <div className="grid grid-cols-7 gap-2">
          {colorNames.map(name => (
            <div key={name} className="space-y-1">
              <p className="text-xs font-medium capitalize text-center">{name}</p>
              {shades.map(shade => (
                <div
                  key={shade}
                  className="h-8 rounded"
                  style={{ backgroundColor: editedPalette.colors[name][shade] }}
                  title={`${name}-${shade}: ${editedPalette.colors[name][shade]}`}
                />
              ))}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
```

---

## Applying Colors Dynamically

### Using CSS Variables in Components

```typescript
// Direct CSS variable usage
<div style={{ color: 'var(--color-primary-500)' }}>
  Primary Text
</div>

<div style={{ backgroundColor: 'var(--color-secondary-100)' }}>
  Secondary Background
</div>

// Using inline styles with palette
function MyComponent() {
  const { palette } = usePalette()

  return (
    <div style={{ color: palette.colors.primary[500] }}>
      Dynamic Color
    </div>
  )
}
```

### Tailwind Configuration

```javascript
// tailwind.config.js - Extended for CSS variables
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
          950: 'var(--color-primary-950)',
        },
        secondary: {
          50: 'var(--color-secondary-50)',
          100: 'var(--color-secondary-100)',
          200: 'var(--color-secondary-200)',
          300: 'var(--color-secondary-300)',
          400: 'var(--color-secondary-400)',
          500: 'var(--color-secondary-500)',
          600: 'var(--color-secondary-600)',
          700: 'var(--color-secondary-700)',
          800: 'var(--color-secondary-800)',
          900: 'var(--color-secondary-900)',
          950: 'var(--color-secondary-950)',
        },
        // ... repeat for accent, neutral, success, warning, error
      }
    }
  }
}
```

### Using Tailwind Classes

```typescript
// These now reference CSS variables automatically
<button className="bg-primary-500 text-white hover:bg-primary-600">
  Primary Button
</button>

<div className="bg-secondary-100 text-secondary-900">
  Secondary Background
</div>

<div className="border-accent-500 text-accent-700">
  Accent Border
</div>
```

---

## CSS Variables System

### Generated CSS Output

```css
:root {
  /* Primary Colors */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;
  --color-primary-950: #172554;

  /* Semantic Colors */
  --color-background: #ffffff;
  --color-foreground: #0a0a0a;
  --color-card: #ffffff;
  --color-card-foreground: #0a0a0a;
  --color-border: #e5e5e5;
  --color-input: #e5e5e5;
  --color-ring: #3b82f6;
}
```

### Accessing in JavaScript

```typescript
// Get CSS variable value
const primaryColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--color-primary-500')

// Set CSS variable value
document.documentElement.style.setProperty(
  '--color-primary-500',
  '#3b82f6'
)

// Using in styled components
const StyledDiv = styled.div`
  color: var(--color-primary-500);
  background: var(--color-secondary-100);
`
```

---

## ShadCN Component Styling

### Button Component with Dynamic Colors

```typescript
// src/components/ui/Button.tsx
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const buttonVariants = {
  default: 'bg-primary-500 text-white hover:bg-primary-600',
  secondary: 'bg-secondary-200 text-secondary-900 hover:bg-secondary-300',
  outline: 'border border-primary-500 text-primary-700 hover:bg-primary-50',
  ghost: 'hover:bg-secondary-100 text-secondary-900',
  danger: 'bg-error-500 text-white hover:bg-error-600',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'px-4 py-2 rounded font-medium transition',
          buttonVariants[variant],
          className
        )}
        {...props}
      />
    )
  }
)
```

### Card Component with Dynamic Colors

```typescript
// Dynamic card styling
<Card className="bg-card text-card-foreground border-border">
  <CardHeader className="border-b border-border">
    <CardTitle className="text-foreground">
      Card Title
    </CardTitle>
  </CardHeader>
  <CardContent className="text-muted-foreground">
    Card content
  </CardContent>
</Card>
```

---

## Runtime Updates

### Immediate Propagation

```typescript
// When palette updates, CSS variables change instantly
function updatePaletteExample() {
  const { updatePalette } = usePalette()

  const newPalette = {
    ...currentPalette,
    colors: {
      ...currentPalette.colors,
      primary: {
        ...currentPalette.colors.primary,
        500: '#ff0000' // Change to red
      }
    }
  }

  // All components using primary-500 update immediately
  await updatePalette(newPalette, userId)
}
```

### Preview Mode

```typescript
// src/components/features/PalettePreview.tsx
export function PalettePreview({ palette }: { palette: ColorPalette }) {
  useEffect(() => {
    // Apply temporary preview
    applyPalettePreview(palette)

    return () => {
      // Restore original on unmount
      const { palette: original } = usePalette()
      applyPalettePreview(original)
    }
  }, [palette])

  return (
    <div>
      <Button>Preview Button</Button>
      <Card>Preview Card</Card>
    </div>
  )
}

function applyPalettePreview(palette: ColorPalette) {
  Object.entries(palette.colors).forEach(([colorName, shades]) => {
    Object.entries(shades).forEach(([shade, value]) => {
      document.documentElement.style.setProperty(
        `--color-${colorName}-${shade}`,
        value
      )
    })
  })
}
```

---

## Best Practices

### 1. Always Use CSS Variables

```typescript
// ✅ Good - Uses CSS variables
<div className="bg-primary-500 text-white">
  Content
</div>

// ❌ Bad - Hardcoded colors
<div className="bg-blue-500 text-white">
  Content
</div>
```

### 2. Provide Fallbacks

```css
/* Fallback for unsupported browsers */
.element {
  background: #3b82f6; /* Fallback */
  background: var(--color-primary-500);
}
```

### 3. Validate Palette Changes

```typescript
function validateColor(color: string): boolean {
  const hexPattern = /^#[0-9A-F]{6}$/i
  return hexPattern.test(color)
}

// Before saving
if (!validateColor(newColor)) {
  throw new Error('Invalid color format')
}
```

### 4. Cache Palette Data

```typescript
// Use React Query for caching
const { data: palette } = useQuery({
  queryKey: ['palette'],
  queryFn: () => PaletteService.getPalette(),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000 // 10 minutes
})
```

### 5. Test Color Contrast

```typescript
// Check WCAG contrast ratios
function getContrastRatio(color1: string, color2: string): number {
  const l1 = getLuminance(color1)
  const l2 = getLuminance(color2)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

// Ensure minimum 4.5:1 for normal text
if (getContrastRatio(textColor, bgColor) < 4.5) {
  console.warn('Insufficient contrast ratio')
}
```

### 6. Version Control

```typescript
// Track palette versions
interface PaletteVersion {
  version: string
  palette: ColorPalette
  timestamp: string
}

const history: PaletteVersion[] = []

function savePaletteVersion(palette: ColorPalette) {
  history.push({
    version: palette.version,
    palette: { ...palette },
    timestamp: new Date().toISOString()
  })
}
```

---

## Complete Implementation Example

```typescript
// src/App.tsx
import { PaletteProvider } from '@/contexts/PaletteContext'
import { AuthProvider } from '@/contexts/AuthContext'

function App() {
  return (
    <AuthProvider>
      <PaletteProvider>
        <YourApp />
      </PaletteProvider>
    </AuthProvider>
  )
}

// src/pages/admin/PaletteSettingsPage.tsx
import { PaletteManager } from '@/components/features/PaletteManager'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export function PaletteSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="container mx-auto py-8">
        <PaletteManager />
      </div>
    </ProtectedRoute>
  )
}

// Usage in any component
function MyComponent() {
  const { palette } = usePalette()

  return (
    <div className="bg-primary-500 text-white p-4 rounded">
      <h1>Current Theme: {palette.name}</h1>
      <p style={{ color: palette.colors.accent[500] }}>
        Accent colored text
      </p>
    </div>
  )
}
```

---

## Summary

The dynamic color palette system provides:

- ✅ Admin interface for color customization
- ✅ JSON storage in Supabase
- ✅ CSS variables for dynamic application
- ✅ Full Tailwind integration
- ✅ ShadCN component compatibility
- ✅ Real-time updates without page reload
- ✅ Import/export functionality
- ✅ Color preview and validation
- ✅ Type-safe TypeScript implementation

All components automatically respond to palette changes through CSS variable cascading.
