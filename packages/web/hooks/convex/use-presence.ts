'use client';

import { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { useQuery, useConvex } from 'convex/react';
import { useDebouncedCallback } from 'use-debounce';
import { Id } from '@/convex/_generated/dataModel';
import usePresence from '@convex-dev/presence/react';
import {
  useIsActive,
  useShouldPauseHeartbeats,
  useIsOffline,
  useIsAway,
  useLastActivityTime,
} from '@/providers/visibility-provider';

// ===== CONSTANTS =====
// Increased from 10s to 30s to reduce function calls by 3x
// The presence component considers users offline after 2x the interval (60s)
const DEFAULT_HEARTBEAT_INTERVAL = 30000; // 30 seconds

// Lazy-load the presence API to avoid deep type instantiation issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _presenceApi: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _api: any;

function getPresenceApi() {
  if (!_presenceApi) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _api = require('@/convex/_generated/api').api;
    _presenceApi = _api.presence;
  }
  return _presenceApi;
}

function getApi() {
  if (!_api) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _api = require('@/convex/_generated/api').api;
    _presenceApi = _api.presence;
  }
  return _api;
}

// ===== TYPES =====

export interface PresenceUser {
  odUi: string;
  userId: string;
  data?: {
    isTyping?: boolean;
    lastActivity?: number;
  };
}

export interface TypingUser {
  personId: Id<'persons'>;
  name: string;
  image?: string;
}

// ===== PRESENCE HOOKS =====

/**
 * Track user presence in a post thread
 * Call this on post detail pages to mark user as present
 *
 * Note: Heartbeats are paused when the tab is hidden (after grace period)
 * or when user is idle to reduce function calls.
 */
export function usePostPresence(
  postId: Id<'posts'> | undefined,
  personId: Id<'persons'> | undefined
) {
  const roomId = postId ? `post:${postId}` : '';
  const userId = personId ?? '';
  const shouldPauseHeartbeats = useShouldPauseHeartbeats();
  const isEnabled = !!postId && !!personId && !shouldPauseHeartbeats;

  // Use the Convex presence hook
  // When roomId or userId is empty, or tab is hidden, the hook will not send heartbeats
  const presenceState = usePresence(
    getPresenceApi(),
    roomId,
    userId,
    isEnabled ? DEFAULT_HEARTBEAT_INTERVAL : 0
  );

  return {
    presenceState,
    isTracking: isEnabled,
  };
}

/**
 * Track user presence in a post thread with roomToken exposed
 * This is needed for typing indicators to work
 *
 * Note: This hook manages its own heartbeats instead of using usePresence
 * to avoid creating duplicate sessions and to expose the roomToken.
 * Heartbeats are paused when the tab is hidden (after grace period)
 * or when user is idle to reduce function calls.
 */
export function usePostPresenceWithToken(
  postId: Id<'posts'> | undefined,
  personId: Id<'persons'> | undefined
) {
  const roomId = useMemo(() => (postId ? `post:${postId}` : ''), [postId]);
  const userId = personId ?? '';
  const shouldPauseHeartbeats = useShouldPauseHeartbeats();
  const isEnabled = !!postId && !!personId && !shouldPauseHeartbeats;
  const convex = useConvex();

  // Track roomToken from heartbeat
  const roomTokenRef = useRef<string | null>(null);
  const [roomTokenState, setRoomTokenState] = useState<string | null>(null);
  const [sessionId] = useState(() => crypto.randomUUID());
  const sessionTokenRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear roomToken when disabled
  const roomToken = isEnabled ? roomTokenState : null;

  // Send heartbeats to get the roomToken
  // We manage our own heartbeats instead of using usePresence to:
  // 1. Expose the roomToken (usePresence doesn't expose it)
  // 2. Avoid creating duplicate sessions
  useEffect(() => {
    if (!isEnabled) {
      // Clear refs but don't call setState
      roomTokenRef.current = null;
      return;
    }

    let isMounted = true;

    const sendHeartbeat = async () => {
      try {
        const result = await convex.mutation(getApi().presence.heartbeat, {
          roomId,
          userId,
          sessionId,
          interval: DEFAULT_HEARTBEAT_INTERVAL,
        });
        if (isMounted) {
          roomTokenRef.current = result.roomToken;
          setRoomTokenState(result.roomToken);
          sessionTokenRef.current = result.sessionToken;
        }
      } catch {
        // Silently fail - heartbeat is not critical
      }
    };

    // Send initial heartbeat
    void sendHeartbeat();

    // Set up interval
    intervalRef.current = setInterval(
      sendHeartbeat,
      DEFAULT_HEARTBEAT_INTERVAL
    );

    // Cleanup
    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Disconnect session
      if (sessionTokenRef.current) {
        void convex.mutation(getApi().presence.disconnect, {
          sessionToken: sessionTokenRef.current,
        });
      }
    };
  }, [isEnabled, roomId, userId, sessionId, convex]);

  return {
    roomToken,
    isTracking: isEnabled,
  };
}

