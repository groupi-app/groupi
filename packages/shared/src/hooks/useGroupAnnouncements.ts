import type { useQuery, useMutation, ReactMutation } from 'convex/react';
import type { FunctionReference, FunctionReturnType } from 'convex/server';
import type { ConvexId } from './types';
interface AnnouncementApi {
  groupAnnouncements: {
    queries: { getAnnouncement: FunctionReference<'query'> };
    mutations: { sendAnnouncement: FunctionReference<'mutation'> };
  };
}
/** Inject the consuming application's SDK to use its actual provider. */
export function createGroupAnnouncementHooks<Api extends AnnouncementApi>(
  api: Api,
  hooks: { useQuery: typeof useQuery; useMutation: typeof useMutation }
) {
  function useAnnouncement(
    groupId: ConvexId<'groups'>,
    requestId: string | null
  ) {
    return hooks.useQuery(
      api.groupAnnouncements.queries.getAnnouncement,
      requestId ? { groupId, requestId } : 'skip'
    ) as
      | FunctionReturnType<
          Api['groupAnnouncements']['queries']['getAnnouncement']
        >
      | undefined;
  }
  function useSendAnnouncement() {
    return hooks.useMutation(
      api.groupAnnouncements.mutations.sendAnnouncement
    ) as ReactMutation<
      Api['groupAnnouncements']['mutations']['sendAnnouncement']
    >;
  }
  return { useAnnouncement, useSendAnnouncement };
}
