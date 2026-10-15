import type { useQuery, useMutation } from 'convex/react';
import type { FunctionReference, FunctionArgs } from 'convex/server';
interface AudienceApi {
  groupEventAudiences: {
    queries: {
      getEventAudiences: FunctionReference<'query'>;
      listGroupSharedEvents: FunctionReference<'query'>;
    };
    mutations: {
      shareEventWithGroup: FunctionReference<'mutation'>;
      withdrawGroupEventAudience: FunctionReference<'mutation'>;
      configureGroupEventSharing: FunctionReference<'mutation'>;
      setEventFriendsAudience: FunctionReference<'mutation'>;
    };
  };
}
export function createGroupEventAudienceHooks<Api extends AudienceApi>(
  api: Api,
  hooks: { useQuery: typeof useQuery; useMutation: typeof useMutation }
) {
  const refs = api.groupEventAudiences;
  function useEventAudiences(
    args:
      | FunctionArgs<Api['groupEventAudiences']['queries']['getEventAudiences']>
      | 'skip'
  ) {
    return hooks.useQuery<
      Api['groupEventAudiences']['queries']['getEventAudiences']
    >(refs.queries.getEventAudiences, args);
  }
  function useGroupSharedEvents(
    args:
      | FunctionArgs<
          Api['groupEventAudiences']['queries']['listGroupSharedEvents']
        >
      | 'skip'
  ) {
    return hooks.useQuery<
      Api['groupEventAudiences']['queries']['listGroupSharedEvents']
    >(refs.queries.listGroupSharedEvents, args);
  }
  function useShareEventWithGroup() {
    return hooks.useMutation<
      Api['groupEventAudiences']['mutations']['shareEventWithGroup']
    >(refs.mutations.shareEventWithGroup);
  }
  function useWithdrawGroupEventAudience() {
    return hooks.useMutation<
      Api['groupEventAudiences']['mutations']['withdrawGroupEventAudience']
    >(refs.mutations.withdrawGroupEventAudience);
  }
  function useConfigureGroupEventSharing() {
    return hooks.useMutation<
      Api['groupEventAudiences']['mutations']['configureGroupEventSharing']
    >(refs.mutations.configureGroupEventSharing);
  }
  function useSetEventFriendsAudience() {
    return hooks.useMutation<
      Api['groupEventAudiences']['mutations']['setEventFriendsAudience']
    >(refs.mutations.setEventFriendsAudience);
  }
  return {
    useEventAudiences,
    useGroupSharedEvents,
    useShareEventWithGroup,
    useWithdrawGroupEventAudience,
    useConfigureGroupEventSharing,
    useSetEventFriendsAudience,
  };
}
