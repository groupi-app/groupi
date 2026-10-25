import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { FunctionArgs } from 'convex/server';
import type { Id } from 'convex/_generated/dataModel';
import {
  useEventToolScope,
  type ContentOwnerId,
} from '@/components/content/event-tool-scope';
import { createGroupListHooks } from '@groupi/shared/hooks';
export const {
  useList,
  useListManagement,
  useLists: groupUseLists,
  useListEntries,
  useOwnListEntries,
  useCreateList: groupUseCreateList,
  useConfigureList,
  useAddListEntry,
  useEditListEntry,
  useRemoveListEntry,
  useDeleteList,
  useListPolicy: groupUseListPolicy,
  useConfigureListPolicy: groupUseConfigureListPolicy,
} = createGroupListHooks(api, { useQuery, useMutation });

export function useLists(
  args:
    | (Omit<
        FunctionArgs<typeof api.groupLists.queries.listLists>,
        'groupId'
      > & { groupId: ContentOwnerId })
    | 'skip'
) {
  const eventId = useEventToolScope();
  const group = groupUseLists(
    eventId || args === 'skip'
      ? 'skip'
      : { ...args, groupId: args.groupId as Id<'groups'> }
  );
  const event = useQuery(
    api.eventContent.queries.listLists,
    eventId && args !== 'skip'
      ? { eventId, paginationOpts: args.paginationOpts }
      : 'skip'
  );
  return eventId ? event : group;
}
export function useCreateList() {
  const eventId = useEventToolScope();
  const group = groupUseCreateList();
  const event = useMutation(api.eventContent.mutations.createList);
  return (
    args: Omit<
      FunctionArgs<typeof api.groupLists.mutations.createList>,
      'groupId'
    > & { groupId: ContentOwnerId }
  ) => {
    const { groupId, ...input } = args;
    return eventId
      ? event({ ...input, eventId })
      : group({ ...input, groupId: groupId as Id<'groups'> });
  };
}
export function useListPolicy(args: { groupId: ContentOwnerId } | 'skip') {
  const eventId = useEventToolScope();
  const group = groupUseListPolicy(
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
export function useConfigureListPolicy() {
  const eventId = useEventToolScope();
  const configure = groupUseConfigureListPolicy();
  return (
    args: Omit<
      FunctionArgs<typeof api.groupTools.mutations.configureListPolicy>,
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
