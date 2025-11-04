'use cache: private';

import { cacheTag, cacheLife } from 'next/cache';
import type { ResultTuple } from '@groupi/schema';
import { fetchInvitePageData } from '../domains/invite';
import type { InvitePageData } from '@groupi/schema/data';
import type {
  NotFoundError,
  UnauthorizedError,
  AuthenticationError,
  DatabaseError,
  ConnectionError,
  ConstraintError,
  ValidationError,
} from '@groupi/schema';

// ============================================================================
// INVITE CACHE FUNCTIONS (PRIVATE)
// ============================================================================

/**
 * Cached invite details for acceptance flow - PRIVATE per user
 * Cache for 2 minutes with invite-specific tag for invalidation
 */
export async function getCachedInviteData(
  inviteId: string
): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | AuthenticationError
    | DatabaseError
    | ConnectionError
    | ConstraintError
    | ValidationError,
    InvitePageData
  >
> {
  'use cache: private';
  cacheLife('event');
  cacheTag(`invite-${inviteId}`);

  return await fetchInvitePageData({ inviteId });
}
