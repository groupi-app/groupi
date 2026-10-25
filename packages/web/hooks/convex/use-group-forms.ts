'use client';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
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

// Existing tool-id operations are shared; only discovery, creation, and policy depend on owner.
import type { FunctionArgs } from 'convex/server';
import type { Id } from '@/convex/_generated/dataModel';
import {
  useEventToolId,
  type ContentOwnerId,
} from '@/features/content/tool-scope';
type OwnerArgs<T> = Omit<T, 'groupId'> & { groupId: ContentOwnerId };
export function useForms(
  args:
    | OwnerArgs<FunctionArgs<typeof api.groupForms.queries.listForms>>
    | 'skip'
) {
  const eventId = useEventToolId();
  const groups = groupUseForms(
    eventId || args === 'skip'
      ? 'skip'
      : { ...args, groupId: args.groupId as Id<'groups'> }
  );
  const events = useQuery(
    api.eventContent.queries.listForms,
    eventId && args !== 'skip'
      ? { eventId, paginationOpts: args.paginationOpts }
      : 'skip'
  );
  return eventId ? events : groups;
}
export function useCreateForm() {
  const eventId = useEventToolId();
  const groupCreate = groupUseCreateForm();
  const eventCreate = useMutation(api.eventContent.mutations.createForm);
  return (
    args: OwnerArgs<FunctionArgs<typeof api.groupForms.mutations.createForm>>
  ) => {
    const { groupId, ...input } = args;
    return eventId
      ? eventCreate({ ...input, eventId })
      : groupCreate({ ...input, groupId: groupId as Id<'groups'> });
  };
}
export function useFormPolicy(args: { groupId: ContentOwnerId } | 'skip') {
  const eventId = useEventToolId();
  const policy = groupUseFormPolicy(
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
export function useConfigureFormPolicy() {
  const configure = groupUseConfigureFormPolicy();
  return (
    args: OwnerArgs<
      FunctionArgs<typeof api.groupTools.mutations.configureFormPolicy>
    >
  ) => configure({ ...args, groupId: args.groupId as Id<'groups'> });
}
