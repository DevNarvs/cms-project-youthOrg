import React from 'react';
import type { Database } from '@/types/supabase';

type Program = Database['public']['Tables']['programs']['Row'];

interface Props {
  program: Program;
  organizationName?: string | null;
  onOpen: (p: Program) => void;
}

export function ProgramCard({ program, organizationName, onOpen }: Props) {
  return (
    <article
      onClick={() => onOpen(program)}
      className="cursor-pointer bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen(program);
      }}
    >
      {program.image_url && (
        <div className="w-full h-40 bg-muted">
          <img src={program.image_url} alt={program.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-2 truncate">{program.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{program.description}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{organizationName || program.organization_id}</span>
          <div className="flex items-center space-x-2">
            <span>{new Date(program.created_at).toLocaleDateString()}</span>
            {program.approved ? (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Approved
              </span>
            ) : (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Pending
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default ProgramCard;
