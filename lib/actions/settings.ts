'use server';

import { ActionResponse, SettingsData } from '@/types';
import { NotificationMethodType, NotificationType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { db } from '../db';
import { auth } from '@clerk/nextjs/server';
import { log } from '@/lib/logger';

export async function fetchUserSettings(): Promise<
  ActionResponse<SettingsData>
> {
  const { userId }: { userId: string | null } = await auth();

  if (!userId) {
    return { error: 'User not found' };
  }
  const res = await db.personSettings.findUnique({
    where: {
      personId: userId,
    },
    include: {
      notificationMethods: {
        include: {
          notifications: true,
        },
      },
    },
  });
  if (!res) {
    return { error: 'Settings not found' };
  }
  return {
    success: res,
  };
}

/**
 * Updates all notification settings for the current user
 */
export async function updateUserSettings(data: {
  notificationMethods: Array<{
    id?: string;
    type: NotificationMethodType;
    name?: string;
    value: string;
    enabled: boolean;
    notifications: Array<{
      notificationType: NotificationType;
      enabled: boolean;
    }>;
  }>;
}): Promise<ActionResponse<boolean>> {
  'use server';
  const { userId } = await auth();
  if (!userId) return { error: 'User not found' };
  try {
    // Get the user's settings record
    const settings = await db.personSettings.findUnique({
      where: { personId: userId },
    });
    if (!settings) return { error: 'Settings not found for user' };

    // Remove all existing notification methods for this user
    await db.notificationMethod.deleteMany({
      where: { settingsId: settings.id },
    });

    // Add all new/updated notification methods
    for (const method of data.notificationMethods) {
      await db.notificationMethod.create({
        data: {
          type: method.type,
          value: method.value,
          enabled: method.enabled,
          settingsId: settings.id,
          name: method.name,
          notifications: {
            create: method.notifications.map(n => ({
              notificationType: n.notificationType,
              enabled: n.enabled,
            })),
          },
        },
      });
    }
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    log.error('Error updating user settings', {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    return { error: 'Failed to update notification settings' };
  }
}
