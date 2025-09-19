import { Schedule } from 'effect';

// Standardized retry schedules for different operation types
export const retrySchedules = {
  // Database operations: 3 retries, exponential backoff up to 2 seconds
  database: Schedule.exponential(100).pipe(
    Schedule.intersect(Schedule.recurs(3)),
    Schedule.intersect(Schedule.spaced('2 seconds'))
  ),

  // External services: 2 retries, exponential backoff up to 5 seconds
  externalService: Schedule.exponential(500).pipe(
    Schedule.intersect(Schedule.recurs(2)),
    Schedule.intersect(Schedule.spaced('5 seconds'))
  ),

  // Critical external services: 3 retries, longer backoff
  criticalExternalService: Schedule.exponential(1000).pipe(
    Schedule.intersect(Schedule.recurs(3)),
    Schedule.intersect(Schedule.spaced('10 seconds'))
  ),

  // Non-critical operations: 1 retry, short backoff
  nonCritical: Schedule.exponential(200).pipe(
    Schedule.intersect(Schedule.recurs(1)),
    Schedule.intersect(Schedule.spaced('1 second'))
  ),
};

// Helper to determine if an error is retryable (infrastructure/transient)
export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      // Database/connection errors
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('temporary') ||
      message.includes('rate limit') ||
      message.includes('connection pool') ||
      message.includes('deadlock') ||
      // Prisma specific errors
      (error as { code?: string }).code === 'P1001' || // Connection error
      (error as { code?: string }).code === 'P1008' || // Timeout
      (error as { code?: string }).code === 'P1017' || // Server closed connection
      (error as { code?: string }).code === 'P2024' || // Connection pool timeout
      // HTTP/Network errors
      message.includes('econnreset') ||
      message.includes('enotfound') ||
      message.includes('socket hang up') ||
      // Service-specific rate limits
      message.includes('rate limited') ||
      message.includes('too many requests')
    );
  }
  return false;
};

// Helper to determine if an error is a business logic error (should NOT retry)
export const isBusinessLogicError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const tag = (error as { _tag?: string })._tag;
    return (
      // Not found errors
      tag?.includes('NotFound') ||
      tag?.includes('Unauthorized') ||
      tag?.includes('UserNotMember') ||
      tag?.includes('ValidationError') ||
      // Permission errors
      error.message.includes('not authorized') ||
      error.message.includes('permission denied') ||
      error.message.includes('not a member') ||
      error.message.includes('invalid input')
    );
  }
  return false;
};

// Helper to categorize errors for different retry strategies
export const getRetrySchedule = (
  error: unknown,
  operationType:
    | 'database'
    | 'externalService'
    | 'criticalExternalService'
    | 'nonCritical' = 'database'
) => {
  if (isBusinessLogicError(error)) {
    return null; // Don't retry business logic errors
  }

  if (isRetryableError(error)) {
    return retrySchedules[operationType];
  }

  return null; // Don't retry unknown errors
};
