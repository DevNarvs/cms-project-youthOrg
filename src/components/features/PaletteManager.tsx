import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ErrorMessage } from '@/components/ErrorMessage'
import { Palette, RefreshCw } from 'lucide-react'

interface ColorFormData {
  primary_color: string
  secondary_color: string
}

const PRESET_COLORS = [
  { name: 'Blue', primary: '#3b82f6', secondary: '#64748b' },
  { name: 'Green', primary: '#22c55e', secondary: '#64748b' },
  { name: 'Red', primary: '#ef4444', secondary: '#64748b' },
  { name: 'Orange', primary: '#f97316', secondary: '#64748b' },
  { name: 'Teal', primary: '#14b8a6', secondary: '#64748b' },
  { name: 'Pink', primary: '#ec4899', secondary: '#64748b' },
]

export function PaletteManager() {
  const { appUser, isOrganization } = useAuth()
  const { organization, updateTheme } = useTheme()
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState<ColorFormData>({
    primary_color: organization?.primary_color || '#3b82f6',
    secondary_color: organization?.secondary_color || '#64748b',
  })
  const [errors, setErrors] = useState<Partial<ColorFormData>>({})
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    if (organization) {
      setFormData({
        primary_color: organization.primary_color,
        secondary_color: organization.secondary_color,
      })
    }
  }, [organization])

  const updateMutation = useMutation({
    mutationFn: async (data: ColorFormData) => {
      if (!appUser?.organization_id) throw new Error('No organization ID')

      const { error } = await supabase
        .from('organizations')
        .update(data as any)
        .eq('id', appUser.organization_id)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      updateTheme(variables.primary_color, variables.secondary_color)
      setPreviewMode(false)
    },
  })

  const validate = (): boolean => {
    const newErrors: Partial<ColorFormData> = {}

    if (!formData.primary_color || !/^#[0-9A-F]{6}$/i.test(formData.primary_color)) {
      newErrors.primary_color = 'Invalid color format (use #RRGGBB)'
    }
    if (!formData.secondary_color || !/^#[0-9A-F]{6}$/i.test(formData.secondary_color)) {
      newErrors.secondary_color = 'Invalid color format (use #RRGGBB)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    updateMutation.mutate(formData)
  }

  const handlePreview = () => {
    if (!validate()) return
    updateTheme(formData.primary_color, formData.secondary_color)
    setPreviewMode(true)
  }

  const handleReset = () => {
    if (organization) {
      setFormData({
        primary_color: organization.primary_color,
        secondary_color: organization.secondary_color,
      })
      updateTheme(organization.primary_color, organization.secondary_color)
      setPreviewMode(false)
    }
  }

  const applyPreset = (preset: typeof PRESET_COLORS[0]) => {
    setFormData({
      primary_color: preset.primary,
      secondary_color: preset.secondary,
    })
    updateTheme(preset.primary, preset.secondary)
    setPreviewMode(true)
  }

  if (!isOrganization) {
    return <ErrorMessage message="Only organization users can manage color palettes" />
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Palette className="h-6 w-6 mr-2" />
            Color Palette
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Customize your organization's color scheme
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Custom Colors</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                label="Primary Color"
                required
                error={errors.primary_color}
                htmlFor="primary_color"
              >
                <div className="flex space-x-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) =>
                      setFormData({ ...formData, primary_color: e.target.value })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) =>
                      setFormData({ ...formData, primary_color: e.target.value })
                    }
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </FormField>

              <FormField
                label="Secondary Color"
                required
                error={errors.secondary_color}
                htmlFor="secondary_color"
              >
                <div className="flex space-x-2">
                  <Input
                    id="secondary_color"
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) =>
                      setFormData({ ...formData, secondary_color: e.target.value })
                    }
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.secondary_color}
                    onChange={(e) =>
                      setFormData({ ...formData, secondary_color: e.target.value })
                    }
                    placeholder="#64748b"
                    className="flex-1"
                  />
                </div>
              </FormField>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreview}
                  className="flex-1"
                >
                  Preview
                </Button>
                {previewMode && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-1"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>

              {previewMode && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                  <p className="text-sm text-yellow-700">
                    Preview mode active. Click "Save Changes" to apply permanently.
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Color Presets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="p-4 border border-border rounded-md hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div
                      className="h-8 w-8 rounded border border-border"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div
                      className="h-8 w-8 rounded border border-border"
                      style={{ backgroundColor: preset.secondary }}
                    />
                  </div>
                  <p className="text-sm font-medium">{preset.name}</p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Button>Primary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="secondary">Secondary Button</Button>
              </div>
              <div className="p-6 bg-primary text-primary-foreground rounded-lg">
                <h3 className="text-xl font-bold mb-2">Primary Color Background</h3>
                <p>This is how your primary color looks with text</p>
              </div>
              <div className="p-6 bg-secondary text-secondary-foreground rounded-lg">
                <h3 className="text-xl font-bold mb-2">Secondary Color Background</h3>
                <p>This is how your secondary color looks with text</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
