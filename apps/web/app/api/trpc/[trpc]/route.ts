import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { auth } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

import { appRouter } from '@groupi/api';

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => {
      const { userId } = await auth();

      return {
        userId,
      };
    },
  });

export { handler as GET, handler as POST };
