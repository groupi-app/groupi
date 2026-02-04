'use client';

import { useQuery, useMutation } from 'convex/react';
import { useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Id } from '@/convex/_generated/dataModel';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let friendQueries: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let friendMutations: any;

function initApi() {
  if (!friendQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require('@/convex/_generated/api');
    friendQueries = api.friends?.queries ?? {};
    friendMutations = api.friends?.mutations ?? {};
  }
}
initApi();

/**
 * Friend data types
 */
export type Friend = {
  friendshipId: Id<'friendships'>;
  personId: Id<'persons'>;
  userId: string;
  name: string | null;
  username: string | null;
  image: string | null;
  lastSeen: number | null;
};

export type FriendRequest = {
  friendshipId: Id<'friendships'>;
  personId: Id<'persons'>;
  userId: string;
  name: string | null;
  username: string | null;
  image: string | null;
  createdAt: number;
  mutualEventCount: number;
};

export type FriendshipStatus =
  | 'none'
  | 'pending_sent'
  | 'pending_received'
  | 'friends'
  | 'declined'
  | 'self';

/**
 * Get all friends for the current user
 */
export function useFriends() {
  return useQuery(friendQueries.getFriends, {});
}

/**
 * Get pending friend requests received by current user
 */
export function usePendingRequests() {
  return useQuery(friendQueries.getPendingRequests, {});
}

/**
 * Get friend requests sent by current user
 */
export function useSentRequests() {
  return useQuery(friendQueries.getSentRequests, {});
}

/**
 * Get friendship status between current user and another person
 */
export function useFriendshipStatus(targetPersonId: Id<'persons'> | undefined) {
  return useQuery(
    friendQueries.getFriendshipStatus,
    targetPersonId ? { targetPersonId } : 'skip'
  );
}

/**
 * Search users by username
 */
export function useSearchUsers(searchTerm: string) {
  const shouldSearch = searchTerm.trim().length >= 2;
  return useQuery(
    friendQueries.searchUsersByUsername,
    shouldSearch ? { searchTerm } : 'skip'
  );
}

/**
 * Search result type for user search
 */
export type SearchUserResult = {
  personId: Id<'persons'>;
  userId: string;
  name: string | null;
  username: string | null;
  image: string | null;
  friendshipStatus: string;
  friendshipId: Id<'friendships'> | null;
};

/**
 * Parallel user search with exact match prioritization
 *
 * Runs two searches in parallel:
 * 1. Exact username match (fast, returns immediately when found)
 * 2. Fuzzy username search (slower, returns multiple matches)
 *
 * Results are merged with exact match first, duplicates filtered.
 */
export function useParallelUserSearch(searchTerm: string) {
  const shouldSearch = searchTerm.trim().length >= 3;

  // Run both queries in parallel
  const exactMatch = useQuery(
    friendQueries.searchUserByExactUsername,
    shouldSearch ? { searchTerm } : 'skip'
  ) as SearchUserResult | null | undefined;

  const fuzzyResults = useQuery(
    friendQueries.searchUsersByUsername,
    shouldSearch ? { searchTerm } : 'skip'
  ) as SearchUserResult[] | undefined;

  // Merge results: exact match first, filter duplicates from fuzzy results
  const mergedResults = useMemo(() => {
    // Still loading both
    if (exactMatch === undefined && fuzzyResults === undefined) {
      return undefined;
    }

    const results: SearchUserResult[] = [];

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
 * User with mutual events type
 */
export type MutualEventUser = {
  personId: Id<'persons'>;
  userId: string;
  name: string | null;
  username: string | null;
  image: string | null;
  mutualEventCount: number;
  mutualFriendCount: number;
  mutualFriendAvatars: Array<{ image: string | null; name: string | null }>;
  friendshipStatus: FriendshipStatus;
  friendshipId: Id<'friendships'> | null;
};

/**
 * Mutual friend type for profile dialog
 */
export type MutualFriend = {
  personId: Id<'persons'>;
  userId: string;
  name: string | null;
  username: string | null;
  image: string | null;
};

/**
 * Get users who share mutual events with the current user
 */
export function useMutualEventUsers() {
  return useQuery(friendQueries.getUsersWithMutualEvents, {});
}

/**
 * Get mutual friends between current user and a target user
 */
export function useMutualFriends(
  targetUserId: string | undefined,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled ?? true;
  return useQuery(
    friendQueries.getMutualFriends,
    enabled && targetUserId ? { targetUserId } : 'skip'
  ) as MutualFriend[] | undefined;
}

/**
 * Send a friend request
 */
export function useSendFriendRequest() {
  const sendRequest = useMutation(friendMutations.sendFriendRequest);
  const { toast } = useToast();

  return useCallback(
    async (addresseePersonId: Id<'persons'>) => {
      try {
        const result = await sendRequest({ addresseePersonId });

        if (result.status === 'ACCEPTED') {
          toast({
            title: 'Friend Added',
            description: 'You are now friends!',
          });
        } else {
          toast({
            title: 'Friend Request Sent',
            description: 'Your friend request has been sent.',
          });
        }

        return { success: true, ...result };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to send friend request. Please try again.';

        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });

        return { success: false, error: message };
      }
    },
    [sendRequest, toast]
  );
}

/**
 * Accept a friend request
 */
export function useAcceptFriendRequest() {
  const acceptRequest = useMutation(friendMutations.acceptFriendRequest);
  const { toast } = useToast();

  return useCallback(
    async (friendshipId: Id<'friendships'>) => {
      try {
        await acceptRequest({ friendshipId });

        toast({
          title: 'Friend Request Accepted',
          description: 'You are now friends!',
        });

        return { success: true };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to accept friend request. Please try again.';

        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });

        return { success: false, error: message };
      }
    },
    [acceptRequest, toast]
  );
}

