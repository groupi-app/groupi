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

interface VisibilityContextValue {
  /** Whether the document/tab is currently visible */
  isVisible: boolean;
  /** Whether the window is currently focused */
  isFocused: boolean;
  /** Whether the user has been idle (no interaction) for the timeout period */
  isAway: boolean;
  /** Whether the app should be considered "active" (visible AND not away) */
  isActive: boolean;
  /** Manually reset the idle timer (e.g., after programmatic activity) */
  resetIdleTimer: () => void;
}

const VisibilityContext = createContext<VisibilityContextValue>({
  isVisible: true,
  isFocused: true,
  isAway: false,
  isActive: true,
  resetIdleTimer: () => {},
});

interface VisibilityProviderProps {
  children: ReactNode;
  /** Idle timeout in milliseconds. Default: 5 minutes (300000ms) */
  idleTimeoutMs?: number;
}

/**
 * Provider that tracks document visibility, focus, and user activity state.
 *
 * This enables pausing expensive operations (subscriptions, animations)
 * when the user isn't actively using the app, reducing bandwidth
 * and function calls significantly.
 *
 * Features:
 * - Tracks tab visibility (hidden tabs pause)
 * - Tracks window focus
 * - Tracks user activity (mouse, keyboard, touch, scroll)
 * - Auto-sets "away" status after idle timeout
 *
 * Place this near the root of your app, inside the Convex provider.
 */
export function VisibilityProvider({
  children,
  idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
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

  // Use ref to track the timeout so we can clear it
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Track last activity time for debugging (initialized on first activity)
  const lastActivityRef = useRef<number>(0);

  // Internal function to set up the idle timeout (doesn't call setState)
  // Used for initial setup to avoid cascading renders in effects
  const setupIdleTimeout = useCallback(() => {
    // Clear existing timeout
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }

    // Only set idle timeout if tab is visible
    // (hidden tabs are already paused, no need to track idle)
    if (
      typeof document !== 'undefined' &&
      document.visibilityState === 'visible'
    ) {
      idleTimeoutRef.current = setTimeout(() => {
        setIsAway(true);
      }, idleTimeoutMs);
    }
  }, [idleTimeoutMs]);

  // Reset idle timer - called on any user activity
  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    // If user was away, mark them as back
    setIsAway(false);

    // Set up new idle timeout
    setupIdleTimeout();
  }, [setupIdleTimeout]);

  // Debounce timeout ref for visibility changes
  const visibilityDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Handle visibility changes with debounce on restoration
  // This prevents rapid tab switching from causing repeated subscribe/unsubscribe cycles
  useEffect(() => {
    const VISIBILITY_DEBOUNCE_MS = 150; // Wait 150ms before marking visible

    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';

      // Clear any pending visibility debounce
      if (visibilityDebounceRef.current) {
        clearTimeout(visibilityDebounceRef.current);
        visibilityDebounceRef.current = null;
      }

      if (visible) {
        // Tab became visible - debounce to avoid rapid tab switching churn
        visibilityDebounceRef.current = setTimeout(() => {
          setIsVisible(true);
          resetIdleTimer();
        }, VISIBILITY_DEBOUNCE_MS);
      } else {
        // Tab hidden - immediately pause (no debounce needed)
        setIsVisible(false);
        // Clear idle timer (we pause anyway when hidden)
        if (idleTimeoutRef.current) {
          clearTimeout(idleTimeoutRef.current);
          idleTimeoutRef.current = null;
        }
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
      // Clean up debounce on unmount
      if (visibilityDebounceRef.current) {
        clearTimeout(visibilityDebounceRef.current);
      }
    };
  }, [resetIdleTimer]);

  // Track user activity events
  useEffect(() => {
    // Activity events to listen for
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

    // Throttle activity detection to avoid excessive state updates
    let lastEventTime = 0;
    const THROTTLE_MS = 1000; // Only process one event per second

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastEventTime >= THROTTLE_MS) {
        lastEventTime = now;
        resetIdleTimer();
      }
    };

    // Use passive listeners for better scroll performance
    const options: AddEventListenerOptions = { passive: true, capture: true };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, options);
    });

    // Start initial idle timer (use setupIdleTimeout to avoid setState on mount)
    setupIdleTimeout();

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, options);
      });

      // Clear timeout on unmount
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
    };
  }, [resetIdleTimer, setupIdleTimeout]);

  const value: VisibilityContextValue = {
    isVisible,
    isFocused,
    isAway,
    // Active means: visible AND not idle/away
    // This is what hooks should use to pause subscriptions
    isActive: isVisible && !isAway,
    resetIdleTimer,
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
 * Hook that returns whether the app should be considered "active".
 * This means: tab is visible AND user is not idle/away.
 *
 * Use this for pausing subscriptions and expensive operations.
 */
export function useIsActive(): boolean {
  return useContext(VisibilityContext).isActive;
}

/**
 * Hook to manually reset the idle timer.
 * Useful after programmatic activity that doesn't trigger DOM events.
 */
export function useResetIdleTimer(): () => void {
  return useContext(VisibilityContext).resetIdleTimer;
}
