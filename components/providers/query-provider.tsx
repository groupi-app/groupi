'use client';

import React from 'react';
import { QueryDefinition } from '@/lib/query-definitions';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { pusherClient } from '../../lib/pusher-client';

interface QueryProviderProps {
  queryDefinition: QueryDefinition;
  children: React.ReactNode;
}

export default function QueryProvider({
  queryDefinition,
  children,
}: QueryProviderProps) {
  const { queryKey, pusherChannel, pusherEvent } = queryDefinition;
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0,
          },
        },
      })
  );

  useEffect(() => {
    function invalidateQueries() {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    }

    pusherClient.subscribe(pusherChannel);
    pusherClient.bind(pusherEvent, invalidateQueries);
    return () => {
      pusherClient.unsubscribe(pusherChannel);
      pusherClient.unbind(pusherEvent, invalidateQueries);
    };
  }, [queryKey, pusherChannel, pusherEvent, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
