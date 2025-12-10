import { supabase } from '@/lib/supabase'
import type { ColorPalette } from '@/types/palette'

export class PaletteService {
  private static BUCKET = 'public-assets'
  private static PATH = 'config/color-palette.json'

  static async getPalette(): Promise<ColorPalette> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET)
        .download(this.PATH)

      if (error) {
        console.warn('Palette not found in storage, using default:', error)
        return this.getDefaultPalette()
      }

      const text = await data.text()
      const palette = JSON.parse(text) as ColorPalette

      if (!this.validatePalette(palette)) {
        console.warn('Invalid palette structure, using default')
        return this.getDefaultPalette()
      }

      return palette
    } catch (error) {
      console.error('Failed to fetch palette:', error)
      return this.getDefaultPalette()
    }
  }

  static async updatePalette(
    palette: ColorPalette,
    userId: string
  ): Promise<void> {
    palette.metadata.updatedAt = new Date().toISOString()
    palette.metadata.author = userId

    if (!this.validatePalette(palette)) {
      throw new Error('Invalid palette structure')
    }

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

  static async uploadPaletteFile(file: File, userId: string): Promise<void> {
    const text = await file.text()
    const palette = JSON.parse(text) as ColorPalette

    if (!this.validatePalette(palette)) {
      throw new Error('Invalid palette file structure')
    }

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
    if (!palette || typeof palette !== 'object') {
      return false
    }

    if (!palette.version || !palette.name || !palette.colors || !palette.metadata) {
      return false
    }

    const requiredColors: Array<keyof ColorPalette['colors']> = [
      'primary',
      'secondary',
      'accent',
      'neutral',
      'success',
      'warning',
      'error'
    ]

    for (const color of requiredColors) {
      if (!palette.colors[color]) {
        return false
      }
    }

    const requiredShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

    for (const color of requiredColors) {
      for (const shade of requiredShades) {
        if (!palette.colors[color][shade]) {
          return false
        }
      }
    }

    return true
  }

  static validateColor(color: string): boolean {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/
    return hexPattern.test(color)
  }
}
