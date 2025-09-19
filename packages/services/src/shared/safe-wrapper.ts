import { z, ZodSchema, ZodError } from 'zod';
import { ResultTuple, success, error } from '@groupi/schema';
import { ValidationError } from './errors';

/**
 * A safe wrapper that combines error handling with Zod schema validation
 * while preserving custom error types
 *
 * @template Args - Function argument types as tuple
 * @template Raw - Raw return type from the function
 * @template Parsed - Parsed/validated return type from Zod schema
 * @template CustomErrors - Custom error types that can be thrown
 *
 * @param fn - The async function to wrap
 * @param schema - Zod schema to validate the return value
 * @returns A function that returns [CustomErrors | ValidationError, null] | [null, Parsed] tuple
 *
 * @example
 * // With explicit types for Effect functions
 * const getEventData = safeWrapper<
 *   [string, string],
 *   any,
 *   PDTData,
 *   AvailabilityNotFoundError | AvailabilityEventNotFoundError | AvailabilityUserNotMemberError
 * >(
 *   async (eventId: string, userId: string) =>
 *     Effect.runPromise(getEventPotentialDateTimesEffect(eventId, userId)),
 *   PDTDataSchema
 * );
 *
 * const [error, data] = await getEventData("123", "456");
 * if (error) {
 *   if (error instanceof AvailabilityNotFoundError) { ... }
 *   else if (error instanceof ValidationError) { ... }
 * } else {
 *   // error is null, data is properly typed as PDTData
 * }
 */
export function safeWrapper<
  Args extends any[],
  Parsed,
  CustomErrors extends Error = never,
>(
  fn: (...args: Args) => Promise<Parsed>,
  schema: ZodSchema<Parsed>
): (
  ...args: Args
) => Promise<ResultTuple<Parsed, CustomErrors | ValidationError>> {
  return async (
    ...args: Args
  ): Promise<ResultTuple<Parsed, CustomErrors | ValidationError>> => {
    try {
      const raw = await fn(...args);
      const parsed = schema.parse(raw);
      return success(parsed);
    } catch (err) {
      // Preserve custom error types, wrap Zod errors as ValidationError
      const wrappedError =
        err instanceof ZodError
          ? new ValidationError('Validation failed: ' + err.message)
          : err instanceof Error
            ? (err as CustomErrors | ValidationError)
            : new ValidationError(String(err));
      return error(wrappedError);
    }
  };
}

/**
 * Synchronous version of safeWrapper for non-async functions
 */
export function safeWrapperSync<
  Args extends any[],
  Raw,
  Parsed,
  CustomErrors extends Error = never,
>(
  fn: (...args: Args) => Raw,
  schema: ZodSchema<Parsed>
): (...args: Args) => ResultTuple<Parsed, CustomErrors | ValidationError> {
  return (
    ...args: Args
  ): ResultTuple<Parsed, CustomErrors | ValidationError> => {
    try {
      const raw = fn(...args);
      const parsed = schema.parse(raw);
      return success(parsed);
    } catch (err) {
      const wrappedError =
        err instanceof ZodError
          ? new ValidationError('Validation failed: ' + err.message)
          : err instanceof Error
            ? (err as CustomErrors | ValidationError)
            : new ValidationError(String(err));
      return error(wrappedError);
    }
  };
}
