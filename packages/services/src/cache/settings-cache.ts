'use cache: private';

import { cacheTag, cacheLife } from 'next/cache';
import type { ResultTuple, SerializedError } from '@groupi/schema';
import { serializeResultTuple } from '@groupi/schema';
import { fetchUserSettings } from '../domains/settings';
import type { SettingsPageData } from '@groupi/schema/data';

// ============================================================================
// SETTINGS CACHE FUNCTIONS (PRIVATE)
// ============================================================================

/**
 * Cached settings data - PRIVATE per user
 * Cache for 5 minutes with user-specific tag for invalidation
 * Uses "use cache: private" to allow access to headers/cookies for auth
 */
export async function getCachedSettingsData(): Promise<
  ResultTuple<SerializedError, SettingsPageData>
> {
  'use cache: private';
  cacheLife('user');

  const result = await fetchUserSettings({});

  // If successful, add user-specific cache tag
  if (!result[0] && result[1]) {
    const userId = result[1].personId;
    cacheTag(`user-${userId}`, `user-${userId}-settings`);
  }

  return serializeResultTuple(result);
}
