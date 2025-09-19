// ============================================================================
// SERVER-SIDE PREFETCHING UTILITIES
// ============================================================================

import {
  QueryClient,
  dehydrate,
  type DehydratedState,
} from '@tanstack/react-query';
import { createServerSideHelpers } from '@trpc/react-query/server';
// httpBatchLink not used in this server helper; remove to satisfy build/lint
import superjson from 'superjson';
import { appRouter, type AppRouter } from '@groupi/api';

// ============================================================================
// TRPC SERVER HELPERS
// ============================================================================

/**
 * Create a fresh QueryClient for server-side use (request-scoped)
 */
export function createServerQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: false, // Don't retry on server
      },
    },
  });
}

/**
 * Create tRPC server-side helpers for prefetching
 * Can optionally reuse an existing QueryClient for batching multiple prefetches
 */
export function createTRPCServerHelpers(
  userId?: string,
  queryClient?: QueryClient
) {
  const client = queryClient || createServerQueryClient();

  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: {
      userId: userId || null,
      // Add other context properties as needed
    },
    transformer: superjson,
    queryClient: client,
  });

  return { helpers, queryClient: client };
}

// ============================================================================
// PREFETCH FUNCTIONS
// ============================================================================

/**
 * Prefetch event data for a specific event
 */
export async function prefetchEventData(eventId: string, userId?: string) {
  const queryClient = createServerQueryClient();
  const { helpers } = createTRPCServerHelpers(userId, queryClient);

  try {
    // Prefetch all event-related data in parallel
    await Promise.allSettled([
      helpers.event.getById.prefetch({ id: eventId }),
      helpers.event.getPageData.prefetch({ id: eventId }),
      helpers.invite.getEventData.prefetch({ eventId }),
      helpers.availability.getEventPotentialDateTimes.prefetch({ eventId }),
    ]);

    return dehydrate(queryClient);
  } catch (error) {
    console.error('Error prefetching event data:', error);
    return dehydrate(queryClient); // Return empty dehydrated state
  }
}

/**
 * Prefetch post data for a specific post
 */
