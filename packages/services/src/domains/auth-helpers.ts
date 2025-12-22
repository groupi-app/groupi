import { auth, type Session } from './auth';
import { headers } from 'next/headers';
import type { ResultTuple } from '@groupi/schema';
import { AuthenticationError, DatabaseError } from '@groupi/schema';
import { db } from '../infrastructure/db';

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

/**
 * Check if user needs onboarding (missing username)
 * Returns: [error, needsOnboarding] tuple
 */
export async function needsOnboarding(): Promise<
  ResultTuple<AuthenticationError | DatabaseError, boolean>
> {
  try {
    const [authError, session] = await getSession();

    if (authError || !session) {
      return [
        authError || new AuthenticationError({ message: 'Not authenticated' }),
        undefined,
      ];
    }

    // Check if user has a username
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { username: true },
    });

    if (!user) {
      return [new DatabaseError({ message: 'User not found' }), undefined];
    }

    // User needs onboarding if they don't have a username
    return [null, !user.username];
  } catch (error) {
    return [
      new DatabaseError({
        message: `Failed to check onboarding status: ${error instanceof Error ? error.message : String(error)}`,
        cause: error instanceof Error ? error : new Error(String(error)),
      }),
      undefined,
    ];
  }
}
