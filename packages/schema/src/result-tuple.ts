import { z } from 'zod';

// ============================================================================
// RESULT TUPLE UTILITY
// ============================================================================

/**
 * Creates a discriminated union that ensures exactly one of error OR data is present
 * This prevents invalid states like [null, undefined] or [error, data]
 *
 * @param errorSchema - Zod schema for the error type
 * @param dataSchema - Zod schema for the data type
 * @returns Discriminated union schema for [Error, undefined] | [null, Data]
 */
export function createResultTuple<
  TError extends z.ZodTypeAny,
  TData extends z.ZodTypeAny,
>(errorSchema: TError, dataSchema: TData) {
  return z.union([
    z.tuple([errorSchema, z.undefined()]),
    z.tuple([z.null(), dataSchema]),
  ]);
}

/**
 * Type helper for result tuples
 */
export type ResultTuple<TError, TData> = [TError, undefined] | [null, TData];

// ============================================================================
// SUCCESS/ERROR HELPERS
// ============================================================================

/**
 * Creates a success result tuple
 */
export function success<TData>(data: TData): [null, TData] {
  return [null, data];
}

/**
 * Creates an error result tuple
 */
export function error<TError>(error: TError): [TError, undefined] {
  return [error, undefined];
}

/**
 * Type guard to check if result is successful
 */
export function isSuccess<TError, TData>(
  result: ResultTuple<TError, TData>
): result is [null, TData] {
  return result[0] === null;
}

/**
 * Type guard to check if result is an error
 */
export function isError<TError, TData>(
  result: ResultTuple<TError, TData>
): result is [TError, undefined] {
  return result[0] !== null;
}

// ============================================================================
// SERIALIZATION FOR SERVER COMPONENT CACHING
// ============================================================================

/**
 * Serialized error type that only contains the tag for cache safety
 * Strips message, cause, and other details that may not be serializable
 */
export type SerializedError = { _tag: string };

/**
 * Serializes a result tuple for server component caching
 * - Strips error details (keeping only the tag)
 * - Converts Date objects to ISO strings for cache safety
 *
 * This ensures the result tuple can be safely cached by Next.js server components
 * without serialization issues from Date objects or complex error objects.
 */
export function serializeResultTuple<TError extends { _tag: string }, TData>([
  err,
  data,
]: ResultTuple<TError, TData>): ResultTuple<SerializedError, TData> {
  if (err) {
    // Strip error details, keep only the tag for cache safety
    return [{ _tag: err._tag }, undefined];
  }

  // Convert Date → ISO for server component cache safety
  const serializedData = JSON.parse(
    JSON.stringify(data, (_, value) =>
      value instanceof Date ? value.toISOString() : value
    )
  ) as TData;

  return [null, serializedData];
}
