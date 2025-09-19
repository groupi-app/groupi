import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import { auth } from '@clerk/nextjs/server';
import superjson from 'superjson';

import type { AppRouter } from '@groupi/api';

/**
 * Create the tRPC React client
 */
export const api = createTRPCReact<AppRouter>();

/**
 * Create the tRPC client with configuration
 */
export const trpcClient = api.createClient({
  links: [
    httpBatchLink({
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/trpc`,
      transformer: superjson,
      headers: async () => {
        // Get auth token from Clerk
        const { userId } = await auth();
        return {
          authorization: userId ? `Bearer ${userId}` : '',
        };
      },
    }),
  ],
});

/**
 * Export the client for provider setup
 */
export { trpcClient as client };
