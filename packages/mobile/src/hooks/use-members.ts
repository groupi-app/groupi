import { useMutation } from 'convex/react';
import { useCallback } from 'react';
import { toast } from '@groupi/shared/platform';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

export function useUpdateMemberRole() {
  const mutation = useMutation(api.events.mutations.updateMemberRole);

  return useCallback(
    async (params: {
      membershipId: Id<'memberships'>;
      newRole: 'MODERATOR' | 'ATTENDEE';
    }) => {
      try {
        await mutation(params);
        const label = params.newRole === 'MODERATOR' ? 'Moderator' : 'Attendee';
        toast.success(`Role updated to ${label}`);
      } catch {
        toast.error('Failed to update role');
      }
    },
    [mutation]
  );
}

export function useRemoveMember() {
  const mutation = useMutation(api.events.mutations.removeMember);

  return useCallback(
    async (params: { membershipId: Id<'memberships'> }) => {
      try {
        await mutation(params);
        toast.success('Member removed');
      } catch {
        toast.error('Failed to remove member');
      }
    },
    [mutation]
  );
}

export function useBanMember() {
  const mutation = useMutation(api.events.mutations.banMember);

  return useCallback(
    async (params: { membershipId: Id<'memberships'>; reason?: string }) => {
      try {
        await mutation(params);
        toast.success('Member banned');
      } catch {
        toast.error('Failed to ban member');
      }
    },
    [mutation]
  );
}

export function useChooseEventDate() {
  const mutation = useMutation(api.events.mutations.chooseEventDate);

  return useCallback(
    async (params: {
      eventId: Id<'events'>;
      chosenDateTime: number;
      chosenEndDateTime?: number;
    }) => {
      try {
        await mutation(params);
        toast.success('Event date selected!');
      } catch {
        toast.error('Failed to choose date');
      }
    },
    [mutation]
  );
}

export function useResetEventDate() {
  const mutation = useMutation(api.events.mutations.resetEventDate);

  return useCallback(
    async (eventId: Id<'events'>) => {
      try {
        await mutation({ eventId });
        toast.success('Event date reset');
      } catch {
        toast.error('Failed to reset date');
      }
    },
    [mutation]
  );
}
