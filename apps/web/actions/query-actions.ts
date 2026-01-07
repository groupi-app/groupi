'use server';

import {
  getCachedEventHeaderData,
  getCachedMyEventsData,
  getCachedEventAttendeesData,
  getCachedPostFeedData,
  getCachedPostWithReplies,
  getCachedEventInviteData,
  getCachedEventAvailabilityData,
  getCachedNotificationsForPerson,
  getCachedUnreadNotificationCount,
  getCachedUserProfileData,
  getCachedMutualEventsData,
} from '@groupi/services/server';
import type { ResultTuple, SerializedError } from '@groupi/schema';
import type {
  EventHeaderData,
  UserDashboardData,
  EventAttendeesPageData,
  PostFeedData,
  PostDetailPageData,
  EventInvitePageData,
  AvailabilityPageData,
  NotificationFeedData,
  NotificationCountData,
  UserProfileData,
  MutualEventsData,
} from '@groupi/schema/data';
import { withActionTrace } from '@/lib/action-trace';

// ============================================================================
// QUERY ACTIONS (for React Query)
// ============================================================================
// These server actions wrap cache functions so they can be safely called
// from client components via React Query's queryFn

/**
 * Fetch event header data
 * Server action wrapper for getCachedEventHeaderData
 */
export async function fetchEventHeaderAction(
  eventId: string
): Promise<ResultTuple<SerializedError, EventHeaderData>> {
  return withActionTrace('fetchEventHeader', async () => {
    return await getCachedEventHeaderData(eventId);
  });
}

/**
 * Fetch user events list
 * Server action wrapper for getCachedMyEventsData
 */
export async function fetchUserEventsAction(): Promise<
  ResultTuple<SerializedError, UserDashboardData>
> {
  return withActionTrace('fetchUserEvents', async () => {
    return await getCachedMyEventsData();
  });
}

/**
 * Fetch event attendees/members list
 * Server action wrapper for getCachedEventAttendeesData
 */
export async function fetchEventAttendeesAction(
  eventId: string
): Promise<ResultTuple<SerializedError, EventAttendeesPageData>> {
  return withActionTrace('fetchEventAttendees', async () => {
    return await getCachedEventAttendeesData(eventId);
  });
}

/**
 * Fetch post feed data
 * Server action wrapper for getCachedPostFeedData
 */
export async function fetchPostFeedAction(
  eventId: string
): Promise<ResultTuple<SerializedError, PostFeedData>> {
  return withActionTrace('fetchPostFeed', async () => {
    return await getCachedPostFeedData(eventId);
  });
}

/**
 * Fetch post detail with replies
 * Server action wrapper for getCachedPostWithReplies
 */
export async function fetchPostDetailAction(
  postId: string
): Promise<ResultTuple<SerializedError, PostDetailPageData>> {
  return withActionTrace('fetchPostDetail', async () => {
    return await getCachedPostWithReplies(postId);
  });
}

/**
 * Fetch member list for an event
 * Server action wrapper for getCachedEventAttendeesData
 */
export async function fetchMemberListAction(
  eventId: string
): Promise<ResultTuple<SerializedError, EventAttendeesPageData>> {
  return withActionTrace('fetchMemberList', async () => {
    return await getCachedEventAttendeesData(eventId);
  });
}

/**
 * Fetch event invite management data
 * Server action wrapper for getCachedEventInviteData
 */
export async function fetchEventInvitesAction(
  eventId: string
): Promise<ResultTuple<SerializedError, EventInvitePageData>> {
  return withActionTrace('fetchEventInvites', async () => {
    return await getCachedEventInviteData(eventId);
  });
}

/**
 * Fetch event availability data
 * Server action wrapper for getCachedEventAvailabilityData
 */
export async function fetchEventAvailabilityAction(
  eventId: string
): Promise<ResultTuple<SerializedError, AvailabilityPageData>> {
  return withActionTrace('fetchEventAvailability', async () => {
    return await getCachedEventAvailabilityData(eventId);
  });
}

/**
 * Fetch notifications for current user
 * Server action wrapper for getCachedNotificationsForPerson
 */
export async function fetchNotificationsAction(
  cursor?: string
): Promise<ResultTuple<SerializedError, NotificationFeedData[]>> {
  return withActionTrace('fetchNotifications', async () => {
    return await getCachedNotificationsForPerson({ cursor });
  });
}

/**
 * Fetch unread notification count for current user
 * Server action wrapper for getCachedUnreadNotificationCount
 */
export async function fetchNotificationCountAction(): Promise<
  ResultTuple<SerializedError, NotificationCountData>
> {
  return withActionTrace('fetchNotificationCount', async () => {
    return await getCachedUnreadNotificationCount();
  });
}

/**
 * Fetch user profile data by user ID
 * Server action wrapper for getCachedUserProfileData
 */
export async function fetchUserProfileAction(
  userId: string
): Promise<ResultTuple<SerializedError, UserProfileData>> {
  return withActionTrace('fetchUserProfile', async () => {
    return await getCachedUserProfileData(userId);
  });
}

/**
 * Fetch mutual events between current user and another user
 * Server action wrapper for getCachedMutualEventsData
 */
export async function fetchMutualEventsAction(
  otherUserId: string
): Promise<ResultTuple<SerializedError, MutualEventsData>> {
  return withActionTrace('fetchMutualEvents', async () => {
    return await getCachedMutualEventsData(otherUserId);
  });
}
