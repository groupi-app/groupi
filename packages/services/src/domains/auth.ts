import { Effect } from 'effect';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { createAuthMiddleware, APIError } from 'better-auth/api';
import {
  twoFactor,
  username,
  phoneNumber,
  magicLink,
  oneTap,
  admin,
  apiKey,
} from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { headers } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { createEffectLoggerLayer, authLogger } from '../infrastructure/logger';
import type { ResultTuple } from '@groupi/schema';
import { DatabaseError } from '@groupi/schema';

// ============================================================================
// BETTER AUTH INSTANCE
// ============================================================================

// Create a singleton Prisma client for auth
const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache session in cookie for 5 minutes to prevent flash
    },
  },
  user: {
    additionalFields: {
      imageKey: {
        type: 'string',
        required: false,
        input: false,
      },
      pronouns: {
        type: 'string',
        required: false,
        input: false,
      },
      bio: {
        type: 'string',
        required: false,
        input: false,
      },
    },
  },
  trustedOrigins: process.env.BETTER_AUTH_URL
    ? [process.env.BETTER_AUTH_URL]
    : ['http://localhost:3000'],
  plugins: [
    twoFactor(),
    username(),
    phoneNumber(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const isDevelopment = process.env.NODE_ENV === 'development';

        authLogger.info({ email, url }, 'Magic link generated');

        // In development, just log the magic link URL
        if (isDevelopment) {
          authLogger.info(
            `🔗 MAGIC LINK FOR DEVELOPMENT - Email: ${email} - URL: ${url}`
          );
          authLogger.info(
            'Copy this URL to your browser (expires in 5 minutes)'
          );
          return;
        }

        // In production, send email using Resend
        try {
          const resendApiKey = process.env.RESEND_API_KEY;
          if (!resendApiKey) {
            authLogger.warn(
              'RESEND_API_KEY not configured, magic link not sent'
            );
            return;
          }

          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: 'Groupi <noreply@groupi.gg>',
              to: [email],
              subject: 'Sign in to Groupi',
              html: `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  </head>
                  <body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #2563eb;">Sign in to Groupi</h1>
                    <p>Click the button below to sign in to your account:</p>
                    <div style="margin: 30px 0;">
                      <a href="${url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        Sign In
                      </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">
                      This link will expire in 5 minutes. If you didn't request this email, you can safely ignore it.
                    </p>
                    <p style="color: #999; font-size: 12px; margin-top: 40px;">
                      Or copy and paste this URL into your browser:<br/>
                      <span style="color: #666;">${url}</span>
                    </p>
                  </body>
                </html>
              `,
            }),
          });

          if (!response.ok) {
            const error = await response.text();
            authLogger.error({ error }, 'Failed to send magic link email');
          } else {
            authLogger.info({ email }, 'Magic link email sent successfully');
          }
        } catch (error) {
          authLogger.error({ error }, 'Error sending magic link email');
        }
      },
    }),
    oneTap({
      clientId: process.env.GOOGLE_CLIENT_ID!,
    }),
    admin(),
    apiKey(), // For API key authentication
    nextCookies(), // Must be last plugin - handles cookies in Server Actions/Components
  ],
  hooks: {
    after: createAuthMiddleware(async ctx => {
      // Create Person record on user creation (sign-up or OAuth)
      const newSession = ctx.context.newSession;
      if (newSession) {
        try {
          // Check if Person already exists
          const existingPerson = await prisma.person.findUnique({
            where: { id: newSession.user.id },
          });

          if (!existingPerson) {
            // Create Person record (just the ID for relationships)
            await prisma.person.create({
              data: {
                id: newSession.user.id,
              },
            });
            authLogger.info(
              {
                userId: newSession.user.id,
                method: ctx.path,
              },
              'Created Person record for user'
            );
          }
        } catch (error) {
          authLogger.error(
            { error: error as Error },
            'Failed to create Person record'
          );
        }
      }

      // No need to sync on update - User table has all the data

      // Delete Person record on user deletion (admin delete)
      if (ctx.path.startsWith('/admin/remove-user')) {
        const userId = ctx.context.body?.userId;
        if (userId) {
          try {
            // Delete Person record (will cascade delete related data)
            await prisma.person.delete({
              where: { id: userId },
            });
            authLogger.info(
              {
                userId,
              },
              'Deleted Person record for user'
            );
          } catch (error) {
            authLogger.error(
              { error: error as Error },
              'Failed to delete Person record'
            );
          }
        }
      }
    }),
  },
});

