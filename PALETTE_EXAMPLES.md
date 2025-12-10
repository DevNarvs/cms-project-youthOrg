# Color Palette Usage Examples

Quick reference for using the dynamic color palette system in components.

## Basic Usage

### 1. Using usePalette Hook

```typescript
import { usePalette } from '@/hooks/usePalette'

function MyComponent() {
  const { palette } = usePalette()

  return (
    <div style={{ color: palette.colors.primary[500] }}>
      Direct color access
    </div>
  )
}
```

### 2. Using CSS Variables with Tailwind

```typescript
function ButtonExample() {
  return (
    <div className="space-y-4">
      {/* Background colors */}
      <button className="bg-primary-500 text-white px-4 py-2 rounded">
        Primary Button
      </button>

      <button className="bg-secondary-600 text-white px-4 py-2 rounded">
        Secondary Button
      </button>

      {/* Text colors */}
      <p className="text-primary-700">Primary text</p>
      <p className="text-accent-500">Accent text</p>

      {/* Border colors */}
      <div className="border-2 border-primary-500 p-4">
        Primary border
      </div>

      {/* Hover states */}
      <button className="bg-success-500 hover:bg-success-600 px-4 py-2">
        Success with hover
      </button>
    </div>
  )
}
```

### 3. Using Inline Styles with CSS Variables

```typescript
function InlineStyleExample() {
  return (
    <div>
      <div style={{ backgroundColor: 'var(--color-primary-500)' }}>
        Using CSS variable directly
      </div>

      <div style={{
        color: 'var(--color-secondary-700)',
        borderColor: 'var(--color-accent-300)'
      }}>
        Multiple CSS variables
      </div>
    </div>
  )
}
```

## Advanced Examples

### 4. Dynamic Color Component

```typescript
import { usePalette } from '@/hooks/usePalette'
import type { ColorName, ShadeLevel } from '@/types/palette'

interface DynamicColorBoxProps {
  color: ColorName
  shade: ShadeLevel
  children: React.ReactNode
}

function DynamicColorBox({ color, shade, children }: DynamicColorBoxProps) {
  const { palette } = usePalette()
  const bgColor = palette.colors[color][shade]

  return (
    <div
      className="p-6 rounded-lg"
      style={{ backgroundColor: bgColor, color: '#fff' }}
    >
      {children}
    </div>
  )
}

// Usage
<DynamicColorBox color="primary" shade="500">
  Hello World
</DynamicColorBox>
```

### 5. Theme-Aware Card Component

```typescript
function ThemedCard({ title, children }) {
  return (
    <div className="bg-card text-card-foreground border border-border rounded-lg shadow-sm">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>
      <div className="p-6 text-muted-foreground">
        {children}
      </div>
    </div>
  )
}
```

### 6. Status Badge with Dynamic Colors

```typescript
type Status = 'success' | 'warning' | 'error' | 'primary'

interface StatusBadgeProps {
  status: Status
  label: string
}

function StatusBadge({ status, label }: StatusBadgeProps) {
  const bgClass = `bg-${status}-100`
  const textClass = `text-${status}-700`
  const borderClass = `border-${status}-300`

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${bgClass} ${textClass} ${borderClass}`}>
      {label}
    </span>
  )
}

// Usage
<StatusBadge status="success" label="Active" />
<StatusBadge status="warning" label="Pending" />
<StatusBadge status="error" label="Inactive" />
```

### 7. Gradient Background

```typescript
function GradientHero() {
  const { palette } = usePalette()

  return (
    <div
      className="h-64 flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${palette.colors.primary[500]}, ${palette.colors.accent[500]})`
      }}
    >
      <h1 className="text-4xl font-bold text-white">
        Gradient Header
      </h1>
    </div>
  )
}
```

### 8. Progress Bar with Dynamic Color

```typescript
interface ProgressBarProps {
  value: number
  max: number
  color?: ColorName
}

function ProgressBar({ value, max, color = 'primary' }: ProgressBarProps) {
  const percentage = (value / max) * 100

  return (
    <div className="w-full bg-neutral-200 rounded-full h-4 overflow-hidden">
      <div
        className={`h-full bg-${color}-500 transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

// Usage
<ProgressBar value={75} max={100} color="success" />
```

### 9. Alert Component

```typescript
type AlertType = 'success' | 'warning' | 'error' | 'primary'

interface AlertProps {
  type: AlertType
  title: string
  message: string
}

function Alert({ type, title, message }: AlertProps) {
  return (
    <div className={`p-4 rounded-lg border bg-${type}-50 border-${type}-200`}>
      <h4 className={`font-semibold text-${type}-900 mb-1`}>{title}</h4>
      <p className={`text-sm text-${type}-700`}>{message}</p>
    </div>
  )
}
```

### 10. Color Picker with Palette

```typescript
function ColorPickerWithPalette() {
  const { palette } = usePalette()
  const [selectedColor, setSelectedColor] = useState('')

  const allColors = Object.entries(palette.colors).flatMap(([name, shades]) =>
    Object.entries(shades).map(([shade, hex]) => ({
      name: `${name}-${shade}`,
      hex
    }))
  )

  return (
    <div className="grid grid-cols-8 gap-2">
      {allColors.map(({ name, hex }) => (
        <button
          key={name}
          onClick={() => setSelectedColor(hex)}
          className="w-10 h-10 rounded border-2 hover:scale-110 transition-transform"
          style={{
            backgroundColor: hex,
            borderColor: selectedColor === hex ? '#000' : 'transparent'
          }}
          title={name}
        />
      ))}
    </div>
  )
}
```

## Integration with Forms

### 11. Form with Theme Colors

```typescript
function ThemedForm() {
  return (
    <form className="space-y-4 max-w-md">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Email
        </label>
        <input
          type="email"
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Password
        </label>
        <input
          type="password"
          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <button className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2 rounded-md font-medium">
        Sign In
      </button>
    </form>
  )
}
```

## Real-time Updates

### 12. Watching for Palette Changes

```typescript
function PaletteWatcher() {
  const { palette } = usePalette()
  const [updateCount, setUpdateCount] = useState(0)

  useEffect(() => {
    setUpdateCount(prev => prev + 1)
  }, [palette])

  return (
    <div className="p-4 bg-primary-100 border border-primary-300 rounded">
      <p>Palette has been updated {updateCount} times</p>
      <p className="text-sm text-muted-foreground mt-2">
        Current primary: {palette.colors.primary[500]}
      </p>
    </div>
  )
}
```

## Best Practices

1. **Always use CSS variables for colors** - This ensures runtime updates work
2. **Prefer Tailwind classes** - More maintainable than inline styles
3. **Use semantic colors** - background, foreground, border, etc.
4. **Test contrast ratios** - Ensure text is readable on backgrounds
5. **Provide fallbacks** - For browsers that don't support CSS variables

## CSS Variable Reference

All available CSS variables:

```css
/* Color shades (for each: primary, secondary, accent, neutral, success, warning, error) */
--color-{name}-50
--color-{name}-100
--color-{name}-200
--color-{name}-300
--color-{name}-400
--color-{name}-500
--color-{name}-600
--color-{name}-700
--color-{name}-800
--color-{name}-900
--color-{name}-950

/* Semantic colors */
--color-background
--color-foreground
--color-card
--color-card-foreground
--color-popover
--color-popover-foreground
--color-muted
--color-muted-foreground
--color-border
--color-input
--color-ring
```
