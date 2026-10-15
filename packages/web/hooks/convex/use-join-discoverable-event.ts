'use client';

import { useMutation } from 'convex/react';
import { useCallback } from 'react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useToast } from '@/components/ui/use-toast';

/**
 * Join a discoverable event (friends-visible)
 */
export function useJoinDiscoverableEvent() {
  const joinEvent = useMutation(api.events.mutations.joinDiscoverableEvent);
  const { toast } = useToast();

  return useCallback(
    async (eventId: Id<'events'>) => {
      try {
        const result = await joinEvent({ eventId });

        toast({
          title: 'Joined event',
          description:
            'Your RSVP is Pending. Confirm attendance once a date is chosen.',
        });

        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description:
            error instanceof Error
              ? error.message
              : 'Failed to join event. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [joinEvent, toast]
  );
}
