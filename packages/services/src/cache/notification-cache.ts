'use cache: private';

import { cacheTag, cacheLife } from 'next/cache';
import type { ResultTuple, SerializedError } from '@groupi/schema';
import { serializeResultTuple } from '@groupi/schema';
import {
  fetchNotificationsForPerson,
  getUnreadNotificationCount,
} from '../domains/notification';
import type {
  NotificationFeedData,
  NotificationCountData,
} from '@groupi/schema/data';
import type { GetNotificationsForPersonParams } from '@groupi/schema/params';
import { getUserId } from '../domains/auth-helpers';

// ============================================================================
// NOTIFICATION CACHE FUNCTIONS (PRIVATE)
// ============================================================================

/**
 * Cached notifications for person - PRIVATE per user
 * Cache for 5 minutes with user-specific tag for invalidation
 * Uses "use cache: private" to allow access to headers/cookies for auth
 */
export async function getCachedNotificationsForPerson(
  params: GetNotificationsForPersonParams = {}
): Promise<ResultTuple<SerializedError, NotificationFeedData[]>> {
  'use cache: private';
  cacheLife('user');

  const result = await fetchNotificationsForPerson(params);

  // If successful, add user-specific cache tag
  if (!result[0] && result[1]) {
    const [authError, userId] = await getUserId();
    if (!authError && userId) {
      cacheTag(`user-${userId}`, `user-${userId}-notifications`);
    }
  }

  return serializeResultTuple(result);
}

/**
 * Cached unread notification count - PRIVATE per user
 * Cache for 5 minutes with user-specific tag for invalidation
 * Uses "use cache: private" to allow access to headers/cookies for auth
 */
export async function getCachedUnreadNotificationCount(): Promise<
  ResultTuple<SerializedError, NotificationCountData>
> {
  'use cache: private';
  cacheLife('user');

  const result = await getUnreadNotificationCount({});

  // If successful, add user-specific cache tag
  if (!result[0] && result[1]) {
    const [authError, userId] = await getUserId();
    if (!authError && userId) {
      cacheTag(`user-${userId}`, `user-${userId}-notifications`);
    }
  }

  return serializeResultTuple(result);
}
