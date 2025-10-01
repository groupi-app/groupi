import { createTRPCReact } from '@trpc/react-query';
import { QueryClient } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

import type { AppRouter } from '@groupi/api';

export const api = createTRPCReact<AppRouter>();

export const createTRPCClient = (config: {
  url: string;
  headers?: () => Promise<Record<string, string>>;
}) => {
  return api.createClient({
    links: [
      httpBatchLink({
        url: config.url,
        headers: config.headers,
        transformer: superjson,
      }),
    ],
  });
};

export { api as trpcApi };

export const createQueryClient = () => new QueryClient();
