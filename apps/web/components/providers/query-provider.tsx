'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

/**
 * React Query Provider
 * Provides QueryClient to all child components for client-side data management
 * Singleton pattern ensures single QueryClient instance per app
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Consider data fresh for 30 seconds (matches server cache TTL for posts)
            // Note: Individual queries can override this (e.g., events use 5min staleTime)
            staleTime: 30 * 1000,
            // Keep unused queries in cache for 15 minutes (matches longest server cache expire time)
            // This allows instant navigation back to pages without server round-trips
            // Even though server components still execute, React Query prevents client refetches
            gcTime: 15 * 60 * 1000, // Previously cacheTime
            // Retry failed requests 3 times
            retry: 3,
            // Don't refetch on window focus (we use Pusher for real-time updates)
            refetchOnWindowFocus: false,
            // Don't refetch on reconnect (Pusher handles this)
            refetchOnReconnect: false,
            // Refetch on mount only if data is stale (default behavior respects staleTime)
            // Removing custom function that checked !query.state.data because in production
            // with PPR, React Query may not be hydrated yet when component mounts,
            // causing unnecessary refetches. Default behavior respects staleTime properly.
            // refetchOnMount defaults to true but respects staleTime - data within staleTime
            // won't trigger a refetch, allowing instant cache usage in production
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

