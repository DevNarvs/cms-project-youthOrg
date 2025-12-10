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
      applyPaletteToDom(palette)
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
    a.download = `color-palette-${Date.now()}.json`
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

function applyPaletteToDom(palette: ColorPalette) {
  let style = document.getElementById('dynamic-palette-vars') as HTMLStyleElement

  if (!style) {
    style = document.createElement('style')
    style.id = 'dynamic-palette-vars'
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
