import { z } from 'zod';
import {
  PersonSettingsSchema,
  NotificationMethodSchema,
  NotificationSchema,
} from '../generated';
import type { ResultTuple } from '../result-tuple';

// ============================================================================
// SETTINGS PAGE SCHEMAS
// ============================================================================

// Notification with minimal fields
export const SettingsPageNotificationSchema = NotificationSchema.pick({
  id: true,
  type: true,
  read: true,
  createdAt: true,
});

// Notification method with notifications
export const SettingsPageNotificationMethodSchema =
  NotificationMethodSchema.pick({
    id: true,
    type: true,
    value: true,
    enabled: true,
    createdAt: true,
    updatedAt: true,
  }).extend({
    notifications: z.array(SettingsPageNotificationSchema),
  });

// Main data structure for Settings page
export const SettingsPageDataSchema = PersonSettingsSchema.pick({
  id: true,
  personId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  notificationMethods: z.array(SettingsPageNotificationMethodSchema),
});

// Error types
export const SettingsPageErrorSchema = z.discriminatedUnion('_tag', [
  z.object({
    _tag: z.literal('SettingsNotFoundError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('UserNotFoundError'),
    message: z.string(),
  }),
  z.object({
    _tag: z.literal('DatabaseError'),
    message: z.string(),
  }),
]);

// Type exports
export type SettingsPageData = z.infer<typeof SettingsPageDataSchema>;
export type SettingsPageError = z.infer<typeof SettingsPageErrorSchema>;
export type SettingsPageResult = ResultTuple<
  SettingsPageError,
  SettingsPageData
>;
