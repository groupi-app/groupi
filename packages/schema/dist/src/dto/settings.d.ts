import { z } from 'zod';
import type { PersonSettings as PrismaPersonSettings, NotificationMethod as PrismaNotificationMethod, NotificationSetting as PrismaNotificationSetting } from '../generated';
export declare const NotificationMethodSettingsDTO: z.ZodObject<Pick<{
    type: z.ZodEnum<["EMAIL", "PUSH", "WEBHOOK"]>;
    webhookFormat: z.ZodNullable<z.ZodEnum<["DISCORD", "SLACK", "TEAMS", "GENERIC", "CUSTOM"]>>;
    id: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    settingsId: z.ZodString;
    enabled: z.ZodBoolean;
    name: z.ZodNullable<z.ZodString>;
    value: z.ZodString;
    webhookHeaders: z.ZodNullable<z.ZodType<import("@prisma/client/runtime/library").JsonValue, z.ZodTypeDef, import("@prisma/client/runtime/library").JsonValue>>;
    customTemplate: z.ZodNullable<z.ZodString>;
}, "value" | "type" | "id" | "name" | "enabled" | "webhookHeaders" | "customTemplate" | "webhookFormat"> & {
    notifications: z.ZodArray<z.ZodObject<Pick<{
        notificationType: z.ZodEnum<["EVENT_EDITED", "NEW_POST", "NEW_REPLY", "DATE_CHOSEN", "DATE_CHANGED", "DATE_RESET", "USER_JOINED", "USER_LEFT", "USER_PROMOTED", "USER_DEMOTED", "USER_RSVP"]>;
        id: z.ZodString;
        methodId: z.ZodString;
        enabled: z.ZodBoolean;
    }, "enabled" | "notificationType">, "strip", z.ZodTypeAny, {
        enabled: boolean;
        notificationType: "EVENT_EDITED" | "NEW_POST" | "NEW_REPLY" | "DATE_CHOSEN" | "DATE_CHANGED" | "DATE_RESET" | "USER_JOINED" | "USER_LEFT" | "USER_PROMOTED" | "USER_DEMOTED" | "USER_RSVP";
    }, {
        enabled: boolean;
        notificationType: "EVENT_EDITED" | "NEW_POST" | "NEW_REPLY" | "DATE_CHOSEN" | "DATE_CHANGED" | "DATE_RESET" | "USER_JOINED" | "USER_LEFT" | "USER_PROMOTED" | "USER_DEMOTED" | "USER_RSVP";
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    value: string;
    type: "EMAIL" | "PUSH" | "WEBHOOK";
    id: string;
    name: string | null;
    enabled: boolean;
    webhookHeaders: import("@prisma/client/runtime/library").JsonValue;
    customTemplate: string | null;
    webhookFormat: "DISCORD" | "SLACK" | "TEAMS" | "GENERIC" | "CUSTOM" | null;
    notifications: {
        enabled: boolean;
        notificationType: "EVENT_EDITED" | "NEW_POST" | "NEW_REPLY" | "DATE_CHOSEN" | "DATE_CHANGED" | "DATE_RESET" | "USER_JOINED" | "USER_LEFT" | "USER_PROMOTED" | "USER_DEMOTED" | "USER_RSVP";
    }[];
}, {
    value: string;
    type: "EMAIL" | "PUSH" | "WEBHOOK";
    id: string;
    name: string | null;
    enabled: boolean;
    webhookHeaders: import("@prisma/client/runtime/library").JsonValue;
    customTemplate: string | null;
    webhookFormat: "DISCORD" | "SLACK" | "TEAMS" | "GENERIC" | "CUSTOM" | null;
    notifications: {
        enabled: boolean;
        notificationType: "EVENT_EDITED" | "NEW_POST" | "NEW_REPLY" | "DATE_CHOSEN" | "DATE_CHANGED" | "DATE_RESET" | "USER_JOINED" | "USER_LEFT" | "USER_PROMOTED" | "USER_DEMOTED" | "USER_RSVP";
    }[];
}>;
export type NotificationMethodSettingsDTO = z.infer<typeof NotificationMethodSettingsDTO>;
export declare const UserNotificationSettingsDTO: z.ZodObject<Pick<{
    id: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    personId: z.ZodString;
}, "id"> & {
    notificationMethods: z.ZodArray<z.ZodObject<Pick<{
        type: z.ZodEnum<["EMAIL", "PUSH", "WEBHOOK"]>;
        webhookFormat: z.ZodNullable<z.ZodEnum<["DISCORD", "SLACK", "TEAMS", "GENERIC", "CUSTOM"]>>;
        id: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        settingsId: z.ZodString;
        enabled: z.ZodBoolean;
        name: z.ZodNullable<z.ZodString>;
        value: z.ZodString;
        webhookHeaders: z.ZodNullable<z.ZodType<import("@prisma/client/runtime/library").JsonValue, z.ZodTypeDef, import("@prisma/client/runtime/library").JsonValue>>;
        customTemplate: z.ZodNullable<z.ZodString>;
    }, "value" | "type" | "id" | "name" | "enabled" | "webhookHeaders" | "customTemplate" | "webhookFormat"> & {
        notifications: z.ZodArray<z.ZodObject<Pick<{
            notificationType: z.ZodEnum<["EVENT_EDITED", "NEW_POST", "NEW_REPLY", "DATE_CHOSEN", "DATE_CHANGED", "DATE_RESET", "USER_JOINED", "USER_LEFT", "USER_PROMOTED", "USER_DEMOTED", "USER_RSVP"]>;
            id: z.ZodString;
            methodId: z.ZodString;
            enabled: z.ZodBoolean;
        }, "enabled" | "notificationType">, "strip", z.ZodTypeAny, {
            enabled: boolean;
            notificationType: "EVENT_EDITED" | "NEW_POST" | "NEW_REPLY" | "DATE_CHOSEN" | "DATE_CHANGED" | "DATE_RESET" | "USER_JOINED" | "USER_LEFT" | "USER_PROMOTED" | "USER_DEMOTED" | "USER_RSVP";
        }, {
            enabled: boolean;
            notificationType: "EVENT_EDITED" | "NEW_POST" | "NEW_REPLY" | "DATE_CHOSEN" | "DATE_CHANGED" | "DATE_RESET" | "USER_JOINED" | "USER_LEFT" | "USER_PROMOTED" | "USER_DEMOTED" | "USER_RSVP";
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        value: string;
        type: "EMAIL" | "PUSH" | "WEBHOOK";
        id: string;
        name: string | null;
        enabled: boolean;
        webhookHeaders: import("@prisma/client/runtime/library").JsonValue;
        customTemplate: string | null;
        webhookFormat: "DISCORD" | "SLACK" | "TEAMS" | "GENERIC" | "CUSTOM" | null;
        notifications: {
            enabled: boolean;
            notificationType: "EVENT_EDITED" | "NEW_POST" | "NEW_REPLY" | "DATE_CHOSEN" | "DATE_CHANGED" | "DATE_RESET" | "USER_JOINED" | "USER_LEFT" | "USER_PROMOTED" | "USER_DEMOTED" | "USER_RSVP";
        }[];
    }, {
        value: string;
        type: "EMAIL" | "PUSH" | "WEBHOOK";
        id: string;
        name: string | null;
        enabled: boolean;
        webhookHeaders: import("@prisma/client/runtime/library").JsonValue;
        customTemplate: string | null;
        webhookFormat: "DISCORD" | "SLACK" | "TEAMS" | "GENERIC" | "CUSTOM" | null;
        notifications: {
            enabled: boolean;
            notificationType: "EVENT_EDITED" | "NEW_POST" | "NEW_REPLY" | "DATE_CHOSEN" | "DATE_CHANGED" | "DATE_RESET" | "USER_JOINED" | "USER_LEFT" | "USER_PROMOTED" | "USER_DEMOTED" | "USER_RSVP";
        }[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    notificationMethods: {
        value: string;
        type: "EMAIL" | "PUSH" | "WEBHOOK";
        id: string;
        name: string | null;
        enabled: boolean;
        webhookHeaders: import("@prisma/client/runtime/library").JsonValue;
        customTemplate: string | null;
        webhookFormat: "DISCORD" | "SLACK" | "TEAMS" | "GENERIC" | "CUSTOM" | null;
        notifications: {
            enabled: boolean;
            notificationType: "EVENT_EDITED" | "NEW_POST" | "NEW_REPLY" | "DATE_CHOSEN" | "DATE_CHANGED" | "DATE_RESET" | "USER_JOINED" | "USER_LEFT" | "USER_PROMOTED" | "USER_DEMOTED" | "USER_RSVP";
        }[];
    }[];
}, {
    id: string;
    notificationMethods: {
        value: string;
        type: "EMAIL" | "PUSH" | "WEBHOOK";
        id: string;
        name: string | null;
        enabled: boolean;
        webhookHeaders: import("@prisma/client/runtime/library").JsonValue;
        customTemplate: string | null;
        webhookFormat: "DISCORD" | "SLACK" | "TEAMS" | "GENERIC" | "CUSTOM" | null;
        notifications: {
            enabled: boolean;
            notificationType: "EVENT_EDITED" | "NEW_POST" | "NEW_REPLY" | "DATE_CHOSEN" | "DATE_CHANGED" | "DATE_RESET" | "USER_JOINED" | "USER_LEFT" | "USER_PROMOTED" | "USER_DEMOTED" | "USER_RSVP";
        }[];
    }[];
}>;
export type UserNotificationSettingsDTO = z.infer<typeof UserNotificationSettingsDTO>;
export type NotificationMethodWithSettings = PrismaNotificationMethod & {
    notifications: PrismaNotificationSetting[];
};
export type SettingsWithMethods = PrismaPersonSettings & {
    notificationMethods: NotificationMethodWithSettings[];
};
export declare function createNotificationMethodSettingsDTO(method: NotificationMethodWithSettings): NotificationMethodSettingsDTO;
export declare function createUserNotificationSettingsDTO(settings: SettingsWithMethods): UserNotificationSettingsDTO;
