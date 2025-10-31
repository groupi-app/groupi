'use cache: private';

import { cacheTag, cacheLife } from 'next/cache';
import type { ResultTuple } from '@groupi/schema';
import { fetchUserSettings } from '../domains/settings';
import type { SettingsPageData } from '@groupi/schema/data';
import type {
  NotFoundError,
  AuthenticationError,
  DatabaseError,
  ConnectionError,
  ConstraintError,
} from '@groupi/schema';

// ============================================================================
// SETTINGS CACHE FUNCTIONS (PRIVATE)
// ============================================================================

/**
 * Cached settings data - PRIVATE per user
 * Cache for 5 minutes with user-specific tag for invalidation
 * Uses "use cache: private" to ensure user isolation
 */
export async function getCachedSettingsData(): Promise<
  ResultTuple<
    | NotFoundError
    | AuthenticationError
    | DatabaseError
    | ConnectionError
    | ConstraintError,
    SettingsPageData
  >
> {
  'use cache: private';
  cacheLife('user');

  const result = await fetchUserSettings({});

  // If successful, add user-specific cache tag
  if (!result[0] && result[1]) {
    const userId = result[1].personId;
    cacheTag(`user-${userId}`, `user-${userId}-settings`);
  }

  return result;
}
