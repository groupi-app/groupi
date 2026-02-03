'use client';

/* eslint-disable react-hooks/refs -- Intentional stale-while-revalidate caching pattern */

import { useRef } from 'react';
import { useQuery } from 'convex/react';
import { useIsActive } from '@/providers/visibility-provider';
import type { FunctionReference, FunctionArgs } from 'convex/server';

/**
 * An activity-aware wrapper around Convex's useQuery with stale-while-revalidate.
 *
 * When the tab is hidden or user is away (idle), this hook:
 * 1. Skips the Convex subscription to save bandwidth and function calls
 * 2. Returns the last known value (cached) instead of undefined
 *
 * When the tab becomes visible and user is active again:
 * 1. Re-subscribes to the query automatically
 * 2. Returns cached data immediately (no loading flash!)
 * 3. Updates with fresh data when server responds
 *
 * This significantly reduces bandwidth usage for apps that users leave
 * open in background tabs or walk away from, AND prevents loading flashes
 * when users tab back in.
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
 * @returns The query result, or cached result while loading/hidden
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

  // Update cache when we get fresh data
  if (result !== undefined) {
    cachedResultRef.current = result;
  }

  // Stale-while-revalidate: Return cached result when query returns undefined
  // This prevents loading flashes when:
  // 1. User tabs back in and query is re-subscribing
  // 2. User is inactive and we have cached data
  if (result === undefined && cachedResultRef.current !== undefined) {
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
