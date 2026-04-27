import { useQuery, useMutation } from 'convex/react';
import { useCallback } from 'react';
import { toast } from '@groupi/shared/platform';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

export function useIsEventMuted(eventId: string | undefined) {
  return useQuery(
    api.muting.queries.isEventMuted,
    eventId ? { eventId } : 'skip'
  );
}

export function useToggleEventMute() {
  const mutation = useMutation(api.muting.mutations.toggleEventMute);

  return useCallback(
    async (eventId: string) => {
      try {
        const result = await mutation({ eventId });
        toast.success(result?.muted ? 'Event muted' : 'Event unmuted');
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
  return useQuery(api.muting.queries.isPostMuted, postId ? { postId } : 'skip');
}

export function useTogglePostMute() {
  const mutation = useMutation(api.muting.mutations.togglePostMute);

  return useCallback(
    async (postId: string) => {
      try {
        const result = await mutation({ postId });
        toast.success(result?.muted ? 'Post muted' : 'Post unmuted');
        return result;
      } catch {
        toast.error('Failed to update mute status');
      }
    },
    [mutation]
  );
}
