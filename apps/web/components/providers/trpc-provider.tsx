'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import {
  trpcApi as api,
  createTRPCClient,
  createQueryClient,
} from '@groupi/hooks';

interface TRPCProviderProps {
  children: React.ReactNode;
}

export function TRPCProvider({ children }: TRPCProviderProps) {
  const { getToken } = useAuth();

  const [queryClient] = useState(() => createQueryClient());

  const [trpcClient] = useState(() =>
    createTRPCClient({
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/trpc`,
      headers: async () => {
        try {
          const token = await getToken();
          return { authorization: token ? `Bearer ${token}` : '' } as Record<
            string,
            string
          >;
        } catch (_error) {
          return {} as Record<string, string>;
        }
      },
    })
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
}

/**
 * Combined provider that wraps both tRPC and existing QueryProvider
 * This allows tRPC to work alongside their existing real-time notification system
 */
// Removed legacy CombinedTRPCProvider; use TRPCProvider + React Query directly
