'use cache: private';

import { cacheTag, cacheLife } from 'next/cache';
import type { ResultTuple } from '@groupi/schema';
import { fetchUserDashboardData } from '../domains/person';
import type { UserDashboardData } from '@groupi/schema/data';
import type {
  NotFoundError,
  AuthenticationError,
  DatabaseError,
  ConnectionError,
  ConstraintError,
} from '@groupi/schema';

// ============================================================================
// USER CACHE FUNCTIONS (PRIVATE)
// ============================================================================

/**
 * Cached user events list - PRIVATE per user
 * Cache for user-specific data with user-events tag for invalidation
 * Uses "use cache: private" to allow access to headers/cookies for auth
 */
export async function getCachedMyEventsData(): Promise<
  ResultTuple<
    | NotFoundError
    | AuthenticationError
    | DatabaseError
    | ConnectionError
    | ConstraintError,
    UserDashboardData
  >
> {
  'use cache: private';
  cacheLife('user');

  // Can now safely call fetchUserDashboardData which uses getCurrentUserId() internally
  const result = await fetchUserDashboardData({});

  // If successful, add user-specific cache tag
  if (!result[0] && result[1]) {
    const userId = result[1].id;
    cacheTag(`user-${userId}`, `user-${userId}-events`);
  }

  return result;
}
