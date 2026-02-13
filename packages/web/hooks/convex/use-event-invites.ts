'use client';

import { useQuery, useMutation } from 'convex/react';
import { useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Id } from '@/convex/_generated/dataModel';
import { useRouter } from 'next/navigation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let eventInviteQueries: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let eventInviteMutations: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let eventQueries: any;

function initApi() {
  if (!eventInviteQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    eventInviteQueries = api.eventInvites?.queries ?? {};
    eventInviteMutations = api.eventInvites?.mutations ?? {};
    eventQueries = api.events?.queries ?? {};
  }
}
initApi();

/**
 * Event invite types
 */
export type EventInvite = {
  inviteId: Id<'eventInvites'>;
  eventId: Id<'events'>;
  eventTitle: string;
  eventDescription: string | null;
  eventImageUrl: string | null;
  eventLocation: string | null;
  eventDateTime: number | null;
  eventVisibility?: 'PRIVATE' | 'FRIENDS' | 'PUBLIC';
  memberCount: number;
  role: 'ATTENDEE' | 'MODERATOR';
  message: string | null;
  createdAt: number;
  inviter: {
    personId: Id<'persons'>;
    name: string | null;
    username: string | null;
    image: string | null;
  };
};

export type SentEventInvite = {
  inviteId: Id<'eventInvites'>;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  role: 'ATTENDEE' | 'MODERATOR';
  message: string | null;
  createdAt: number;
  respondedAt: number | null;
  invitee: {
    personId: Id<'persons'>;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  inviter: {
    personId: Id<'persons'>;
    name: string | null;
    username: string | null;
    image: string | null;
  };
};

export type InviteSearchResult = {
  personId: Id<'persons'>;
  name: string | null;
  username: string | null;
  image: string | null;
  isFriend: boolean;
  hasPendingInvite: boolean;
  pendingInviteId: Id<'eventInvites'> | null;
};

/**
 * Get pending event invites for the current user
 */
export function usePendingEventInvites() {
  return useQuery(eventInviteQueries.getPendingEventInvites, {}) as
    | EventInvite[]
    | undefined;
}

/**
 * Get count of pending invites (for badge display)
 */
export function usePendingInviteCount() {
  return useQuery(eventInviteQueries.getPendingInviteCount, {}) as
    | number
    | undefined;
}

/**
 * Get sent event invites for an event
 */
export function useSentEventInvites(eventId: Id<'events'> | undefined) {
  return useQuery(
    eventInviteQueries.getSentEventInvites,
    eventId ? { eventId } : 'skip'
  ) as SentEventInvite[] | undefined;
}

/**
 * Search users who can be invited to an event
 */
export function useSearchUsersForEventInvite(
  eventId: Id<'events'> | undefined,
  searchTerm: string
) {
  const shouldSearch = eventId && searchTerm.trim().length >= 2;
  return useQuery(
    eventInviteQueries.searchUsersForEventInvite,
    shouldSearch ? { eventId, searchTerm } : 'skip'
  ) as InviteSearchResult[] | undefined;
}

/**
 * Parallel user search for event invites with exact match prioritization
 *
 * Runs two searches in parallel:
 * 1. Exact username match (fast, returns immediately when found)
 * 2. Fuzzy username/name search (slower, returns multiple matches)
 *
 * Results are merged with exact match first, duplicates filtered.
 */
export function useParallelEventInviteSearch(
  eventId: Id<'events'> | undefined,
  searchTerm: string
) {
  const shouldSearch = eventId && searchTerm.trim().length >= 2;

  // Run both queries in parallel
  const exactMatch = useQuery(
    eventInviteQueries.searchUserByExactUsernameForEventInvite,
    shouldSearch ? { eventId, searchTerm } : 'skip'
  ) as InviteSearchResult | null | undefined;

  const fuzzyResults = useQuery(
    eventInviteQueries.searchUsersForEventInvite,
    shouldSearch ? { eventId, searchTerm } : 'skip'
  ) as InviteSearchResult[] | undefined;

  // Merge results: exact match first, filter duplicates from fuzzy results
  const mergedResults = useMemo(() => {
    // Still loading both
    if (exactMatch === undefined && fuzzyResults === undefined) {
      return undefined;
    }

    const results: InviteSearchResult[] = [];

    // Add exact match first if available
    if (exactMatch) {
      results.push(exactMatch);
    }

    // Add fuzzy results, filtering out the exact match
    if (fuzzyResults) {
      const exactMatchId = exactMatch?.personId;
      for (const result of fuzzyResults) {
        if (result.personId !== exactMatchId) {
          results.push(result);
        }
      }
    }

    return results;
  }, [exactMatch, fuzzyResults]);

  return {
    // Main results array
    results: mergedResults,
    // Individual query states for fine-grained loading UI
    exactMatch,
    fuzzyResults,
    // True if either query is still loading
    isLoading:
      shouldSearch && (exactMatch === undefined || fuzzyResults === undefined),
    // True if exact match is still loading (for showing early fuzzy results)
    isExactLoading: shouldSearch && exactMatch === undefined,
    // True if fuzzy results are still loading (for showing early exact match)
    isFuzzyLoading: shouldSearch && fuzzyResults === undefined,
    // True if we have any results to show
    hasResults: mergedResults && mergedResults.length > 0,
  };
}

/**
 * Send an event invite
 */
export function useSendEventInvite() {
  const sendInvite = useMutation(eventInviteMutations.sendEventInvite);
  const { toast } = useToast();

  return useCallback(
    async (
      eventId: Id<'events'>,
      inviteePersonId: Id<'persons'>,
      role: 'ATTENDEE' | 'MODERATOR' = 'ATTENDEE',
      message?: string
    ) => {
      try {
        const result = await sendInvite({
          eventId,
          inviteePersonId,
          role,
          message,
        });

        toast({
          title: 'Invite Sent',
          description: 'Your invite has been sent successfully.',
        });

        return { success: true, ...result };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to send invite. Please try again.';

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });

        return { success: false, error: errorMessage };
      }
    },
    [sendInvite, toast]
  );
}

