'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type RealtimePayload = {
  new: Record<string, unknown>;
  old: Record<string, unknown>;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
};

type RealtimeConfig = {
  channel: string;
  table: string;
  filter?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  onInsert?: (payload: RealtimePayload) => void;
  onUpdate?: (payload: RealtimePayload) => void;
  onDelete?: (payload: RealtimePayload) => void;
  refreshOnChange?: boolean; // Whether to call router.refresh() on changes
};

/**
 * Hook to sync server-cached data with realtime database changes
 *
 * @example
 * // Simple usage - just refresh cache on any change
 * useRealtimeSync({
 *   channel: 'event-posts',
 *   table: 'Post',
 *   filter: `eventId=eq.${eventId}`,
 *   refreshOnChange: true,
 * });
 *
 * @example
 * // Advanced usage - custom handlers with optimistic updates
 * useRealtimeSync({
 *   channel: 'event-posts',
 *   table: 'Post',
 *   filter: `eventId=eq.${eventId}`,
 *   onInsert: (payload) => {
 *     setPosts(prev => [...prev, payload.new]);
 *   },
 *   onUpdate: (payload) => {
 *     setPosts(prev => prev.map(p => p.id === payload.new.id ? payload.new : p));
 *   },
 *   onDelete: (payload) => {
 *     setPosts(prev => prev.filter(p => p.id !== payload.old.id));
 *   },
 * });
 */
export function useRealtimeSync(config: RealtimeConfig) {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase.channel(config.channel);

    // Subscribe to postgres changes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (channel as any).on(
      'postgres_changes',
      {
        event: (config.event || '*') as '*' | 'INSERT' | 'UPDATE' | 'DELETE',
        schema: 'public',
        table: config.table,
        filter: config.filter,
      },
      (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        const realtimePayload: RealtimePayload = {
          new: (payload as { new?: Record<string, unknown> }).new || {},
          old: (payload as { old?: Record<string, unknown> }).old || {},
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
        };

        // Call custom handlers if provided
        if (realtimePayload.eventType === 'INSERT' && config.onInsert) {
          config.onInsert(realtimePayload);
        } else if (realtimePayload.eventType === 'UPDATE' && config.onUpdate) {
          config.onUpdate(realtimePayload);
        } else if (realtimePayload.eventType === 'DELETE' && config.onDelete) {
          config.onDelete(realtimePayload);
        }

        // Refresh cache if requested
        if (config.refreshOnChange) {
          router.refresh();
        }
      }
    );

    channel.subscribe(status => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setIsConnected(false);
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.channel,
    config.table,
    config.filter,
    config.event,
    config.refreshOnChange,
    // Note: Handlers (onInsert, onUpdate, onDelete) intentionally excluded
    // to prevent re-subscribing when callback references change
  ]);

  return { isConnected };
}
