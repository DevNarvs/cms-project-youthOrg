import React, { useState } from 'react';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import ProgramCard from '@/components/ProgramCard';
import DetailsModal from '@/components/ui/DetailsModal';
import type { Database } from '@/types/supabase';

type Program = Database['public']['Tables']['programs']['Row'];

export function ProgramsPage() {
  const [selected, setSelected] = useState<Program | null>(null);

  const {
    data: programs,
    isLoading,
    error,
  } = useQuery(['programs'], async () => {
    const result = await (supabase as any)
      .from('programs')
      .select('*, organizations(id,name)')
      .eq('archived', false)
      .order('created_at', { ascending: false });

    if (result.error) throw result.error;
    return (result.data || []) as Array<Program & { organizations?: any }>;
  });

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Our Programs</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs?.map((p) => (
            <ProgramCard
              key={p.id}
              program={p}
              organizationName={
                Array.isArray(p.organizations) ? p.organizations[0]?.name : p.organizations?.name
              }
              onOpen={(it) => setSelected(it)}
            />
          ))}
        </div>

        <DetailsModal
          open={!!selected}
          onClose={() => setSelected(null)}
          title={selected?.name}
          image={selected?.image_url ?? null}
          content={selected?.description ?? ''}
          gallery={selected?.image_url ? [selected.image_url] : []}
          metadata={{
            organization: selected
              ? Array.isArray(selected.organizations)
                ? selected.organizations[0]?.name
                : selected.organizations?.name
              : undefined,
            created_at: selected?.created_at,
            approved: selected?.approved ? 'Approved' : 'Pending',
          }}
        />
      </div>
    </PublicLayout>
  );
}

export default ProgramsPage;
