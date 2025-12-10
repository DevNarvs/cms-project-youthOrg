import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorMessage } from '@/components/ErrorMessage'
import { EmptyState } from '@/components/EmptyState'
import { Building2, Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import type { Organization } from '@/types/database'

interface OrganizationFormData {
  name: string
  description: string
  website_url: string
  contact_email: string
  contact_phone: string
  logo_url: string
  primary_color: string
  secondary_color: string
}

export function OrganizationManager() {
  const { isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Organization | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [formData, setFormData] = useState<OrganizationFormData>({
    name: '',
    description: '',
    website_url: '',
    contact_email: '',
    contact_phone: '',
    logo_url: '',
    primary_color: '#3b82f6',
    secondary_color: '#64748b',
  })
  const [errors, setErrors] = useState<Partial<OrganizationFormData>>({})

  const { data: organizations, isLoading, error } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('archived', false)
        .order('name', { ascending: true })

      if (error) throw error
      return data as Organization[]
    },
    enabled: isAdmin,
  })

  const createMutation = useMutation({
    mutationFn: async (data: OrganizationFormData) => {
      const { error } = await supabase.from('organizations').insert(data as any)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<OrganizationFormData> }) => {
      const { error } = await supabase
        .from('organizations')
        .update(data as any)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('organizations')
        .update({ archived: true } as any)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      setDeleteConfirm(null)
    },
  })

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('organizations')
        .update({ active } as any)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
    },
  })

  const openModal = (item?: Organization) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        name: item.name,
        description: item.description || '',
        website_url: item.website_url || '',
        contact_email: item.contact_email || '',
        contact_phone: item.contact_phone || '',
        logo_url: item.logo_url || '',
        primary_color: item.primary_color,
        secondary_color: item.secondary_color,
      })
    } else {
      setEditingItem(null)
      setFormData({
        name: '',
        description: '',
        website_url: '',
        contact_email: '',
        contact_phone: '',
        logo_url: '',
        primary_color: '#3b82f6',
        secondary_color: '#64748b',
      })
    }
    setErrors({})
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
    setFormData({
      name: '',
      description: '',
      website_url: '',
      contact_email: '',
      contact_phone: '',
      logo_url: '',
      primary_color: '#3b82f6',
      secondary_color: '#64748b',
    })
    setErrors({})
  }

  const validate = (): boolean => {
    const newErrors: Partial<OrganizationFormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required'
    }
    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Invalid email address'
    }
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

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  if (!isAdmin) {
    return <ErrorMessage message="You do not have permission to manage organizations" />
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message="Failed to load organizations" />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Organizations</h2>
        <Button onClick={() => openModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Organization
        </Button>
      </div>

      {organizations && organizations.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-12 w-12" />}
          title="No organizations"
          description="Create your first organization to get started"
          action={
            <Button onClick={() => openModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Organization
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations?.map((org) => (
            <Card key={org.id}>
              <CardHeader>
                <div className="flex items-center space-x-4 mb-4">
                  {org.logo_url ? (
                    <img
                      src={org.logo_url}
                      alt={org.name}
                      className="h-16 w-16 object-contain rounded"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-muted rounded flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    {org.active ? (
                      <span className="text-xs text-green-600">Active</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Inactive</span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {org.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {org.description}
                  </p>
                )}
                <div className="space-y-2 text-sm mb-4">
                  {org.contact_email && (
                    <div className="text-muted-foreground truncate">{org.contact_email}</div>
                  )}
                  {org.contact_phone && (
                    <div className="text-muted-foreground">{org.contact_phone}</div>
                  )}
                </div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex-1 flex items-center space-x-2">
                    <div
                      className="h-6 w-6 rounded border border-border"
                      style={{ backgroundColor: org.primary_color }}
                      title="Primary Color"
                    />
                    <div
                      className="h-6 w-6 rounded border border-border"
                      style={{ backgroundColor: org.secondary_color }}
                      title="Secondary Color"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openModal(org)}
                    className="flex-1"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toggleActiveMutation.mutate({
                        id: org.id,
                        active: !org.active,
                      })
                    }
                  >
                    {org.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteConfirm(org.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? 'Edit Organization' : 'Add Organization'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Organization Name" required error={errors.name} htmlFor="name">
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter organization name"
            />
          </FormField>

          <FormField label="Description" error={errors.description} htmlFor="description">
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter organization description (optional)"
              rows={3}
            />
          </FormField>

          <FormField label="Website URL" error={errors.website_url} htmlFor="website_url">
            <Input
              id="website_url"
              value={formData.website_url}
              onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
              placeholder="https://example.com (optional)"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Contact Email" error={errors.contact_email} htmlFor="contact_email">
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                placeholder="contact@example.com (optional)"
              />
            </FormField>

            <FormField label="Contact Phone" error={errors.contact_phone} htmlFor="contact_phone">
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                placeholder="(555) 123-4567 (optional)"
              />
            </FormField>
          </div>

          <FormField label="Logo URL" error={errors.logo_url} htmlFor="logo_url">
            <Input
              id="logo_url"
              value={formData.logo_url}
              onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png (optional)"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
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
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.primary_color}
                  onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.secondary_color}
                  onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                  placeholder="#64748b"
                  className="flex-1"
                />
              </div>
            </FormField>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : editingItem
                ? 'Update'
                : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
        title="Delete Organization"
        description="Are you sure you want to delete this organization? This will also archive all associated content and users. This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
