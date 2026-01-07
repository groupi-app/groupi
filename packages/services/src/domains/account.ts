import { Effect, Schedule } from 'effect';
import { getUserId } from './auth-helpers';
import { db } from '../infrastructure/db';
import { createEffectLoggerLayer } from '../infrastructure/logger';
import { resend } from '../infrastructure/email';
import type { ResultTuple } from '@groupi/schema';
import {
  GetAccountSettingsParams,
  CheckUsernameAvailabilityParams,
  UpdateAccountSettingsParams,
  UpdateProfileParams,
  UnlinkAccountParams,
  DeleteAccountParams,
} from '@groupi/schema/params';
import {
  AccountSettingsData,
  UsernameAvailabilityData,
} from '@groupi/schema/data';
import {
  NotFoundError,
  DatabaseError,
  ConnectionError,
  ConstraintError,
  ValidationError,
  OperationError,
  AuthenticationError,
  ConflictError,
  UnauthorizedError,
} from '@groupi/schema';
import { getPrismaError } from '../shared/errors';
import { updateUserAdmin, deleteUserAdmin } from './auth';
import { UTApi } from 'uploadthing/server';

const utapi = new UTApi();

// ============================================================================
// ACCOUNT DOMAIN SERVICES
// ============================================================================

/**
 * Fetch account settings data
 */
export const getAccountSettingsData = async (
  _params: GetAccountSettingsParams
): Promise<
  ResultTuple<
    | NotFoundError
    | DatabaseError
    | ConnectionError
    | AuthenticationError
    | ValidationError
    | ConstraintError
    | OperationError
    | UnauthorizedError
    | ConflictError,
    AccountSettingsData
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Fetching account settings', {
      userId,
    });

    // Fetch User data
    const user = yield* Effect.promise(() =>
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('User', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'getAccountSettingsData.fetchUser',
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    if (!user) {
      yield* Effect.fail(
        new NotFoundError({ message: 'User not found', cause: userId })
      );
      return;
    }

    // Fetch linked accounts
    const linkedAccountsRaw = yield* Effect.promise(() =>
      db.account.findMany({
        where: { userId },
        select: {
          id: true,
          providerId: true,
          accountId: true,
          accessToken: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Account', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'getAccountSettingsData.fetchAccounts',
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    // Fetch usernames/names for Discord and Google accounts
    const linkedAccounts = yield* Effect.all(
      linkedAccountsRaw.map(account =>
        Effect.gen(function* () {
          // Fetch username for Discord accounts with access token
          if (
            account.providerId.toLowerCase() === 'discord' &&
            account.accessToken
          ) {
            const result = yield* Effect.promise(() =>
              fetch('https://discord.com/api/users/@me', {
                headers: {
                  Authorization: `Bearer ${account.accessToken}`,
                },
              })
            ).pipe(
              Effect.flatMap(response =>
                response.ok
                  ? Effect.promise(() => response.json()).pipe(
                      Effect.map(userData => ({
                        id: account.id,
                        providerId: account.providerId,
                        accountId: account.accountId,
                        createdAt: account.createdAt,
                        username: userData.username || null,
                      }))
                    )
                  : Effect.succeed({
                      id: account.id,
                      providerId: account.providerId,
                      accountId: account.accountId,
                      createdAt: account.createdAt,
                      username: null,
                    })
              ),
              Effect.catchAll(() =>
                Effect.succeed({
                  id: account.id,
                  providerId: account.providerId,
                  accountId: account.accountId,
                  createdAt: account.createdAt,
                  username: null,
                })
              )
            );

            return result;
          }

          // Fetch name for Google accounts with access token
          if (
            account.providerId.toLowerCase() === 'google' &&
            account.accessToken
          ) {
            const result = yield* Effect.promise(() =>
              fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                  Authorization: `Bearer ${account.accessToken}`,
                },
              })
            ).pipe(
              Effect.flatMap(response =>
                response.ok
                  ? Effect.promise(() => response.json()).pipe(
                      Effect.map(userData => ({
                        id: account.id,
                        providerId: account.providerId,
                        accountId: account.accountId,
                        createdAt: account.createdAt,
                        username: userData.name || null,
                      }))
                    )
                  : Effect.succeed({
                      id: account.id,
                      providerId: account.providerId,
                      accountId: account.accountId,
                      createdAt: account.createdAt,
                      username: null,
                    })
              ),
              Effect.catchAll(() =>
                Effect.succeed({
                  id: account.id,
                  providerId: account.providerId,
                  accountId: account.accountId,
                  createdAt: account.createdAt,
                  username: null,
                })
              )
            );

            return result;
          }

          return {
            id: account.id,
            providerId: account.providerId,
            accountId: account.accountId,
            createdAt: account.createdAt,
            username: null,
          };
        })
      ),
      { concurrency: 5 }
    );

    yield* Effect.logDebug('Account settings fetched', {
      userId,
      linkedAccountCount: linkedAccounts.length,
    });

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      linkedAccounts,
    } satisfies AccountSettingsData;
  });

  return Effect.runPromise(
    effect.pipe(
      Effect.provide(createEffectLoggerLayer('account')),
      Effect.either,
      Effect.map(either =>
        either._tag === 'Left'
          ? ([either.left, undefined] as const)
          : ([null, either.right!] as const)
      )
    )
  );
};

