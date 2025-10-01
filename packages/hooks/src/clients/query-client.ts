import { QueryClient, type QueryClientConfig } from '@tanstack/react-query';

// Default client config used across apps unless overridden
const defaultClientOptions: NonNullable<QueryClientConfig['defaultOptions']> = {
  queries: {
    staleTime: 30 * 1000, // 30s
    gcTime: 5 * 60 * 1000, // 5m
    retry: (failureCount, error: unknown) => {
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as { message?: string }).message ?? '';
        if (
          message.includes('authentication') ||
          message.includes('unauthorized')
        ) {
          return false;
        }
      }
      return failureCount < 3;
    },
  },
  mutations: {
    retry: 1,
  },
};

/**
 * Create a QueryClient with sensible defaults and optional overrides.
 * Keep this UI-agnostic so both web and mobile can share it.
 */
export function createQueryClient(
  overrides?: Partial<NonNullable<QueryClientConfig['defaultOptions']>>
): QueryClient {
  const merged: NonNullable<QueryClientConfig['defaultOptions']> = {
    queries: { ...defaultClientOptions.queries, ...(overrides?.queries ?? {}) },
    mutations: {
      ...defaultClientOptions.mutations,
      ...(overrides?.mutations ?? {}),
    },
  };

  return new QueryClient({ defaultOptions: merged });
}

/**
 * Create a server-side QueryClient tuned for prefetching.
 */
export function createServerQueryClient(
  overrides?: Partial<NonNullable<QueryClientConfig['defaultOptions']>>
): QueryClient {
  const serverDefaults: NonNullable<QueryClientConfig['defaultOptions']> = {
    queries: {
      ...defaultClientOptions.queries,
      retry: false,
    },
    mutations: { ...defaultClientOptions.mutations },
  };

  const merged: NonNullable<QueryClientConfig['defaultOptions']> = {
    queries: { ...serverDefaults.queries, ...(overrides?.queries ?? {}) },
    mutations: { ...serverDefaults.mutations, ...(overrides?.mutations ?? {}) },
  };

  return new QueryClient({ defaultOptions: merged });
}
