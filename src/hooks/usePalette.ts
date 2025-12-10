import { useContext } from 'react'
import { PaletteContext } from '@/contexts/PaletteContext'

export function usePalette() {
  const context = useContext(PaletteContext)

  if (!context) {
    throw new Error('usePalette must be used within PaletteProvider')
  }

  return context
}
