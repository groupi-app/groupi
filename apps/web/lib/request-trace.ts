import { headers } from 'next/headers';
import {
  runWithContextAsync,
  generateTraceId,
  getTraceId as getStoredTraceId,
} from '@groupi/services/request-context';

/**
 * Request Trace Helper for Server Components
 *
 * Reads the trace ID from the middleware-injected header and sets up AsyncLocalStorage.
 * All logs within the context will automatically include the trace ID.
 *
 * Usage in a server component:
 *   const data = await withRequestTrace(async () => {
 *     // All logs here will have the same traceId
 *     return fetchData();
 *   });
 *
 * Usage in Grafana to see all logs for one request:
 *   {service="groupi"} | json | traceId="abc123"
 */

/**
 * Get the trace ID from the request header (set by middleware)
 */
export async function getTraceIdFromHeader(): Promise<string> {
  try {
    const headersList = await headers();
    return headersList.get('x-trace-id') || generateTraceId();
  } catch {
    // headers() can fail if called outside request context (e.g., during build)
    return generateTraceId();
  }
}

/**
 * Get the current trace ID - either from AsyncLocalStorage or generate new
 */
export function getTraceId(): string | undefined {
  return getStoredTraceId();
}

/**
 * Wrap an async function with request tracing context
 * All logs within the callback will include the same traceId
 */
export async function withRequestTrace<T>(
  fn: () => Promise<T>,
  options?: { path?: string; userId?: string }
): Promise<T> {
  const traceId = await getTraceIdFromHeader();

  return runWithContextAsync(
    {
      traceId,
      path: options?.path,
      userId: options?.userId,
    },
    fn
  );
}
