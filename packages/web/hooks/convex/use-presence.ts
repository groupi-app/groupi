"use client";

import { useCallback, useEffect, useRef, useMemo } from "react";
import { useQuery, useConvex } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import usePresence from "@convex-dev/presence/react";

// ===== CONSTANTS =====
const DEFAULT_HEARTBEAT_INTERVAL = 10000; // 10 seconds

// Lazy-load the presence API to avoid deep type instantiation issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _presenceApi: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _api: any;

function getPresenceApi() {
  if (!_presenceApi) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _api = require("@/convex/_generated/api").api;
    _presenceApi = _api.presence;
  }
  return _presenceApi;
}

function getApi() {
  if (!_api) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    _api = require("@/convex/_generated/api").api;
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
  personId: Id<"persons">;
  name: string;
  image?: string;
}

// ===== PRESENCE HOOKS =====

/**
 * Track user presence in a post thread
 * Call this on post detail pages to mark user as present
 */
export function usePostPresence(
  postId: Id<"posts"> | undefined,
  personId: Id<"persons"> | undefined
) {
  const roomId = postId ? `post:${postId}` : "";
  const userId = personId ?? "";
  const isEnabled = !!postId && !!personId;

  // Use the Convex presence hook
  // When roomId or userId is empty, the hook will effectively not track
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
 * Track user presence in an event
 * Call this on event pages to mark user as present
 */
export function useEventPresence(
  eventId: Id<"events"> | undefined,
  personId: Id<"persons"> | undefined
) {
  const roomId = eventId ? `event:${eventId}` : "";
  const userId = personId ?? "";
  const isEnabled = !!eventId && !!personId;

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
 * Get list of users currently viewing a post
 */
export function usePostViewers(postId: Id<"posts"> | undefined) {
  const roomId = postId ? `post:${postId}` : "";

  // Using usePresence with empty userId to just observe without sending heartbeats
  const presenceState = usePresence(
    getPresenceApi(),
    roomId,
    "", // Empty user ID - we're just observing
    0 // No heartbeats - just observing
  );

  return presenceState ?? [];
}

/**
 * Get typing indicators for a room
 * Requires a roomToken obtained from the usePresence hook
 */
export function useTypingIndicators(roomToken: string | undefined): TypingUser[] {
  const result = useQuery(
    getApi().presence.getTypingUsers,
    roomToken ? { roomToken } : "skip"
  );

  return (result ?? []) as TypingUser[];
}

/**
 * Hook to manage typing state
 * Returns a function to set typing state
 */
export function useTypingState(
  postId: Id<"posts"> | undefined,
  personId: Id<"persons"> | undefined
) {
  const roomId = useMemo(() => postId ? `post:${postId}` : "", [postId]);
  const userId = personId ?? "";
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const isEnabled = !!postId && !!personId;
  const convex = useConvex();

  // Use presence for tracking
  const presenceState = usePresence(
    getPresenceApi(),
    roomId,
    userId,
    isEnabled ? DEFAULT_HEARTBEAT_INTERVAL : 0
  );

  const setTyping = useCallback(
    async (isTyping: boolean) => {
      if (!isEnabled) return;

      // Clear existing timeout
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
        // Auto-clear typing after 3 seconds of no activity
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
        }, 3000);
      }
    },
    [isEnabled, roomId, userId, convex]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    setTyping,
    presenceState,
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
 */
export function useAppPresence(personId: Id<"persons"> | undefined) {
  const userId = personId ?? "";
  const isEnabled = !!personId;

  const presenceState = usePresence(
    getPresenceApi(),
    "app",
    userId,
    isEnabled ? DEFAULT_HEARTBEAT_INTERVAL : 0
  );

  // Also update last seen periodically
  const updateLastSeen = useUpdateLastSeen();

  useEffect(() => {
    if (!personId) return;

    // Update last seen on mount
    updateLastSeen();

    // Update every 5 minutes while active
    const interval = setInterval(() => {
      updateLastSeen();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [personId, updateLastSeen]);

  return presenceState;
}
