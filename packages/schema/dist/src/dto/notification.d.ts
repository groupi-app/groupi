import { z } from 'zod';
import type { Notification as PrismaNotification, Person, Event, Post } from '../generated';
export declare const NotificationFeedDTO: z.ZodObject<Pick<{
    type: z.ZodEnum<["EVENT_EDITED", "NEW_POST", "NEW_REPLY", "DATE_CHOSEN", "DATE_CHANGED", "DATE_RESET", "USER_JOINED", "USER_LEFT", "USER_PROMOTED", "USER_DEMOTED", "USER_RSVP"]>;
    rsvp: z.ZodNullable<z.ZodEnum<["YES", "MAYBE", "NO", "PENDING"]>>;
    id: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    personId: z.ZodString;
    authorId: z.ZodNullable<z.ZodString>;
    eventId: z.ZodNullable<z.ZodString>;
    postId: z.ZodNullable<z.ZodString>;
    read: z.ZodBoolean;
    datetime: z.ZodNullable<z.ZodDate>;
}, "type" | "id" | "createdAt" | "read" | "datetime" | "rsvp"> & {
    event: z.ZodNullable<z.ZodObject<Pick<{
        id: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        title: z.ZodString;
        description: z.ZodString;
        location: z.ZodString;
        chosenDateTime: z.ZodNullable<z.ZodDate>;
    }, "id" | "title">, "strip", z.ZodTypeAny, {
        id: string;
        title: string;
    }, {
        id: string;
        title: string;
    }>>;
    post: z.ZodNullable<z.ZodObject<Pick<{
        id: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        editedAt: z.ZodDate;
        authorId: z.ZodString;
        eventId: z.ZodString;
        title: z.ZodString;
        content: z.ZodString;
    }, "id" | "title">, "strip", z.ZodTypeAny, {
        id: string;
        title: string;
    }, {
        id: string;
        title: string;
    }>>;
    author: z.ZodNullable<z.ZodObject<Pick<{
        id: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
        firstName: z.ZodNullable<z.ZodString>;
        lastName: z.ZodNullable<z.ZodString>;
        username: z.ZodString;
        imageUrl: z.ZodString;
    }, "id" | "firstName" | "lastName" | "username" | "imageUrl">, "strip", z.ZodTypeAny, {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    }, {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    type: "EVENT_EDITED" | "NEW_POST" | "NEW_REPLY" | "DATE_CHOSEN" | "DATE_CHANGED" | "DATE_RESET" | "USER_JOINED" | "USER_LEFT" | "USER_PROMOTED" | "USER_DEMOTED" | "USER_RSVP";
    id: string;
    createdAt: Date;
    read: boolean;
    datetime: Date | null;
    rsvp: "YES" | "MAYBE" | "NO" | "PENDING" | null;
    event: {
        id: string;
        title: string;
    } | null;
    post: {
        id: string;
        title: string;
    } | null;
    author: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    } | null;
}, {
    type: "EVENT_EDITED" | "NEW_POST" | "NEW_REPLY" | "DATE_CHOSEN" | "DATE_CHANGED" | "DATE_RESET" | "USER_JOINED" | "USER_LEFT" | "USER_PROMOTED" | "USER_DEMOTED" | "USER_RSVP";
    id: string;
    createdAt: Date;
    read: boolean;
    datetime: Date | null;
    rsvp: "YES" | "MAYBE" | "NO" | "PENDING" | null;
    event: {
        id: string;
        title: string;
    } | null;
    post: {
        id: string;
        title: string;
    } | null;
    author: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        username: string;
        imageUrl: string;
    } | null;
}>;
export type NotificationFeedDTO = z.infer<typeof NotificationFeedDTO>;
export type NotificationWithRelations = PrismaNotification & {
    event?: Event | null;
    post?: Post | null;
    author?: Person | null;
};
export declare function createNotificationFeedDTO(notification: NotificationWithRelations): NotificationFeedDTO;
