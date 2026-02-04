'use client';

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { Id } from '@/convex/_generated/dataModel';
import { useEventHeaderData, useEventAttendeesData } from '@/hooks/convex';
import { useEventAvailabilityDataWithSkip } from '@/hooks/convex/use-availability';
import {
  usePostDetail,
  usePostDetailWithSkip,
  useEventPostFeedWithSkip,
} from '@/hooks/convex/use-posts';
import {
  useRepliesByPost,
  useRepliesByPostWithSkip,
} from '@/hooks/convex/use-replies';
import { useGlobalUser } from '@/context/global-user-context';

// ===== Types =====

// Infer types from hook return values
type EventHeaderData = ReturnType<typeof useEventHeaderData>;
type EventMembersData = ReturnType<typeof useEventAttendeesData>;
type EventAvailabilityData = ReturnType<
  typeof useEventAvailabilityDataWithSkip
>;
type EventPostFeedData = ReturnType<typeof useEventPostFeedWithSkip>;
// CurrentUserData is derived from GlobalUserContext to avoid duplicate query
// Include 'id' aliases for backward compatibility with components that expect id instead of _id
type CurrentUserData =
  | {
      user: {
        _id: string;
        id: string; // Alias for _id
        email: string;
        name: string | null;
        image: string | null;
        username: string | null;
        role: string;
      };
      person: {
        _id: string;
        id: string; // Alias for _id
        bio: string | null;
      } | null;
    }
  | undefined;
// These types are inferred from hooks but we use direct useQuery with skip pattern
type PostDetailData = ReturnType<typeof usePostDetail>;
type RepliesData = ReturnType<typeof useRepliesByPost>;

interface EventDataContextValue {
  eventId: string;
  // Raw data from hooks (undefined = loading, null = not found)
  headerData: EventHeaderData;
  membersData: EventMembersData;
  availabilityData: EventAvailabilityData;
  postFeedData: EventPostFeedData;
  currentUser: CurrentUserData;
  // Post-specific data (only populated when on a post page)
  postId: string | null;
  postDetailData: PostDetailData;
  repliesData: RepliesData;
  // Computed loading states
  isLoading: boolean;
  isHeaderLoading: boolean;
  isMembersLoading: boolean;
  isAvailabilityLoading: boolean;
  isPostFeedLoading: boolean;
  isCurrentUserLoading: boolean;
  isPostLoading: boolean;
  isRepliesLoading: boolean;
}

// ===== Context =====

const EventDataContext = createContext<EventDataContextValue | null>(null);

// ===== Provider =====

interface EventDataProviderProps {
  eventId: string;
  children: ReactNode;
}

/**
 * Provides all event-related data to child components via context.
 * Data is fetched once at the layout level and shared across all child pages.
 *
 * Also fetches post-specific data when on a post page (detected via URL params).
 *
 * This prevents:
 * - Duplicate queries when navigating between event pages
 * - Skeleton flashes when data is already cached
 * - Inconsistent loading states across components
 */
