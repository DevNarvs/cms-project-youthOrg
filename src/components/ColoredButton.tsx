import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ColoredButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  colorScheme?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error'
  shade?: '400' | '500' | '600' | '700'
  variant?: 'solid' | 'outline' | 'ghost'
}

export const ColoredButton = forwardRef<HTMLButtonElement, ColoredButtonProps>(
  ({ className, colorScheme = 'primary', shade = '500', variant = 'solid', children, ...props }, ref) => {
    const baseClasses = 'px-4 py-2 rounded-md font-medium transition-colors'

    const variantClasses = {
      solid: `bg-${colorScheme}-${shade} text-white hover:bg-${colorScheme}-${Number(shade) + 100}`,
      outline: `border-2 border-${colorScheme}-${shade} text-${colorScheme}-${shade} hover:bg-${colorScheme}-50`,
      ghost: `text-${colorScheme}-${shade} hover:bg-${colorScheme}-50`
    }

    return (
      <button
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], className)}
        {...props}
      >
        {children}
      </button>
    )
  }
)

ColoredButton.displayName = 'ColoredButton'