/**
 * Get list of users currently viewing a post
 */
export function usePostViewers(postId: Id<'posts'> | undefined) {
  const roomId = postId ? `post:${postId}` : '';

  // Using usePresence with empty userId to just observe without sending heartbeats
  const presenceState = usePresence(
    getPresenceApi(),
    roomId,
    '', // Empty user ID - we're just observing
    0 // No heartbeats - just observing
  );

  return presenceState ?? [];
}

/**
 * Get typing indicators for a room
 * Requires a roomToken obtained from the usePresence hook
 */
export function useTypingIndicators(
  roomToken: string | undefined
): TypingUser[] {
  const result = useQuery(
    getApi().presence.getTypingUsers,
    roomToken ? { roomToken } : 'skip'
  );

  return (result ?? []) as TypingUser[];
}

// Typing auto-clear timeout in milliseconds
const TYPING_TIMEOUT = 5000; // 5 seconds
// Debounce delay for typing indicator updates (reduces mutations by ~90%)
const TYPING_DEBOUNCE_MS = 300;

/**
 * Hook to manage typing state with debouncing
 * Returns a function to set typing state
 *
 * Optimization: Debounces "isTyping: true" updates with 300ms delay to batch
 * rapid keystrokes. "isTyping: false" updates are immediate to ensure the
 * indicator clears promptly when the user stops typing or deletes content.
 *
 * Note: This hook does NOT manage its own presence session.
 * The presence session should be managed by usePostPresenceWithToken
 * in the parent component to avoid duplicate sessions.
 */
export function useTypingState(
  postId: Id<'posts'> | undefined,
  personId: Id<'persons'> | undefined
) {
  const roomId = useMemo(() => (postId ? `post:${postId}` : ''), [postId]);
  const userId = personId ?? '';
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const isEnabled = !!postId && !!personId;
  const convex = useConvex();

  // Core function that actually sends the mutation
  const updateTypingState = useCallback(
    async (isTyping: boolean) => {
      if (!isEnabled) return;

      // Clear existing auto-clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Only update if state changed
      if (isTypingRef.current !== isTyping) {
        isTypingRef.current = isTyping;

        try {
          // Use convex.mutation directly to avoid complex type inference
          await convex.mutation(getApi().presence.updatePresenceData, {
            roomId,
            userId,
            data: {
              isTyping,
              lastActivity: Date.now(),
            },
          });
        } catch {
          // Silently fail - typing indicator is not critical
        }
      }

      if (isTyping) {
        // Auto-clear typing after timeout of no activity
        typingTimeoutRef.current = setTimeout(async () => {
          if (isTypingRef.current) {
            isTypingRef.current = false;
            try {
              await convex.mutation(getApi().presence.updatePresenceData, {
                roomId,
                userId,
                data: {
                  isTyping: false,
                  lastActivity: Date.now(),
                },
              });
            } catch {
              // Silently fail
            }
          }
        }, TYPING_TIMEOUT);
      }
    },
    [isEnabled, roomId, userId, convex]
  );

  // Debounced version for "start typing" events
  // This batches rapid keystrokes, reducing mutations by ~90%
  const debouncedSetTyping = useDebouncedCallback(
    () => {
      void updateTypingState(true);
    },
    TYPING_DEBOUNCE_MS,
    { leading: false, trailing: true }
  );

  // Public API: Debounce "typing" state, immediate "stopped typing"
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!isEnabled) return;

      if (isTyping) {
        // Debounced - batch rapid keystrokes
        debouncedSetTyping();
      } else {
        // Immediately clear typing state
        debouncedSetTyping.cancel();
        void updateTypingState(false);
      }
    },
    [isEnabled, debouncedSetTyping, updateTypingState]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      debouncedSetTyping.cancel();
    };
  }, [debouncedSetTyping]);

  return {
    setTyping,
  };
}

/**
 * Update user's last seen timestamp
 * Call periodically while user is active
 */
export function useUpdateLastSeen() {
  const convex = useConvex();

  return useCallback(async () => {
    try {
      await convex.mutation(getApi().presence.updateLastSeen, {});
    } catch {
      // Silently fail - last seen is not critical
    }
  }, [convex]);
}

/**
 * Global presence tracking - marks user as online in the app
 * Call this at the app root level
 *
 * Features:
 * - Sends heartbeats to mark user as online
 * - Updates lastSeen timestamp periodically
 * - Handles auto-idle status when user becomes away/returns
 * - 30 second grace period for tab switches before pausing
 * - Stops heartbeats entirely when user is offline (idle for 15+ min)
 *
 * This hook manages its own heartbeats instead of using the usePresence library
 * to avoid subscribing to the presence:list query (we don't need the list for
 * app-level presence, just the heartbeat to show the user is online).
 */
