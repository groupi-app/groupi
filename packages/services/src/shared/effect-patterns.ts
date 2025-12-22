import { Effect, Schedule } from 'effect';

/**
 * Standard database operation with retry logic
 */
export const dbOperation = <T>(
  operation: () => Promise<T>,
  errorMapper: (cause: unknown) => Error,
  _description: string
) =>
  Effect.promise(operation).pipe(
    Effect.mapError(errorMapper),
    Effect.tapError(error =>
      Effect.logError('Database operation encountered error', {
        operation: _description,
        error: error.message,
        errorType: error.constructor.name,
        willRetry: true,
      })
    ),
    Effect.retry({
      schedule: Schedule.exponential(1000).pipe(
        Schedule.intersect(Schedule.recurs(3))
      ),
      while: () => true, // Retry all database errors
    })
  );

/**
 * External service operation with retry and graceful degradation
 */
export const externalServiceOperation = <T>(
  operation: () => Promise<T>,
  errorMapper: (cause: unknown) => Error,
  _description: string
) =>
  Effect.promise(operation).pipe(
    Effect.mapError(errorMapper),
    Effect.tapError(error =>
      Effect.logError('External service operation encountered error', {
        operation: _description,
        error: error.message,
        errorType: error.constructor.name,
        willRetry: true,
      })
    ),
    Effect.retry({
      schedule: Schedule.exponential(1000).pipe(
        Schedule.intersect(Schedule.recurs(2))
      ),
      while: () => true, // Retry external service errors
    }),
    Effect.catchAll(() => Effect.succeed(undefined as T)) // Graceful degradation
  );

/**
 * Business logic operation (no retry)
 */
export const businessLogicOperation = <T>(
  operation: () => T,
  errorMapper: (cause: unknown) => Error,
  _description: string
) =>
  Effect.try({
    try: operation,
    catch: errorMapper,
  });