/**
 * Accept an event invite
 */
export function useAcceptEventInvite() {
  const acceptInvite = useMutation(eventInviteMutations.acceptEventInvite);
  const { toast } = useToast();
  const router = useRouter();

  return useCallback(
    async (inviteId: Id<'eventInvites'>, eventId: Id<'events'>) => {
      try {
        await acceptInvite({ inviteId });

        toast({
          title: 'Invite Accepted',
          description: 'You have joined the event!',
        });

        // Navigate to the event
        router.push(`/event/${eventId}`);

        return { success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to accept invite. Please try again.';

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });

        return { success: false, error: errorMessage };
      }
    },
    [acceptInvite, toast, router]
  );
}

/**
 * Decline an event invite (with optimistic update)
 */
export function useDeclineEventInvite() {
  const declineInvite = useMutation(
    eventInviteMutations.declineEventInvite
  ).withOptimisticUpdate((localStore, { inviteId }) => {
    // Optimistically remove from pending invites
    const pendingInvites = localStore.getQuery(
      eventInviteQueries.getPendingEventInvites,
      {}
    );
    if (pendingInvites) {
      localStore.setQuery(
        eventInviteQueries.getPendingEventInvites,
        {},
        pendingInvites.filter(
          (invite: EventInvite) => invite.inviteId !== inviteId
        )
      );
    }

    // Optimistically update the count
    const count = localStore.getQuery(
      eventInviteQueries.getPendingInviteCount,
      {}
    );
    if (count !== undefined && count > 0) {
      localStore.setQuery(
        eventInviteQueries.getPendingInviteCount,
        {},
        count - 1
      );
    }
  });
  const { toast } = useToast();

  return useCallback(
    async (inviteId: Id<'eventInvites'>) => {
      try {
        await declineInvite({ inviteId });

        toast({
          title: 'Invite Declined',
          description: 'The invite has been declined.',
        });

        return { success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to decline invite. Please try again.';

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });

        return { success: false, error: errorMessage };
      }
    },
    [declineInvite, toast]
  );
}

/**
 * Cancel a sent event invite
 */
export function useCancelEventInvite() {
  const cancelInvite = useMutation(eventInviteMutations.cancelEventInvite);
  const { toast } = useToast();

  return useCallback(
    async (inviteId: Id<'eventInvites'>) => {
      try {
        await cancelInvite({ inviteId });

        toast({
          title: 'Invite Cancelled',
          description: 'The invite has been cancelled.',
        });

        return { success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to cancel invite. Please try again.';

        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });

        return { success: false, error: errorMessage };
      }
    },
    [cancelInvite, toast]
  );
}

/**
 * Combined hook for managing event invite actions
 */
export function useEventInviteManagement() {
  const pendingInvites = usePendingEventInvites();
  const pendingCount = usePendingInviteCount();
  const sendInvite = useSendEventInvite();
  const acceptInvite = useAcceptEventInvite();
  const declineInvite = useDeclineEventInvite();
  const cancelInvite = useCancelEventInvite();

  return {
    // Data
    pendingInvites: pendingInvites ?? [],
    pendingCount: pendingCount ?? 0,

    // Loading states
    isLoading: pendingInvites === undefined,

    // Actions
    sendInvite,
    acceptInvite,
    declineInvite,
    cancelInvite,
  };
}

/**
 * Get events the current user can invite a target user to.
 * Used by the "Invite to Event" popover on profile dialogs.
 */
export function useEventsForUserInvite(
  targetPersonId: Id<'persons'> | undefined
) {
  return useQuery(
    eventQueries.getEventsForUserInvite,
    targetPersonId ? { targetPersonId } : 'skip'
  );
}
