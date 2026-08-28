import { useQuery, useMutation } from 'convex/react';
import { useCallback } from 'react';
import { toast } from '@groupi/shared/platform';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

export function useIsEventMuted(eventId: string | undefined) {
  const result = useQuery(
    api.muting.queries.isEventMuted,
    eventId ? { eventId: eventId as Id<'events'> } : 'skip'
  );

  return result?.isMuted ?? false;
}

export function useToggleEventMute() {
  const mutation = useMutation(api.muting.mutations.toggleEventMute);

  return useCallback(
    async (eventId: string) => {
      try {
        const result = await mutation({ eventId: eventId as Id<'events'> });
        toast.success(result?.isMuted ? 'Event muted' : 'Event unmuted');
        return result;
      } catch {
        toast.error('Failed to update mute status');
      }
    },
    [mutation]
  );
}

export function useMutedEvents() {
  return useQuery(api.muting.queries.getMutedEvents, {});
}

export function useIsPostMuted(postId: string | undefined) {
  return useQuery(
    api.muting.queries.isPostMuted,
    postId ? { postId: postId as Id<'posts'> } : 'skip'
  );
}

export function useTogglePostMute() {
  const mutation = useMutation(api.muting.mutations.togglePostMute);

  return useCallback(
    async (postId: string) => {
      try {
        const result = await mutation({ postId: postId as Id<'posts'> });
        toast.success(result?.isMuted ? 'Post muted' : 'Post unmuted');
        return result;
      } catch {
        toast.error('Failed to update mute status');
      }
    },
    [mutation]
  );
}
