"use client";

import { useQuery, useMutation } from "convex/react";
import { useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Id } from "@/convex/_generated/dataModel";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let settingsQueries: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let settingsMutations: any;

function initApi() {
  if (!settingsQueries) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { api } = require("@/convex/_generated/api");
    settingsQueries = api.settings?.queries ?? {};
    settingsMutations = api.settings?.mutations ?? {};
  }
}
initApi();

// Types for notification settings
export type NotificationType =
  | "EVENT_EDITED"
  | "NEW_POST"
  | "NEW_REPLY"
  | "DATE_CHOSEN"
  | "DATE_CHANGED"
  | "DATE_RESET"
  | "USER_JOINED"
  | "USER_LEFT"
  | "USER_PROMOTED"
  | "USER_DEMOTED"
  | "USER_RSVP"
  | "USER_MENTIONED";

export type NotificationMethodType = "EMAIL" | "PUSH" | "WEBHOOK";

export type WebhookFormat = "DISCORD" | "SLACK" | "TEAMS" | "GENERIC" | "CUSTOM";

export interface NotificationSetting {
  notificationType: NotificationType;
  enabled: boolean;
}

export interface NotificationMethod {
  id?: string; // Convex Id as string - will be converted on the backend
  type: NotificationMethodType;
  enabled: boolean;
  name?: string;
  value: string;
  webhookFormat?: WebhookFormat;
  customTemplate?: string;
  webhookHeaders?: string;
  notifications: NotificationSetting[];
}

/**
 * Get notification settings for the current user
 */
export function useNotificationMethodSettings() {
  return useQuery(settingsQueries.getNotificationSettings, {});
}

/**
 * Save notification settings
 */
export function useSaveNotificationSettings() {
  const saveSettings = useMutation(settingsMutations.saveNotificationSettings);
  const { toast } = useToast();

  return useCallback(
    async (notificationMethods: NotificationMethod[]) => {
      try {
        await saveSettings({ notificationMethods });

        toast({
          title: "Settings Saved",
          description: "Your notification settings have been updated.",
        });

        return { success: true };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to save settings. Please try again.";

        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });

        return { success: false, error: message };
      }
    },
    [saveSettings, toast]
  );
}

/**
 * Delete a notification method
 */
export function useDeleteNotificationMethod() {
  const deleteMethod = useMutation(settingsMutations.deleteNotificationMethod);
  const { toast } = useToast();

  return useCallback(
    async (methodId: Id<"notificationMethods">) => {
      try {
        await deleteMethod({ methodId });

        toast({
          title: "Method Deleted",
          description: "Notification method has been removed.",
        });

        return { success: true };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to delete method. Please try again.";

        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });

        return { success: false, error: message };
      }
    },
    [deleteMethod, toast]
  );
}

/**
 * Combined hook for notification settings management
 */
export function useNotificationMethodSettingsManagement() {
  const settings = useNotificationMethodSettings();
  const saveSettings = useSaveNotificationSettings();
  const deleteMethod = useDeleteNotificationMethod();

  return {
    // Data
    personSettings: settings?.personSettings ?? null,
    notificationMethods: settings?.notificationMethods ?? [],

    // Loading state
    isLoading: settings === undefined,

    // Actions
    saveSettings,
    deleteMethod,
  };
}
