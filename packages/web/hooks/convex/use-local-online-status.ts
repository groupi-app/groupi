'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Hook that computes online status locally from cached presence data.
 * Uses setInterval to update UI without network requests.
 *
 * This follows the Convex presence optimization pattern - instead of
 * re-fetching to check if users went offline, we compute status locally
 * from cached lastHeartbeat timestamps using a periodic interval.
 *
 * @param presenceData - Array of users with lastHeartbeat timestamps
 * @param offlineThreshold - Time in ms before user is considered offline (default: 60s)
 * @param refreshInterval - How often to recompute status in ms (default: 10s)
 * @returns Array of users with computed isOnline status
 */
export function useLocalOnlineStatus<T extends { lastHeartbeat?: number }>(
  presenceData: T[] | undefined,
  offlineThreshold = 60000,
  refreshInterval = 10000
): (T & { isOnline: boolean })[] {
  // Use a ref to track the current timestamp (impure but safe in ref)
  const timestampRef = useRef(0);

  // Trigger re-render periodically to recompute online status
  // This doesn't make network requests - just recalculates from cached data
  const [, setTick] = useState(0);

  useEffect(() => {
    // Initialize timestamp on mount (in effect, not during render)
    timestampRef.current = Date.now();
    setTick(t => t + 1);

    const interval = setInterval(() => {
      timestampRef.current = Date.now();
      setTick(t => t + 1);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return useMemo(() => {
    if (!presenceData) return [];
    const now = timestampRef.current;
    return presenceData.map(user => ({
      ...user,
      isOnline:
        user.lastHeartbeat !== undefined &&
        now - user.lastHeartbeat < offlineThreshold,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presenceData, offlineThreshold, timestampRef.current]);
}

/**
 * Helper to compute online status for a single user
 * Useful when you already have the timestamp and don't need reactivity
 */
export function computeOnlineStatus(
  lastHeartbeat: number | undefined,
  offlineThreshold = 60000
): boolean {
  if (lastHeartbeat === undefined) return false;
  return Date.now() - lastHeartbeat < offlineThreshold;
}
