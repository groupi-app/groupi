import type { useMutation, useQuery } from 'convex/react';
import type { FunctionArgs, FunctionReference } from 'convex/server';

/** Bind the consuming app's Convex hooks so shared never owns an SDK context. */
export function createEventAdmissionHooks<
  Api extends {
    events: {
      queries: {
        getEventLogistics: FunctionReference<'query'>;
        getDiscoverableEvents: FunctionReference<'query'>;
      };
      mutations: {
        updateAdmissionPolicy: FunctionReference<'mutation'>;
        joinDiscoverableEvent: FunctionReference<'mutation'>;
      };
    };
  },
>(
  api: Api,
  hooks: { useQuery: typeof useQuery; useMutation: typeof useMutation }
) {
  function useEventLogistics(
    eventId: FunctionArgs<
      Api['events']['queries']['getEventLogistics']
    >['eventId']
  ) {
    return hooks.useQuery<Api['events']['queries']['getEventLogistics']>(
      api.events.queries.getEventLogistics,
      { eventId } as FunctionArgs<Api['events']['queries']['getEventLogistics']>
    );
  }
  function useDiscoverableEvents() {
    return hooks.useQuery<Api['events']['queries']['getDiscoverableEvents']>(
      api.events.queries.getDiscoverableEvents,
      {} as FunctionArgs<Api['events']['queries']['getDiscoverableEvents']>
    );
  }
  function useUpdateAdmissionPolicy() {
    return hooks.useMutation<
      Api['events']['mutations']['updateAdmissionPolicy']
    >(api.events.mutations.updateAdmissionPolicy);
  }
  function useJoinEvent() {
    return hooks.useMutation<
      Api['events']['mutations']['joinDiscoverableEvent']
    >(api.events.mutations.joinDiscoverableEvent);
  }
  return {
    useEventLogistics,
    useUpdateAdmissionPolicy,
    useJoinEvent,
    useDiscoverableEvents,
  };
}
