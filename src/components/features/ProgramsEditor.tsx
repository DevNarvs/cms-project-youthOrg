import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, insertRow, updateRow } from '@/lib/supabase';
import type { Database } from '@/types/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { EmptyState } from '@/components/EmptyState';
import { Calendar, Plus, Edit2, Trash2, Eye, EyeOff, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import type { Program } from '@/types/database';

interface ProgramFormData {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  image_url: string;
}

interface UpdateProgramVars {
  id: string;
  data: Partial<ProgramFormData>;
}

interface DeleteProgramVars {
  id: string;
}

interface ToggleProgramApprovalVars {
  id: string;
  approved: boolean;
}

export function ProgramsEditor() {
  const { appUser, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Program | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProgramFormData>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    image_url: '',
  });
  const [errors, setErrors] = useState<Partial<ProgramFormData>>({});

  const {
    data: programs,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['programs', appUser?.organization_id],
    queryFn: async () => {
      let query = supabase
        .from('programs')
        .select('*')
        .eq('archived', false)
        .order('start_date', { ascending: false });

      if (!isAdmin && appUser?.organization_id) {
        query = query.eq('organization_id', appUser.organization_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Program[];
    },
  });

  const createMutation = useMutation<void, Error, ProgramFormData>({
    mutationFn: async (data: ProgramFormData) => {
      const { error } = await insertRow('programs', {
        ...data,
        organization_id: appUser?.organization_id,
        approved: isAdmin,
        created_by: appUser?.id,
      } as Database['public']['Tables']['programs']['Insert']);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      closeModal();
    },
  });

  const updateMutation = useMutation<void, Error, UpdateProgramVars>({
    mutationFn: async ({ id, data }: UpdateProgramVars) => {
      const { error } = await updateRow(
        'programs',
        data as Database['public']['Tables']['programs']['Update'],
        { id }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation<void, Error, DeleteProgramVars>({
    mutationFn: async ({ id }: DeleteProgramVars) => {
      const { error } = await updateRow(
        'programs',
        { archived: true } as Database['public']['Tables']['programs']['Update'],
        { id }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      setDeleteConfirm(null);
    },
  });

  const toggleApprovalMutation = useMutation<void, Error, ToggleProgramApprovalVars>({
    mutationFn: async ({ id, approved }: ToggleProgramApprovalVars) => {
      const { error } = await updateRow(
        'programs',
        { approved } as Database['public']['Tables']['programs']['Update'],
        { id }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    },
  });

  const openModal = (item?: Program) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        start_date: item.start_date ? item.start_date.split('T')[0] : '',
        end_date: item.end_date ? item.end_date.split('T')[0] : '',
        image_url: item.image_url || '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        image_url: '',
      });
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      image_url: '',
    });
    setErrors({});
  };

  const validate = (): boolean => {
    const newErrors: Partial<ProgramFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Program name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.start_date) {
      newErrors.start_date = 'Start date is required';
    }
    if (!formData.end_date) {
      newErrors.end_date = 'End date is required';
    }
    if (formData.start_date && formData.end_date && formData.end_date < formData.start_date) {
      newErrors.end_date = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load programs" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Programs</h2>
        <Button onClick={() => openModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Program
        </Button>
      </div>

      {programs && programs.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-12 w-12" />}
          title="No programs"
          description="Create your first program to share with your community"
          action={
            <Button onClick={() => openModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Program
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {programs?.map((program) => (
            <Card key={program.id}>
              <CardHeader>
                {program.image_url && (
                  <div className="relative h-48 mb-4 rounded-md overflow-hidden bg-muted">
                    <img
                      src={program.image_url}
                      alt={program.name}
                      className="w-full h-full object-cover"
                    />
                    {!program.approved && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500 text-white text-xs font-medium rounded">
                        Pending
                      </div>
                    )}
                  </div>
                )}
                <CardTitle>{program.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {program.description}
                </p>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {format(new Date(program.start_date), 'MMM dd, yyyy')} -{' '}
                    {format(new Date(program.end_date), 'MMM dd, yyyy')}
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  {program.approved ? (
                    <span className="text-sm text-green-600">Approved</span>
                  ) : (
                    <span className="text-sm text-yellow-600">Pending</span>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openModal(program)}
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
                          id: program.id,
                          approved: !program.approved,
                        })
                      }
                    >
                      {program.approved ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteConfirm(program.id)}
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
        title={editingItem ? 'Edit Program' : 'Add Program'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Program Name" required error={errors.name} htmlFor="name">
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter program name"
            />
          </FormField>

          <FormField label="Description" required error={errors.description} htmlFor="description">
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter program description"
              rows={4}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Start Date" required error={errors.start_date} htmlFor="start_date">
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </FormField>

            <FormField label="End Date" required error={errors.end_date} htmlFor="end_date">
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </FormField>
          </div>

          <FormField label="Image URL" error={errors.image_url} htmlFor="image_url">
            <Input
              id="image_url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg (optional)"
            />
          </FormField>

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
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
        title="Delete Program"
        description="Are you sure you want to delete this program? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
