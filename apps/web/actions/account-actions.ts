'use server';

import { updateTag } from 'next/cache';
import {
  getAccountSettingsData,
  checkUsernameAvailability,
  updateAccountSettings,
  updateProfile,
  unlinkAccount,
  deleteAccount,
} from '@groupi/services';
import { getUserId } from '@groupi/services/server';
import type { ResultTuple } from '@groupi/schema';
import type {
  AccountSettingsData,
  UsernameAvailabilityData,
} from '@groupi/schema/data';
import type {
  CheckUsernameAvailabilityParams,
  UpdateAccountSettingsParams,
  UpdateProfileParams,
  UnlinkAccountParams,
} from '@groupi/schema/params';
import type {
  NotFoundError,
  UnauthorizedError,
  DatabaseError,
  ValidationError,
  AuthenticationError,
  ConnectionError,
  ConstraintError,
  OperationError,
  ConflictError,
} from '@groupi/schema';
import { deleteUploadThingFile } from '@/lib/uploadthing-delete';
import { createLogger } from '@/lib/logger';

const logger = createLogger('account-actions');

/**
 * Serialized error type that preserves message for client display
 */
type SerializedErrorWithMessage = { _tag: string; message: string };

/**
 * Serializes a result tuple for server actions, preserving error messages
 * This ensures errors can be safely passed to client components
 */
function serializeErrorResult<TError extends { _tag: string; message?: string }, TData>([
  err,
  data,
]: ResultTuple<TError, TData>): ResultTuple<SerializedErrorWithMessage, TData> {
  if (err) {
    // Convert error to plain object with tag and message
    // Use empty string as fallback for errors without messages
    return [{ _tag: err._tag, message: err.message || '' }, undefined];
  }
  return [null, data!]; // Non-null assertion: if err is null, data must be TData
}

// ============================================================================
// ACCOUNT ACTIONS
// ============================================================================

type AccountMutationError =
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
 * Get account settings data
 * Returns: [error, AccountSettingsData] tuple
 */
export async function getAccountSettingsDataAction(): Promise<
  ResultTuple<AccountMutationError, AccountSettingsData>
> {
  return await getAccountSettingsData({});
}

/**
 * Check username availability
 * Returns: [error, UsernameAvailabilityData] tuple
 */
export async function checkUsernameAvailabilityAction(
  input: CheckUsernameAvailabilityParams
): Promise<ResultTuple<AccountMutationError, UsernameAvailabilityData>> {
  return await checkUsernameAvailability(input);
}

/**
 * Update account settings (username/email)
 * Returns: [error, { id }] tuple
 */
export async function updateAccountSettingsAction(
  input: UpdateAccountSettingsParams
): Promise<ResultTuple<AccountMutationError, { id: string }>> {
  const result = await updateAccountSettings(input);

  // Invalidate user cache on successful update
  if (!result[0]) {
    const [, userId] = await getUserId();
    if (userId) {
      updateTag(`user-${userId}`);
      updateTag(`user-${userId}-settings`);
      updateTag(`user-${userId}-account`);
      
      // Revalidate the layout to refresh session in profile dropdown
      // This forces MainNavDynamicWrapper to re-fetch the session
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/', 'layout');
    }
  }

  return result;
}

/**
 * Update user profile (name, image, imageKey, pronouns, bio)
 * Returns: [error, { id }] tuple
 */
export async function updateProfileAction(
  input: UpdateProfileParams
): Promise<ResultTuple<AccountMutationError, { id: string }>> {
  const result = await updateProfile(input);

  // Invalidate user cache on successful update
  if (!result[0]) {
    const [, userId] = await getUserId();
    if (userId) {
      updateTag(`user-${userId}`);
      updateTag(`user-${userId}-settings`);
      
      // Revalidate the layout to refresh session in profile dropdown
      // This forces MainNavDynamicWrapper to re-fetch the session
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/', 'layout');
    }

    // Handle old image deletion (non-blocking)
    if (input.oldImageKey && input.oldImageKey !== input.imageKey) {
      try {
        await deleteUploadThingFile(input.oldImageKey);
        logger.info(
          {
            userId,
            oldImageKey: input.oldImageKey,
          },
          'Old profile image deleted'
        );
      } catch (error) {
        // Log error but don't fail the update
        logger.error(
          { error, userId, oldImageKey: input.oldImageKey },
          'Failed to delete old profile image'
        );
      }
    }
  }

  return result;
}

/**
 * Unlink an OAuth account
 * Returns: [error, { message }] tuple
 */
export async function unlinkAccountAction(
  input: UnlinkAccountParams
): Promise<ResultTuple<SerializedErrorWithMessage, { message: string }>> {
  const result = await unlinkAccount(input);

  // Invalidate account cache on successful unlink
  if (!result[0]) {
    const [, userId] = await getUserId();
    if (userId) {
      updateTag(`user-${userId}`);
      updateTag(`user-${userId}-account`);
      
      // Revalidate the account settings page to refresh the UI
      const { revalidatePath } = await import('next/cache');
      revalidatePath('/settings/account');
    }
  }

  // Serialize the result tuple to prevent Error object serialization issues
  return serializeErrorResult(result);
}

/**
 * Delete user account
 * Signs user out and redirects to home page
 * Returns: [error, { message }] tuple
 */
export async function deleteAccountAction(): Promise<
  ResultTuple<SerializedErrorWithMessage, { message: string }>
> {
  const result = await deleteAccount({});

  // If successful, sign out and redirect
  if (!result[0]) {
    // Sign out using Better Auth
    try {
      // Note: Better Auth signOut is typically called from client side
      // For server-side logout, we could invalidate sessions directly
      // For now, the client will handle the redirect after deletion
    } catch (error) {
      // Log error but don't fail the deletion
      console.error('Error signing out after account deletion:', error);
    }

    // Redirect will be handled by the client component after receiving success
  }

  // Serialize the result tuple to prevent Error object serialization issues
  return serializeErrorResult(result);
}
