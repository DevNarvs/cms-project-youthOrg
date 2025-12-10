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
import { Image, Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'
import type { CarouselItem } from '@/types/database'

interface CarouselFormData {
  title: string
  subtitle: string
  image_url: string
  link_url: string
  display_order: number
}

export function CarouselManager() {
  const { appUser, isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CarouselItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [formData, setFormData] = useState<CarouselFormData>({
    title: '',
    subtitle: '',
    image_url: '',
    link_url: '',
    display_order: 0,
  })
  const [errors, setErrors] = useState<Partial<CarouselFormData>>({})

  const { data: items, isLoading, error } = useQuery({
    queryKey: ['carousel-items', appUser?.organization_id],
    queryFn: async () => {
      let query = supabase
        .from('carousel_items')
        .select('*')
        .eq('archived', false)
        .order('display_order', { ascending: true })

      if (!isAdmin && appUser?.organization_id) {
        query = query.eq('organization_id', appUser.organization_id)
      }

      const { data, error } = await query

      if (error) throw error
      return data as CarouselItem[]
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: CarouselFormData) => {
      const { error } = await supabase.from('carousel_items').insert({
        ...data,
        organization_id: appUser?.organization_id,
        approved: isAdmin,
        created_by: appUser?.id,
      } as any)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carousel-items'] })
      closeModal()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CarouselFormData> }) => {
      const { error } = await supabase
        .from('carousel_items')
        .update(data as any)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carousel-items'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('carousel_items')
        .update({ archived: true } as any)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carousel-items'] })
      setDeleteConfirm(null)
    },
  })

  const toggleApprovalMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from('carousel_items')
        .update({ approved } as any)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carousel-items'] })
    },
  })

  const openModal = (item?: CarouselItem) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        title: item.title,
        subtitle: item.subtitle || '',
        image_url: item.image_url,
        link_url: item.link_url || '',
        display_order: item.display_order.toString(),
      })
    } else {
      setEditingItem(null)
      setFormData({
        title: '',
        subtitle: '',
        image_url: '',
        link_url: '',
        display_order: (items?.length || 0) + 1,
      })
    }
    setErrors({})
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
    setFormData({
      title: '',
      subtitle: '',
      image_url: '',
      link_url: '',
      display_order: 0,
    })
    setErrors({})
  }

  const validate = (): boolean => {
    const newErrors: Partial<CarouselFormData> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    if (!formData.image_url.trim()) {
      newErrors.image_url = 'Image URL is required'
    }
    if (formData.display_order < 0) {
      newErrors.display_order = 'Display order must be positive'
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

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message="Failed to load carousel items" />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Carousel Items</h2>
        <Button onClick={() => openModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {items && items.length === 0 ? (
        <EmptyState
          icon={<Image className="h-12 w-12" />}
          title="No carousel items"
          description="Create your first carousel item to display on the homepage"
          action={
            <Button onClick={() => openModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Item
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items?.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="relative h-48 mb-4 rounded-md overflow-hidden bg-muted">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  {!item.approved && (
                    <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded">
                      Pending
                    </div>
                  )}
                </div>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                {item.subtitle && (
                  <p className="text-sm text-muted-foreground mb-4">{item.subtitle}</p>
                )}
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>Order: {item.display_order}</span>
                  {item.approved ? (
                    <span className="text-green-600">Approved</span>
                  ) : (
                    <span className="text-yellow-600">Pending</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openModal(item)}
                    className="flex-1"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        toggleApprovalMutation.mutate({
                          id: item.id,
                          approved: !item.approved,
                        })
                      }
                    >
                      {item.approved ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteConfirm(item.id)}
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
        title={editingItem ? 'Edit Carousel Item' : 'Add Carousel Item'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Title" required error={errors.title} htmlFor="title">
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter carousel title"
            />
          </FormField>

          <FormField label="Subtitle" error={errors.subtitle} htmlFor="subtitle">
            <Textarea
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              placeholder="Enter subtitle (optional)"
              rows={2}
            />
          </FormField>

          <FormField label="Image URL" required error={errors.image_url} htmlFor="image_url">
            <Input
              id="image_url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </FormField>

          <FormField label="Link URL" error={errors.link_url} htmlFor="link_url">
            <Input
              id="link_url"
              value={formData.link_url}
              onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
              placeholder="https://example.com (optional)"
            />
          </FormField>

          <FormField
            label="Display Order"
            required
            error={errors.display_order?.toString()}
            htmlFor="display_order"
          >
            <Input
              id="display_order"
              type="number"
              value={formData.display_order}
              onChange={(e) =>
                setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })
              }
              min="0"
            />
          </FormField>

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
        title="Delete Carousel Item"
        description="Are you sure you want to delete this carousel item? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
