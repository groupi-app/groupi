'use client';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { FunctionArgs } from 'convex/server';
import type { Id } from 'convex/_generated/dataModel';
import {
  useEventToolScope,
  type ContentOwnerId,
} from '@/components/content/event-tool-scope';
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

export function usePolls(
  args:
    | (Omit<
        FunctionArgs<typeof api.groupPolls.queries.listPolls>,
        'groupId'
      > & { groupId: ContentOwnerId })
    | 'skip'
) {
  const eventId = useEventToolScope();
  const group = groupUsePolls(
    eventId || args === 'skip'
      ? 'skip'
      : { ...args, groupId: args.groupId as Id<'groups'> }
  );
  const event = useQuery(
    api.eventContent.queries.listPolls,
    eventId && args !== 'skip'
      ? { eventId, paginationOpts: args.paginationOpts }
      : 'skip'
  );
  return eventId ? event : group;
}
export function useCreatePoll() {
  const eventId = useEventToolScope();
  const group = groupUseCreatePoll();
  const event = useMutation(api.eventContent.mutations.createPoll);
  return (
    args: Omit<
      FunctionArgs<typeof api.groupPolls.mutations.createPoll>,
      'groupId'
    > & { groupId: ContentOwnerId }
  ) => {
    const { groupId, ...input } = args;
    return eventId
      ? event({ ...input, eventId })
      : group({ ...input, groupId: groupId as Id<'groups'> });
  };
}
export function usePollPolicy(args: { groupId: ContentOwnerId } | 'skip') {
  const eventId = useEventToolScope();
  const group = groupUsePollPolicy(
    eventId || args === 'skip'
      ? 'skip'
      : { groupId: args.groupId as Id<'groups'> }
  );
  const event = useQuery(
    api.eventContent.queries.getContext,
    eventId && args !== 'skip' ? { eventId } : 'skip'
  );
  if (!eventId)
    return group && { ...group, canCreate: undefined as boolean | undefined };
  return (
    event && {
      enabled: true,
      creation: event.canCreate ? ('MEMBERS' as const) : ('MANAGERS' as const),
      canConfigure: false,
      canCreate: event.canCreate,
    }
  );
}
export function useConfigurePollPolicy() {
  const eventId = useEventToolScope();
  const configure = groupUseConfigurePollPolicy();
  return (
    args: Omit<
      FunctionArgs<typeof api.groupTools.mutations.configurePollPolicy>,
      'groupId'
    > & { groupId: ContentOwnerId }
  ) => {
    if (eventId)
      throw new Error(
        'Event content creation is controlled by Event permissions.'
      );
    return configure({ ...args, groupId: args.groupId as Id<'groups'> });
  };
}
