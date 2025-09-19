import { z } from 'zod';
import { NotificationMethodSchema, NotificationSettingSchema, PersonSettingsSchema, } from '../generated';
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
    notifications: z.array(NotificationSettingSchema.pick({
        notificationType: true,
        enabled: true,
    })),
});
// User notification settings DTO - for user's notification settings page
export const UserNotificationSettingsDTO = PersonSettingsSchema.pick({
    id: true,
}).extend({
    notificationMethods: z.array(NotificationMethodSettingsDTO),
});
// Factory functions
export function createNotificationMethodSettingsDTO(method) {
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
export function createUserNotificationSettingsDTO(settings) {
    return {
        id: settings.id,
        notificationMethods: settings.notificationMethods.map(createNotificationMethodSettingsDTO),
    };
}
