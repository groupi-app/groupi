'use cache: private';

import { cacheTag, cacheLife } from 'next/cache';
import type { ResultTuple, SerializedError } from '@groupi/schema';
import { serializeResultTuple } from '@groupi/schema';
import {
  getEventHeaderData,
  getEventNewPostPageData,
  getEventAttendeesPageData,
  fetchMutualEvents,
} from '../domains/event';
import { getEventPotentialDateTimes } from '../domains/availability';
import { getEventInvitePageData } from '../domains/invite';
import type {
  EventHeaderData,
  EventAttendeesPageData,
  EventNewPostPageData,
  AvailabilityPageData,
  EventInvitePageData,
  MutualEventsData,
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
// CACHED HELPERS (Only cache successful results)
// ============================================================================

/**
 * Cached wrapper that only caches successful EventHeaderData
 * Errors are not cached to prevent serialization issues
 */
async function getCachedEventHeaderDataSuccess(
  eventId: string
): Promise<EventHeaderData> {
  'use cache: private';

  cacheLife('event');
  cacheTag(`event-${eventId}`, `event-${eventId}-header`);

  const result = await getEventHeaderData({ eventId });

  if (result[0]) {
    throw result[0]; // Throw error instead of returning tuple
  }
  return result[1];
}

// Note: getCachedMemberListDataSuccess was removed as it's not currently used
// If needed in the future, it can be re-added to cache MemberListPageData

/**
 * Cached wrapper that only caches successful EventAttendeesPageData
 * Errors are not cached to prevent serialization issues
 */
async function getCachedEventAttendeesPageDataSuccess(
  eventId: string
): Promise<EventAttendeesPageData> {
  'use cache: private';
  cacheLife('event');
  cacheTag(`event-${eventId}`, `event-${eventId}-attendees`);

  const result = await getEventAttendeesPageData({ eventId });
  if (result[0]) {
    throw result[0]; // Throw error instead of returning tuple
  }
  return result[1];
}

// ============================================================================
// EVENT CACHE FUNCTIONS (PRIVATE)
// ============================================================================
// Note: Using "use cache: private" because our service layer uses getUserId()
// which accesses headers(). Events are still cached per user, with shared eventId tags.

/**
 * Cached event header data - PRIVATE per user
 * Cache for 5 minutes with event-specific tag for invalidation
 * Only caches successful results - errors are returned without caching
 */
export async function getCachedEventHeaderData(
  eventId: string
): Promise<ResultTuple<SerializedError, EventHeaderData>> {
  try {
    const data = await getCachedEventHeaderDataSuccess(eventId);
    return serializeResultTuple([null, data] as [null, EventHeaderData]);
  } catch (error) {
    // Errors are not cached - serialize error tuple for cache safety
    if (error && typeof error === 'object' && '_tag' in error) {
      return serializeResultTuple([
        error as
          | NotFoundError
          | UnauthorizedError
          | AuthenticationError
          | DatabaseError
          | ConnectionError
          | ConstraintError,
        undefined,
      ] as [
        (
          | NotFoundError
          | UnauthorizedError
          | AuthenticationError
          | DatabaseError
          | ConnectionError
          | ConstraintError
        ),
        undefined,
      ]) as ResultTuple<SerializedError, EventHeaderData>;
    }
    // Fallback for unexpected error types
    return [{ _tag: 'UnknownError' }, undefined] as ResultTuple<
      SerializedError,
      EventHeaderData
    >;
  }
}

/**
 * Cached event attendees page data - PRIVATE per user
 * Cache for 2 minutes with event-attendees tag for invalidation
 * Only caches successful results - errors are returned without caching
 */
export async function getCachedEventAttendeesData(
  eventId: string
): Promise<ResultTuple<SerializedError, EventAttendeesPageData>> {
  try {
    const data = await getCachedEventAttendeesPageDataSuccess(eventId);
    return serializeResultTuple([null, data] as [null, EventAttendeesPageData]);
  } catch (error) {
    // Errors are not cached - serialize error tuple for cache safety
    if (error && typeof error === 'object' && '_tag' in error) {
      return serializeResultTuple([
        error as
          | NotFoundError
          | UnauthorizedError
          | AuthenticationError
          | DatabaseError
          | ConnectionError
          | ConstraintError,
        undefined,
      ] as [
        (
          | NotFoundError
          | UnauthorizedError
          | AuthenticationError
          | DatabaseError
          | ConnectionError
          | ConstraintError
        ),
        undefined,
      ]) as ResultTuple<SerializedError, EventAttendeesPageData>;
    }
    // Fallback for unexpected error types
    return [{ _tag: 'UnknownError' }, undefined] as ResultTuple<
      SerializedError,
      EventAttendeesPageData
    >;
  }
}

/**
 * Cached event new post page data - PRIVATE per user
 * Cache for 5 minutes with event-specific tag for invalidation
 */
export async function getCachedEventNewPostPageData(
  eventId: string
): Promise<ResultTuple<SerializedError, EventNewPostPageData>> {
  'use cache: private';
  cacheLife('event');
  cacheTag(`event-${eventId}`, `event-${eventId}-new-post`);

  const result = await getEventNewPostPageData({ eventId });
  return serializeResultTuple(result);
}

/**
 * Cached event availability data - PRIVATE per user
 * Cache for 2 minutes with event-availability tag for invalidation
 */
export async function getCachedEventAvailabilityData(
  eventId: string
): Promise<ResultTuple<SerializedError, AvailabilityPageData>> {
  'use cache: private';
  cacheLife('event');
  cacheTag(`event-${eventId}`, `event-${eventId}-availability`);

  const result = await getEventPotentialDateTimes({ eventId });
  return serializeResultTuple(result);
}

/**
 * Cached event invite page data - PRIVATE per user
 * Cache for 5 minutes with event-invite tag for invalidation
 */
export async function getCachedEventInviteData(
  eventId: string
): Promise<ResultTuple<SerializedError, EventInvitePageData>> {
  'use cache: private';
  cacheLife('event');
  cacheTag(`event-${eventId}`, `event-${eventId}-invites`);

  const result = await getEventInvitePageData({ eventId });
  return serializeResultTuple(result);
}

/**
 * Check if user has set availability for an event
 * Returns true if user has availability set, false otherwise
 * Returns null if event doesn't have voting enabled or user is organizer
 * Returns undefined on error
 */
export async function hasUserSetAvailability(
  eventId: string
): Promise<boolean | null | undefined> {
  const [error, availabilityData] =
    await getCachedEventAvailabilityData(eventId);

  if (error) {
    // If unauthorized or not found, don't redirect (let the page handle it)
    return undefined;
  }

  const { potentialDateTimes, userRole, userId } = availabilityData;

  // If no potential date times, voting is not enabled - don't require availability
  if (!potentialDateTimes || potentialDateTimes.length === 0) {
    return null;
  }

  // Organizers don't vote on availabilities - don't require availability
  if (userRole === 'ORGANIZER') {
    return null;
  }

  // Check if user has any availabilities set
  const memberAvailabilities = potentialDateTimes.flatMap(pdt =>
    pdt.availabilities.filter(avail => avail.membership.person.id === userId)
  );

  return memberAvailabilities.length > 0;
}

/**
 * Check if user should be redirected to availability page
 * Only redirects if there's an active poll (no chosen date) and user hasn't set availability
 * Returns true if redirect is needed, false otherwise
 * Returns null if event has chosen date (no active poll) or availability not required
 * Returns undefined on error (don't redirect on error)
 */
export async function shouldRedirectToAvailability(
  eventId: string
): Promise<boolean | null | undefined> {
  // First check if event has a chosen date (if yes, no active poll - don't redirect)
  const [headerError, headerData] = await getCachedEventHeaderData(eventId);

  if (headerError) {
    // If we can't get header data, don't redirect (let the page handle the error)
    return undefined;
  }

  const hasChosenDate = headerData?.event?.chosenDateTime;

  // If event has a chosen date, there's no active poll - don't redirect
  if (hasChosenDate) {
    return null;
  }

  // No chosen date means there's an active poll - check if user has set availability
  const hasAvailability = await hasUserSetAvailability(eventId);

  // If error checking availability, don't redirect
  if (hasAvailability === undefined) {
    return undefined;
  }

  // If availability not required (null), don't redirect
  if (hasAvailability === null) {
    return null;
  }

  // If user hasn't set availability (false), redirect is needed
  // If user has set availability (true), no redirect needed
  return hasAvailability === false;
}

/**
 * Cached mutual events data - PRIVATE per user pair
 * Cache for mutual events between current user and another user
 * Uses "use cache: private" to allow access to headers/cookies for auth
 */
export async function getCachedMutualEventsData(
  otherUserId: string
): Promise<ResultTuple<SerializedError, MutualEventsData>> {
  'use cache: private';
  cacheLife('user');

  const result = await fetchMutualEvents({ otherUserId });

  // If successful, add cache tags for both users
  if (!result[0] && result[1]) {
    // Tag with both user IDs for invalidation
    cacheTag(`user-${otherUserId}`, `mutual-events-${otherUserId}`);
  }

  return serializeResultTuple(result);
}