export function EventDataProvider({
  eventId,
  children,
}: EventDataProviderProps) {
  const eventIdTyped = eventId as Id<'events'>;

  // Detect if we're on a post page by checking URL params
  const params = useParams();
  const pathname = usePathname();
  const postId = (params?.postId as string) || null;
  const postIdTyped = postId ? (postId as Id<'posts'>) : null;

  // Fetch all event-related data at the provider level
  const headerData = useEventHeaderData(eventIdTyped);
  const membersData = useEventAttendeesData(eventIdTyped);

  // Only fetch availability data on pages that need it
  // (availability page and change-date pages)
  const needsAvailabilityData =
    pathname?.includes('/availability') || pathname?.includes('/change-date');
  const availabilityData = useEventAvailabilityDataWithSkip(
    needsAvailabilityData ? eventIdTyped : null
  );

  // Skip post feed query when on a post detail page
  // The post detail query already fetches the needed post data
  const isPostDetailPage = !!postIdTyped;
  const postFeedData = useEventPostFeedWithSkip(
    isPostDetailPage ? null : eventIdTyped
  );

  // Use GlobalUserContext instead of separate useCurrentUser query
  // This eliminates 1 duplicate query since GlobalUserProvider already fetches user data
  const {
    user: globalUser,
    person: globalPerson,
    isLoading: isGlobalUserLoading,
  } = useGlobalUser();

  // Map GlobalUserContext data to expected CurrentUserData shape
  // Include 'id' aliases for backward compatibility with components that expect id instead of _id
  const currentUser = useMemo<CurrentUserData>(() => {
    if (!globalUser) return undefined;
    return {
      user: {
        ...globalUser,
        id: globalUser._id, // Alias for backward compatibility
      },
      person: globalPerson
        ? {
            ...globalPerson,
            id: globalPerson._id, // Alias for backward compatibility
          }
        : null,
    };
  }, [globalUser, globalPerson]);

  // Try to derive post detail data from the already-loaded feed (if available)
  // Note: Since we skip post feed on post detail pages, this will usually return null
  // unless feed data was previously cached from navigating through the event page
  const postFromFeed = useMemo(() => {
    if (!postIdTyped || !postFeedData?.event?.posts) return null;

    const post = postFeedData.event.posts.find(
      (p: { _id: Id<'posts'> }) => p._id === postIdTyped
    );
    if (!post) return null;

    // Construct a postDetailData-compatible object from feed data
    return {
      post: {
        ...post,
        event: {
          ...postFeedData.event,
          memberships: postFeedData.event.memberships,
        },
        // These will be empty until loaded separately - attachments fetched via separate query
        replies: [],
        attachments: [],
      },
      userMembership: {
        ...postFeedData.userMembership,
        person: {
          ...postFeedData.userMembership.person,
          user: currentUser,
        },
      },
    };
  }, [postIdTyped, postFeedData, currentUser]);

  // Fetch replies separately when on a post page
  // Use skip-aware hook for conditional fetching
  const repliesData = useRepliesByPostWithSkip(postIdTyped);

  // Always fetch full post detail when on a post page (for attachments and complete data)
  // Use skip-aware hook for conditional fetching
  const fullPostDetailData = usePostDetailWithSkip(postIdTyped);

  // Use feed-derived data for instant rendering while full data loads
  // Once full data is available, prefer it (has attachments)
  const postDetailData = useMemo(() => {
    if (!postId) return undefined;

    // Prefer full data when available (has attachments)
    if (fullPostDetailData) return fullPostDetailData;

    // Use feed data for instant rendering while full data loads
    if (postFromFeed) return postFromFeed;

    return undefined; // Still loading
  }, [postId, postFromFeed, fullPostDetailData]);

  // Compute loading states
  const isHeaderLoading = headerData === undefined;
  const isMembersLoading = membersData === undefined;
  const isAvailabilityLoading = availabilityData === undefined;
  const isPostFeedLoading = postFeedData === undefined;
  // Use GlobalUserContext loading state instead of checking currentUser === undefined
  const isCurrentUserLoading = isGlobalUserLoading;
  // Post is loading only if we don't have feed data AND the full query is loading
  const isPostLoading = postId
    ? !postFromFeed && fullPostDetailData === undefined
    : false;
  const isRepliesLoading = postId ? repliesData === undefined : false;
  const isLoading = isHeaderLoading || isCurrentUserLoading;

  const value = useMemo<EventDataContextValue>(
    () => ({
      eventId,
      headerData,
      membersData,
      availabilityData,
      postFeedData,
      currentUser,
      postId,
      postDetailData: postId ? postDetailData : undefined,
      repliesData: postId ? repliesData : undefined,
      isLoading,
      isHeaderLoading,
      isMembersLoading,
      isAvailabilityLoading,
      isPostFeedLoading,
      isCurrentUserLoading,
      isPostLoading,
      isRepliesLoading,
    }),
    [
      eventId,
      headerData,
      membersData,
      availabilityData,
      postFeedData,
      currentUser,
      postId,
      postDetailData,
      repliesData,
      isLoading,
      isHeaderLoading,
      isMembersLoading,
      isAvailabilityLoading,
      isPostFeedLoading,
      isCurrentUserLoading,
      isPostLoading,
      isRepliesLoading,
    ]
  );

  return (
    <EventDataContext.Provider value={value}>
      {children}
    </EventDataContext.Provider>
  );
}

// ===== Consumer Hooks =====

/**
 * Access the full event data context.
 * Must be used within an EventDataProvider.
 */
export function useEventData() {
  const context = useContext(EventDataContext);
  if (!context) {
    throw new Error('useEventData must be used within an EventDataProvider');
  }
  return context;
}

/**
 * Access event header data from context.
 * Drop-in replacement for useEventHeader/useEventHeaderData.
 */
export function useEventHeaderFromContext() {
  const { headerData, isHeaderLoading } = useEventData();
  return { data: headerData, isLoading: isHeaderLoading };
}

/**
 * Access event members data from context.
 * Drop-in replacement for useEventMembers/useEventAttendeesData.
 */
export function useEventMembersFromContext() {
  const { membersData, isMembersLoading } = useEventData();
  return { data: membersData, isLoading: isMembersLoading };
}

/**
 * Access event availability data from context.
 * Drop-in replacement for useEventAvailabilityData.
 */
export function useEventAvailabilityFromContext() {
  const { availabilityData, isAvailabilityLoading } = useEventData();
  return { data: availabilityData, isLoading: isAvailabilityLoading };
}

/**
 * Access event post feed data from context.
 * Drop-in replacement for useEventPostFeed.
 */
export function useEventPostFeedFromContext() {
  const { postFeedData, isPostFeedLoading } = useEventData();
  return { data: postFeedData, isLoading: isPostFeedLoading };
}

/**
 * Access current user data from context.
 * Drop-in replacement for useCurrentUser.
 */
export function useCurrentUserFromContext() {
  const { currentUser, isCurrentUserLoading } = useEventData();
  return { data: currentUser, isLoading: isCurrentUserLoading };
}

/**
 * Access post detail data from context.
 * Only available when on a post page.
 * Drop-in replacement for usePostDetail.
 */
export function usePostDetailFromContext() {
  const { postDetailData, isPostLoading } = useEventData();
  return { data: postDetailData, isLoading: isPostLoading };
}

/**
 * Access replies data from context.
 * Only available when on a post page.
 * Drop-in replacement for useReplies.
 */
export function useRepliesFromContext() {
  const { repliesData, isRepliesLoading } = useEventData();
  return { data: repliesData, isLoading: isRepliesLoading };
}
