'use client';

import { useCallback } from 'react';

/**
 * Generate a unique trace ID for request correlation
 * Format: timestamp-random (e.g., "lq2x5k9-a7b3c2d")
 */
export function generateTraceId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Hook that provides trace ID generation utilities for user actions
 *
 * Usage:
 * ```typescript
 * const { generateTraceId, withTrace } = useTraceContext();
 *
 * // Generate a trace ID manually
 * const traceId = generateTraceId();
 *
 * // Or wrap an async action with automatic trace ID
 * await withTrace(async (traceId) => {
 *   console.log(`[${traceId}] Starting action`);
 *   await someAsyncAction({ _traceId: traceId });
 * });
 * ```
 */
export function useTraceContext() {
  const generate = useCallback(() => {
    return generateTraceId();
  }, []);

  /**
   * Wrap an async action with automatic trace ID generation and logging
   */
  const withTrace = useCallback(
    async <T>(
      action: (traceId: string) => Promise<T>,
      options?: { silent?: boolean }
    ): Promise<T> => {
      const traceId = generate();

      if (!options?.silent) {
        console.log(`[${traceId}] Starting traced action`);
      }

      try {
        const result = await action(traceId);
        if (!options?.silent) {
          console.log(`[${traceId}] Completed traced action`);
        }
        return result;
      } catch (error) {
        console.error(`[${traceId}] Failed traced action:`, error);
        throw error;
      }
    },
    [generate]
  );

  return {
    generateTraceId: generate,
    withTrace,
  };
}

export type TraceContext = ReturnType<typeof useTraceContext>;
