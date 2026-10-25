import type { useQuery, useMutation } from 'convex/react';
import type { ConvexApi, ConvexId } from './types';

/** Bind the consuming app's SDK so web and native use their actual provider. */
export function createEventTransferHooks(
  api: ConvexApi,
  sdk: { useQuery: typeof useQuery; useMutation: typeof useMutation }
) {
  function useEventTransfer(eventId: ConvexId<'events'>) {
    const status = sdk.useQuery(api.eventTransfers.queries.status, { eventId });
    const offer = sdk.useMutation(api.eventTransfers.mutations.offer);
    const accept = sdk.useMutation(api.eventTransfers.mutations.accept);
    const decline = sdk.useMutation(api.eventTransfers.mutations.decline);
    const cancel = sdk.useMutation(api.eventTransfers.mutations.cancel);
    return { status, offer, accept, decline, cancel };
  }
  return { useEventTransfer };
}
