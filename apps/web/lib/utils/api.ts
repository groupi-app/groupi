import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

import type { AppRouter } from '@groupi/api';

/**
 * Create the tRPC React client
 */
export const api = createTRPCReact<AppRouter>();

/**
 * Create the tRPC client with configuration
 * Note: Better Auth session cookies are automatically sent with requests
 */
export const trpcClient = api.createClient({
  links: [
    httpBatchLink({
      url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/trpc`,
      transformer: superjson,
      // No need for custom headers - Better Auth cookies are sent automatically
    }),
  ],
});

/**
 * Export the client for provider setup
 */
export { trpcClient as client };

/**
 * Export api as trpc for convenience in components
 */
export { api as trpc };
