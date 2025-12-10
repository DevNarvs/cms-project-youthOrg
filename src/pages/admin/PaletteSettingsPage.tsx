import { PaletteManager } from '@/components/features/PaletteManager'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export function PaletteSettingsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="container mx-auto py-8 px-4">
        <PaletteManager />
      </div>
    </ProtectedRoute>
  )
}
