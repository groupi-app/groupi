/* eslint-disable no-redeclare */
import { z } from 'zod';
import {
  NotificationMethodSchema,
  NotificationSettingSchema,
} from '../generated';

// ============================================================================
// SETTINGS DOMAIN PARAMETER SCHEMAS
// ============================================================================

// Fetch user settings parameters
export const GetUserSettingsParams = z.object({});

export type GetUserSettingsParams = z.infer<typeof GetUserSettingsParams>;

// Update user settings parameters
export const UpdateUserSettingsParams = z.object({
  notificationMethods: z.array(
    NotificationMethodSchema.pick({
      type: true,
      value: true,
      enabled: true,
    }).extend({
      id: NotificationMethodSchema.shape.id.optional(),
      name: NotificationMethodSchema.shape.name.optional(),
      notifications: z.array(
        NotificationSettingSchema.pick({
          notificationType: true,
          enabled: true,
        })
      ),
      // Webhook-specific fields
      webhookFormat: NotificationMethodSchema.shape.webhookFormat.optional(),
      customTemplate: NotificationMethodSchema.shape.customTemplate.optional(),
      webhookHeaders: NotificationMethodSchema.shape.webhookHeaders.optional(),
    })
  ),
});

export type UpdateUserSettingsParams = z.infer<typeof UpdateUserSettingsParams>;
