import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import { apiLogger } from '@groupi/services';

// ============================================================================
// CONTEXT
// ============================================================================

/**
 * Context for tRPC procedures - minimal context
 * Auth is handled directly in services via auth() calls
 */
export async function createTRPCContext() {
  return {};
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

// ============================================================================
// tRPC INITIALIZATION
// ============================================================================

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof Error &&
          error.cause.name === 'ZodError' &&
          'flatten' in error.cause &&
          typeof error.cause.flatten === 'function'
            ? error.cause.flatten()
            : null,
      },
    };
  },
});

// ============================================================================
// ROUTER & PROCEDURE EXPORTS
// ============================================================================

/**
 * Create a tRPC router
 */
export const createTRPCRouter = t.router;

/**
 * Public procedure - no auth required
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure - auth is handled in services
 * Services will return [AuthenticationError, null] if not authenticated
 */
export const protectedProcedure = t.procedure;

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Custom middleware for logging procedure calls
 */
export const loggingMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();

  const result = await next();

  const durationMs = Date.now() - start;

  // Log tRPC procedure calls with structured logging
  if (result.ok) {
    apiLogger.info(`[tRPC] ${type.toUpperCase()} ${path} - ${durationMs}ms`, {
      type,
      path,
      success: true,
      durationMs,
    });
  } else {
    apiLogger.warn(`[tRPC] ${type.toUpperCase()} ${path} - ${durationMs}ms`, {
      type,
      path,
      success: false,
      durationMs,
      error: result.error?.message,
    });
  }

  return result;
});

/**
 * Logged procedure - includes request logging
 */
export const loggedProcedure = publicProcedure.use(loggingMiddleware);

/**
 * Protected procedure with logging
 */
export const protectedLoggedProcedure =
  protectedProcedure.use(loggingMiddleware);
