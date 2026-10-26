import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
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

// Existing tool-id operations are shared; only discovery, creation, and policy depend on owner.
import type { FunctionArgs } from 'convex/server';
import type { Id } from '@/convex/_generated/dataModel';
import {
  useEventToolId,
  type ContentOwnerId,
} from '@/features/content/tool-scope';
type OwnerArgs<T> = Omit<T, 'groupId'> & { groupId: ContentOwnerId };
export function useLists(
  args:
    | OwnerArgs<FunctionArgs<typeof api.groupLists.queries.listLists>>
    | 'skip'
) {
  const eventId = useEventToolId();
  const groups = groupUseLists(
    eventId || args === 'skip'
      ? 'skip'
      : { ...args, groupId: args.groupId as Id<'groups'> }
  );
  const events = useQuery(
    api.eventContent.queries.listLists,
    eventId && args !== 'skip'
      ? { eventId, paginationOpts: args.paginationOpts }
      : 'skip'
  );
  return eventId ? events : groups;
}
export function useCreateList() {
  const eventId = useEventToolId();
  const groupCreate = groupUseCreateList();
  const eventCreate = useMutation(api.eventContent.mutations.createList);
  return (
    args: OwnerArgs<FunctionArgs<typeof api.groupLists.mutations.createList>>
  ) => {
    const { groupId, ...input } = args;
    return eventId
      ? eventCreate({ ...input, eventId })
      : groupCreate({ ...input, groupId: groupId as Id<'groups'> });
  };
}
export function useListPolicy(args: { groupId: ContentOwnerId } | 'skip') {
  const eventId = useEventToolId();
  const policy = groupUseListPolicy(
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
export function useConfigureListPolicy() {
  const configure = groupUseConfigureListPolicy();
  return (
    args: OwnerArgs<
      FunctionArgs<typeof api.groupTools.mutations.configureListPolicy>
    >
  ) => configure({ ...args, groupId: args.groupId as Id<'groups'> });
}
