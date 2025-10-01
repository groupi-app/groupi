/* eslint-disable no-redeclare */
import { z } from 'zod';
import {
  PersonSettingsSchema,
  NotificationMethodSchema,
  NotificationSettingSchema,
} from '../generated';

// ============================================================================
// SETTINGS DOMAIN DATA DTOS
// ============================================================================

// Basic settings DTO
export const SettingsDTO = PersonSettingsSchema.pick({
  id: true,
  personId: true,
  createdAt: true,
  updatedAt: true,
});

export type SettingsDTO = z.infer<typeof SettingsDTO>;

// Notification method DTO
export const NotificationMethodDTO = NotificationMethodSchema.pick({
  id: true,
  type: true,
  enabled: true,
  name: true,
  value: true,
  webhookHeaders: true,
  customTemplate: true,
  webhookFormat: true,
});

export type NotificationMethodDTO = z.infer<typeof NotificationMethodDTO>;

// Notification method with settings DTO
export const NotificationMethodSettingsDTO = NotificationMethodDTO.extend({
  notifications: z.array(
    NotificationSettingSchema.pick({
      notificationType: true,
      enabled: true,
    })
  ),
});

export type NotificationMethodSettingsDTO = z.infer<
  typeof NotificationMethodSettingsDTO
>;

// Settings page DTO
export const SettingsPageDTO = PersonSettingsSchema.pick({
  id: true,
  createdAt: true,
  updatedAt: true,
  personId: true,
}).extend({
  notificationMethods: z.array(NotificationMethodSettingsDTO),
});

export type SettingsPageDTO = z.infer<typeof SettingsPageDTO>;
