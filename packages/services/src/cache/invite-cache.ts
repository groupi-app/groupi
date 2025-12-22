'use cache: private';

import { cacheTag, cacheLife } from 'next/cache';
import type { ResultTuple, SerializedError } from '@groupi/schema';
import { serializeResultTuple } from '@groupi/schema';
import { fetchInvitePageData } from '../domains/invite';
import type { InvitePageData } from '@groupi/schema/data';

// ============================================================================
// INVITE CACHE FUNCTIONS (PRIVATE)
// ============================================================================

/**
 * Cached invite details for acceptance flow - PRIVATE per user
 * Cache for 2 minutes with invite-specific tag for invalidation
 */
export async function getCachedInviteData(
  inviteId: string
): Promise<ResultTuple<SerializedError, InvitePageData>> {
  'use cache: private';
  cacheLife('event');
  cacheTag(`invite-${inviteId}`);

  const result = await fetchInvitePageData({ inviteId });
  return serializeResultTuple(result);
}