/**
 * Decline a friend request
 */
export function useDeclineFriendRequest() {
  const declineRequest = useMutation(friendMutations.declineFriendRequest);
  const { toast } = useToast();

  return useCallback(
    async (friendshipId: Id<'friendships'>) => {
      try {
        await declineRequest({ friendshipId });

        toast({
          title: 'Request Declined',
          description: 'The friend request has been declined.',
        });

        return { success: true };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to decline friend request. Please try again.';

        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });

        return { success: false, error: message };
      }
    },
    [declineRequest, toast]
  );
}

/**
 * Cancel a sent friend request
 */
export function useCancelFriendRequest() {
  const cancelRequest = useMutation(friendMutations.cancelFriendRequest);
  const { toast } = useToast();

  return useCallback(
    async (friendshipId: Id<'friendships'>) => {
      try {
        await cancelRequest({ friendshipId });

        toast({
          title: 'Request Cancelled',
          description: 'The friend request has been cancelled.',
        });

        return { success: true };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to cancel friend request. Please try again.';

        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });

        return { success: false, error: message };
      }
    },
    [cancelRequest, toast]
  );
}

/**
 * Remove a friend
 */
export function useRemoveFriend() {
  const removeFriend = useMutation(friendMutations.removeFriend);
  const { toast } = useToast();

  return useCallback(
    async (friendshipId: Id<'friendships'>) => {
      try {
        await removeFriend({ friendshipId });

        toast({
          title: 'Friend Removed',
          description: 'This person has been removed from your friends.',
        });

        return { success: true };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to remove friend. Please try again.';

        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });

        return { success: false, error: message };
      }
    },
    [removeFriend, toast]
  );
}

/**
 * Remove a friend by person ID
 */
export function useRemoveFriendByPersonId() {
  const removeFriend = useMutation(friendMutations.removeFriendByPersonId);
  const { toast } = useToast();

  return useCallback(
    async (personId: Id<'persons'>) => {
      try {
        await removeFriend({ personId });

        toast({
          title: 'Friend Removed',
          description: 'This person has been removed from your friends.',
        });

        return { success: true };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to remove friend. Please try again.';

        toast({
          title: 'Error',
          description: message,
          variant: 'destructive',
        });

        return { success: false, error: message };
      }
    },
    [removeFriend, toast]
  );
}

/**
 * Combined hook for managing friend request actions on a specific person
 */
export function useFriendActions(targetPersonId: Id<'persons'> | undefined) {
  const status = useFriendshipStatus(targetPersonId);
  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const declineRequest = useDeclineFriendRequest();
  const cancelRequest = useCancelFriendRequest();
  const removeFriend = useRemoveFriend();

  return {
    status: status?.status ?? 'none',
    friendshipId: status?.friendshipId ?? null,
    isLoading: status === undefined,
    sendRequest: targetPersonId
      ? () => sendRequest(targetPersonId)
      : async () => ({ success: false, error: 'No target person' }),
    acceptRequest: status?.friendshipId
      ? () => acceptRequest(status.friendshipId!)
      : async () => ({ success: false, error: 'No friendship' }),
    declineRequest: status?.friendshipId
      ? () => declineRequest(status.friendshipId!)
      : async () => ({ success: false, error: 'No friendship' }),
    cancelRequest: status?.friendshipId
      ? () => cancelRequest(status.friendshipId!)
      : async () => ({ success: false, error: 'No friendship' }),
    removeFriend: status?.friendshipId
      ? () => removeFriend(status.friendshipId!)
      : async () => ({ success: false, error: 'No friendship' }),
  };
}

/**
 * Combined hook for friend management (friends list, requests, etc.)
 */
export function useFriendManagement() {
  const friends = useFriends();
  const pendingRequests = usePendingRequests();
  const sentRequests = useSentRequests();
  const acceptRequest = useAcceptFriendRequest();
  const declineRequest = useDeclineFriendRequest();
  const cancelRequest = useCancelFriendRequest();
  const removeFriend = useRemoveFriend();

  return {
    // Data
    friends: friends ?? [],
    pendingRequests: pendingRequests ?? [],
    sentRequests: sentRequests ?? [],

    // Counts for badges
    friendCount: friends?.length ?? 0,
    pendingCount: pendingRequests?.length ?? 0,
    sentCount: sentRequests?.length ?? 0,

    // Loading states
    isLoading: friends === undefined,
    isPendingLoading: pendingRequests === undefined,
    isSentLoading: sentRequests === undefined,

    // Actions
    acceptRequest,
    declineRequest,
    cancelRequest,
    removeFriend,
  };
}
