'use client';

import { useQuery, useMutation } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { useCallback, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mutingQueries: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mutingMutations: any;

function initApi() {
  if (!mutingQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    mutingQueries = api.muting?.queries ?? {};
    mutingMutations = api.muting?.mutations ?? {};
  }
}
initApi();

// ===== MUTING QUERIES WITH OPTIMISTIC UPDATES =====

/**
 * Check if an event is muted by the current user (with optimistic updates)
 */
export function useIsEventMuted(eventId: Id<'events'>) {
  const serverState = useQuery(mutingQueries.isEventMuted, { eventId });
  const [optimisticState, setOptimisticState] = useState<boolean | null>(null);

  // Reset optimistic state when server state changes
  useEffect(() => {
    if (serverState !== undefined) {
      setOptimisticState(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset when isMuted changes
  }, [serverState?.isMuted]);

  // Return optimistic state if set, otherwise server state
  const isMuted =
    optimisticState !== null
      ? optimisticState
      : (serverState?.isMuted ?? false);

  return {
    isMuted,
    isLoading: serverState === undefined,
    setOptimisticMuted: setOptimisticState,
  };
}

/**
 * Check if a post is muted by the current user (with optimistic updates)
 */
export function useIsPostMuted(postId: Id<'posts'>) {
  const serverState = useQuery(mutingQueries.isPostMuted, { postId });
  const [optimisticState, setOptimisticState] = useState<boolean | null>(null);

  // Reset optimistic state when server state changes
  useEffect(() => {
    if (serverState !== undefined) {
      setOptimisticState(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset when isMuted changes
  }, [serverState?.isMuted]);

  // Return optimistic state if set, otherwise server state
  const isMuted =
    optimisticState !== null
      ? optimisticState
      : (serverState?.isMuted ?? false);

  return {
    isMuted,
    isLoading: serverState === undefined,
    setOptimisticMuted: setOptimisticState,
  };
}

/**
 * Get all muted events for the current user
 */
export function useMutedEvents() {
  return useQuery(mutingQueries.getMutedEvents, {});
}

/**
 * Get all muted posts for the current user
 */
export function useMutedPosts() {
  return useQuery(mutingQueries.getMutedPosts, {});
}

// ===== MUTING MUTATIONS =====

/**
 * Toggle mute status for an event (with optimistic updates)
 */
export function useToggleEventMute() {
  const toggleMute = useMutation(mutingMutations.toggleEventMute);
  const { toast } = useToast();

  return useCallback(
    async (
      eventId: Id<'events'>,
      currentMuted: boolean,
      setOptimisticMuted?: (value: boolean | null) => void
    ) => {
      // Optimistically update the UI
      const newMutedState = !currentMuted;
      setOptimisticMuted?.(newMutedState);

      try {
        const result = await toggleMute({ eventId });

        toast({
          title: result.isMuted ? 'Event muted' : 'Event unmuted',
          description: result.isMuted
            ? "You won't receive notifications for this event"
            : "You'll now receive notifications for this event",
        });

        return result;
      } catch (error) {
        // Revert optimistic update on error
        setOptimisticMuted?.(null);
        toast({
          title: 'Error',
          description: 'Failed to update mute settings. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toggleMute, toast]
  );
}

/**
 * Toggle mute status for a post (with optimistic updates)
 */
export function useTogglePostMute() {
  const toggleMute = useMutation(mutingMutations.togglePostMute);
  const { toast } = useToast();

  return useCallback(
    async (
      postId: Id<'posts'>,
      currentMuted: boolean,
      setOptimisticMuted?: (value: boolean | null) => void
    ) => {
      // Optimistically update the UI
      const newMutedState = !currentMuted;
      setOptimisticMuted?.(newMutedState);

      try {
        const result = await toggleMute({ postId });

        toast({
          title: result.isMuted ? 'Post muted' : 'Post unmuted',
          description: result.isMuted
            ? "You won't receive notifications for this post"
            : "You'll now receive notifications for this post",
        });

        return result;
      } catch (error) {
        // Revert optimistic update on error
        setOptimisticMuted?.(null);
        toast({
          title: 'Error',
          description: 'Failed to update mute settings. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [toggleMute, toast]
  );
}

/**
 * Mute an event
 */
export function useMuteEvent() {
  const muteEvent = useMutation(mutingMutations.muteEvent);
  const { toast } = useToast();

  return useCallback(
    async (eventId: Id<'events'>) => {
      try {
        const result = await muteEvent({ eventId });

        if (!result.alreadyMuted) {
          toast({
            title: 'Event muted',
            description: "You won't receive notifications for this event",
          });
        }

        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to mute event. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [muteEvent, toast]
  );
}

/**
 * Unmute an event
 */
export function useUnmuteEvent() {
  const unmuteEvent = useMutation(mutingMutations.unmuteEvent);
  const { toast } = useToast();

  return useCallback(
    async (eventId: Id<'events'>) => {
      try {
        const result = await unmuteEvent({ eventId });

        if (result.unmuted) {
          toast({
            title: 'Event unmuted',
            description: "You'll now receive notifications for this event",
          });
        }

        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to unmute event. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [unmuteEvent, toast]
  );
}

/**
 * Mute a post
 */
export function useMutePost() {
  const mutePost = useMutation(mutingMutations.mutePost);
  const { toast } = useToast();

  return useCallback(
    async (postId: Id<'posts'>) => {
      try {
        const result = await mutePost({ postId });

        if (!result.alreadyMuted) {
          toast({
            title: 'Post muted',
            description: "You won't receive notifications for this post",
          });
        }

        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to mute post. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [mutePost, toast]
  );
}

/**
 * Unmute a post
 */
export function useUnmutePost() {
  const unmutePost = useMutation(mutingMutations.unmutePost);
  const { toast } = useToast();

  return useCallback(
    async (postId: Id<'posts'>) => {
      try {
        const result = await unmutePost({ postId });

        if (result.unmuted) {
          toast({
            title: 'Post unmuted',
            description: "You'll now receive notifications for this post",
          });
        }

        return result;
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to unmute post. Please try again.',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [unmutePost, toast]
  );
}
