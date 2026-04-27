import { useQuery, useMutation } from 'convex/react';
import { useState, useEffect, useCallback } from 'react';
import { toast } from '@groupi/shared/platform';
import { navigation } from '@groupi/shared/platform';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

// --- Queries ---

export function usePendingEventInvites() {
  return useQuery(api.eventInvites.queries.getPendingEventInvites, {});
}

export function usePendingInviteCount() {
  return useQuery(api.eventInvites.queries.getPendingInviteCount, {});
}

export function useSentEventInvites(eventId: string | undefined) {
  return useQuery(
    api.eventInvites.queries.getSentEventInvites,
    eventId ? { eventId } : 'skip'
  );
}

export function useEventInviteSearch(
  eventId: string | undefined,
  searchTerm: string,
  enabled = true
) {
  const [debouncedTerm, setDebouncedTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const results = useQuery(
    api.eventInvites.queries.searchUsersForEventInvite,
    enabled && eventId && debouncedTerm.length >= 2
      ? { eventId, searchTerm: debouncedTerm }
      : 'skip'
  );

  return { results, debouncedTerm };
}

// --- Mutations ---

export function useAcceptEventInvite() {
  const mutation = useMutation(api.eventInvites.mutations.acceptEventInvite);

  return useCallback(
    async (inviteId: string) => {
      try {
        const result = await mutation({ inviteId });
        toast.success('Invite accepted!');
        if (result?.eventId) {
          navigation.replace(`/event/${result.eventId}`);
        }
        return result;
      } catch {
        toast.error('Failed to accept invite');
      }
    },
    [mutation]
  );
}

export function useDeclineEventInvite() {
  const mutation = useMutation(api.eventInvites.mutations.declineEventInvite);

  return useCallback(
    async (inviteId: string) => {
      try {
        await mutation({ inviteId });
        toast.info('Invite declined');
      } catch {
        toast.error('Failed to decline invite');
      }
    },
    [mutation]
  );
}

export function useSendEventInvite() {
  const mutation = useMutation(api.eventInvites.mutations.sendEventInvite);

  return useCallback(
    async (params: {
      eventId: string;
      inviteePersonId: string;
      role: 'ATTENDEE' | 'MODERATOR';
      message?: string;
    }) => {
      try {
        await mutation(params);
        toast.success('Invite sent!');
      } catch {
        toast.error('Failed to send invite');
      }
    },
    [mutation]
  );
}

export function useCancelEventInvite() {
  const mutation = useMutation(api.eventInvites.mutations.cancelEventInvite);

  return useCallback(
    async (inviteId: string) => {
      try {
        await mutation({ inviteId });
        toast.info('Invite cancelled');
      } catch {
        toast.error('Failed to cancel invite');
      }
    },
    [mutation]
  );
}
