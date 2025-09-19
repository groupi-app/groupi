import { Effect } from 'effect';
import { retrySchedules, isRetryableError } from './retry-patterns';

// Reusable pattern for database operations with retry
export const dbOperation = <T, E extends Error>(
  operation: () => Promise<T>,
  errorWrapper: (cause: unknown) => E,
  operationName: string
) =>
  Effect.gen(function* (_) {
    yield* _(Effect.logInfo(`Starting ${operationName}`));

    const result = yield* _(
      Effect.tryPromise({
        try: operation,
        catch: errorWrapper,
      }).pipe(
        Effect.retry({
          schedule: retrySchedules.database,
          while: (error: E) => isRetryableError(error.cause || error),
        }),
        Effect.tapError(error =>
          Effect.logWarning(`${operationName} failed, retrying...`, {
            error: error.message,
            attempt: 'retry',
          })
        )
      )
    );

    yield* _(Effect.logInfo(`Successfully completed ${operationName}`));
    return result;
  });

// Reusable pattern for external service calls with retry
export const externalServiceOperation = <T, E extends Error>(
  operation: () => Promise<T>,
  errorWrapper: (cause: unknown) => E,
  operationName: string,
  critical: boolean = false
) =>
  Effect.gen(function* (_) {
    yield* _(Effect.logInfo(`Starting external service: ${operationName}`));

    const schedule = critical
      ? retrySchedules.criticalExternalService
      : retrySchedules.externalService;

    const result = yield* _(
      Effect.tryPromise({
        try: operation,
        catch: errorWrapper,
      }).pipe(
        Effect.retry({
          schedule,
          while: (error: E) => isRetryableError(error.cause || error),
        }),
        Effect.tapError(error =>
          Effect.logWarning(
            `External service ${operationName} failed, retrying...`,
            {
              error: error.message,
              critical,
              attempt: 'retry',
            }
          )
        )
      )
    );

    yield* _(
      Effect.logInfo(
        `Successfully completed external service: ${operationName}`
      )
    );
    return result;
  });

// Reusable pattern for non-critical operations (notifications, etc) with graceful degradation
export const nonCriticalOperation = <T, E extends Error>(
  operation: () => Promise<T>,
  errorWrapper: (cause: unknown) => E,
  operationName: string
) =>
  Effect.gen(function* (_) {
    yield* _(
      Effect.logInfo(`Starting non-critical operation: ${operationName}`)
    );

    const result = yield* _(
      Effect.tryPromise({
        try: operation,
        catch: errorWrapper,
      }).pipe(
        Effect.retry({
          schedule: retrySchedules.nonCritical,
          while: (error: E) => isRetryableError(error.cause || error),
        }),
        Effect.tapError(error =>
          Effect.logWarning(
            `Non-critical operation ${operationName} failed, retrying...`,
            {
              error: error.message,
              attempt: 'retry',
            }
          )
        ),
        // Graceful degradation - don't fail the whole operation
        Effect.catchAll(error => {
          return Effect.gen(function* (_) {
            yield* _(
              Effect.logError(
                `Non-critical operation ${operationName} ultimately failed`,
                {
                  error: error.message,
                }
              )
            );
            return undefined as T; // Return undefined to continue
          });
        })
      )
    );

    if (result !== undefined) {
      yield* _(
        Effect.logInfo(
          `Successfully completed non-critical operation: ${operationName}`
        )
      );
    }

    return result;
  });

// Reusable pattern for non-critical database operations (like notifications)
// These get proper retry logic but don't fail the main operation if they ultimately fail
export const nonCriticalDbOperation = <T, E extends Error>(
  operation: () => Promise<T>,
  errorWrapper: (cause: unknown) => E,
  operationName: string
) =>
  Effect.gen(function* (_) {
    yield* _(
      Effect.logInfo(`Starting non-critical DB operation: ${operationName}`)
    );

    const result = yield* _(
      Effect.tryPromise({
        try: operation,
        catch: errorWrapper,
      }).pipe(
        Effect.retry({
          schedule: retrySchedules.database,
          while: (error: E) => isRetryableError(error.cause || error),
        }),
        Effect.tapError(error =>
          Effect.logWarning(
            `Non-critical DB operation ${operationName} failed, retrying...`,
            {
              error: error.message,
              attempt: 'retry',
            }
          )
        ),
        // Graceful degradation - don't fail the whole operation
        Effect.catchAll(error => {
          return Effect.gen(function* (_) {
            yield* _(
              Effect.logWarning(
                `Non-critical DB operation ${operationName} ultimately failed`,
                {
                  error: error.message,
                }
              )
            );
            return undefined as T; // Return undefined to continue
          });
        })
      )
    );

    if (result !== undefined) {
      yield* _(
        Effect.logInfo(
          `Successfully completed non-critical DB operation: ${operationName}`
        )
      );
    }

    return result;
  });

// Pattern for operations that should fail fast (business logic validation)
export const businessLogicOperation = <T, E extends Error>(
  operation: () => Promise<T>,
  errorWrapper: (cause: unknown) => E,
  operationName: string
) =>
  Effect.gen(function* (_) {
    yield* _(Effect.logInfo(`Executing business logic: ${operationName}`));

    const result = yield* _(
      Effect.tryPromise({
        try: operation,
        catch: errorWrapper,
      })
    );

    yield* _(Effect.logInfo(`Business logic completed: ${operationName}`));
    return result;
  });

// Helper for batch operations with controlled concurrency
export const batchOperation = <T, E extends Error>(
  items: Array<unknown>,
  operation: (item: unknown) => Effect.Effect<T, E, never>,
  operationName: string,
  concurrency: number = 3
) =>
  Effect.gen(function* (_) {
    yield* _(
      Effect.logInfo(
        `Starting batch operation: ${operationName} (${items.length} items)`
      )
    );

    const results = yield* _(
      Effect.all(items.map(operation), {
        concurrency,
        mode: 'default', // Fail if any item fails
      })
    );

    yield* _(
      Effect.logInfo(
        `Completed batch operation: ${operationName} (${results.length} results)`
      )
    );
    return results;
  });

// Helper for batch operations where individual failures are acceptable
export const batchOperationTolerant = <T, E extends Error>(
  items: Array<unknown>,
  operation: (item: unknown) => Effect.Effect<T, E, never>,
  operationName: string,
  concurrency: number = 3
) =>
  Effect.gen(function* (_) {
    yield* _(
      Effect.logInfo(
        `Starting tolerant batch operation: ${operationName} (${items.length} items)`
      )
    );

    const results = yield* _(
      Effect.all(
        items.map(item =>
          operation(item).pipe(
            Effect.catchAll(error => {
              return Effect.gen(function* (_) {
                yield* _(
                  Effect.logWarning(`Item failed in batch ${operationName}`, {
                    error: error.message,
                  })
                );
                return null as T;
              });
            })
          )
        ),
        { concurrency }
      )
    );

    const successful = results.filter(r => r !== null);
    const failed = results.length - successful.length;

    yield* _(
      Effect.logInfo(`Completed tolerant batch operation: ${operationName}`, {
        total: items.length,
        successful: successful.length,
        failed,
      })
    );

    return { successful, failed };
  });
