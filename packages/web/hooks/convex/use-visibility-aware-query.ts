'use client';

import { useRef } from 'react';
import { useQuery } from 'convex/react';
import { useIsActive } from '@/providers/visibility-provider';
import type { FunctionReference, FunctionArgs } from 'convex/server';

/**
 * An activity-aware wrapper around Convex's useQuery.
 *
 * When the tab is hidden or user is away (idle), this hook:
 * 1. Skips the Convex subscription to save bandwidth and function calls
 * 2. Returns the last known value (cached) instead of undefined
 *
 * When the tab becomes visible and user is active again:
 * 1. Re-subscribes to the query automatically
 * 2. Updates with fresh data from the server
 *
 * This significantly reduces bandwidth usage for apps that users leave
 * open in background tabs or walk away from.
 *
 * @example
 * ```tsx
 * // Instead of:
 * const notifications = useQuery(api.notifications.list, { limit: 10 });
 *
 * // Use:
 * const notifications = useVisibilityAwareQuery(api.notifications.list, { limit: 10 });
 * ```
 *
 * @param query - The Convex query function reference
 * @param args - The query arguments, or "skip" to disable
 * @returns The query result, or cached result if tab is hidden or user is away
 */
export function useVisibilityAwareQuery<
  Query extends FunctionReference<'query'>,
>(
  query: Query,
  args: FunctionArgs<Query> | 'skip'
): ReturnType<typeof useQuery<Query>> {
  const isActive = useIsActive();
  const cachedResultRef = useRef<ReturnType<typeof useQuery<Query>>>(undefined);

  // If tab is hidden or user is away, skip the subscription
  // If args is already "skip", respect that
  const effectiveArgs = !isActive ? 'skip' : args;

  const result = useQuery(query, effectiveArgs);

  // Update cache when we get a real result
  if (result !== undefined) {
    // eslint-disable-next-line react-hooks/refs -- Intentional caching pattern for visibility optimization
    cachedResultRef.current = result;
  }

  // Return cached result if not active and we have cached data
  // eslint-disable-next-line react-hooks/refs -- Intentional caching pattern for visibility optimization
  if (!isActive && cachedResultRef.current !== undefined) {
    // eslint-disable-next-line react-hooks/refs -- Intentional caching pattern for visibility optimization
    return cachedResultRef.current;
  }

  return result;
}

/**
 * Same as useVisibilityAwareQuery but always returns fresh data.
 * Does not cache when hidden/away - returns undefined instead.
 *
 * Use this for queries where stale data would be confusing or problematic.
 */
export function useVisibilityAwareQueryNoCache<
  Query extends FunctionReference<'query'>,
>(
  query: Query,
  args: FunctionArgs<Query> | 'skip'
): ReturnType<typeof useQuery<Query>> {
  const isActive = useIsActive();

  // If tab is hidden or user is away, skip the subscription
  const effectiveArgs = !isActive ? 'skip' : args;

  return useQuery(query, effectiveArgs);
}
