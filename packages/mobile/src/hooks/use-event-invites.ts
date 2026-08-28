import { useQuery, useMutation } from 'convex/react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from '@groupi/shared/platform';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

// --- Queries ---

export function usePendingEventInvites() {
  return useQuery(api.eventInvites.queries.getPendingEventInvites, {});
}

export function usePendingInviteCount() {
  return useQuery(api.eventInvites.queries.getPendingInviteCount, {});
}

export function useSentEventInvites(eventId: Id<'events'> | undefined) {
  return useQuery(
    api.eventInvites.queries.getSentEventInvites,
    eventId ? { eventId } : 'skip'
  );
}

export function useEventInviteSearch(
  eventId: Id<'events'> | undefined,
  searchTerm: string,
  enabled = true
) {
  const [debouncedTerm, setDebouncedTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const exactMatch = useQuery(
    api.eventInvites.queries.searchUserByExactUsernameForEventInvite,
    enabled && eventId && debouncedTerm.length >= 2
      ? { eventId, searchTerm: debouncedTerm }
      : 'skip'
  );
  const fuzzyResults = useQuery(
    api.eventInvites.queries.searchUsersForEventInvite,
    enabled && eventId && debouncedTerm.length >= 2
      ? { eventId, searchTerm: debouncedTerm }
      : 'skip'
  );

  const results =
    exactMatch === undefined && fuzzyResults === undefined
      ? undefined
      : [
          ...(exactMatch ? [exactMatch] : []),
          ...(fuzzyResults ?? []).filter(
            result => result.personId !== exactMatch?.personId
          ),
        ];

  return {
    results,
    exactMatch,
    debouncedTerm,
    isLoading:
      enabled &&
      debouncedTerm.length >= 2 &&
      (exactMatch === undefined || fuzzyResults === undefined),
  };
}

// --- Mutations ---

export function useAcceptEventInvite() {
  const mutation = useMutation(api.eventInvites.mutations.acceptEventInvite);

  return useCallback(
    async (inviteId: Id<'eventInvites'>) => {
      try {
        const result = await mutation({ inviteId });
        toast.success('Invite accepted!');
        return result;
      } catch (error) {
        toast.error('Failed to accept invite');
        throw error;
      }
    },
    [mutation]
  );
}

export function useDeclineEventInvite() {
  const mutation = useMutation(api.eventInvites.mutations.declineEventInvite);

  return useCallback(
    async (inviteId: Id<'eventInvites'>) => {
      try {
        const result = await mutation({ inviteId });
        toast.info('Invite declined');
        return result;
      } catch (error) {
        toast.error('Failed to decline invite');
        throw error;
      }
    },
    [mutation]
  );
}

export function useSendEventInvite() {
  const mutation = useMutation(api.eventInvites.mutations.sendEventInvite);

  return useCallback(
    async (params: {
      eventId: Id<'events'>;
      inviteePersonId: Id<'persons'>;
      role: 'ATTENDEE' | 'MODERATOR';
      message?: string;
    }) => {
      try {
        const result = await mutation(params);
        toast.success('Invite sent!');
        return result;
      } catch (error) {
        toast.error('Failed to send invite');
        throw error;
      }
    },
    [mutation]
  );
}

export function useCancelEventInvite() {
  const mutation = useMutation(api.eventInvites.mutations.cancelEventInvite);

  return useCallback(
    async (inviteId: Id<'eventInvites'>) => {
      try {
        const result = await mutation({ inviteId });
        toast.info('Invite cancelled');
        return result;
      } catch (error) {
        toast.error('Failed to cancel invite');
        throw error;
      }
    },
    [mutation]
  );
}
