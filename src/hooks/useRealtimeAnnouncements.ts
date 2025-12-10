import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Announcement } from '@/types/database'

export function useRealtimeAnnouncements(organizationId: string) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchAndSubscribe = async () => {
      try {
        setLoading(true)

        const { data, error: fetchError } = await supabase
          .from('announcements')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('archived', false)
          .order('publish_date', { ascending: false })

        if (fetchError) throw fetchError
        setAnnouncements(data || [])
        setError(null)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchAndSubscribe()

    const channel = supabase
      .channel(`announcements-${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
          filter: `organization_id=eq.${organizationId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as Announcement
            if (!newItem.archived) {
              setAnnouncements(prev => [newItem, ...prev])
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Announcement
            setAnnouncements(prev => {
              if (updated.archived) {
                return prev.filter(item => item.id !== updated.id)
              }
              return prev.map(item =>
                item.id === updated.id ? updated : item
              )
            })
          } else if (payload.eventType === 'DELETE') {
            setAnnouncements(prev =>
              prev.filter(item => item.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organizationId])

  return { announcements, loading, error }
}
