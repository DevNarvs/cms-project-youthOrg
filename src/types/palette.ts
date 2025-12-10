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

export type ColorName = keyof ColorPalette['colors']
export type ShadeLevel = keyof ColorShades
