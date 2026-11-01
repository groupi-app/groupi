'use client';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { createGroupPollHooks } from '@groupi/shared/hooks';
export const {
  usePoll,
  usePollManagement,
  usePolls: groupUsePolls,
  usePollHistory,
  usePollResults,
  useCreatePoll: groupUseCreatePoll,
  useConfigurePoll,
  useSubmitPollVote,
  useRemovePollVote,
  useRemovePollResult,
  useDeletePoll,
  usePollPolicy: groupUsePollPolicy,
  useConfigurePollPolicy: groupUseConfigurePollPolicy,
} = createGroupPollHooks(api, { useQuery, useMutation });

// Existing tool-id operations are shared; only discovery, creation, and policy depend on owner.
import type { FunctionArgs } from 'convex/server';
import type { Id } from '@/convex/_generated/dataModel';
import {
  useEventToolId,
  type ContentOwnerId,
} from '@/features/content/tool-scope';
type OwnerArgs<T> = Omit<T, 'groupId'> & { groupId: ContentOwnerId };
export function usePolls(
  args:
    | OwnerArgs<FunctionArgs<typeof api.groupPolls.queries.listPolls>>
    | 'skip'
) {
  const eventId = useEventToolId();
  const groups = groupUsePolls(
    eventId || args === 'skip'
      ? 'skip'
      : { ...args, groupId: args.groupId as Id<'groups'> }
  );
  const events = useQuery(
    api.eventContent.queries.listPolls,
    eventId && args !== 'skip'
      ? { eventId, paginationOpts: args.paginationOpts }
      : 'skip'
  );
  return eventId ? events : groups;
}
export function useCreatePoll() {
  const eventId = useEventToolId();
  const groupCreate = groupUseCreatePoll();
  const eventCreate = useMutation(api.eventContent.mutations.createPoll);
  return (
    args: OwnerArgs<FunctionArgs<typeof api.groupPolls.mutations.createPoll>>
  ) => {
    const { groupId, ...input } = args;
    return eventId
      ? eventCreate({ ...input, eventId })
      : groupCreate({ ...input, groupId: groupId as Id<'groups'> });
  };
}
export function usePollPolicy(args: { groupId: ContentOwnerId } | 'skip') {
  const eventId = useEventToolId();
  const policy = groupUsePollPolicy(
    eventId || args === 'skip'
      ? 'skip'
      : { groupId: args.groupId as Id<'groups'> }
  );
  const event = useQuery(
    api.eventContent.queries.getContext,
    eventId && args !== 'skip' ? { eventId } : 'skip'
  );
  if (!eventId) return policy ? { ...policy, canCreate: undefined } : undefined;
  if (event === undefined) return undefined;
  return {
    enabled: true,
    canCreate: event?.canCreate === true,
    creation: event?.canCreate ? ('MEMBERS' as const) : ('MANAGERS' as const),
    canConfigure: false,
  };
}
export function useConfigurePollPolicy() {
  const configure = groupUseConfigurePollPolicy();
  return (
    args: OwnerArgs<
      FunctionArgs<typeof api.groupTools.mutations.configurePollPolicy>
    >
  ) => configure({ ...args, groupId: args.groupId as Id<'groups'> });
}
