'use server';

import { updateTag } from 'next/cache';
import { updateUserSettings } from '@groupi/services';
import { getUserId } from '@groupi/services/server';
import type {
  ResultTuple,
  NotificationMethodSettingsData,
} from '@groupi/schema';
import type { UpdateUserSettingsParams } from '@groupi/schema/params';
import type {
  NotFoundError,
  UnauthorizedError,
  DatabaseError,
  ValidationError,
  AuthenticationError,
  ConnectionError,
  ConstraintError,
  OperationError,
} from '@groupi/schema';

// ============================================================================
// SETTINGS ACTIONS
// ============================================================================

type SettingsMutationError =
  | NotFoundError
  | UnauthorizedError
  | DatabaseError
  | ValidationError
  | AuthenticationError
  | ConnectionError
  | ConstraintError
  | OperationError;

/**
 * Update user's notification settings
 * Returns: [error, NotificationMethodSettingsData[]] tuple
 */
export async function updateUserSettingsAction(
  input: UpdateUserSettingsParams
): Promise<
  ResultTuple<SettingsMutationError, NotificationMethodSettingsData[]>
> {
  const result = await updateUserSettings({
    notificationMethods: input.notificationMethods.map(method => ({
      ...method,
      name: method.name ?? null,
    })),
  });

  // Invalidate settings cache on successful update
  if (!result[0]) {
    const [, userId] = await getUserId();
    if (userId) {
      updateTag(`user-${userId}-settings`);
    }
  }

  return result;
}
