import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { NextRequest } from 'next/server';

import { appRouter } from '@groupi/api';
import { apiLogger } from '@/lib/logger';

const handler = async (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: async () => {
      return {};
    },
    onError: ({ error, path, type, input }) => {
      // Enhanced error logging with more context
      const errorDetails = {
        type,
        path,
        message: error.message,
        name: error.name,
        stack: error.stack,
        input: input ? JSON.stringify(input, null, 2) : undefined,
        cause: error.cause ? JSON.stringify(error.cause, null, 2) : undefined,
        // Add more error context
        code: (error as any).code,
        data: (error as any).data,
        // If it's a wrapped error, try to get the original error
        originalError: (error as any).originalError
          ? {
              message: (error as any).originalError.message,
              name: (error as any).originalError.name,
              stack: (error as any).originalError.stack,
            }
          : undefined,
      };

      // Log with full context
      apiLogger.error('[tRPC] Error occurred', errorDetails);

      // Also log to console for immediate visibility during development
      if (process.env.NODE_ENV === 'development') {
        console.error(`[tRPC Error] ${path}:`, {
          message: error.message,
          input: input,
          fullError: error,
        });
      }
    },
  });

export { handler as GET, handler as POST };
