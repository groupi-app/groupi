/* eslint-disable no-redeclare */
import { z } from 'zod';
import type {
  PersonSettings as PrismaPersonSettings,
  NotificationMethod as PrismaNotificationMethod,
  NotificationSetting as PrismaNotificationSetting,
} from '../generated';
import {
  NotificationMethodSchema,
  NotificationSettingSchema,
  PersonSettingsSchema,
} from '../generated';

// Notification method settings DTO - for individual notification method configuration
export const NotificationMethodSettingsDTO = NotificationMethodSchema.pick({
  id: true,
  type: true,
  enabled: true,
  name: true,
  value: true,
  webhookHeaders: true,
  customTemplate: true,
  webhookFormat: true,
}).extend({
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

// User notification settings DTO - for user's notification settings page
export const UserNotificationSettingsDTO = PersonSettingsSchema.pick({
  id: true,
}).extend({
  notificationMethods: z.array(NotificationMethodSettingsDTO),
});

export type UserNotificationSettingsDTO = z.infer<
  typeof UserNotificationSettingsDTO
>;

// Types for Prisma data
export type NotificationMethodWithSettings = PrismaNotificationMethod & {
  notifications: PrismaNotificationSetting[];
};

export type SettingsWithMethods = PrismaPersonSettings & {
  notificationMethods: NotificationMethodWithSettings[];
};

// Factory functions
export function createNotificationMethodSettingsDTO(
  method: NotificationMethodWithSettings
): NotificationMethodSettingsDTO {
  return {
    id: method.id,
    type: method.type,
    enabled: method.enabled,
    name: method.name,
    value: method.value,
    webhookHeaders: method.webhookHeaders,
    customTemplate: method.customTemplate,
    webhookFormat: method.webhookFormat,
    notifications: method.notifications.map(notification => ({
      notificationType: notification.notificationType,
      enabled: notification.enabled,
    })),
  };
}

export function createUserNotificationSettingsDTO(
  settings: SettingsWithMethods
): UserNotificationSettingsDTO {
  return {
    id: settings.id,
    notificationMethods: settings.notificationMethods.map(
      createNotificationMethodSettingsDTO
    ),
  };
}
