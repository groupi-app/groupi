import { z } from 'zod';
import type { ResultTuple } from '@groupi/schema';
import { ValidationError } from '@groupi/schema';

/**
 * Safe wrapper function that provides type-safe error handling and validation
 */
export function safeWrapper<Args extends unknown[], T, E extends Error>(
  fn: (...args: Args) => Promise<T>,
  schema: z.ZodSchema<T>
): (...args: Args) => Promise<ResultTuple<E | ValidationError, T>> {
  return async (
    ...args: Args
  ): Promise<ResultTuple<E | ValidationError, T>> => {
    try {
      const result = await fn(...args);
      const parsed = schema.parse(result);
      return [null, parsed];
    } catch (err) {
      if (err instanceof z.ZodError) {
        return [
          new ValidationError(`Validation failed: ${err.message}`),
          undefined,
        ];
      }
      return [err as E, undefined];
    }
  };
}
