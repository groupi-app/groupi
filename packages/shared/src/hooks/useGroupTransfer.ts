import type { useQuery, useMutation } from 'convex/react';
import type { FunctionArgs, FunctionReference } from 'convex/server';
export function createGroupTransferHooks<
  Api extends {
    groupTransfers: {
      queries: { status: FunctionReference<'query'> };
      mutations: {
        offer: FunctionReference<'mutation'>;
        accept: FunctionReference<'mutation'>;
        decline: FunctionReference<'mutation'>;
        cancel: FunctionReference<'mutation'>;
      };
    };
  },
>(
  api: Api,
  hooks: { useQuery: typeof useQuery; useMutation: typeof useMutation }
) {
  function useGroupTransfer(
    groupId: FunctionArgs<Api['groupTransfers']['queries']['status']>['groupId']
  ) {
    const status = hooks.useQuery<Api['groupTransfers']['queries']['status']>(
      api.groupTransfers.queries.status,
      { groupId } as FunctionArgs<Api['groupTransfers']['queries']['status']>
    );
    const offer = hooks.useMutation<
      Api['groupTransfers']['mutations']['offer']
    >(api.groupTransfers.mutations.offer);
    const accept = hooks.useMutation<
      Api['groupTransfers']['mutations']['accept']
    >(api.groupTransfers.mutations.accept);
    const decline = hooks.useMutation<
      Api['groupTransfers']['mutations']['decline']
    >(api.groupTransfers.mutations.decline);
    const cancel = hooks.useMutation<
      Api['groupTransfers']['mutations']['cancel']
    >(api.groupTransfers.mutations.cancel);
    return { status, offer, accept, decline, cancel };
  }
  return { useGroupTransfer };
}
