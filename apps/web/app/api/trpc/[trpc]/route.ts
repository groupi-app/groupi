import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { NextRequest } from 'next/server';

import { appRouter } from '@groupi/api';

const handler = async (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => {
      return {};
    },
    // No onError handler - services handle all error logging
  });

export { handler as GET, handler as POST };
