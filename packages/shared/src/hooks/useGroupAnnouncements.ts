import type { useQuery, useMutation } from 'convex/react';
import type { FunctionReference, FunctionArgs } from 'convex/server';
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
    args:
      | FunctionArgs<Api['groupAnnouncements']['queries']['getAnnouncement']>
      | 'skip'
  ) {
    return hooks.useQuery<
      Api['groupAnnouncements']['queries']['getAnnouncement']
    >(api.groupAnnouncements.queries.getAnnouncement, args);
  }
  function useSendAnnouncement() {
    return hooks.useMutation<
      Api['groupAnnouncements']['mutations']['sendAnnouncement']
    >(api.groupAnnouncements.mutations.sendAnnouncement);
  }
  return { useAnnouncement, useSendAnnouncement };
}
