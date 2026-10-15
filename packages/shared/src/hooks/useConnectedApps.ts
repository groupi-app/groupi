import { useMutation, useQuery } from 'convex/react';
import type { FunctionReference } from 'convex/server';
import type { ConvexId } from './types';

export function createConnectedAppHooks<Connections, Result>(api: {
  delegatedApps: {
    queries: {
      listConnections: FunctionReference<
        'query',
        'public',
        Record<string, never>,
        Connections
      >;
    };
    mutations: {
      disconnect: FunctionReference<
        'mutation',
        'public',
        { grantId: ConvexId<'authorizationGrants'> },
        Result
      >;
    };
  };
}) {
  return {
    useConnectedApps: () =>
      useQuery(api.delegatedApps.queries.listConnections, {}),
    useDisconnectApp: () => useMutation(api.delegatedApps.mutations.disconnect),
  };
}
