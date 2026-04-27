import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useMutation, useQuery } from 'convex/react';
import { useGlobalUser } from '@/context/global-user-context';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

const HEARTBEAT_INTERVAL_MS = 30_000;

/**
 * App-level presence tracking. Sends heartbeats when the app is foregrounded,
 * pauses when backgrounded.
 */
export function useAppPresence() {
  const { person } = useGlobalUser();
  const personId = person?._id as string | undefined;
  const updateLastSeen = useMutation(api.presence.updateLastSeen);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const sendHeartbeat = useCallback(async () => {
    if (!personId) return;
    if (appStateRef.current !== 'active') return;
    try {
      await updateLastSeen({});
    } catch {
      // Presence is non-critical — fail silently
    }
  }, [personId, updateLastSeen]);

  useEffect(() => {
    if (!personId) return;

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval
    intervalRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    // Listen to app state changes
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        const wasInactive = appStateRef.current !== 'active';
        appStateRef.current = nextState;

        if (nextState === 'active' && wasInactive) {
          // App came to foreground — send heartbeat immediately
          sendHeartbeat();
        }
      }
    );

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      subscription.remove();
    };
  }, [personId, sendHeartbeat]);
}

/**
 * Post-level presence: heartbeat for a specific post room.
 * Returns the roomToken needed for typing indicators.
 */
export function usePostPresence(postId: string | undefined) {
  const { person } = useGlobalUser();
  const personId = person?._id as string | undefined;
  const heartbeat = useMutation(api.presence.heartbeat);
  const [roomToken, setRoomToken] = useState<string | null>(null);
  const sessionIdRef = useRef<string>(generateId());

  useEffect(() => {
    if (!postId || !personId) return;

    const roomId = `post:${postId}`;
    const sid = sessionIdRef.current;

    async function sendRoomHeartbeat() {
      try {
        const result = await heartbeat({
          roomId,
          userId: personId,
          sessionId: sid,
          interval: HEARTBEAT_INTERVAL_MS,
        });
        if (result?.roomToken) setRoomToken(result.roomToken);
      } catch {
        // Non-critical
      }
    }

    sendRoomHeartbeat();
    const interval = setInterval(sendRoomHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [postId, personId, heartbeat]);

  return { roomToken };
}

/**
 * Typing state management for a post room.
 * Returns setTyping function with built-in debouncing.
 */
export function useTypingState(postId: string | undefined) {
  const { person } = useGlobalUser();
  const personId = person?._id as string | undefined;
  const updatePresenceData = useMutation(api.presence.updatePresenceData);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastValueRef = useRef(false);

  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!postId || !personId) return;

      const roomId = `post:${postId}`;

      // Clear previous debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      if (!isTyping) {
        // Stop typing — send immediately
        if (lastValueRef.current) {
          lastValueRef.current = false;
          updatePresenceData({
            roomId,
            userId: personId,
            data: { isTyping: false, lastActivity: Date.now() },
          }).catch(() => {});
        }
        return;
      }

      // Start typing — debounce 300ms
      debounceRef.current = setTimeout(() => {
        if (!lastValueRef.current) {
          lastValueRef.current = true;
          updatePresenceData({
            roomId,
            userId: personId,
            data: { isTyping: true, lastActivity: Date.now() },
          }).catch(() => {});
        }
      }, 300);
    },
    [postId, personId, updatePresenceData]
  );

  // Clean up on unmount — clear typing
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (postId && personId && lastValueRef.current) {
        updatePresenceData({
          roomId: `post:${postId}`,
          userId: personId,
          data: { isTyping: false, lastActivity: Date.now() },
        }).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, personId]);

  return { setTyping };
}

/**
 * Query typing users for a room.
 */
export function useTypingIndicators(roomToken: string | undefined) {
  const result = useQuery(
    api.presence.getTypingUsers,
    roomToken ? { roomToken } : 'skip'
  );
  return result ?? [];
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
