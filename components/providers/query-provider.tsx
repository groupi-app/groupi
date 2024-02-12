"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { pusherClient } from "../../lib/pusher-client";
import { QueryDefinition } from "@/lib/query-definitions";

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
            staleTime: Infinity,
          },
        },
      })
  );

  function invalidateQueries() {
    queryClient.invalidateQueries({ queryKey: [queryKey] });
  }

  useEffect(() => {
    pusherClient.subscribe(pusherChannel);
    pusherClient.bind(pusherEvent, invalidateQueries);
    return () => {
      pusherClient.unsubscribe(pusherChannel);
      pusherClient.unbind(pusherEvent, invalidateQueries);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
