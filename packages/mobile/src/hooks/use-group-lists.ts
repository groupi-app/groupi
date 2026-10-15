import { useQuery, useMutation } from 'convex/react';
import { api } from 'convex/_generated/api';
import { createGroupListHooks } from '@groupi/shared/hooks';
export const {
  useList,
  useListManagement,
  useLists,
  useListEntries,
  useOwnListEntries,
  useCreateList,
  useConfigureList,
  useAddListEntry,
  useEditListEntry,
  useRemoveListEntry,
  useDeleteList,
  useListPolicy,
  useConfigureListPolicy,
} = createGroupListHooks(api, { useQuery, useMutation });