export function useAppPresence(personId: Id<'persons'> | undefined) {
  const userId = personId ?? '';
  const shouldPauseHeartbeats = useShouldPauseHeartbeats();
  const isOffline = useIsOffline();
  const isAway = useIsAway();
  const lastActivityTime = useLastActivityTime();
  const isActive = useIsActive(); // For lastSeen updates
  const convex = useConvex();

  // Heartbeats are enabled if we have a personId and shouldn't pause and aren't offline
  const heartbeatsEnabled = !!personId && !shouldPauseHeartbeats && !isOffline;

  // Session management
  const [sessionId] = useState(() => crypto.randomUUID());
  const sessionTokenRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track previous away state for auto-idle
  // Initialize as null to skip the first effect run and avoid race conditions
  const prevIsAwayRef = useRef<boolean | null>(null);

  // Update last seen periodically
  const updateLastSeen = useUpdateLastSeen();

  // Send heartbeats to mark user as online in the app
  useEffect(() => {
    if (!heartbeatsEnabled) {
      // Clear interval when disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    let isMounted = true;

    const sendHeartbeat = async () => {
      try {
        const result = await convex.mutation(getApi().presence.heartbeat, {
          roomId: 'app',
          userId,
          sessionId,
          interval: DEFAULT_HEARTBEAT_INTERVAL,
        });
        if (isMounted) {
          sessionTokenRef.current = result.sessionToken;
        }
      } catch {
        // Silently fail - heartbeat is not critical
      }
    };

    // Send initial heartbeat
    void sendHeartbeat();

    // Set up interval for heartbeats
    intervalRef.current = setInterval(
      sendHeartbeat,
      DEFAULT_HEARTBEAT_INTERVAL
    );

    // Cleanup
    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Disconnect session on unmount
      if (sessionTokenRef.current) {
        void convex.mutation(getApi().presence.disconnect, {
          sessionToken: sessionTokenRef.current,
        });
      }
    };
  }, [heartbeatsEnabled, userId, sessionId, convex]);

  // Handle auto-idle status changes
  useEffect(() => {
    if (!personId) return;

    // On first run, just record the initial state without calling the mutation
    // This prevents race conditions during mount from triggering unwanted status changes
    if (prevIsAwayRef.current === null) {
      prevIsAwayRef.current = isAway;
      return;
    }

    // Check if away state actually changed from a known previous state
    if (prevIsAwayRef.current !== isAway) {
      prevIsAwayRef.current = isAway;

      // Call setAutoIdle mutation when away state changes
      void convex.mutation(getApi().presence.setAutoIdle, {
        isIdle: isAway,
      });
    }
  }, [personId, isAway, convex]);

  // Track if we've already called updateLastSeen in this active session
  // This prevents duplicate calls when multiple dependencies change simultaneously
  const hasUpdatedInSessionRef = useRef(false);
  const lastActiveStateRef = useRef(isActive);

  // Combined effect for updating lastSeen in person record
  // Handles: initial mount, becoming active, and periodic updates
  useEffect(() => {
    if (!personId || !isActive) {
      // Reset session tracking when becoming inactive
      if (!isActive && lastActiveStateRef.current) {
        hasUpdatedInSessionRef.current = false;
      }
      lastActiveStateRef.current = isActive;
      return;
    }

    // Only call updateLastSeen once per active session
    // This prevents duplicate calls from:
    // 1. Mount + visibility change happening together
    // 2. lastActivityTime changing right after mount
    if (!hasUpdatedInSessionRef.current) {
      hasUpdatedInSessionRef.current = true;
      updateLastSeen();
    }

    lastActiveStateRef.current = isActive;

    // Update every 5 minutes while active and visible
    const interval = setInterval(
      () => {
        updateLastSeen();
      },
      5 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [personId, isActive, lastActivityTime, updateLastSeen]);
}

// ===== CONVENIENCE HOOKS WITH GLOBAL USER CONTEXT =====

// Lazy-load global user context to avoid circular dependencies
function usePersonIdFromContext(): Id<'persons'> | undefined {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useGlobalUser } = require('@/context/global-user-context');
  const { person } = useGlobalUser();
  return person?._id as Id<'persons'> | undefined;
}

/**
 * Track presence in a post using the current user from global context.
 * Convenience wrapper around usePostPresenceWithToken.
 *
 * @param postId - The post to track presence in
 * @returns { roomToken, isTracking } - roomToken for typing indicators
 */
export function useCurrentUserPostPresence(postId: Id<'posts'> | undefined) {
  const personId = usePersonIdFromContext();
  return usePostPresenceWithToken(postId, personId);
}

/**
 * Manage typing state for the current user using global context.
 * Convenience wrapper around useTypingState.
 *
 * @param postId - The post to track typing state in
 * @returns { setTyping } - Function to update typing state (debounced)
 */
export function useCurrentUserTypingState(postId: Id<'posts'> | undefined) {
  const personId = usePersonIdFromContext();
  return useTypingState(postId, personId);
}
