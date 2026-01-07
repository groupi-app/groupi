import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';

/**
 * Request Context for Transaction Tracing
 *
 * Uses AsyncLocalStorage to propagate a trace ID through the entire request lifecycle.
 * All logs within a request will include the same traceId, making it easy to:
 * - Filter logs in Grafana Loki by traceId to see a single transaction
 * - Correlate logs across different services/modules
 * - Debug issues by following the complete request flow
 *
 * Usage in Grafana:
 *   {service="groupi"} | json | traceId="abc123"
 */

export interface RequestContext {
  /** Unique identifier for this request/transaction */
  traceId: string;
  /** Optional user ID if authenticated */
  userId?: string;
  /** Request start time for duration tracking */
  startTime: number;
  /** Optional request path for context */
  path?: string;
}

// AsyncLocalStorage instance for request context
const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Generate a short, readable trace ID
 * Format: first 8 chars of UUID (e.g., "a1b2c3d4")
 */
export function generateTraceId(): string {
  return randomUUID().split('-')[0];
}

/**
 * Run a function within a request context
 * All code executed within the callback will have access to the trace ID
 */
export function runWithContext<T>(
  context: Partial<RequestContext> & { traceId?: string },
  fn: () => T
): T {
  const fullContext: RequestContext = {
    traceId: context.traceId || generateTraceId(),
    userId: context.userId,
    startTime: context.startTime || Date.now(),
    path: context.path,
  };

  return requestContextStorage.run(fullContext, fn);
}

/**
 * Run an async function within a request context
 */
export function runWithContextAsync<T>(
  context: Partial<RequestContext> & { traceId?: string },
  fn: () => Promise<T>
): Promise<T> {
  const fullContext: RequestContext = {
    traceId: context.traceId || generateTraceId(),
    userId: context.userId,
    startTime: context.startTime || Date.now(),
    path: context.path,
  };

  return requestContextStorage.run(fullContext, fn);
}

/**
 * Get the current request context
 * Returns undefined if not within a request context
 */
export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

/**
 * Get the current trace ID
 * Returns undefined if not within a request context
 */
export function getTraceId(): string | undefined {
  return getRequestContext()?.traceId;
}

/**
 * Update the current request context (e.g., to add userId after auth)
 */
export function updateRequestContext(
  updates: Partial<Omit<RequestContext, 'traceId' | 'startTime'>>
): void {
  const current = getRequestContext();
  if (current) {
    Object.assign(current, updates);
  }
}

/**
 * Get duration since request started in milliseconds
 */
export function getRequestDuration(): number | undefined {
  const context = getRequestContext();
  if (!context) return undefined;
  return Date.now() - context.startTime;
}
