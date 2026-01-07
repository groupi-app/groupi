'use server';

import { headers } from 'next/headers';
import { runWithContextAsync } from '@groupi/services/request-context';

/**
 * Server Action Trace Helper
 *
 * Wraps server action logic with request tracing context.
 * All logs within the wrapped function will include the same traceId.
 *
 * Usage:
 *   export async function myAction(input: Input) {
 *     return withActionTrace('myAction', async () => {
 *       // action logic here - all logs will have traceId
 *     });
 *   }
 *
 * In Grafana Loki, filter by traceId to see the full request flow:
 *   {service="groupi"} | json | traceId="abc123"
 */
export async function withActionTrace<T>(
  actionName: string,
  fn: () => Promise<T>
): Promise<T> {
  const headersList = await headers();
  const traceId = headersList.get('x-trace-id') || undefined;

  return runWithContextAsync({ traceId, path: `/actions/${actionName}` }, fn);
}
