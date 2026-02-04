'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';

// Default idle timeout: 5 minutes of no interaction
const DEFAULT_IDLE_TIMEOUT_MS = 5 * 60 * 1000;

// Grace period before marking as "away" when tab is hidden
// This prevents quick tab switches from triggering idle status
const DEFAULT_TAB_HIDDEN_GRACE_MS = 30 * 1000; // 30 seconds

// Extended idle timeout: after this long, user is considered "offline"
// This stops all heartbeats to save resources
const DEFAULT_OFFLINE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

interface VisibilityContextValue {
  /** Whether the document/tab is currently visible */
  isVisible: boolean;
  /** Whether the window is currently focused */
  isFocused: boolean;
  /** Whether the user has been idle (no interaction) for the idle timeout */
  isAway: boolean;
  /** Whether the user has been away for extended period (offline timeout) */
  isOffline: boolean;
  /** Whether the app should be considered "active" (visible AND not away) */
  isActive: boolean;
  /** Whether queries should be paused (hidden for grace period OR away) */
  shouldPauseQueries: boolean;
  /** Whether heartbeats should be paused (away OR hidden past grace period) */
  shouldPauseHeartbeats: boolean;
  /** Manually reset the idle timer (e.g., after programmatic activity) */
  resetIdleTimer: () => void;
  /** Timestamp of last activity (for cache freshness checks) */
  lastActivityTime: number;
}

const VisibilityContext = createContext<VisibilityContextValue>({
  isVisible: true,
  isFocused: true,
  isAway: false,
  isOffline: false,
  isActive: true,
  shouldPauseQueries: false,
  shouldPauseHeartbeats: false,
  resetIdleTimer: () => {},
  lastActivityTime: Date.now(),
});

interface VisibilityProviderProps {
  children: ReactNode;
  /** Idle timeout in milliseconds. Default: 5 minutes (300000ms) */
  idleTimeoutMs?: number;
  /** Grace period before pausing when tab is hidden. Default: 30 seconds */
  tabHiddenGraceMs?: number;
  /** Extended idle timeout before marking offline. Default: 15 minutes */
  offlineTimeoutMs?: number;
}

/**
 * Provider that tracks document visibility, focus, and user activity state.
 *
 * This enables pausing expensive operations (subscriptions, animations)
 * when the user isn't actively using the app, reducing bandwidth
 * and function calls significantly.
 *
 * Features:
 * - Tracks tab visibility (hidden tabs pause after grace period)
 * - Tracks window focus
 * - Tracks user activity (mouse, keyboard, touch, scroll)
 * - Auto-sets "away" status after idle timeout (5 min default)
 * - Auto-sets "offline" status after extended idle (15 min default)
 * - Grace period before pausing when tab hidden (30 sec default)
 *
 * State transitions:
 * - visible + active → immediate queries, heartbeats active
 * - hidden (< grace period) → queries continue, heartbeats continue (quick tab switch)
 * - hidden (> grace period) → queries paused, heartbeats paused
 * - away (idle 5 min) → queries paused, heartbeats paused, status set to IDLE
 * - offline (idle 15 min) → all stopped, status shows offline
 *
 * Place this near the root of your app, inside the Convex provider.
 */
