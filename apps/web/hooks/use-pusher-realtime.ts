'use client';

import { usePusherEvent } from '@/stores/pusher-channels-store';
import { useQueryClient } from '@tanstack/react-query';
import { pusherLogger } from '@/lib/logger';
import { useCallback, useEffect } from 'react';

interface PusherRealtimeConfig {
  channel: string;
  event: string;
  tags: string[]; // Cache tags to invalidate on server-side cache
  queryKey: readonly unknown[]; // React Query key for this data
  enabled?: boolean; // Whether to subscribe (defaults to true)
  onInsert?: (data: unknown) => void; // Optional custom handler (for backward compatibility)
  onUpdate?: (data: unknown) => void; // Optional custom handler (for backward compatibility)
  onDelete?: (data: unknown) => void; // Optional custom handler (for backward compatibility)
}

interface RecordWithId {
  id: string | number;
  [key: string]: unknown;
}

/**
 * Hook for syncing Pusher real-time events with React Query cache
 * Uses setQueryData to update cache directly (no router.refresh)
 * This maintains item identity for Framer Motion animations
 */
export function usePusherRealtime(config: PusherRealtimeConfig) {
  const queryClient = useQueryClient();
  const {
    queryKey,
    tags,
    onInsert,
    onUpdate,
    onDelete,
    channel,
    event,
    enabled = true,
  } = config;

  useEffect(() => {
    pusherLogger.debug(
      { channel, event, tags },
      'Initializing Pusher realtime hook'
    );
  }, [channel, event, tags]);

  const handleEvent = useCallback(
    (data: unknown) => {
      const eventData = data as {
        type: 'INSERT' | 'UPDATE' | 'DELETE';
        new?: unknown; // Full record data for INSERT/UPDATE
        old?: unknown; // Full record data for DELETE
      };

      pusherLogger.debug(
        {
          channel,
          event,
          type: eventData.type,
          hasNew: !!eventData.new,
          hasOld: !!eventData.old,
          data,
        },
        'Received Pusher realtime event'
      );

      // Update React Query cache directly using setQueryData
      // This maintains item identity for Framer Motion animations
      if (eventData.type === 'INSERT' && eventData.new) {
        if (onInsert) {
          // Use custom handler if provided (for backward compatibility)
          onInsert(eventData.new);
        } else {
          // Default: add to beginning of array
          queryClient.setQueryData(queryKey, (old: unknown) => {
            if (!Array.isArray(old)) {
              pusherLogger.warn(
                {
                  channel,
                  event,
                  queryKey,
                  dataType: typeof old,
                  isArray: Array.isArray(old),
                },
                'Default INSERT handler expects array data. Provide custom onInsert handler for non-array data structures.'
              );
              return old; // Return unchanged if not an array
            }
            return [eventData.new, ...old];
          });
        }
      } else if (eventData.type === 'UPDATE' && eventData.new) {
        pusherLogger.debug(
          { channel, event, updateData: eventData.new },
          'Calling onUpdate handler'
        );
        if (onUpdate) {
          // Use custom handler if provided
          onUpdate(eventData.new);
        } else {
          // Default: update matching item by id
          queryClient.setQueryData(queryKey, (old: unknown) => {
            if (!Array.isArray(old)) {
              pusherLogger.warn(
                {
                  channel,
                  event,
                  queryKey,
                  dataType: typeof old,
                  isArray: Array.isArray(old),
                },
                'Default UPDATE handler expects array data. Provide custom onUpdate handler for non-array data structures.'
              );
              return old; // Return unchanged if not an array
            }
            return old.map(item => {
              const record = item as RecordWithId;
              return record.id === (eventData.new as RecordWithId).id
                ? eventData.new
                : item;
            });
          });
        }
      } else if (eventData.type === 'DELETE' && eventData.old) {
        if (onDelete) {
          // Use custom handler if provided
          onDelete(eventData.old);
        } else {
          // Default: remove matching item by id
          queryClient.setQueryData(queryKey, (old: unknown) => {
            if (!Array.isArray(old)) {
              pusherLogger.warn(
                {
                  channel,
                  event,
                  queryKey,
                  dataType: typeof old,
                  isArray: Array.isArray(old),
                },
                'Default DELETE handler expects array data. Provide custom onDelete handler for non-array data structures.'
              );
              return old; // Return unchanged if not an array
            }
            return old.filter(
              item =>
                (item as RecordWithId).id !== (eventData.old as RecordWithId).id
            );
          });
        }
      }

      // Still invalidate server-side cache (for other users' SSR)
      // But DON'T call router.refresh() - that breaks animations
      fetch('/api/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags }),
      }).catch(err => {
        pusherLogger.error(
          { channel, event, tags, error: err },
          'Failed to invalidate cache'
        );
      });
    },
    [queryClient, queryKey, tags, onInsert, onUpdate, onDelete, channel, event]
  );

  // Pass handler dependencies to usePusherEvent so it re-subscribes when handlers change
  usePusherEvent(
    channel,
    event,
    handleEvent,
    [queryKey, tags, onInsert, onUpdate, onDelete],
    enabled
  );
}
