import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import {
  NotificationMethodType,
  NotificationType,
  WebhookFormat,
} from '@prisma/client';
import {
  // Import service functions
  fetchUserSettings,
  updateUserSettings,
} from '@groupi/services';
import { UpdateUserSettingsParams } from '@groupi/schema/params';

// ============================================================================
// INPUT SCHEMAS (settings-specific)
// ============================================================================

// Settings data schema for updates
export const UpdateUserSettingsInputSchema = z.object({
  notificationMethods: z.array(
    z.object({
      id: z.string(),
      type: z.nativeEnum(NotificationMethodType),
      name: z.string().nullable().optional(),
      value: z.string(),
      enabled: z.boolean(),
      notifications: z.array(
        z.object({
          notificationType: z.nativeEnum(NotificationType),
          enabled: z.boolean(),
        })
      ),
      // Webhook-specific fields
      webhookFormat: z.nativeEnum(WebhookFormat).optional(),
      customTemplate: z.string().optional(),
      webhookHeaders: z.string().optional(),
    })
  ),
});

// ============================================================================
// SETTINGS ROUTER
// ============================================================================

export const settingsRouter = createTRPCRouter({
  /**
   * Get current user's settings
   * Returns: [error, settings] tuple
   */
  getCurrent: protectedProcedure.query(async () => {
    return await fetchUserSettings({});
  }),

  /**
   * Update user's notification settings
   * Returns: [error, settings] tuple
   */
  update: protectedProcedure
    .input(UpdateUserSettingsParams)
    .mutation(async ({ input }) => {
      return await updateUserSettings({
        notificationMethods: input.notificationMethods.map(method => ({
          ...method,
          name: method.name ?? null,
        })),
      });
    }),

  // ============================================================================
  // COMPONENT-SPECIFIC DATA ENDPOINTS
  // ============================================================================

  /**
   * Get settings page data
   * Returns: [error, SettingsPageData] tuple
   */
  getSettingsPageData: protectedProcedure.query(async () => {
    return await fetchUserSettings({});
  }),
});
