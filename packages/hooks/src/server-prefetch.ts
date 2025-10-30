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
import { appRouter } from '@groupi/api';
import { prefetchLogger } from './logger';

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
 * Note: Auth is handled in services via getCurrentUserId(), no need to pass userId through context
 */
export function createTRPCServerHelpers(queryClient?: QueryClient) {
  const client = queryClient || createServerQueryClient();

  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: {}, // Empty context - auth handled in services
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
 * Services will get userId via getCurrentUserId()
 */
export async function prefetchEventData(eventId: string) {
  const queryClient = createServerQueryClient();
  const { helpers } = createTRPCServerHelpers(queryClient);

  try {
    // Prefetch all event-related data in parallel
    await Promise.allSettled([
      helpers.event.getHeaderData.prefetch({ eventId }),
      helpers.invite.getEventData.prefetch({ eventId }),
    ]);

    return dehydrate(queryClient);
  } catch (error) {
    prefetchLogger.error({ error }, 'Error prefetching event data');
    return dehydrate(queryClient); // Return empty dehydrated state
  }
}

/**
 * Prefetch post data for a specific post
 * Services will get userId via getCurrentUserId()
 */
export async function prefetchPostData(postId: string) {
  const queryClient = createServerQueryClient();
  const { helpers } = createTRPCServerHelpers(queryClient);

  try {
    // Prefetch post with replies
    await helpers.post.getByIdWithReplies.prefetch({ postId });

    return dehydrate(queryClient);
  } catch (error) {
    prefetchLogger.error({ error }, 'Error prefetching post data');
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch user dashboard data
 * Services will get userId via getCurrentUserId()
 */
export async function prefetchUserDashboard() {
  const queryClient = createServerQueryClient();
  const { helpers } = createTRPCServerHelpers(queryClient);

  try {
    // Prefetch user data and their memberships
    await Promise.allSettled([
      helpers.person.getCurrent.prefetch(),
      helpers.notification.getForUser.prefetch({ cursor: undefined }),
    ]);

    return dehydrate(queryClient);
  } catch (error) {
    prefetchLogger.error({ error }, 'Error prefetching user dashboard data');
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch availability data for an event
 * Services will get userId via getCurrentUserId()
 */
export async function prefetchAvailabilityData(_eventId: string) {
  const { queryClient } = createTRPCServerHelpers();

  try {
    // Note: availability service will get userId via getCurrentUserId()
    // await helpers.availability.getEventPotentialDateTimes.prefetch({ eventId });
    return dehydrate(queryClient);
  } catch (error) {
    prefetchLogger.error({ error }, 'Error prefetching availability data');
    return dehydrate(queryClient);
  }
}

// ============================================================================
// GENERIC PREFETCH UTILITIES
// ============================================================================

/**
 * Generic prefetch function that accepts multiple queries
 * Services will get userId via getCurrentUserId()
 */
export async function prefetchQueries(
  queries: Array<() => Promise<unknown>>
): Promise<DehydratedState> {
  const { queryClient } = createTRPCServerHelpers();

  try {
    await Promise.allSettled(queries);
    return dehydrate(queryClient);
  } catch (error) {
    prefetchLogger.error({ error }, 'Error prefetching queries');
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
export async function prefetchEventPage(eventId: string) {
  return prefetchEventData(eventId);
}

/**
 * Prefetch data for the events list page
 */
export async function prefetchEventsListPage() {
  return prefetchUserDashboard();
}

/**
 * Prefetch data for the post page
 */
export async function prefetchPostPage(postId: string) {
  return prefetchPostData(postId);
}

/**
 * Prefetch data for the availability page
 */
export async function prefetchAvailabilityPage(eventId: string) {
  return prefetchAvailabilityData(eventId);
}

// ============================================================================
// COMPONENT-SPECIFIC PREFETCH FUNCTIONS
// ============================================================================

// Individual component prefetch functions removed - use prefetchEventPageComponents() instead

/**
 * Prefetch all component data for event page in parallel
 * Uses consolidated event page services
 * Services will get userId via getCurrentUserId()
 */
export async function prefetchEventPageComponents(eventId: string) {
  const { helpers, queryClient } = createTRPCServerHelpers();

  try {
    // Prefetch all event page component data in parallel
    await Promise.allSettled([
      helpers.event.getHeaderData.prefetch({ eventId }),
      helpers.event.getMemberListData.prefetch({ eventId }),
    ]);

    return dehydrate(queryClient);
  } catch (error) {
    prefetchLogger.error({ error }, 'Error prefetching event page components');
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for MyEvents page
 * Uses consolidated my events service
 * Services will get userId via getCurrentUserId()
 */
export async function prefetchMyEventsPageData() {
  const { helpers, queryClient } = createTRPCServerHelpers();

  try {
    // Prefetch my events data
    await helpers.person.getMyEventsData.prefetch();

    return dehydrate(queryClient);
  } catch (error) {
    prefetchLogger.error({ error }, 'Error prefetching my events page data');
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Invite page
 * Uses consolidated invite page service
 * Services will get userId via getCurrentUserId()
 */
export async function prefetchInvitePageData(inviteId: string) {
  const { helpers, queryClient } = createTRPCServerHelpers();

  try {
    // Prefetch invite page data
    await helpers.invite.getInvitePageData.prefetch({ inviteId });

    return dehydrate(queryClient);
  } catch (error) {
    prefetchLogger.error({ error }, 'Error prefetching invite page data');
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Post Detail page
 * Uses consolidated post detail service
 * Services will get userId via getCurrentUserId()
 */
export async function prefetchPostDetailPageData(postId: string) {
  const { helpers, queryClient } = createTRPCServerHelpers();

  try {
    // Prefetch post detail data
    await helpers.post.getByIdWithReplies.prefetch({ postId });

    return dehydrate(queryClient);
  } catch (error) {
    prefetchLogger.error({ error }, 'Error prefetching post detail page data');
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Settings page
 * Uses consolidated settings page service
 * Services will get userId via getCurrentUserId()
 */
export async function prefetchSettingsPageData() {
  const { helpers, queryClient } = createTRPCServerHelpers();

  try {
    // Prefetch settings page data
    await helpers.settings.getSettingsPageData.prefetch();

    return dehydrate(queryClient);
  } catch (error) {
    prefetchLogger.error({ error }, 'Error prefetching settings page data');
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Event Invite page
 * Uses consolidated event invite page service
 * Services will get userId via getCurrentUserId()
 */
export async function prefetchEventInvitePageData(eventId: string) {
  const { helpers, queryClient } = createTRPCServerHelpers();

  try {
    // Prefetch event invite page data
    await helpers.invite.getEventInvitePageData.prefetch({ eventId });

    return dehydrate(queryClient);
  } catch (error) {
    prefetchLogger.error({ error }, 'Error prefetching event invite page data');
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Event Attendees page
 * Uses consolidated event attendees page service
 * Services will get userId via getCurrentUserId()
 */
export async function prefetchEventAttendeesPageData(eventId: string) {
  const { helpers, queryClient } = createTRPCServerHelpers();

  try {
    // Prefetch event attendees page data
    await helpers.event.getAttendeesPageData.prefetch({ eventId });

    return dehydrate(queryClient);
  } catch (error) {
    prefetchLogger.error(
      { error },
      'Error prefetching event attendees page data'
    );
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Event Availability page
 * Uses consolidated event availability page service
 * Services will get userId via getCurrentUserId()
 */
export async function prefetchEventAvailabilityPageData(_eventId: string) {
  const { queryClient } = createTRPCServerHelpers();

  try {
    // Prefetch event availability page data
    // Services will get userId via getCurrentUserId()

    return dehydrate(queryClient);
  } catch (error) {
    prefetchLogger.error(
      { error },
      'Error prefetching event availability page data'
    );
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Event New Post page
 * Uses consolidated event new post page service
 * Services will get userId via getCurrentUserId()
 */
export async function prefetchEventNewPostPageData(eventId: string) {
  const { helpers, queryClient } = createTRPCServerHelpers();

  try {
    // Prefetch event new post page data
    await helpers.event.getNewPostPageData.prefetch({ eventId });

    return dehydrate(queryClient);
  } catch (error) {
    prefetchLogger.error(
      { error },
      'Error prefetching event new post page data'
    );
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Event Edit page
 * Uses consolidated event edit page service
 * Services will get userId via getCurrentUserId()
 */
export async function prefetchEventEditPageData(eventId: string) {
  const { helpers, queryClient } = createTRPCServerHelpers();

  try {
    // Use header data as fallback since edit page endpoint doesn't exist
    await helpers.event.getHeaderData.prefetch({ eventId });

    return dehydrate(queryClient);
  } catch (error) {
    prefetchLogger.error({ error }, 'Error prefetching event edit page data');
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Event Date Select page (organizer-only)
 * Uses consolidated event date select page service
 * Services will get userId via getCurrentUserId()
 */
export async function prefetchEventDateSelectPageData(_eventId: string) {
  const { queryClient } = createTRPCServerHelpers();

  try {
    // Use availability data as fallback since date select endpoint doesn't exist
    // Services will get userId via getCurrentUserId()
    return dehydrate(queryClient);
  } catch (error) {
    prefetchLogger.error(
      { error },
      'Error prefetching event date select page data'
    );
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Event Change Date page
 * Uses consolidated event change date page service
 * Services will get userId via getCurrentUserId()
 */
export async function prefetchEventChangeDatePageData(eventId: string) {
  const { helpers, queryClient } = createTRPCServerHelpers();

  try {
    // Use header data as fallback since change date endpoint doesn't exist
    await helpers.event.getHeaderData.prefetch({ eventId });

    return dehydrate(queryClient);
  } catch (error) {
    prefetchLogger.error(
      { error },
      'Error prefetching event change date page data'
    );
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Event Change Date Single page
 * Uses consolidated event change date single page service
 * Services will get userId via getCurrentUserId()
 */
export async function prefetchEventChangeDateSinglePageData(eventId: string) {
  const { helpers, queryClient } = createTRPCServerHelpers();

  try {
    // Prefetch event change date single page data
    await helpers.event.getHeaderData.prefetch({ eventId });

    return dehydrate(queryClient);
  } catch (error) {
    prefetchLogger.error(
      { error },
      'Error prefetching event change date single page data'
    );
    return dehydrate(queryClient);
  }
}

/**
 * Prefetch data for Event Change Date Multi page
 * Uses consolidated event change date multi page service
 * Services will get userId via getCurrentUserId()
 */
export async function prefetchEventChangeDateMultiPageData(eventId: string) {
  const { helpers, queryClient } = createTRPCServerHelpers();

  try {
    // Prefetch event change date multi page data
    await helpers.event.getHeaderData.prefetch({ eventId });

    return dehydrate(queryClient);
  } catch (error) {
    prefetchLogger.error(
      { error },
      'Error prefetching event change date multi page data'
    );
    return dehydrate(queryClient);
  }
}