/**
 * Check username availability
 */
export const checkUsernameAvailability = async (
  params: CheckUsernameAvailabilityParams
): Promise<
  ResultTuple<
    | DatabaseError
    | ConnectionError
    | ValidationError
    | NotFoundError
    | ConstraintError
    | OperationError
    | UnauthorizedError
    | ConflictError,
    UsernameAvailabilityData
  >
> => {
  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Checking username availability', {
      username: params.username,
    });

    // Check if username is already taken
    const existingUser = yield* Effect.promise(() =>
      db.user.findFirst({
        where: {
          username: {
            equals: params.username,
            mode: 'insensitive',
          },
        },
        select: { id: true },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('User', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'checkUsernameAvailability',
          username: params.username,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    const available = !existingUser;

    yield* Effect.logDebug('Username availability checked', {
      username: params.username,
      available,
    });

    return { available } satisfies UsernameAvailabilityData;
  });

  return Effect.runPromise(
    effect.pipe(
      Effect.provide(createEffectLoggerLayer('account')),
      Effect.either,
      Effect.map(either =>
        either._tag === 'Left'
          ? ([either.left, undefined] as const)
          : ([null, either.right!] as const)
      )
    )
  );
};

/**
 * Update account settings (username/email)
 * For email changes, sends verification email to original email
 */
export const updateAccountSettings = async (
  params: UpdateAccountSettingsParams
): Promise<
  ResultTuple<
    | NotFoundError
    | DatabaseError
    | ConnectionError
    | ConstraintError
    | ValidationError
    | OperationError
    | AuthenticationError
    | UnauthorizedError
    | ConflictError,
    { id: string }
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Updating account settings', {
      userId,
      hasUsername: !!params.username,
      hasEmail: !!params.email,
    });

    // Fetch current user data to check for email change
    const currentUser = yield* Effect.promise(() =>
      db.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('User', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'updateAccountSettings.fetchUser',
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    if (!currentUser) {
      yield* Effect.fail(
        new NotFoundError({ message: 'User not found', cause: userId })
      );
      return;
    }

    // If email is changing, send verification email to original email
    if (params.email && params.email !== currentUser.email) {
      yield* Effect.logInfo(
        'Email change detected, sending verification email',
        {
          userId,
          oldEmail: currentUser.email,
          newEmail: params.email,
        }
      );

      // Send verification email to original email
      const verificationUrl = `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/settings/account?emailVerification=true`;

      yield* Effect.promise(() =>
        resend.emails.send({
          from: 'Groupi <noreply@groupi.gg>',
          to: [currentUser.email],
          subject: 'Email Change Verification - Groupi',
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #2563eb;">Email Change Verification</h1>
                <p>You have requested to change your email address from <strong>${currentUser.email}</strong> to <strong>${params.email}</strong>.</p>
                <p>To verify this change, please click the button below:</p>
                <div style="margin: 30px 0;">
                  <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Verify Email Change
                  </a>
                </div>
                <p style="color: #666; font-size: 14px;">
                  If you didn't request this change, please contact support immediately.
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 40px;">
                  Or copy and paste this URL into your browser:<br/>
                  <span style="color: #666;">${verificationUrl}</span>
                </p>
              </body>
            </html>
          `,
        })
      ).pipe(
        Effect.tap(emailResult =>
          Effect.logInfo('Verification email sent', {
            userId,
            email: currentUser.email,
            emailId: emailResult.data?.id,
          })
        ),
        Effect.catchAll((error: unknown) =>
          Effect.logError('Failed to send verification email', {
            userId,
            email: currentUser.email,
            error: error instanceof Error ? error.message : String(error),
          })
        )
      );

      // For now, we'll update the email immediately
      // In a production system, you might want to require email verification first
      // by storing a pending email change and only applying it after verification
    }

    // Update user via admin function
    const [updateError, updateResult] = yield* Effect.promise(() =>
      updateUserAdmin({
        userId,
        username: params.username ?? undefined,
        email: params.email ?? undefined,
      })
    );

    if (updateError) {
      yield* Effect.fail(updateError);
      return;
    }

    if (!updateResult) {
      yield* Effect.fail(
        new OperationError({ message: 'Failed to update account settings' })
      );
      return;
    }

    yield* Effect.logInfo('Account settings updated', {
      userId,
      updatedFields: {
        username: params.username !== undefined,
        email: params.email !== undefined,
      },
    });

    return updateResult;
  });

  return Effect.runPromise(
    effect.pipe(
      Effect.provide(createEffectLoggerLayer('account')),
      Effect.either,
      Effect.map(either =>
        either._tag === 'Left'
          ? ([either.left, undefined] as const)
          : ([null, either.right!] as const)
      )
    )
  );
};

/**
 * Update user profile (name, image, imageKey, pronouns, bio)
 * Updates User record only
 */
export const updateProfile = async (
  params: UpdateProfileParams
): Promise<
  ResultTuple<
    | NotFoundError
    | DatabaseError
    | ConnectionError
    | ConstraintError
    | ValidationError
    | OperationError
    | AuthenticationError
    | UnauthorizedError
    | ConflictError,
    { id: string }
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Updating profile', {
      userId,
      hasName: params.name !== undefined,
      hasImage: params.image !== undefined,
      hasImageKey: params.imageKey !== undefined,
      hasPronouns: params.pronouns !== undefined,
      hasBio: params.bio !== undefined,
    });

    // Verify user exists
    const user = yield* Effect.promise(() =>
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('User', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'updateProfile.fetchUser',
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    if (!user) {
      yield* Effect.fail(
        new NotFoundError({ message: 'User not found', cause: userId })
      );
      return;
    }

    // Update user via admin function
    const [updateError, updateResult] = yield* Effect.promise(() =>
      updateUserAdmin({
        userId,
        name: params.name ?? undefined,
        image: params.image ?? undefined,
        imageKey: params.imageKey ?? undefined,
        pronouns: params.pronouns ?? undefined,
        bio: params.bio ?? undefined,
      })
    );

    if (updateError) {
      yield* Effect.fail(updateError);
      return;
    }

    if (!updateResult) {
      yield* Effect.fail(
        new OperationError({ message: 'Failed to update profile' })
      );
      return;
    }

    yield* Effect.logInfo('Profile updated', {
      userId,
      updatedFields: {
        name: params.name !== undefined,
        image: params.image !== undefined,
        imageKey: params.imageKey !== undefined,
        pronouns: params.pronouns !== undefined,
        bio: params.bio !== undefined,
      },
    });

    return updateResult;
  });

  return Effect.runPromise(
    effect.pipe(
      Effect.provide(createEffectLoggerLayer('account')),
      Effect.either,
      Effect.map(either =>
        either._tag === 'Left'
          ? ([either.left, undefined] as const)
          : ([null, either.right!] as const)
      )
    )
  );
};

/**
 * Unlink an OAuth account
 * Ensures user has at least one remaining auth method
 */
export const unlinkAccount = async (
  params: UnlinkAccountParams
): Promise<
  ResultTuple<
    | NotFoundError
    | DatabaseError
    | ConnectionError
    | OperationError
    | ValidationError
    | AuthenticationError
    | ConstraintError
    | UnauthorizedError
    | ConflictError,
    { message: string }
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Unlinking account', {
      userId,
      accountId: params.accountId,
    });

    // Fetch account to verify ownership
    const account = yield* Effect.promise(() =>
      db.account.findUnique({
        where: { id: params.accountId },
        select: {
          userId: true,
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Account', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'unlinkAccount.fetchAccount',
          userId,
          accountId: params.accountId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    if (!account) {
      yield* Effect.fail(
        new NotFoundError({
          message: 'Account not found',
          cause: params.accountId,
        })
      );
      return;
    }

    if (account.userId !== userId) {
      yield* Effect.fail(
        new ValidationError({
          message: 'Account does not belong to user',
        })
      );
      return;
    }

    // Count only OAuth accounts (exclude credential/providerId='credential')
    const oauthAccounts = yield* Effect.promise(() =>
      db.account.count({
        where: {
          userId,
          providerId: { not: 'credential' }, // Exclude credential accounts
        },
      })
    ).pipe(Effect.mapError((cause: Error) => getPrismaError('Account', cause)));

    // Check if user has email (magic link auth)
    const user = yield* Effect.promise(() =>
      db.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
        },
      })
    ).pipe(Effect.mapError((cause: Error) => getPrismaError('User', cause)));

    if (!user) {
      yield* Effect.fail(
        new NotFoundError({ message: 'User not found', cause: userId })
      );
      return;
    }

    // Calculate remaining auth methods after unlinking
    // Magic link is available if user has email
    const hasMagicLink = !!user.email;
    const remainingOAuthAccounts = oauthAccounts - 1;

    // Allow unlinking if:
    // 1. User has email (magic link available), OR
    // 2. At least one OAuth account will remain
    if (!hasMagicLink && remainingOAuthAccounts < 1) {
      yield* Effect.fail(
        new OperationError({
          message:
            'Cannot unlink account. You must have at least one authentication method.',
        })
      );
      return;
    }

    // Delete the account
    yield* Effect.promise(() =>
      db.account.delete({
        where: { id: params.accountId },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('Account', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'unlinkAccount.deleteAccount',
          userId,
          accountId: params.accountId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    yield* Effect.logInfo('Account unlinked', {
      userId,
      accountId: params.accountId,
    });

    return { message: 'Account unlinked successfully' };
  });

  return Effect.runPromise(
    effect.pipe(
      Effect.provide(createEffectLoggerLayer('account')),
      Effect.either,
      Effect.map(either =>
        either._tag === 'Left'
          ? ([either.left, undefined] as const)
          : ([null, either.right!] as const)
      )
    )
  );
};

/**
 * Delete user account
 * Deletes profile picture from UploadThing if imageKey exists
 */
export const deleteAccount = async (
  _params: DeleteAccountParams
): Promise<
  ResultTuple<
    | NotFoundError
    | DatabaseError
    | ConnectionError
    | AuthenticationError
    | ValidationError
    | ConstraintError
    | OperationError
    | UnauthorizedError
    | ConflictError,
    { message: string }
  >
> => {
  // Get auth outside Effect.gen so it's available in error handlers
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ] as const;
  }

  const effect = Effect.gen(function* () {
    yield* Effect.logDebug('Deleting account', {
      userId,
    });

    // Fetch user to get imageKey before deletion
    const user = yield* Effect.promise(() =>
      db.user.findUnique({
        where: { id: userId },
        select: {
          imageKey: true,
        },
      })
    ).pipe(
      Effect.mapError((cause: Error) => getPrismaError('User', cause)),
      Effect.tapError(error =>
        Effect.logError('Database operation encountered error', {
          operation: 'deleteAccount.fetchUser',
          userId,
          error: error.message,
          errorType: error.constructor.name,
          willRetry: error instanceof ConnectionError,
        })
      ),
      Effect.retry({
        schedule: Schedule.exponential(1000).pipe(
          Schedule.intersect(Schedule.recurs(3))
        ),
        while: error => error instanceof ConnectionError,
      })
    );

    if (!user) {
      yield* Effect.fail(
        new NotFoundError({ message: 'User not found', cause: userId })
      );
      return;
    }

    // Delete profile picture from UploadThing if imageKey exists
    if (user.imageKey) {
      yield* Effect.promise(() => utapi.deleteFiles(user.imageKey!)).pipe(
        Effect.tap(() =>
          Effect.logInfo('Profile picture deleted from UploadThing', {
            userId,
            imageKey: user.imageKey,
          })
        ),
        Effect.catchAll((error: unknown) =>
          Effect.logError('Failed to delete profile picture from UploadThing', {
            userId,
            imageKey: user.imageKey,
            error: error instanceof Error ? error.message : String(error),
          })
        )
      );
      // Continue with account deletion even if image deletion fails
    }

    // Delete user account via admin function
    const [deleteError, deleteResult] = yield* Effect.promise(() =>
      deleteUserAdmin({
        userId,
      })
    );

    if (deleteError) {
      yield* Effect.fail(deleteError);
      return;
    }

    if (!deleteResult) {
      yield* Effect.fail(
        new OperationError({ message: 'Failed to delete account' })
      );
      return;
    }

    yield* Effect.logInfo('Account deleted', {
      userId,
    });

    return { message: 'Account deleted successfully' };
  });

  return Effect.runPromise(
    effect.pipe(
      Effect.provide(createEffectLoggerLayer('account')),
      Effect.either,
      Effect.map(either =>
        either._tag === 'Left'
          ? ([either.left, undefined] as const)
          : ([null, either.right!] as const)
      )
    )
  );
};
