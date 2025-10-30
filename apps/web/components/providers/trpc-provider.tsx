'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { api } from '@groupi/hooks';
import { createTRPCClient, createQueryClient } from '@groupi/hooks';

interface TRPCProviderProps {
  children: React.ReactNode;
}

export function TRPCProvider({ children }: TRPCProviderProps) {
  const [queryClient] = useState(() => createQueryClient());

  const [trpcClient] = useState(() =>
    createTRPCClient({
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/trpc`,
      // Better Auth cookies are automatically sent with requests
      // No need for custom headers - auth is handled via cookies
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
