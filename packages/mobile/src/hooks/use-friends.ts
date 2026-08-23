import { useQuery, useMutation } from 'convex/react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from '@groupi/shared/platform';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

// --- Queries ---

export function useFriendsList() {
  return useQuery(api.friends.queries.getFriends, {});
}

export function usePendingRequests() {
  return useQuery(api.friends.queries.getPendingRequests, {});
}

export function useSentRequests() {
  return useQuery(api.friends.queries.getSentRequests, {});
}

export function useFriendshipStatus(targetPersonId: Id<'persons'> | undefined) {
  return useQuery(
    api.friends.queries.getFriendshipStatus,
    targetPersonId ? { targetPersonId } : 'skip'
  );
}

export function useFriendSearch(searchTerm: string, enabled = true) {
  const [debouncedTerm, setDebouncedTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const results = useQuery(
    api.friends.queries.searchUsersByUsername,
    enabled && debouncedTerm.length >= 3
      ? { searchTerm: debouncedTerm }
      : 'skip'
  );

  return { results, debouncedTerm };
}

export function useFriendSuggestions() {
  return useQuery(api.friends.queries.getUsersWithMutualEvents, {});
}

export function useMutualFriends(targetUserId: string | undefined) {
  return useQuery(
    api.friends.queries.getMutualFriends,
    targetUserId ? { targetUserId } : 'skip'
  );
}

export function useBlockStatus(targetPersonId: Id<'persons'> | undefined) {
  return useQuery(
    api.friends.queries.getBlockStatus,
    targetPersonId ? { targetPersonId } : 'skip'
  );
}

export function useBlockedUsers() {
  return useQuery(api.friends.queries.getBlockedUsers, {});
}

// --- Mutations ---

export function useSendFriendRequest() {
  const mutation = useMutation(api.friends.mutations.sendFriendRequest);

  return useCallback(
    async (addresseePersonId: Id<'persons'>) => {
      try {
        const result = await mutation({ addresseePersonId });
        toast.success(result?.message ?? 'Friend request sent!');
        return result;
      } catch {
        toast.error('Failed to send friend request');
      }
    },
    [mutation]
  );
}

export function useAcceptFriendRequest() {
  const mutation = useMutation(api.friends.mutations.acceptFriendRequest);

  return useCallback(
    async (friendshipId: Id<'friendships'>) => {
      try {
        await mutation({ friendshipId });
        toast.success('Friend request accepted!');
      } catch {
        toast.error('Failed to accept request');
      }
    },
    [mutation]
  );
}

export function useDeclineFriendRequest() {
  const mutation = useMutation(api.friends.mutations.declineFriendRequest);

  return useCallback(
    async (friendshipId: Id<'friendships'>) => {
      try {
        await mutation({ friendshipId });
        toast.info('Request declined');
      } catch {
        toast.error('Failed to decline request');
      }
    },
    [mutation]
  );
}

export function useCancelFriendRequest() {
  const mutation = useMutation(api.friends.mutations.cancelFriendRequest);

  return useCallback(
    async (friendshipId: Id<'friendships'>) => {
      try {
        await mutation({ friendshipId });
        toast.info('Request cancelled');
      } catch {
        toast.error('Failed to cancel request');
      }
    },
    [mutation]
  );
}

export function useRemoveFriend() {
  const mutation = useMutation(api.friends.mutations.removeFriend);

  return useCallback(
    async (friendshipId: Id<'friendships'>) => {
      try {
        await mutation({ friendshipId });
        toast.success('Friend removed');
      } catch {
        toast.error('Failed to remove friend');
      }
    },
    [mutation]
  );
}

export function useBlockUser() {
  const mutation = useMutation(api.friends.mutations.blockUser);

  return useCallback(
    async (personId: Id<'persons'>) => {
      try {
        await mutation({ personId });
        toast.success('User blocked');
      } catch {
        toast.error('Failed to block user');
      }
    },
    [mutation]
  );
}

export function useUnblockUser() {
  const mutation = useMutation(api.friends.mutations.unblockUser);

  return useCallback(
    async (personId: Id<'persons'>) => {
      try {
        await mutation({ personId });
        toast.success('User unblocked');
      } catch {
        toast.error('Failed to unblock user');
      }
    },
    [mutation]
  );
}
