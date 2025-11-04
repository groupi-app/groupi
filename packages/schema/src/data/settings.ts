/* eslint-disable no-redeclare */
import { z } from 'zod';
import {
  PersonSettingsSchema,
  NotificationMethodSchema,
  NotificationSettingSchema,
} from '../generated';

// ============================================================================
// SETTINGS DOMAIN DATA TYPES
// ============================================================================

// Basic settings data
export const SettingsData = PersonSettingsSchema.pick({
  id: true,
  personId: true,
  createdAt: true,
  updatedAt: true,
});

export type SettingsData = z.infer<typeof SettingsData>;

// Notification method data
export const NotificationMethodData = NotificationMethodSchema.pick({
  id: true,
  type: true,
  enabled: true,
  name: true,
  value: true,
  webhookHeaders: true,
  customTemplate: true,
  webhookFormat: true,
});

export type NotificationMethodData = z.infer<typeof NotificationMethodData>;

// Notification method with settings data
export const NotificationMethodSettingsData = NotificationMethodData.extend({
  notifications: z.array(
    NotificationSettingSchema.pick({
      notificationType: true,
      enabled: true,
    })
  ),
});

export type NotificationMethodSettingsData = z.infer<
  typeof NotificationMethodSettingsData
>;

// Settings page data
export const SettingsPageData = PersonSettingsSchema.pick({
  id: true,
  createdAt: true,
  updatedAt: true,
  personId: true,
}).extend({
  notificationMethods: z.array(NotificationMethodSettingsData),
});

export type SettingsPageData = z.infer<typeof SettingsPageData>;
