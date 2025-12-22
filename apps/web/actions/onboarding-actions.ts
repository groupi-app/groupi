'use server';

import { updateTag } from 'next/cache';
import { updateAccountSettings, updateProfile } from '@groupi/services';
import { getUserId } from '@groupi/services/server';
import type { ResultTuple } from '@groupi/schema';
import type {
  NotFoundError,
  UnauthorizedError,
  DatabaseError,
  ValidationError,
  ConnectionError,
  ConstraintError,
  OperationError,
  ConflictError,
} from '@groupi/schema';
import { AuthenticationError } from '@groupi/schema';
import type {
  UpdateAccountSettingsParams,
  UpdateProfileParams,
} from '@groupi/schema/params';
import { createLogger } from '@/lib/logger';

const logger = createLogger('onboarding-actions');

// ============================================================================
// ONBOARDING ACTIONS
// ============================================================================

type OnboardingMutationError =
  | NotFoundError
  | UnauthorizedError
  | DatabaseError
  | ValidationError
  | AuthenticationError
  | ConnectionError
  | ConstraintError
  | OperationError
  | ConflictError;

/**
 * Serialized error type that preserves message for client display
 */
type SerializedErrorWithMessage = { _tag: string; message: string };

/**
 * Serializes a result tuple for server actions, preserving error messages
 * This ensures errors can be safely passed to client components
 */
function serializeErrorResult<
  TError extends { _tag: string; message?: string },
  TData,
>([err, data]: ResultTuple<TError, TData>): ResultTuple<
  SerializedErrorWithMessage,
  TData
> {
  if (err) {
    // Convert error to plain object with tag and message
    // Use empty string as fallback for errors without messages
    return [{ _tag: err._tag, message: err.message || '' }, undefined];
  }
  return [null, data!]; // Non-null assertion: if err is null, data must be TData
}

/**
 * Complete onboarding - sets username, display name, and optionally other profile fields
 * Returns: [error, { id }] tuple
 */
export async function completeOnboardingAction(input: {
  username: string;
  displayName?: string;
  pronouns?: string;
  bio?: string;
}): Promise<ResultTuple<OnboardingMutationError, { id: string }>> {
  const [authError, userId] = await getUserId();
  if (authError || !userId) {
    return [
      authError || new AuthenticationError({ message: 'Not authenticated' }),
      undefined,
    ];
  }

  logger.info({ userId, username: input.username }, 'Completing onboarding');

  // Update username first
  const [usernameError, usernameResult] = await updateAccountSettings({
    username: input.username,
  } as UpdateAccountSettingsParams);

  if (usernameError) {
    logger.error({ error: usernameError, userId }, 'Failed to set username');
    return [usernameError, undefined];
  }

  // Update profile fields if provided
  const profileUpdates: UpdateProfileParams = {};
  if (input.displayName) {
    profileUpdates.name = input.displayName;
  }
  if (input.pronouns) {
    profileUpdates.pronouns = input.pronouns;
  }
  if (input.bio) {
    profileUpdates.bio = input.bio;
  }

  if (Object.keys(profileUpdates).length > 0) {
    const [profileError, profileResult] = await updateProfile(profileUpdates);

    if (profileError) {
      logger.error({ error: profileError, userId }, 'Failed to update profile');
      // Don't fail onboarding if profile update fails, username is the critical part
    } else if (profileResult) {
      logger.info({ userId }, 'Profile updated during onboarding');
    }
  }

  // Invalidate user cache
  updateTag(`user-${userId}`);
  updateTag(`user-${userId}-settings`);
  updateTag(`user-${userId}-account`);

  logger.info({ userId, username: input.username }, 'Onboarding completed');

  return [null, usernameResult!];
}

/**
 * Check if user needs onboarding (client-safe server action)
 * Returns: [error, needsOnboarding] tuple
 */
export async function checkNeedsOnboardingAction(): Promise<
  ResultTuple<SerializedErrorWithMessage, boolean>
> {
  const { needsOnboarding } = await import('@groupi/services/server');
  const result = await needsOnboarding();

  // Serialize the result tuple to prevent Error object serialization issues
  return serializeErrorResult(result);
}
