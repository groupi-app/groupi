'use client';

import { useQuery, useMutation } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import {
  useCallback,
  useState,
  useEffect,
  useMemo,
  createContext,
  useContext,
  ReactNode,
} from 'react';
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

// ===== BULK MUTING CONTEXT =====
// Use this at the post feed level to avoid per-post queries

interface MutedPostsContextValue {
  mutedPostIds: Set<string>;
  isLoading: boolean;
  optimisticMutes: Map<string, boolean>;
  setOptimisticMute: (postId: string, isMuted: boolean | null) => void;
}

const MutedPostsContext = createContext<MutedPostsContextValue | null>(null);

/**
 * Provider that fetches all muted posts once and provides them via context.
 * Use this at the PostFeed level to eliminate per-post queries.
 */
export function MutedPostsProvider({ children }: { children: ReactNode }) {
  const mutedPosts = useQuery(mutingQueries.getMutedPosts, {});
  const [optimisticMutes, setOptimisticMutes] = useState<Map<string, boolean>>(
    new Map()
  );

  const mutedPostIds = useMemo(() => {
    const ids = new Set<string>();
    if (mutedPosts) {
      for (const mute of mutedPosts) {
        if (mute.postId) {
          ids.add(mute.postId);
        }
      }
    }
    return ids;
  }, [mutedPosts]);

  const setOptimisticMute = useCallback(
    (postId: string, isMuted: boolean | null) => {
      setOptimisticMutes(prev => {
        const next = new Map(prev);
        if (isMuted === null) {
          next.delete(postId);
        } else {
          next.set(postId, isMuted);
        }
        return next;
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      mutedPostIds,
      isLoading: mutedPosts === undefined,
      optimisticMutes,
      setOptimisticMute,
    }),
    [mutedPostIds, mutedPosts, optimisticMutes, setOptimisticMute]
  );

  return (
    <MutedPostsContext.Provider value={value}>
      {children}
    </MutedPostsContext.Provider>
  );
}

/**
 * Hook to check if a post is muted using the bulk context.
 * Falls back to individual query if not within a MutedPostsProvider.
 */
export function useIsPostMutedFromContext(postId: Id<'posts'>) {
  const context = useContext(MutedPostsContext);
  const hasContext = context !== null;

  // Fallback query - only runs if no context is available
  const fallbackServerState = useQuery(
    mutingQueries.isPostMuted,
    hasContext ? 'skip' : { postId }
  );
  const [fallbackOptimisticState, setFallbackOptimisticState] = useState<
    boolean | null
  >(null);

  // Reset fallback optimistic state when server state changes
  useEffect(() => {
    if (!hasContext && fallbackServerState !== undefined) {
      setFallbackOptimisticState(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset when isMuted changes
  }, [hasContext, fallbackServerState?.isMuted]);

  // If we have context, use it
  if (context) {
    const { mutedPostIds, isLoading, optimisticMutes, setOptimisticMute } =
      context;

    // Check optimistic state first
    const optimisticState = optimisticMutes.get(postId);
    const serverMuted = mutedPostIds.has(postId);
    const isMuted =
      optimisticState !== undefined ? optimisticState : serverMuted;

    const setOptimisticMuted = (value: boolean | null) => {
      setOptimisticMute(postId, value);
    };

    return {
      isMuted,
      isLoading,
      setOptimisticMuted,
    };
  }

  // Fallback: use individual query
  const isMuted =
    fallbackOptimisticState !== null
      ? fallbackOptimisticState
      : (fallbackServerState?.isMuted ?? false);

  return {
    isMuted,
    isLoading: fallbackServerState === undefined,
    setOptimisticMuted: setFallbackOptimisticState,
  };
}

/**
 * Hook to get the raw Set of muted post IDs.
 * Useful for components that need to check multiple posts at once.
 */
export function useMutedPostIds() {
  const context = useContext(MutedPostsContext);

  if (!context) {
    throw new Error('useMutedPostIds must be used within a MutedPostsProvider');
  }

  return {
    mutedPostIds: context.mutedPostIds,
    isLoading: context.isLoading,
  };
}

// ===== BULK EVENT MUTING CONTEXT =====
// Use this at the events list level to avoid per-event queries

interface MutedEventsContextValue {
  mutedEventIds: Set<string>;
  isLoading: boolean;
  optimisticMutes: Map<string, boolean>;
  setOptimisticMute: (eventId: string, isMuted: boolean | null) => void;
}

const MutedEventsContext = createContext<MutedEventsContextValue | null>(null);

/**
 * Provider that fetches all muted events once and provides them via context.
 * Use this at the EventsList level to eliminate per-event queries.
 */
export function MutedEventsProvider({ children }: { children: ReactNode }) {
  const mutedEvents = useQuery(mutingQueries.getMutedEvents, {});
  const [optimisticMutes, setOptimisticMutes] = useState<Map<string, boolean>>(
    new Map()
  );

  const mutedEventIds = useMemo(() => {
    const ids = new Set<string>();
    if (mutedEvents) {
      for (const mute of mutedEvents) {
        if (mute.eventId) {
          ids.add(mute.eventId);
        }
      }
    }
    return ids;
  }, [mutedEvents]);

  const setOptimisticMute = useCallback(
    (eventId: string, isMuted: boolean | null) => {
      setOptimisticMutes(prev => {
        const next = new Map(prev);
        if (isMuted === null) {
          next.delete(eventId);
        } else {
          next.set(eventId, isMuted);
        }
        return next;
      });
    },
    []
  );

  const value = useMemo(
    () => ({
      mutedEventIds,
      isLoading: mutedEvents === undefined,
      optimisticMutes,
      setOptimisticMute,
    }),
    [mutedEventIds, mutedEvents, optimisticMutes, setOptimisticMute]
  );

  return (
    <MutedEventsContext.Provider value={value}>
      {children}
    </MutedEventsContext.Provider>
  );
}

/**
 * Hook to check if an event is muted using the bulk context.
 * Falls back to individual query if not within a MutedEventsProvider.
 */
export function useIsEventMutedFromContext(eventId: Id<'events'>) {
  const context = useContext(MutedEventsContext);
  const hasContext = context !== null;

  // Fallback query - only runs if no context is available
  const fallbackServerState = useQuery(
    mutingQueries.isEventMuted,
    hasContext ? 'skip' : { eventId }
  );
  const [fallbackOptimisticState, setFallbackOptimisticState] = useState<
    boolean | null
  >(null);

  // Reset fallback optimistic state when server state changes
  useEffect(() => {
    if (!hasContext && fallbackServerState !== undefined) {
      setFallbackOptimisticState(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset when isMuted changes
  }, [hasContext, fallbackServerState?.isMuted]);

  // If we have context, use it
  if (context) {
    const { mutedEventIds, isLoading, optimisticMutes, setOptimisticMute } =
      context;

    // Check optimistic state first
    const optimisticState = optimisticMutes.get(eventId);
    const serverMuted = mutedEventIds.has(eventId);
    const isMuted =
      optimisticState !== undefined ? optimisticState : serverMuted;

    const setOptimisticMuted = (value: boolean | null) => {
      setOptimisticMute(eventId, value);
    };

    return {
      isMuted,
      isLoading,
      setOptimisticMuted,
    };
  }

  // Fallback: use individual query
  const isMuted =
    fallbackOptimisticState !== null
      ? fallbackOptimisticState
      : (fallbackServerState?.isMuted ?? false);

  return {
    isMuted,
    isLoading: fallbackServerState === undefined,
    setOptimisticMuted: setFallbackOptimisticState,
  };
}

/**
 * Hook to get the raw Set of muted event IDs.
 * Useful for components that need to check multiple events at once.
 */
export function useMutedEventIds() {
  const context = useContext(MutedEventsContext);

  if (!context) {
    throw new Error(
      'useMutedEventIds must be used within a MutedEventsProvider'
    );
  }

  return {
    mutedEventIds: context.mutedEventIds,
    isLoading: context.isLoading,
  };
}
