'use client';

import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { FunctionReference } from 'convex/server';
import { generateTraceId } from './use-trace-context';

/**
 * A wrapper around useMutation that automatically includes trace IDs
 *
 * This hook:
 * 1. Generates a unique trace ID for each mutation call
 * 2. Logs the trace ID to console for debugging
 * 3. Injects the trace ID into the mutation arguments
 *
 * Usage:
 * ```typescript
 * // Instead of:
 * const createEvent = useMutation(api.events.mutations.createEvent);
 *
 * // Use:
 * const createEvent = useTracedMutation(api.events.mutations.createEvent);
 *
 * // Then call normally (trace ID is auto-injected):
 * await createEvent({ title: "My Event" });
 * ```
 */
export function useTracedMutation<Args extends Record<string, unknown>, Result>(
  mutationRef: FunctionReference<
    'mutation',
    'public',
    Args & { _traceId?: string },
    Result
  >
) {
  const mutation = useMutation(mutationRef);

  const tracedMutation = useCallback(
    async (args: Omit<Args, '_traceId'>): Promise<Result> => {
      const traceId = generateTraceId();

      if (process.env.NODE_ENV === 'development') {
        console.log(`[${traceId}] Calling mutation`);
      }

      try {
        // Type cast required due to generic constraint limitations with Convex mutation types
        const result = await mutation({
          ...args,
          _traceId: traceId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        if (process.env.NODE_ENV === 'development') {
          console.log(`[${traceId}] Mutation completed successfully`);
        }

        return result;
      } catch (error) {
        console.error(`[${traceId}] Mutation failed:`, error);
        throw error;
      }
    },
    [mutation]
  );

  return tracedMutation;
}

/**
 * Hook that returns both the traced mutation and the raw mutation
 * Useful when you need to pass trace ID manually or skip tracing
 */
export function useTracedMutationWithRaw<
  Args extends Record<string, unknown>,
  Result,
>(
  mutationRef: FunctionReference<
    'mutation',
    'public',
    Args & { _traceId?: string },
    Result
  >
) {
  const rawMutation = useMutation(mutationRef);
  const tracedMutation = useTracedMutation(mutationRef);

  return {
    traced: tracedMutation,
    raw: rawMutation,
    generateTraceId,
  };
}
