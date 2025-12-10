import React, { useState } from 'react';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import AnnouncementCard from '@/components/AnnouncementCard';
import DetailsModal from '@/components/ui/DetailsModal';
import type { Database } from '@/types/supabase';

type Announcement = Database['public']['Tables']['announcements']['Row'];

export function AnnouncementsPage() {
  const [selected, setSelected] = useState<
    (Announcement & { organizations?: any; app_users?: any }) | null
  >(null);

  const {
    data: announcements,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const result = await (supabase as any)
        .from('announcements')
        .select('*, organizations(id,name), app_users(id,full_name)')
        .eq('archived', false)
        .order('published_date', { ascending: false });

      if (result.error) throw result.error;
      return (result.data || []) as Array<Announcement & { organizations?: any; app_users?: any }>;
    },
  });

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Announcements</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {announcements?.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              organizationName={
                Array.isArray(a.organizations) ? a.organizations[0]?.name : a.organizations?.name
              }
              onOpen={(it) => setSelected(it as any)}
            />
          ))}
        </div>

        <DetailsModal
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected?.title}
          image={null}
          content={selected?.content ?? ''}
          metadata={{
            author: selected?.created_by,
            organization: selected
              ? Array.isArray(selected.organizations)
                ? selected.organizations[0]?.name
                : selected.organizations?.name
              : undefined,
            published_date: selected?.published_date,
          }}
        />
      </div>
    </PublicLayout>
  );
}

export default AnnouncementsPage;