export function VisibilityProvider({
  children,
  idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
  tabHiddenGraceMs = DEFAULT_TAB_HIDDEN_GRACE_MS,
  offlineTimeoutMs = DEFAULT_OFFLINE_TIMEOUT_MS,
}: VisibilityProviderProps) {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof document === 'undefined') return true;
    return document.visibilityState === 'visible';
  });

  const [isFocused, setIsFocused] = useState(() => {
    if (typeof window === 'undefined') return true;
    return document.hasFocus();
  });

  const [isAway, setIsAway] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // Track whether we've exceeded the grace period for hidden tabs
  const [isPastHiddenGrace, setIsPastHiddenGrace] = useState(false);

  // Track last activity time (exposed for cache freshness checks)
  const [lastActivityTime, setLastActivityTime] = useState(() => Date.now());

  // Timeout refs
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const offlineTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hiddenGraceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const visibilityDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all timeouts helper
  const clearAllTimeouts = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
      idleTimeoutRef.current = null;
    }
    if (offlineTimeoutRef.current) {
      clearTimeout(offlineTimeoutRef.current);
      offlineTimeoutRef.current = null;
    }
    if (hiddenGraceTimeoutRef.current) {
      clearTimeout(hiddenGraceTimeoutRef.current);
      hiddenGraceTimeoutRef.current = null;
    }
  }, []);

  // Set up idle and offline timeouts
  const setupIdleTimeouts = useCallback(() => {
    clearAllTimeouts();

    // Only set timeouts if tab is visible
    if (
      typeof document !== 'undefined' &&
      document.visibilityState === 'visible'
    ) {
      // Idle timeout (5 min default)
      idleTimeoutRef.current = setTimeout(() => {
        setIsAway(true);

        // Start offline timeout from when user becomes away
        offlineTimeoutRef.current = setTimeout(() => {
          setIsOffline(true);
        }, offlineTimeoutMs - idleTimeoutMs);
      }, idleTimeoutMs);
    }
  }, [idleTimeoutMs, offlineTimeoutMs, clearAllTimeouts]);

  // Reset idle timer - called on any user activity
  const resetIdleTimer = useCallback(() => {
    const now = Date.now();
    setLastActivityTime(now);

    // If user was away or offline, mark them as back
    setIsAway(false);
    setIsOffline(false);
    setIsPastHiddenGrace(false);

    // Set up new idle timeouts
    setupIdleTimeouts();
  }, [setupIdleTimeouts]);

  // Handle visibility changes
  useEffect(() => {
    const VISIBILITY_DEBOUNCE_MS = 150; // Wait before marking visible

    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';

      // Clear any pending visibility debounce
      if (visibilityDebounceRef.current) {
        clearTimeout(visibilityDebounceRef.current);
        visibilityDebounceRef.current = null;
      }

      if (visible) {
        // Tab became visible - debounce to avoid rapid tab switching
        visibilityDebounceRef.current = setTimeout(() => {
          setIsVisible(true);
          setIsPastHiddenGrace(false);

          // Clear hidden grace timeout
          if (hiddenGraceTimeoutRef.current) {
            clearTimeout(hiddenGraceTimeoutRef.current);
            hiddenGraceTimeoutRef.current = null;
          }

          // Only reset idle timer if user wasn't already away
          // This preserves away/offline state across quick tab switches
          resetIdleTimer();
        }, VISIBILITY_DEBOUNCE_MS);
      } else {
        // Tab hidden - start grace period countdown
        setIsVisible(false);

        // Clear idle/offline timeouts (we'll track via hidden grace instead)
        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
          idleTimeoutRef.current = null;
        }

        // Start grace period timer
        // After grace period, mark as "past grace" to pause queries/heartbeats
        hiddenGraceTimeoutRef.current = setTimeout(() => {
          setIsPastHiddenGrace(true);
          setIsAway(true);

          // After additional time, mark as offline
          offlineTimeoutRef.current = setTimeout(() => {
            setIsOffline(true);
          }, offlineTimeoutMs - tabHiddenGraceMs);
        }, tabHiddenGraceMs);
      }
    };

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => setIsFocused(false);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      if (visibilityDebounceRef.current) {
        clearTimeout(visibilityDebounceRef.current);
      }
    };
  }, [resetIdleTimer, tabHiddenGraceMs, offlineTimeoutMs]);

  // Track user activity events
  useEffect(() => {
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'keypress',
      'touchstart',
      'touchmove',
      'scroll',
      'wheel',
      'click',
      'pointerdown',
      'pointermove',
    ];

    // Throttle activity detection
    let lastEventTime = 0;
    const THROTTLE_MS = 1000;

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastEventTime >= THROTTLE_MS) {
        lastEventTime = now;
        resetIdleTimer();
      }
    };

    const options: AddEventListenerOptions = { passive: true, capture: true };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, options);
    });

    // Start initial idle timer
    setupIdleTimeouts();

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, options);
      });
      clearAllTimeouts();
    };
  }, [resetIdleTimer, setupIdleTimeouts, clearAllTimeouts]);

  // Compute derived states
  // isActive: visible AND not away (for backwards compatibility)
  const isActive = isVisible && !isAway;

  // shouldPauseQueries: true when hidden past grace period OR away
  // This allows queries to continue during the grace period
  const shouldPauseQueries = isPastHiddenGrace || isAway;

  // shouldPauseHeartbeats: true when away OR hidden past grace period
  // Heartbeats continue during grace period so user doesn't flicker offline
  const shouldPauseHeartbeats = isPastHiddenGrace || isAway;

  const value: VisibilityContextValue = {
    isVisible,
    isFocused,
    isAway,
    isOffline,
    isActive,
    shouldPauseQueries,
    shouldPauseHeartbeats,
    resetIdleTimer,
    lastActivityTime,
  };

  return (
    <VisibilityContext.Provider value={value}>
      {children}
    </VisibilityContext.Provider>
  );
}

/**
 * Hook to access the full visibility state.
 *
 * @returns Object with isVisible, isFocused, isAway, isActive, and resetIdleTimer
 */
export function useVisibility(): VisibilityContextValue {
  return useContext(VisibilityContext);
}

/**
 * Hook that returns whether the document is currently visible.
 * Note: This only checks tab visibility, not idle state.
 * For most use cases, prefer useIsActive() which also checks idle state.
 */
export function useIsVisible(): boolean {
  return useContext(VisibilityContext).isVisible;
}

/**
 * Hook that returns whether the user is currently away (idle).
 */
export function useIsAway(): boolean {
  return useContext(VisibilityContext).isAway;
}

/**
 * Hook that returns whether the user is considered offline.
 * This is true after extended idle (15 minutes by default).
 * When offline, all heartbeats should stop.
 */
export function useIsOffline(): boolean {
  return useContext(VisibilityContext).isOffline;
}

/**
 * Hook that returns whether the app should be considered "active".
 * This means: tab is visible AND user is not idle/away.
 *
 * Use this for pausing subscriptions and expensive operations.
 */
export function useIsActive(): boolean {
  return useContext(VisibilityContext).isActive;
}

/**
 * Hook that returns whether queries should be paused.
 * This respects the grace period for hidden tabs.
 *
 * Queries continue during the grace period to maintain cache freshness.
 */
export function useShouldPauseQueries(): boolean {
  return useContext(VisibilityContext).shouldPauseQueries;
}

/**
 * Hook that returns whether heartbeats should be paused.
 * This respects the grace period for hidden tabs.
 *
 * Heartbeats continue during the grace period so user doesn't flicker offline.
 */
export function useShouldPauseHeartbeats(): boolean {
  return useContext(VisibilityContext).shouldPauseHeartbeats;
}

/**
 * Hook to manually reset the idle timer.
 * Useful after programmatic activity that doesn't trigger DOM events.
 */
export function useResetIdleTimer(): () => void {
  return useContext(VisibilityContext).resetIdleTimer;
}

/**
 * Hook that returns the timestamp of last user activity.
 * Useful for cache freshness checks.
 */
export function useLastActivityTime(): number {
  return useContext(VisibilityContext).lastActivityTime;
}