export async function prefetchPostData(postId: string, userId?: string) {
  const queryClient = createServerQueryClient();
  const { helpers } = createTRPCServerHelpers(userId, queryClient);

  try {
    // Prefetch post with replies
    await helpers.post.getByIdWithReplies.prefetch({ id: postId });

    return dehydrate(queryClient);
  } catch (error) {
    console.error('Error prefetching post data:', error);
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch user dashboard data
 */
export async function prefetchUserDashboard(userId: string) {
  const queryClient = createServerQueryClient();
  const { helpers } = createTRPCServerHelpers(userId, queryClient);

  try {
    // Prefetch user data and their memberships
    await Promise.allSettled([
      helpers.person.getCurrent.prefetch(),
      helpers.person.getById.prefetch({ userId }),
      helpers.notification.getForUser.prefetch({ id: userId }),
    ]);

    return dehydrate(queryClient);
  } catch (error) {
    console.error('Error prefetching user dashboard data:', error);
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch availability data for an event
 */
export async function prefetchAvailabilityData(
  eventId: string,
  userId?: string
) {
  const { helpers, queryClient } = createTRPCServerHelpers(userId);

  try {
    await helpers.availability.getEventPotentialDateTimes.prefetch({ eventId });
    return dehydrate(queryClient);
  } catch (error) {
    console.error('Error prefetching availability data:', error);
    return dehydrate(queryClient);
  }
}

// ============================================================================
// GENERIC PREFETCH UTILITIES
// ============================================================================

/**
 * Generic prefetch function that accepts multiple queries
 */
export async function prefetchQueries(
  queries: Array<() => Promise<any>>,
  userId?: string
): Promise<DehydratedState> {
  const { queryClient } = createTRPCServerHelpers(userId);

  try {
    await Promise.allSettled(queries);
    return dehydrate(queryClient);
  } catch (error) {
    console.error('Error prefetching queries:', error);
    return dehydrate(queryClient);
  }
}

/**
 * Merge multiple dehydrated states
 * Useful when you have multiple prefetch operations
 */
export function mergeDehydratedStates(
  ...states: DehydratedState[]
): DehydratedState {
  const merged: DehydratedState = {
    mutations: [],
    queries: [],
  };

  states.forEach(state => {
    merged.queries.push(...state.queries);
    merged.mutations.push(...state.mutations);
  });

  // Remove duplicate queries (by queryHash)
  const uniqueQueries = merged.queries.reduce(
    (acc, query) => {
      if (!acc.find(q => q.queryHash === query.queryHash)) {
        acc.push(query);
      }
      return acc;
    },
    [] as typeof merged.queries
  );

  merged.queries = uniqueQueries;

  return merged;
}

// ============================================================================
// PAGE-SPECIFIC PREFETCH HELPERS
// ============================================================================

/**
 * Prefetch data for the event page
 */
export async function prefetchEventPage(eventId: string, userId?: string) {
  return prefetchEventData(eventId, userId);
}

/**
 * Prefetch data for the events list page
 */
export async function prefetchEventsListPage(userId: string) {
  return prefetchUserDashboard(userId);
}

/**
 * Prefetch data for the post page
 */
export async function prefetchPostPage(postId: string, userId?: string) {
  return prefetchPostData(postId, userId);
}

/**
 * Prefetch data for the availability page
 */
export async function prefetchAvailabilityPage(
  eventId: string,
  userId?: string
) {
  return prefetchAvailabilityData(eventId, userId);
}

// ============================================================================
// COMPONENT-SPECIFIC PREFETCH FUNCTIONS
// ============================================================================

// Individual component prefetch functions removed - use prefetchEventPageComponents() instead

/**
 * Prefetch all component data for event page in parallel
 * Uses consolidated event page services
 */
export async function prefetchEventPageComponents(
  eventId: string,
  userId?: string
) {
  const { helpers, queryClient } = createTRPCServerHelpers(userId);

  try {
    // Prefetch all event page component data in parallel
    await Promise.allSettled([
      helpers.event.getHeaderData.prefetch({ id: eventId }),
      helpers.event.getMemberListData.prefetch({ id: eventId }),
      helpers.event.getPostFeedData.prefetch({ id: eventId }),
    ]);

    return dehydrate(queryClient);
  } catch (error) {
    console.error('Error prefetching event page components:', error);
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for MyEvents page
 * Uses consolidated my events service
 */
export async function prefetchMyEventsPageData(userId?: string) {
  const { helpers, queryClient } = createTRPCServerHelpers(userId);

  try {
    // Prefetch my events data
    await helpers.person.getMyEventsData.prefetch();

    return dehydrate(queryClient);
  } catch (error) {
    console.error('Error prefetching my events page data:', error);
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Invite page
 * Uses consolidated invite page service
 */
export async function prefetchInvitePageData(
  inviteId: string,
  userId?: string
) {
  const { helpers, queryClient } = createTRPCServerHelpers(userId);

  try {
    // Prefetch invite page data
    await helpers.invite.getInvitePageData.prefetch({ inviteId });

    return dehydrate(queryClient);
  } catch (error) {
    console.error('Error prefetching invite page data:', error);
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Post Detail page
 * Uses consolidated post detail service
 */
export async function prefetchPostDetailPageData(
  postId: string,
  userId?: string
) {
  const { helpers, queryClient } = createTRPCServerHelpers(userId);

  try {
    // Prefetch post detail data
    await helpers.post.getDetailData.prefetch({ id: postId });

    return dehydrate(queryClient);
  } catch (error) {
    console.error('Error prefetching post detail page data:', error);
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Settings page
 * Uses consolidated settings page service
 */
export async function prefetchSettingsPageData(userId?: string) {
  const { helpers, queryClient } = createTRPCServerHelpers(userId);

  try {
    // Prefetch settings page data
    await helpers.settings.getSettingsPageData.prefetch();

    return dehydrate(queryClient);
  } catch (error) {
    console.error('Error prefetching settings page data:', error);
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Event Invite page
 * Uses consolidated event invite page service
 */
export async function prefetchEventInvitePageData(
  eventId: string,
  userId?: string
) {
  const { helpers, queryClient } = createTRPCServerHelpers(userId);

  try {
    // Prefetch event invite page data
    await helpers.invite.getEventInvitePageData.prefetch({ eventId });

    return dehydrate(queryClient);
  } catch (error) {
    console.error('Error prefetching event invite page data:', error);
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Event Attendees page
 * Uses consolidated event attendees page service
 */
export async function prefetchEventAttendeesPageData(
  eventId: string,
  userId?: string
) {
  const { helpers, queryClient } = createTRPCServerHelpers(userId);

  try {
    // Prefetch event attendees page data
    await helpers.event.getAttendeesPageData.prefetch({ id: eventId });

    return dehydrate(queryClient);
  } catch (error) {
    console.error('Error prefetching event attendees page data:', error);
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Event Availability page
 * Uses consolidated event availability page service
 */
export async function prefetchEventAvailabilityPageData(
  eventId: string,
  userId?: string
) {
  const { helpers, queryClient } = createTRPCServerHelpers(userId);

  try {
    // Prefetch event availability page data
    await helpers.availability.getAvailabilityPageData.prefetch({ eventId });

    return dehydrate(queryClient);
  } catch (error) {
    console.error('Error prefetching event availability page data:', error);
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Event New Post page
 * Uses consolidated event new post page service
 */
export async function prefetchEventNewPostPageData(
  eventId: string,
  userId?: string
) {
  const { helpers, queryClient } = createTRPCServerHelpers(userId);

  try {
    // Prefetch event new post page data
    await helpers.event.getNewPostPageData.prefetch({ id: eventId });

    return dehydrate(queryClient);
  } catch (error) {
    console.error('Error prefetching event new post page data:', error);
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Event Edit page
 * Uses consolidated event edit page service
 */
export async function prefetchEventEditPageData(
  eventId: string,
  userId?: string
) {
  const { helpers, queryClient } = createTRPCServerHelpers(userId);

  try {
    // Prefetch event edit page data
    await helpers.event.getEditPageData.prefetch({ id: eventId });

    return dehydrate(queryClient);
  } catch (error) {
    console.error('Error prefetching event edit page data:', error);
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Event Date Select page (organizer-only)
 * Uses consolidated event date select page service
 */
export async function prefetchEventDateSelectPageData(
  eventId: string,
  userId?: string
) {
  const { helpers, queryClient } = createTRPCServerHelpers(userId);

  try {
    // Prefetch event date select page data
    await helpers.availability.getDateSelectPageData.prefetch({ eventId });

    return dehydrate(queryClient);
  } catch (error) {
    console.error('Error prefetching event date select page data:', error);
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Event Change Date page
 * Uses consolidated event change date page service
 */
export async function prefetchEventChangeDatePageData(
  eventId: string,
  userId?: string
) {
  const { helpers, queryClient } = createTRPCServerHelpers(userId);

  try {
    // Prefetch event change date page data
    await helpers.event.getChangeDatePageData.prefetch({ id: eventId });

    return dehydrate(queryClient);
  } catch (error) {
    console.error('Error prefetching event change date page data:', error);
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Event Change Date Single page
 * Uses consolidated event change date single page service
 */
export async function prefetchEventChangeDateSinglePageData(
  eventId: string,
  userId?: string
) {
  const { helpers, queryClient } = createTRPCServerHelpers(userId);

  try {
    // Prefetch event change date single page data
    await helpers.event.getChangeDateSinglePageData.prefetch({ id: eventId });

    return dehydrate(queryClient);
  } catch (error) {
    console.error(
      'Error prefetching event change date single page data:',
      error
    );
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Event Change Date Multi page
 * Uses consolidated event change date multi page service
 */
export async function prefetchEventChangeDateMultiPageData(
  eventId: string,
  userId?: string
) {
  const { helpers, queryClient } = createTRPCServerHelpers(userId);

  try {
    // Prefetch event change date multi page data
    await helpers.event.getChangeDateMultiPageData.prefetch({ id: eventId });

    return dehydrate(queryClient);
  } catch (error) {
    console.error(
      'Error prefetching event change date multi page data:',
      error
    );
    return dehydrate(queryClient);
  }
}
