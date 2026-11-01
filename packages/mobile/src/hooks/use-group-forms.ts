'use client';
import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import type { FunctionArgs } from 'convex/server';
import type { Id } from 'convex/_generated/dataModel';
import {
  useEventToolScope,
  type ContentOwnerId,
} from '@/components/content/event-tool-scope';
import { createGroupFormHooks } from '@groupi/shared/hooks';
export const {
  useForm,
  useFormManagement,
  useForms: groupUseForms,
  useFormHistory,
  useFormResults,
  useCreateForm: groupUseCreateForm,
  useConfigureForm,
  useSubmitFormResponse,
  useRemoveFormResponse,
  useRemoveFormResult,
  useDeleteForm,
  useFormPolicy: groupUseFormPolicy,
  useConfigureFormPolicy: groupUseConfigureFormPolicy,
} = createGroupFormHooks(api, { useQuery, useMutation });

export function useForms(
  args:
    | (Omit<
        FunctionArgs<typeof api.groupForms.queries.listForms>,
        'groupId'
      > & { groupId: ContentOwnerId })
    | 'skip'
) {
  const eventId = useEventToolScope();
  const group = groupUseForms(
    eventId || args === 'skip'
      ? 'skip'
      : { ...args, groupId: args.groupId as Id<'groups'> }
  );
  const event = useQuery(
    api.eventContent.queries.listForms,
    eventId && args !== 'skip'
      ? { eventId, paginationOpts: args.paginationOpts }
      : 'skip'
  );
  return eventId ? event : group;
}
export function useCreateForm() {
  const eventId = useEventToolScope();
  const group = groupUseCreateForm();
  const event = useMutation(api.eventContent.mutations.createForm);
  return (
    args: Omit<
      FunctionArgs<typeof api.groupForms.mutations.createForm>,
      'groupId'
    > & { groupId: ContentOwnerId }
  ) => {
    const { groupId, ...input } = args;
    return eventId
      ? event({ ...input, eventId })
      : group({ ...input, groupId: groupId as Id<'groups'> });
  };
}
export function useFormPolicy(args: { groupId: ContentOwnerId } | 'skip') {
  const eventId = useEventToolScope();
  const group = groupUseFormPolicy(
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
export function useConfigureFormPolicy() {
  const eventId = useEventToolScope();
  const configure = groupUseConfigureFormPolicy();
  return (
    args: Omit<
      FunctionArgs<typeof api.groupTools.mutations.configureFormPolicy>,
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
