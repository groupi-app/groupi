import { initTRPC, TRPCError } from '@trpc/server';
import { auth } from '@clerk/nextjs/server';
import superjson from 'superjson';

// ============================================================================
// CONTEXT
// ============================================================================

/**
 * Inner context - minimal context created for each request
 */
export async function createInnerTRPCContext() {
  return {};
}

/**
 * Context for tRPC procedures - includes auth information
 */
export async function createTRPCContext() {
  const innerContext = await createInnerTRPCContext();
  const { userId } = await auth();

  return {
    ...innerContext,
    userId,
  };
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
 * Protected procedure - requires authentication
 * Returns a tuple [error, null] if auth fails instead of throwing
 */
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId, // TypeScript now knows userId is guaranteed to exist
    },
  });
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Custom middleware for logging procedure calls
 */
export const loggingMiddleware = t.middleware(
  async ({ path: _path, type: _type, next }) => {
    // const start = Date.now();

    const result = await next();

    // const _durationMs = Date.now() - start;

    // Log tRPC procedure calls: [tRPC] TYPE path - duration
    // console.log(`[tRPC] ${type.toUpperCase()} ${path} - ${durationMs}ms`, {
    //   success: result.ok,
    //   durationMs,
    // });

    return result;
  }
);

/**
 * Logged procedure - includes request logging
 */
export const loggedProcedure = publicProcedure.use(loggingMiddleware);

/**
 * Protected procedure with logging
 */
export const protectedLoggedProcedure =
  protectedProcedure.use(loggingMiddleware);
