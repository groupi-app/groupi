import { cacheTag, cacheLife } from 'next/cache';
import type { ResultTuple, SerializedError } from '@groupi/schema';
import { serializeResultTuple } from '@groupi/schema';
import { fetchUserDashboardData, fetchUserProfile } from '../domains/person';
import type { UserDashboardData, UserProfileData } from '@groupi/schema/data';

// ============================================================================
// USER CACHE FUNCTIONS (PRIVATE)
// ============================================================================

/**
 * Cached user events list - PRIVATE per user
 * Cache for user-specific data with user-events tag for invalidation
 * Uses "use cache: private" to allow access to headers/cookies for auth
 */
export async function getCachedMyEventsData(): Promise<
  ResultTuple<SerializedError, UserDashboardData>
> {
  'use cache: private';
  cacheLife('user');

  // Can now safely call fetchUserDashboardData which uses getUserId() internally
  // Note: With cache components, if this function executes (cache miss),
  // you'll see database queries in logs. On cache hit, this code doesn't run.
  const result = await fetchUserDashboardData({});

  // If successful, add user-specific cache tag
  if (!result[0] && result[1]) {
    const userId = result[1].id;
    cacheTag(`user-${userId}`, `user-${userId}-events`);
  }

  return serializeResultTuple(result);
}

/**
 * Cached user profile data - PRIVATE per user
 * Cache for user-specific profile data with user-profile tag for invalidation
 * Uses "use cache: private" to allow access to headers/cookies for auth
 */
export async function getCachedUserProfileData(
  userId: string
): Promise<ResultTuple<SerializedError, UserProfileData>> {
  'use cache: private';
  cacheLife('user');

  const result = await fetchUserProfile({ userId });

  // If successful, add user-specific cache tag
  if (!result[0] && result[1]) {
    cacheTag(`user-${userId}`, `user-${userId}-profile`);
  }

  return serializeResultTuple(result);
}
