import React from 'react';
import type { Database } from '@/types/supabase';

type Announcement = Database['public']['Tables']['announcements']['Row'];

interface Props {
  announcement: Announcement;
  organizationName?: string | null;
  onOpen: (a: Announcement) => void;
}

export function AnnouncementCard({ announcement, organizationName, onOpen }: Props) {
  return (
    <article
      onClick={() => onOpen(announcement)}
      className="cursor-pointer bg-card border border-border rounded-lg p-4 hover:shadow-lg transition"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen(announcement);
      }}
    >
      <h3 className="text-lg font-semibold mb-2 truncate">{announcement.title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{announcement.content}</p>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{organizationName || announcement.organization_id}</span>
        <span>{new Date(announcement.published_date).toLocaleDateString()}</span>
      </div>
    </article>
  );
}

export default AnnouncementCard;
