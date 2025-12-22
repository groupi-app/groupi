'use cache: private';

import { cacheTag, cacheLife } from 'next/cache';
import type { ResultTuple, SerializedError } from '@groupi/schema';
import { serializeResultTuple } from '@groupi/schema';
import { getAccountSettingsData } from '../domains/account';
import type { AccountSettingsData } from '@groupi/schema/data';

// ============================================================================
// ACCOUNT CACHE FUNCTIONS (PRIVATE)
// ============================================================================

/**
 * Cached account settings data - PRIVATE per user
 * Cache for 5 minutes with user-specific tag for invalidation
 * Uses "use cache: private" to allow access to headers/cookies for auth
 */
export async function getCachedAccountSettingsData(): Promise<
  ResultTuple<SerializedError, AccountSettingsData>
> {
  'use cache: private';
  cacheLife('user');

  const result = await getAccountSettingsData({});

  // If successful, add user-specific cache tag
  if (!result[0] && result[1]) {
    const userId = result[1].id;
    cacheTag(`user-${userId}`, `user-${userId}-account`);
  }

  return serializeResultTuple(result);
}
