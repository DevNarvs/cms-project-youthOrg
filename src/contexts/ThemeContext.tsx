import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import type { Organization } from '@/types/database'

interface ThemeContextType {
  primaryColor: string
  secondaryColor: string
  updateTheme: (primary: string, secondary: string) => void
  organization: Organization | null
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { appUser } = useAuth()
  const [primaryColor, setPrimaryColor] = useState('#3b82f6')
  const [secondaryColor, setSecondaryColor] = useState('#64748b')
  const [organization, setOrganization] = useState<Organization | null>(null)

  useEffect(() => {
    if (appUser?.organization_id) {
      fetchOrganizationTheme(appUser.organization_id)
    } else {
      setDefaultTheme()
    }
  }, [appUser?.organization_id])

  const fetchOrganizationTheme = async (organizationId: string) => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .eq('archived', false)
        .maybeSingle()

      if (error) throw error

      if (data) {
        const org = data as Organization
        setOrganization(org)
        applyTheme(org.primary_color, org.secondary_color)
      }
    } catch (error) {
      console.error('Error fetching organization theme:', error)
      setDefaultTheme()
    }
  }

  const setDefaultTheme = () => {
    setOrganization(null)
    applyTheme('#3b82f6', '#64748b')
  }

  const applyTheme = (primary: string, secondary: string) => {
    setPrimaryColor(primary)
    setSecondaryColor(secondary)

    const root = document.documentElement
    const hsl = hexToHSL(primary)
    root.style.setProperty('--primary', hsl)
  }

  const updateTheme = (primary: string, secondary: string) => {
    applyTheme(primary, secondary)
  }

  const hexToHSL = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    if (!result) return '221.2 83.2% 53.3%'

    let r = parseInt(result[1], 16) / 255
    let g = parseInt(result[2], 16) / 255
    let b = parseInt(result[3], 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    let h = 0
    let s = 0
    const l = (max + min) / 2

    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6
          break
        case g:
          h = ((b - r) / d + 2) / 6
          break
        case b:
          h = ((r - g) / d + 4) / 6
          break
      }
    }

    h = Math.round(h * 360)
    s = Math.round(s * 100)
    const lPercent = Math.round(l * 100)

    return `${h} ${s}% ${lPercent}%`
  }

  return (
    <ThemeContext.Provider
      value={{
        primaryColor,
        secondaryColor,
        updateTheme,
        organization,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
