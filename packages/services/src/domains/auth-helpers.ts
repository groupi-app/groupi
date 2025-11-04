import { auth, type Session } from './auth';
import { headers } from 'next/headers';
import type { ResultTuple } from '@groupi/schema';
import { AuthenticationError } from '@groupi/schema';

/**
 * Get current user ID - for Server Components ONLY
 * NO caching in helper - components should use 'use cache: private' themselves
 * Components calling this must be wrapped in Suspense boundaries.
 *
 * @returns [error, userId] tuple. Returns [null, null] if no session, [error, undefined] on failure
 */
export async function getUserId(): Promise<
  ResultTuple<AuthenticationError, string | null>
> {
  try {
    const headersToUse = await headers();
    const session = await auth.api.getSession({ headers: headersToUse });

    if (!session?.user?.id) {
      return [null, null];
    }

    return [null, session.user.id];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return [
      new AuthenticationError({
        message: `Failed to get session: ${errorMessage}`,
        cause: error instanceof Error ? error : new Error(String(error)),
      }),
      undefined,
    ];
  }
}

/**
 * Get current user ID - for Route Handlers ONLY
 * No caching to avoid hanging promises in Route Handlers
 *
 * @returns [error, userId] tuple. Returns [null, null] if no session, [error, undefined] on failure
 */
export async function getUserIdUncached(): Promise<
  ResultTuple<AuthenticationError, string | null>
> {
  try {
    // Route handlers can use headers() directly (no prerendering)
    const headersToUse = await headers();
    const session = await auth.api.getSession({ headers: headersToUse });

    if (!session?.user?.id) {
      return [null, null];
    }

    return [null, session.user.id];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return [
      new AuthenticationError({
        message: `Failed to get session: ${errorMessage}`,
        cause: error instanceof Error ? error : new Error(String(error)),
      }),
      undefined,
    ];
  }
}

/**
 * Get current session - for Server Components ONLY
 * NO caching in helper - components should use 'use cache: private' themselves
 * Components calling this must be wrapped in Suspense boundaries.
 *
 * @returns [error, session] tuple. Returns [null, null] if no session, [error, undefined] on failure
 */
export async function getSession(): Promise<
  ResultTuple<AuthenticationError, Session | null>
> {
  try {
    const headersToUse = await headers();
    const session = await auth.api.getSession({ headers: headersToUse });

    if (!session) {
      return [null, null];
    }

    return [null, session];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return [
      new AuthenticationError({
        message: `Failed to get session: ${errorMessage}`,
        cause: error instanceof Error ? error : new Error(String(error)),
      }),
      undefined,
    ];
  }
}

/**
 * Get current session - for Route Handlers ONLY
 * No caching to avoid hanging promises in Route Handlers
 *
 * @returns [error, session] tuple. Returns [null, null] if no session, [error, undefined] on failure
 */
export async function getSessionUncached(): Promise<
  ResultTuple<AuthenticationError, Session | null>
> {
  try {
    // Route handlers can use headers() directly (no prerendering)
    const headersToUse = await headers();
    const session = await auth.api.getSession({ headers: headersToUse });

    if (!session) {
      return [null, null];
    }

    return [null, session];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return [
      new AuthenticationError({
        message: `Failed to get session: ${errorMessage}`,
        cause: error instanceof Error ? error : new Error(String(error)),
      }),
      undefined,
    ];
  }
}
