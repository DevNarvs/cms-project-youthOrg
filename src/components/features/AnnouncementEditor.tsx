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
import { FileText, Plus, Edit2, Trash2, Eye, EyeOff, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import type { Announcement } from '@/types/database'

interface AnnouncementFormData {
  title: string
  content: string
  published_date: string
}

interface UpdateAnnouncementVars {
  id: string
  data: Partial<AnnouncementFormData>
}

interface DeleteAnnouncementVars {
  id: string
}

interface ToggleApprovalVars {
  id: string
  approved: boolean
}

export function AnnouncementEditor() {
  const { appUser, isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Announcement | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [formData, setFormData] = useState<AnnouncementFormData>({
    title: '',
    content: '',
    published_date: new Date().toISOString().split('T')[0],
  })
  const [errors, setErrors] = useState<Partial<AnnouncementFormData>>({})

  const { data: announcements, isLoading, error } = useQuery({
    queryKey: ['announcements', appUser?.organization_id],
    queryFn: async () => {
      let query = supabase
        .from('announcements')
        .select('*')
        .eq('archived', false)
        .order('published_date', { ascending: false })

      if (!isAdmin && appUser?.organization_id) {
        query = query.eq('organization_id', appUser.organization_id)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Announcement[]
    },
  })

  const createMutation = useMutation<void, Error, AnnouncementFormData>({
    mutationFn: async (data: AnnouncementFormData) => {
      const { error } = await supabase.from('announcements').insert({
        ...data,
        organization_id: appUser?.organization_id,
        approved: isAdmin,
        created_by: appUser?.id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      closeModal()
    },
  })

  const updateMutation = useMutation<void, Error, UpdateAnnouncementVars>({
    mutationFn: async ({ id, data }: UpdateAnnouncementVars) => {
      const { error } = await supabase
        .from('announcements')
        .update(data)
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      closeModal()
    },
  })

  const deleteMutation = useMutation<void, Error, DeleteAnnouncementVars>({
    mutationFn: async ({ id }: DeleteAnnouncementVars) => {
      const { error } = await supabase
        .from('announcements')
        .update({ archived: true })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      setDeleteConfirm(null)
    },
  })

  const toggleApprovalMutation = useMutation<void, Error, ToggleApprovalVars>({
    mutationFn: async ({ id, approved }: ToggleApprovalVars) => {
      const { error } = await supabase
        .from('announcements')
        .update({ approved })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
  })

  const openModal = (item?: Announcement) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        title: item.title,
        content: item.content,
        published_date: typeof item.published_date === 'string' ? item.published_date.split('T')[0] : item.published_date,
      })
    } else {
      setEditingItem(null)
      setFormData({
        title: '',
        content: '',
        published_date: new Date().toISOString().split('T')[0],
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
      content: '',
      published_date: new Date().toISOString().split('T')[0],
    })
    setErrors({})
  }

  const validate = (): boolean => {
    const newErrors: Partial<AnnouncementFormData> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required'
    }
    if (!formData.published_date) {
      newErrors.published_date = 'Publish date is required'
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
  if (error) return <ErrorMessage message="Failed to load announcements" />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Announcements</h2>
        <Button onClick={() => openModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Announcement
        </Button>
      </div>

      {announcements && announcements.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="No announcements"
          description="Create your first announcement to share news with your community"
          action={
            <Button onClick={() => openModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Announcement
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {announcements?.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CardTitle>{announcement.title}</CardTitle>
                      {!announcement.approved && (
                        <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      {format(new Date(announcement.published_date), 'MMM dd, yyyy')}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openModal(announcement)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleApprovalMutation.mutate({
                            id: announcement.id,
                            approved: !announcement.approved,
                          })
                        }
                      >
                        {announcement.approved ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteConfirm(announcement.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {announcement.content}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingItem ? 'Edit Announcement' : 'Add Announcement'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Title" required error={errors.title} htmlFor="title">
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter announcement title"
            />
          </FormField>

          <FormField label="Content" required error={errors.content} htmlFor="content">
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Enter announcement content"
              rows={6}
            />
          </FormField>

          <FormField
            label="Publish Date"
            required
            error={errors.published_date}
            htmlFor="published_date"
          >
            <Input
              id="published_date"
              type="date"
              value={formData.published_date}
              onChange={(e) => setFormData({ ...formData, published_date: e.target.value })}
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
        onConfirm={() => deleteConfirm && deleteMutation.mutate({ id: deleteConfirm })}
        title="Delete Announcement"
        description="Are you sure you want to delete this announcement? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
