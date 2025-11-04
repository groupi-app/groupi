'use cache: private';

import { cacheTag, cacheLife } from 'next/cache';
import type { ResultTuple } from '@groupi/schema';
import { getEventHeaderData, getEventNewPostPageData } from '../domains/event';
import { getMemberListData } from '../domains/membership';
import { getEventPotentialDateTimes } from '../domains/availability';
import { getEventInvitePageData } from '../domains/invite';
import type {
  EventHeaderData,
  MemberListPageData,
  EventNewPostPageData,
  AvailabilityPageData,
  EventInvitePageData,
} from '@groupi/schema/data';
import type {
  NotFoundError,
  UnauthorizedError,
  AuthenticationError,
  DatabaseError,
  ConnectionError,
  ConstraintError,
} from '@groupi/schema';

// ============================================================================
// EVENT CACHE FUNCTIONS (PRIVATE)
// ============================================================================
// Note: Using "use cache: private" because our service layer uses getUserId()
// which accesses headers(). Events are still cached per user, with shared eventId tags.

/**
 * Cached event header data - PRIVATE per user
 * Cache for 5 minutes with event-specific tag for invalidation
 */
export async function getCachedEventHeaderData(
  eventId: string
): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | AuthenticationError
    | DatabaseError
    | ConnectionError
    | ConstraintError,
    EventHeaderData
  >
> {
  'use cache: private';
  cacheLife('event');
  cacheTag(`event-${eventId}`, `event-${eventId}-header`);

  return await getEventHeaderData({ eventId });
}

/**
 * Cached event members/member list data - PRIVATE per user
 * Cache for 2 minutes with event-members tag for invalidation
 */
export async function getCachedEventAttendeesData(
  eventId: string
): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | AuthenticationError
    | DatabaseError
    | ConnectionError
    | ConstraintError,
    MemberListPageData
  >
> {
  'use cache: private';
  cacheLife('event');
  cacheTag(`event-${eventId}`, `event-${eventId}-members`);

  return await getMemberListData({ eventId });
}

/**
 * Cached event new post page data - PRIVATE per user
 * Cache for 5 minutes with event-specific tag for invalidation
 */
export async function getCachedEventNewPostPageData(
  eventId: string
): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | AuthenticationError
    | DatabaseError
    | ConnectionError
    | ConstraintError,
    EventNewPostPageData
  >
> {
  'use cache: private';
  cacheLife('event');
  cacheTag(`event-${eventId}`, `event-${eventId}-new-post`);

  return await getEventNewPostPageData({ eventId });
}

/**
 * Cached event availability data - PRIVATE per user
 * Cache for 2 minutes with event-availability tag for invalidation
 */
export async function getCachedEventAvailabilityData(
  eventId: string
): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | AuthenticationError
    | DatabaseError
    | ConnectionError
    | ConstraintError,
    AvailabilityPageData
  >
> {
  'use cache: private';
  cacheLife('event');
  cacheTag(`event-${eventId}`, `event-${eventId}-availability`);

  return await getEventPotentialDateTimes({ eventId });
}

/**
 * Cached event invite page data - PRIVATE per user
 * Cache for 5 minutes with event-invite tag for invalidation
 */
export async function getCachedEventInviteData(
  eventId: string
): Promise<
  ResultTuple<
    | NotFoundError
    | UnauthorizedError
    | AuthenticationError
    | DatabaseError
    | ConnectionError
    | ConstraintError,
    EventInvitePageData
  >
> {
  'use cache: private';
  cacheLife('event');
  cacheTag(`event-${eventId}`, `event-${eventId}-invites`);

  return await getEventInvitePageData({ eventId });
}
