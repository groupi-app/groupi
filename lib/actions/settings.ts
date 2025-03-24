"use server";

import { ActionResponse } from "@/types";
import { NotificationMethodType, NotificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "../db";

/**
 * Adds a new notification method to a user's settings
 */
export async function addNotificationMethod(
  personId: string,
  data: {
    type: NotificationMethodType;
    name: string;
    value: string;
    enabled?: boolean;
    notifications: Record<NotificationType, boolean>;
  }
): Promise<ActionResponse<any>> {
  if (!personId) return { error: "User ID is required" };

  try {
    const settings = await db.personSettings.findUnique({
      where: { personId },
    });

    if (!settings) {
      return { error: "Settings not found for user" };
    }

    // Create the notification method
    const method = await db.notificationMethod.create({
      data: {
        type: data.type,
        name: data.name,
        value: data.value,
        enabled: data.enabled ?? true,
        settingsId: settings.id,
        notifications: {
          create: Object.entries(data.notifications).map(([type, enabled]) => ({
            notificationType: type as NotificationType,
            enabled,
          })),
        },
      },
    });

    revalidatePath("/");

    return { success: method };
  } catch (error) {
    console.error("Error adding notification method:", error);
    return { error: "Failed to add notification method" };
  }
}

/**
 * Deletes a notification method
 */
export async function deleteNotificationMethod(
  methodId: string
): Promise<ActionResponse<any>> {
  "use server";

  if (!methodId) return { error: "Method ID is required" };

  try {
    await db.notificationMethod.delete({
      where: { id: methodId },
    });

    // Revalidate settings path to refresh the UI
    revalidatePath("/");

    return { success: { deleted: true } };
  } catch (error) {
    console.error("Error deleting notification method:", error);
    return { error: "Failed to delete notification method" };
  }
}

/**
 * Updates a notification method's details
 */
export async function updateNotificationMethod(
  methodId: string,
  data: {
    name?: string;
    value?: string;
    enabled?: boolean;
    notifications: Record<NotificationType, boolean>;
  }
): Promise<ActionResponse<any>> {
  "use server";

  if (!methodId) return { error: "Method ID is required" };

  try {
    const updated = await db.notificationMethod.update({
      where: { id: methodId },
      data: {
        ...data,
        notifications: {
          upsert: Object.entries(data.notifications).map(([type, enabled]) => ({
            where: {
              notificationType_methodId: {
                notificationType: type as NotificationType,
                methodId: methodId,
              },
            },
            create: {
              notificationType: type as NotificationType,
              enabled,
            },
            update: {
              enabled,
            },
          })),
        },
      },
    });

    // Revalidate settings path to refresh the UI
    revalidatePath("/");

    return { success: updated };
  } catch (error) {
    console.error("Error updating notification method:", error);
    return { error: "Failed to update notification method" };
  }
}
