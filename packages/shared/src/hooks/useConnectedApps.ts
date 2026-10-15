import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import type { FunctionReference } from 'convex/server';
import type { ConvexId } from './types';

export function createConnectedAppHooks<Connections, Result>(api: {
  delegatedApps: {
    queries: {
      listConnections: FunctionReference<
        'query',
        'public',
        { now: number },
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
    useConnectedApps: () => {
      // This is a display clock, not fetched data or an authorization ceiling.
      const [now, setNow] = useState(() => Date.now());
      useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(timer);
      }, []);
      return useQuery(api.delegatedApps.queries.listConnections, { now });
    },
    useDisconnectApp: () => useMutation(api.delegatedApps.mutations.disconnect),
  };
}
