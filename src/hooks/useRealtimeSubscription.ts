import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeOptions<T> {
  table: string
  filter?: string
  onInsert?: (record: T) => void
  onUpdate?: (record: T) => void
  onDelete?: (id: string) => void
}

export function useRealtimeSubscription<T>(
  options: UseRealtimeOptions<T>
) {
  const [isConnected, setIsConnected] = useState(false)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)

  useEffect(() => {
    const channelName = `${options.table}-${options.filter || 'all'}`

    const newChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: options.table,
          filter: options.filter
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && options.onInsert) {
            options.onInsert(payload.new as T)
          } else if (payload.eventType === 'UPDATE' && options.onUpdate) {
            options.onUpdate(payload.new as T)
          } else if (payload.eventType === 'DELETE' && options.onDelete) {
            options.onDelete(payload.old.id)
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    setChannel(newChannel)

    return () => {
      supabase.removeChannel(newChannel)
    }
  }, [options.table, options.filter])

  const unsubscribe = useCallback(() => {
    if (channel) {
      supabase.removeChannel(channel)
      setChannel(null)
      setIsConnected(false)
    }
  }, [channel])

  return { isConnected, unsubscribe }
}
