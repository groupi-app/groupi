import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import {
  NotificationMethodType,
  NotificationType,
  WebhookFormat,
} from '@prisma/client';
import {
  // Import safe-wrapper service functions
  fetchUserSettings,
  updateUserSettings,
  // Import component-specific services
  getSettingsPageData,
} from '@groupi/services';

// ============================================================================
// INPUT SCHEMAS (settings-specific)
// ============================================================================

// Settings data schema for updates
export const UpdateUserSettingsInputSchema = z.object({
  notificationMethods: z.array(
    z.object({
      id: z.string().optional(),
      type: z.nativeEnum(NotificationMethodType),
      name: z.string().optional(),
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
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    // Return safe-wrapper tuple directly - no error conversion needed
    return await fetchUserSettings(ctx.userId);
  }),

  /**
   * Update user's notification settings
   * Returns: [error, settings] tuple
   */
  update: protectedProcedure
    .input(UpdateUserSettingsInputSchema)
    .mutation(async ({ input, ctx }) => {
      // Return safe-wrapper tuple directly - no error conversion needed
      return await updateUserSettings(input, ctx.userId);
    }),

  // ============================================================================
  // COMPONENT-SPECIFIC DATA ENDPOINTS
  // ============================================================================

  /**
   * Get settings page data
   * Returns: [error, SettingsPageData] tuple
   */
  getSettingsPageData: protectedProcedure.query(async ({ ctx }) => {
    return await getSettingsPageData(ctx.userId);
  }),
});