// ============================================================================
// CLIENT EXPORTS (for server-side use only)
// ============================================================================

// Note: Client auth utilities should be imported directly from 'better-auth/react'
// in client components to avoid server-side imports in the browser

// ============================================================================
// TYPES
// ============================================================================

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;

// ============================================================================
// AUTH DOMAIN SERVICES
// ============================================================================

/**
 * @deprecated Use getUserId() from './auth-helpers' instead
 * This wrapper function is kept for backwards compatibility but will be removed in a future version.
 *
 * Get the current user ID from session
 * Returns [null, null] if no session, [error, undefined] on API failure, [null, userId] on success
 */
export const getCurrentUserId = async (): Promise<
  ResultTuple<DatabaseError, string | null>
> => {
  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Getting current user ID');

    const requestHeadersValue = yield* Effect.tryPromise({
      try: async () => await headers(),
      catch: error =>
        new DatabaseError({
          message: 'Failed to get headers',
          cause: error instanceof Error ? error : new Error(String(error)),
        }),
    });

    const session = yield* Effect.promise(() =>
      auth.api.getSession({
        headers: requestHeadersValue,
      })
    ).pipe(
      Effect.mapError((cause: Error) => {
        if (cause instanceof APIError) {
          return new DatabaseError({
            message: `Auth API Error: ${cause.message}`,
            cause,
          });
        }
        return new DatabaseError({ message: 'Failed to get session', cause });
      })
    );

    if (!session?.user?.id) {
      yield* Effect.logInfo('No active session found', {
        operation: 'getCurrentUserId',
      });
      return null;
    }

    yield* Effect.logDebug('Successfully retrieved user ID', {
      userId: session.user.id,
    });

    return session.user.id;
  });

  return Effect.runPromise(
    effect.pipe(
      Effect.provide(createEffectLoggerLayer('auth')),
      Effect.either,
      Effect.map(either =>
        either._tag === 'Left'
          ? ([either.left, undefined] as const)
          : ([null, either.right] as const)
      )
    )
  );
};

/**
 * @deprecated Use getSession() from './auth-helpers' instead
 * This wrapper function is kept for backwards compatibility but will be removed in a future version.
 *
 * Get the current session
 * Returns [null, null] if no session, [error, undefined] on API failure, [null, session] on success
 */
export const getCurrentSession = async (): Promise<
  ResultTuple<DatabaseError, Session | null>
> => {
  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Getting current session');

    const requestHeadersValue = yield* Effect.tryPromise({
      try: async () => await headers(),
      catch: error =>
        new DatabaseError({
          message: 'Failed to get headers',
          cause: error instanceof Error ? error : new Error(String(error)),
        }),
    });

    const session = yield* Effect.promise(() =>
      auth.api.getSession({
        headers: requestHeadersValue,
      })
    ).pipe(
      Effect.mapError((cause: Error) => {
        if (cause instanceof APIError) {
          return new DatabaseError({
            message: `Auth API Error: ${cause.message}`,
            cause,
          });
        }
        return new DatabaseError({ message: 'Failed to get session', cause });
      })
    );

    if (!session?.user) {
      yield* Effect.logInfo('No active session found', {
        operation: 'getCurrentSession',
      });
      return null;
    }

    yield* Effect.logDebug('Successfully retrieved session', {
      userId: session.user.id,
      userEmail: session.user.email,
    });

    return session;
  });

  return Effect.runPromise(
    effect.pipe(
      Effect.provide(createEffectLoggerLayer('auth')),
      Effect.either,
      Effect.map(either =>
        either._tag === 'Left'
          ? ([either.left, undefined] as const)
          : ([null, either.right] as const)
      )
    )
  );
};

/**
 * Legacy compatibility function that mimics Clerk's auth() return format
 * @deprecated Use getUserId() from './auth-helpers' instead
 */
export const getLegacyAuth = async () => {
  const { getUserId } = await import('./auth-helpers');
  const [error, userId] = await getUserId();
  return {
    userId: error || !userId ? null : userId,
  };
};

// ============================================================================
// ADMIN OPERATIONS (direct User + Person table management)
// ============================================================================

/**
 * Create a new user (admin operation)
 * Creates both User (auth) and Person (app data) records
 */
