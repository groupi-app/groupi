import { Schedule } from 'effect';

/**
 * Standard retry patterns for different operation types
 */

// Database operations - exponential backoff with 3 retries
export const databaseRetrySchedule = Schedule.exponential('1 second').pipe(
  Schedule.intersect(Schedule.recurs(3))
);

// External services - exponential backoff with 2 retries
export const externalServiceRetrySchedule = Schedule.exponential(
  '1 second'
).pipe(Schedule.intersect(Schedule.recurs(2)));

// Quick operations - linear backoff with 1 retry
export const quickRetrySchedule = Schedule.linear('500 millis').pipe(
  Schedule.intersect(Schedule.recurs(1))
);
