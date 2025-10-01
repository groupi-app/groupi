import { Effect } from 'effect';
import * as Sentry from '@sentry/node';

// Note: Sentry is initialized by the Next.js app (sentry.server.config.ts)
// The services package just uses the existing Sentry instance

interface SentryOptions {
  name: string;
  op: string;
  tags?: Record<string, string | number | boolean>;
  data?: Record<string, unknown>;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
}

interface SentrySpanContext {
  name: string;
  op: string;
  tags?: Record<string, string | number | boolean>;
  data?: Record<string, unknown>;
}

// Use real Sentry
const SentryClient = Sentry;

/**
 * Wraps an Effect with Sentry error tracking and performance monitoring
 *
 * @param effect - The Effect to wrap with Sentry
 * @param options - Sentry configuration options
 * @returns The wrapped Effect with Sentry instrumentation
 */
export function withSentry<A, E, R>(
  effect: Effect.Effect<A, E, R>,
  options: SentryOptions
): Effect.Effect<A, E, R> {
  return Effect.gen(function* (_) {
    // Add breadcrumb for operation start
    SentryClient.addBreadcrumb({
      message: `Starting ${options.name}`,
      category: 'effect.operation',
      level: 'info',
      data: {
        operation: options.op,
        ...options.tags,
      },
    });

    // Set tags if provided
    if (options.tags) {
      Object.entries(options.tags).forEach(([key, value]) => {
        SentryClient.setTag(key, String(value));
      });
    }

    // Set context if provided
    if (options.data) {
      SentryClient.setContext(options.name, options.data);
    }

    try {
      // Log operation start
      yield* _(
        Effect.logInfo(`[Sentry] Starting ${options.name}`, {
          operation: options.op,
          tags: options.tags,
        })
      );

      // Execute the effect
      const result = yield* _(effect);

      // Add success breadcrumb
      SentryClient.addBreadcrumb({
        message: `Completed ${options.name}`,
        category: 'effect.operation',
        level: 'info',
        data: {
          operation: options.op,
          status: 'success',
        },
      });

      // Log success
      yield* _(
        Effect.logInfo(`[Sentry] Completed ${options.name}`, {
          operation: options.op,
          status: 'success',
        })
      );

      return result;
    } catch (error) {
      // Capture error in Sentry
      const eventId = SentryClient.captureException(error as Error);

      // Log error with Sentry event ID
      yield* _(
        Effect.logError(`[Sentry] Error in ${options.name}`, {
          operation: options.op,
          error: error instanceof Error ? error.message : String(error),
          sentryEventId: eventId,
          tags: options.tags,
        })
      );

      // Re-throw the error to maintain Effect error handling
      throw error;
    }
  });
}

/**
 * Creates a Sentry span for a specific operation within a larger transaction
 */
export function withSentrySpan<A, E, R>(
  effect: Effect.Effect<A, E, R>,
  spanContext: SentrySpanContext
): Effect.Effect<A, E, R> {
  return Effect.gen(function* (_) {
    // For now, just use the basic withSentry wrapper
    return yield* _(
      withSentry(effect, {
        name: spanContext.name,
        op: spanContext.op,
        tags: spanContext.tags,
        data: spanContext.data,
      })
    );
  });
}

/**
 * Adds Sentry context to the current scope
 */
export function addSentryContext(
  context: Record<string, Record<string, unknown>>
): Effect.Effect<void, never, never> {
  return Effect.sync(() => {
    Object.entries(context).forEach(([key, value]) => {
      SentryClient.setContext(key, value);
    });
  });
}

/**
 * Adds a Sentry breadcrumb
 */
export function addSentryBreadcrumb(breadcrumb: {
  message: string;
  category?: string;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  data?: Record<string, unknown>;
}): Effect.Effect<void, never, never> {
  return Effect.sync(() => {
    SentryClient.addBreadcrumb(breadcrumb);
  });
}

/**
 * Sets Sentry tags for the current scope
 */
export function setSentryTags(
  tags: Record<string, string | number | boolean>
): Effect.Effect<void, never, never> {
  return Effect.sync(() => {
    Object.entries(tags).forEach(([key, value]) => {
      SentryClient.setTag(key, String(value));
    });
  });
}

// Helper functions for common operations
export const SentryHelpers = {
  /**
   * Wrap database operations with Sentry
   */
  withDbOperation: <A, E, R>(
    effect: Effect.Effect<A, E, R>,
    operation: string,
    table?: string
  ) =>
    withSentry(effect, {
      name: `db.${operation}`,
      op: 'db.query',
      tags: {
        operation,
        ...(table && { table }),
      },
    }),

  /**
   * Wrap API operations with Sentry
   */
  withApiOperation: <A, E, R>(
    effect: Effect.Effect<A, E, R>,
    method: string,
    route: string
  ) =>
    withSentry(effect, {
      name: `api.${method.toLowerCase()}.${route}`,
      op: 'http.server',
      tags: {
        method,
        route,
      },
    }),

  /**
   * Wrap service operations with Sentry
   */
  withServiceOperation: <A, E, R>(
    effect: Effect.Effect<A, E, R>,
    service: string,
    operation: string,
    entityId?: string
  ) =>
    withSentry(effect, {
      name: `service.${service}.${operation}`,
      op: 'service.fetch',
      tags: {
        service,
        operation,
        ...(entityId && { entityId }),
      },
    }),

  /**
   * Wrap authentication operations with Sentry
   */
  withAuthOperation: <A, E, R>(
    effect: Effect.Effect<A, E, R>,
    operation: string,
    userId?: string
  ) =>
    withSentry(effect, {
      name: `auth.${operation}`,
      op: 'auth.verify',
      tags: {
        operation,
        ...(userId && { userId }),
      },
    }),
};

// Types for external use
export type { SentryOptions, SentrySpanContext };