export const createUserAdmin = async (params: {
  name: string;
  email: string;
  username?: string;
  image?: string;
  role?: string;
}): Promise<ResultTuple<DatabaseError, { id: string }>> => {
  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Creating user and person records', {
      email: params.email,
      username: params.username,
      role: params.role,
    });

    // Create User record first
    const user = yield* Effect.promise(() =>
      prisma.user.create({
        data: {
          name: params.name,
          email: params.email,
          username: params.username || null,
          displayUsername: params.username || null,
          role: params.role || 'user',
          image: params.image || null,
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => {
        return new DatabaseError({ message: 'Failed to create user', cause });
      })
    );

    // Create matching Person record (just the ID for relationships)
    yield* Effect.promise(() =>
      prisma.person.create({
        data: {
          id: user.id,
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => {
        return new DatabaseError({
          message: 'Failed to create person record',
          cause,
        });
      })
    );

    yield* Effect.logInfo('User and person created', {
      userId: user.id,
      email: params.email,
      username: params.username,
    });

    return { id: user.id };
  });

  return Effect.runPromise(
    effect.pipe(
      Effect.provide(createEffectLoggerLayer('auth')),
      Effect.either,
      Effect.map(either =>
        either._tag === 'Left'
          ? ([either.left, undefined] as const)
          : ([null, either.right] as const)
      )
    )
  );
};

/**
 * Update a user (admin operation)
 * Updates User record only (no Person sync needed)
 */
export const updateUserAdmin = async (params: {
  userId: string;
  name?: string;
  email?: string;
  username?: string;
  role?: string;
  image?: string;
  imageKey?: string;
  pronouns?: string;
  bio?: string;
}): Promise<ResultTuple<DatabaseError, { id: string }>> => {
  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Updating user record', {
      userId: params.userId,
    });

    // Build update data
    const updateData: {
      name?: string | null;
      email?: string;
      username?: string | null;
      displayUsername?: string | null;
      role?: string | null;
      image?: string | null;
      imageKey?: string | null;
      pronouns?: string | null;
      bio?: string | null;
    } = {};
    if (params.name !== undefined) updateData.name = params.name;
    if (params.email !== undefined) updateData.email = params.email;
    if (params.username !== undefined) {
      updateData.username = params.username;
      updateData.displayUsername = params.username; // Keep them in sync
    }
    if (params.role !== undefined) updateData.role = params.role;
    if (params.image !== undefined) updateData.image = params.image;
    if (params.imageKey !== undefined) updateData.imageKey = params.imageKey;
    if (params.pronouns !== undefined) updateData.pronouns = params.pronouns;
    if (params.bio !== undefined) updateData.bio = params.bio;

    // Update User record
    yield* Effect.promise(() =>
      prisma.user.update({
        where: { id: params.userId },
        data: updateData,
      })
    ).pipe(
      Effect.mapError((cause: Error) => {
        return new DatabaseError({ message: 'Failed to update user', cause });
      })
    );

    yield* Effect.logInfo('User updated', {
      userId: params.userId,
    });

    return { id: params.userId };
  });

  return Effect.runPromise(
    effect.pipe(
      Effect.provide(createEffectLoggerLayer('auth')),
      Effect.either,
      Effect.map(either =>
        either._tag === 'Left'
          ? ([either.left, undefined] as const)
          : ([null, either.right] as const)
      )
    )
  );
};

/**
 * Delete a user (admin operation)
 * Deletes User record, Person deletion cascades automatically
 */
export const deleteUserAdmin = async (params: {
  userId: string;
}): Promise<ResultTuple<DatabaseError, { message: string }>> => {
  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Deleting user and person records', {
      userId: params.userId,
    });

    // Delete Person record first (cascade deletes memberships, posts, etc.)
    yield* Effect.promise(() =>
      prisma.person.delete({
        where: { id: params.userId },
      })
    ).pipe(
      Effect.mapError((cause: Error) => {
        return new DatabaseError({
          message: 'Failed to delete person record',
          cause,
        });
      })
    );

    // Delete User record
    yield* Effect.promise(() =>
      prisma.user.delete({
        where: { id: params.userId },
      })
    ).pipe(
      Effect.mapError((cause: Error) => {
        return new DatabaseError({ message: 'Failed to delete user', cause });
      })
    );

    yield* Effect.logInfo('User and person deleted', {
      userId: params.userId,
    });

    return { message: 'User deleted successfully' };
  });

  return Effect.runPromise(
    effect.pipe(
      Effect.provide(createEffectLoggerLayer('auth')),
      Effect.either,
      Effect.map(either =>
        either._tag === 'Left'
          ? ([either.left, undefined] as const)
          : ([null, either.right] as const)
      )
    )
  );
};
