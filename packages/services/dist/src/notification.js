'use server';
import { createNotificationFeedDTO, } from '@groupi/schema';
import { auth } from '@clerk/nextjs/server';
import { NotificationType, } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { db } from './db';
import { getPusherServer } from './pusher-server';
import { getNotificationQuery } from '@groupi/schema/queries';
import { resend } from './email';
import { NotificationEmailTemplate } from '@groupi/ui/email';
import { getNotificationSubject } from './notification-utils';
import { notificationLogger, emailLogger } from './logger';
import { getNEXT_PUBLIC_BASE_URL, getRESEND_FROM_EMAIL } from './env';
export const fetchNotificationsForPerson = async (id) => {
    const { userId } = await auth();
    if (!userId) {
        return {
            error: 'User not found',
        };
    }
    if (userId !== id) {
        return {
            error: "You are not authorized to view this user's notifications",
        };
    }
    const person = await db.person.findUnique({
        where: {
            id,
        },
        select: {
            notifications: {
                include: {
                    person: true,
                    event: true,
                    post: true,
                    author: true,
                },
            },
        },
    });
    if (!person) {
        return {
            error: 'Person not found',
        };
    }
    return {
        success: person.notifications,
    };
};
export const markNotificationAsRead = async (id) => {
    try {
        const { userId } = await auth();
        if (!userId) {
            return {
                error: 'User not found',
            };
        }
        const notification = await db.notification.update({
            where: {
                id,
                personId: userId,
            },
            data: {
                read: true,
            },
            include: {
                person: true,
                event: true,
                post: true,
                author: true,
            },
        });
        if (!notification) {
            return {
                error: 'Notification not found',
            };
        }
        revalidatePath('/');
        const personQueryDefinition = getNotificationQuery(userId);
        getPusherServer().trigger(personQueryDefinition.pusherChannel, personQueryDefinition.pusherEvent, {
            message: 'Event data updated',
        });
        return {
            success: notification,
        };
    }
    catch (_e) {
        return {
            error: 'Notification not found',
        };
    }
};
export const markAllNotificationsAsRead = async () => {
    try {
        const { userId } = await auth();
        if (!userId) {
            return {
                error: 'User not found',
            };
        }
        const notifications = await db.notification.updateMany({
            where: {
                personId: userId,
            },
            data: {
                read: true,
            },
        });
        if (!notifications) {
            return {
                error: 'Notifications not found',
            };
        }
        revalidatePath('/');
        const personQueryDefinition = getNotificationQuery(userId);
        getPusherServer().trigger(personQueryDefinition.pusherChannel, personQueryDefinition.pusherEvent, {
            message: 'Event data updated',
        });
        return {
            success: notifications.count,
        };
    }
    catch (_e) {
        return {
            error: 'Notification not found',
        };
    }
};
export const markNotificationAsUnread = async (id) => {
    try {
        const { userId } = await auth();
        if (!userId) {
            return {
                error: 'User not found',
            };
        }
        const notification = await db.notification.update({
            where: {
                id,
            },
            data: {
                read: false,
            },
            include: {
                person: true,
                event: true,
                post: true,
                author: true,
            },
        });
        if (!notification) {
            return {
                error: 'Notification not found',
            };
        }
        revalidatePath('/');
        const personQueryDefinition = getNotificationQuery(userId);
        getPusherServer().trigger(personQueryDefinition.pusherChannel, personQueryDefinition.pusherEvent, {
            message: 'Event data updated',
        });
        return {
            success: notification,
        };
    }
    catch (_e) {
        return {
            error: 'Notification not found',
        };
    }
};
export const markEventNotifsAsRead = async (eventId) => {
    try {
        const { userId } = await auth();
        if (!userId) {
            return {
                error: 'User not found',
            };
        }
        const notifications = await db.notification.updateMany({
            where: {
                personId: userId,
                eventId,
                type: {
                    in: [
                        NotificationType.EVENT_EDITED,
                        NotificationType.DATE_CHANGED,
                        NotificationType.DATE_CHOSEN,
                        NotificationType.DATE_RESET,
                        NotificationType.USER_JOINED,
                        NotificationType.USER_LEFT,
                        NotificationType.USER_PROMOTED,
                        NotificationType.USER_DEMOTED,
                        NotificationType.USER_RSVP,
                    ],
                },
            },
            data: {
                read: true,
            },
        });
        if (!notifications) {
            return {
                error: 'Notifications not found',
            };
        }
        revalidatePath('/');
        const personQueryDefinition = getNotificationQuery(userId);
        getPusherServer().trigger(personQueryDefinition.pusherChannel, personQueryDefinition.pusherEvent, {
            message: 'Event data updated',
        });
        return {
            success: notifications.count,
        };
    }
    catch (_e) {
        return {
            error: 'Notification not found',
        };
    }
};
export const markPostNotifsAsRead = async (postId) => {
    try {
        const { userId } = await auth();
        if (!userId) {
            return {
                error: 'User not found',
            };
        }
        const notifications = await db.notification.updateMany({
            where: {
                personId: userId,
                postId,
                type: {
                    in: [NotificationType.NEW_POST, NotificationType.NEW_REPLY],
                },
            },
            data: {
                read: true,
            },
        });
        if (!notifications) {
            return {
                error: 'Notifications not found',
            };
        }
        revalidatePath('/');
        const personQueryDefinition = getNotificationQuery(userId);
        getPusherServer().trigger(personQueryDefinition.pusherChannel, personQueryDefinition.pusherEvent, {
            message: 'Event data updated',
        });
        return {
            success: notifications.count,
        };
    }
    catch (_e) {
        return {
            error: 'Notification not found',
        };
    }
};
export const deleteNotification = async (id) => {
    try {
        const { userId } = await auth();
        if (!userId) {
            return {
                error: 'User not found',
            };
        }
        const notification = await db.notification.delete({
            where: {
                id,
                personId: userId,
            },
            include: {
                person: true,
                event: true,
                post: true,
                author: true,
            },
        });
        if (!notification) {
            return {
                error: 'Notification not found',
            };
        }
        revalidatePath('/');
        const personQueryDefinition = getNotificationQuery(userId);
        getPusherServer().trigger(personQueryDefinition.pusherChannel, personQueryDefinition.pusherEvent, {
            message: 'Event data updated',
        });
        return {
            success: notification,
        };
    }
    catch (_e) {
        return {
            error: 'Notification not found',
        };
    }
};
export const deleteAllNotifications = async () => {
    try {
        const { userId } = await auth();
        if (!userId) {
            return {
                error: 'User not found',
            };
        }
        const notifications = await db.notification.deleteMany({
            where: {
                personId: userId,
            },
        });
        if (!notifications) {
            return {
                error: 'Notifications not found',
            };
        }
        revalidatePath('/');
        const personQueryDefinition = getNotificationQuery(userId);
        getPusherServer().trigger(personQueryDefinition.pusherChannel, personQueryDefinition.pusherEvent, {
            message: 'Event data updated',
        });
        return {
            success: notifications.count,
        };
    }
    catch (_e) {
        return {
            error: 'Notification not found',
        };
    }
};
export const createNotification = async (notification) => {
    try {
        const { userId } = await auth();
        if (!userId) {
            return {
                error: 'User not found',
            };
        }
        let membership = undefined;
        if (notification.eventId) {
            const event = await db.event.findUnique({
                where: {
                    id: notification.eventId,
                },
                include: {
                    memberships: true,
                },
            });
            if (!event) {
                return {
                    error: 'Event not found',
                };
            }
            membership = event.memberships.find(membership => membership.personId === userId);
        }
        else if (notification.postId) {
            const post = await db.post.findUnique({
                where: {
                    id: notification.postId,
                },
                include: {
                    event: {
                        include: {
                            memberships: true,
                        },
                    },
                },
            });
            if (!post) {
                return {
                    error: 'Post not found',
                };
            }
            membership = post.event.memberships.find(membership => membership.personId === userId);
        }
        if (!membership) {
            return {
                error: 'User not in event',
            };
        }
        const newNotification = await db.notification.create({
            data: {
                ...notification,
                authorId: userId,
            },
            include: {
                person: true,
                event: true,
                post: true,
                author: true,
            },
        });
        notificationLogger.info({
            notificationId: newNotification.id,
            recipientId: newNotification.personId,
            notificationType: newNotification.type,
            authorId: userId,
        }, 'Created individual notification');
        // Send external notifications for the created notification
        try {
            const result = await sendExternalNotifications(newNotification);
            if (result.error) {
                notificationLogger.error('External notification failed in createNotification', {
                    notificationId: newNotification.id,
                    error: result.error,
                });
            }
            else {
                notificationLogger.info('External notification sent successfully in createNotification', {
                    notificationId: newNotification.id,
                    result: result.success,
                });
            }
        }
        catch (error) {
            notificationLogger.error('Failed to send external notifications in createNotification', {
                notificationId: newNotification.id,
                error: error instanceof Error ? error.message : String(error),
                errorStack: error instanceof Error ? error.stack : undefined,
            });
        }
        revalidatePath('/');
        const personQueryDefinition = getNotificationQuery(newNotification.personId);
        getPusherServer().trigger(personQueryDefinition.pusherChannel, personQueryDefinition.pusherEvent, {
            message: 'Data updated',
        });
        return { success: newNotification };
    }
    catch (_e) {
        return {
            error: 'Notification not found',
        };
    }
};
export const createEventNotifs = async ({ eventId, type, postId, datetime, }) => {
    try {
        const { userId } = await auth();
        if (!userId) {
            return {
                error: 'User not found',
            };
        }
        const event = await db.event.findUnique({
            where: {
                id: eventId,
            },
            include: {
                memberships: true,
            },
        });
        if (!event) {
            return {
                error: 'Event not found',
            };
        }
        // make sure user is in the event
        const membership = event.memberships.find(membership => membership.personId === userId);
        if (!membership) {
            return {
                error: 'User not in event',
            };
        }
        const personIds = event.memberships
            .filter(membership => membership.personId !== userId)
            .map(membership => membership.personId);
        notificationLogger.info({
            eventId,
            notificationType: type,
            authorId: userId,
            recipientCount: personIds.length,
            recipientIds: personIds,
        }, 'Creating event notifications');
        // Create notifications efficiently with createMany
        await db.notification.createMany({
            data: personIds.map(personId => ({
                personId,
                eventId,
                postId,
                type: type,
                authorId: userId,
                datetime,
            })),
        });
        // Fetch the created notifications with full details for external notifications
        const createdNotifications = await db.notification.findMany({
            where: {
                personId: { in: personIds },
                eventId,
                type,
                authorId: userId,
                createdAt: { gte: new Date(Date.now() - 1000) }, // Created within last second
            },
            include: {
                person: true,
                event: true,
                post: true,
                author: true,
            },
        });
        notificationLogger.info('Fetched created notifications for external processing', {
            totalNotifications: createdNotifications.length,
            notificationIds: createdNotifications.map(n => n.id),
            notificationType: type,
            eventId,
        });
        // Send external notifications for each created notification
        for (const notification of createdNotifications) {
            notificationLogger.debug('Processing external notification for createEventNotifs', {
                notificationId: notification.id,
                recipientId: notification.personId,
                notificationType: notification.type,
            });
            try {
                const result = await sendExternalNotifications(notification);
                if (result.error) {
                    notificationLogger.error('External notification failed in createEventNotifs', {
                        notificationId: notification.id,
                        error: result.error,
                    });
                }
                else {
                    notificationLogger.info('External notification sent successfully in createEventNotifs', {
                        notificationId: notification.id,
                        result: result.success,
                    });
                }
            }
            catch (error) {
                notificationLogger.error('Failed to send external notifications in createEventNotifs', {
                    notificationId: notification.id,
                    error: error instanceof Error ? error.message : String(error),
                    errorStack: error instanceof Error ? error.stack : undefined,
                });
            }
        }
        revalidatePath('/');
        const events = [];
        for (const personId of personIds) {
            const notificationQueryDefinition = getNotificationQuery(personId);
            events.push({
                channel: notificationQueryDefinition.pusherChannel,
                name: notificationQueryDefinition.pusherEvent,
                data: { message: 'Data updated' },
            });
        }
        if (events.length > 0) {
            await getPusherServer().triggerBatch(events);
        }
        else {
            notificationLogger.debug('No events to send for notification update');
        }
        return {
            success: createdNotifications.length,
        };
    }
    catch (_e) {
        notificationLogger.error({
            error: _e instanceof Error ? _e.message : String(_e),
            errorStack: _e instanceof Error ? _e.stack : undefined,
            eventId,
            type,
        }, 'Error in createEventNotifs function');
        return {
            error: 'Notification not found',
        };
    }
};
export const createEventModNotifs = async ({ eventId, type, rsvp, }) => {
    try {
        const { userId } = await auth();
        if (!userId) {
            return {
                error: 'User not found',
            };
        }
        const event = await db.event.findUnique({
            where: {
                id: eventId,
            },
            include: {
                memberships: true,
            },
        });
        if (!event) {
            return {
                error: 'Event not found',
            };
        }
        // make sure user is in the event
        const membership = event.memberships.find(membership => membership.personId === userId);
        if (!membership) {
            return {
                error: 'User not in event',
            };
        }
        const personIds = event.memberships
            .filter(membership => membership.personId !== userId && membership.role !== 'ATTENDEE')
            .map(membership => membership.personId);
        notificationLogger.info({
            eventId,
            notificationType: type,
            authorId: userId,
            recipientCount: personIds.length,
            recipientIds: personIds,
            rsvp,
        }, 'Creating event modification notifications');
        // Create notifications efficiently with createMany
        await db.notification.createMany({
            data: personIds.map(personId => ({
                personId,
                eventId,
                type: type,
                authorId: userId,
                rsvp,
            })),
        });
        // Fetch the created notifications with full details for external notifications
        const createdNotifications = await db.notification.findMany({
            where: {
                personId: { in: personIds },
                eventId,
                type,
                authorId: userId,
                createdAt: { gte: new Date(Date.now() - 1000) }, // Created within last second
            },
            include: {
                person: true,
                event: true,
                post: true,
                author: true,
            },
        });
        notificationLogger.info('Fetched created notifications for external processing in createEventModNotifs', {
            totalNotifications: createdNotifications.length,
            notificationIds: createdNotifications.map(n => n.id),
            notificationType: type,
            eventId,
        });
        // Send external notifications for each created notification
        for (const notification of createdNotifications) {
            notificationLogger.debug('Processing external notification for createEventModNotifs', {
                notificationId: notification.id,
                recipientId: notification.personId,
                notificationType: notification.type,
            });
            try {
                const result = await sendExternalNotifications(notification);
                if (result.error) {
                    notificationLogger.error('External notification failed in createEventModNotifs', {
                        notificationId: notification.id,
                        error: result.error,
                    });
                }
                else {
                    notificationLogger.info('External notification sent successfully in createEventModNotifs', {
                        notificationId: notification.id,
                        result: result.success,
                    });
                }
            }
            catch (error) {
                notificationLogger.error('Failed to send external notifications in createEventModNotifs', {
                    notificationId: notification.id,
                    error: error instanceof Error ? error.message : String(error),
                    errorStack: error instanceof Error ? error.stack : undefined,
                });
            }
        }
        revalidatePath('/');
        const events = [];
        for (const personId of personIds) {
            const notificationQueryDefinition = getNotificationQuery(personId);
            events.push({
                channel: notificationQueryDefinition.pusherChannel,
                name: notificationQueryDefinition.pusherEvent,
                data: { message: 'Data updated' },
            });
        }
        if (events.length > 0) {
            await getPusherServer().triggerBatch(events);
        }
        else {
            notificationLogger.debug('No events to send for event modification notification');
        }
        return {
            success: createdNotifications.length,
        };
    }
    catch (_e) {
        notificationLogger.error({
            error: _e instanceof Error ? _e.message : String(_e),
            errorStack: _e instanceof Error ? _e.stack : undefined,
            eventId,
            type,
        }, 'Error in createEventModNotifs function');
        return {
            error: 'Notification not found',
        };
    }
};
export const createPostNotifs = async ({ postId, type, }) => {
    try {
        const { userId } = await auth();
        if (!userId) {
            return {
                error: 'User not found',
            };
        }
        const post = await db.post.findUnique({
            where: {
                id: postId,
            },
            include: {
                replies: true,
                event: {
                    include: {
                        memberships: true,
                    },
                },
            },
        });
        if (!post) {
            return {
                error: 'Post not found',
            };
        }
        // make sure user is in the event
        const membership = post.event.memberships.find(membership => membership.personId === userId);
        if (!membership) {
            return {
                error: 'User not in event',
            };
        }
        const personIds = Array.from(new Set([...post.replies.map(reply => reply.authorId), post.authorId])).filter(personId => personId !== userId);
        notificationLogger.info({
            postId,
            notificationType: type,
            authorId: userId,
            recipientCount: personIds.length,
            recipientIds: personIds,
            eventId: post.eventId,
        }, 'Creating post notifications');
        // Create notifications efficiently with createMany
        await db.notification.createMany({
            data: personIds.map(personId => ({
                personId,
                postId,
                type: type,
                authorId: userId,
                eventId: post.eventId,
            })),
        });
        // Fetch the created notifications with full details for external notifications
        const createdNotifications = await db.notification.findMany({
            where: {
                personId: { in: personIds },
                postId,
                type,
                authorId: userId,
                createdAt: { gte: new Date(Date.now() - 1000) }, // Created within last second
            },
            include: {
                person: true,
                event: true,
                post: true,
                author: true,
            },
        });
        notificationLogger.info('Fetched created notifications for external processing in createPostNotifs', {
            totalNotifications: createdNotifications.length,
            notificationIds: createdNotifications.map(n => n.id),
            notificationType: type,
            postId,
        });
        // Send external notifications for each created notification
        for (const notification of createdNotifications) {
            notificationLogger.debug('Processing external notification for createPostNotifs', {
                notificationId: notification.id,
                recipientId: notification.personId,
                notificationType: notification.type,
            });
            try {
                const result = await sendExternalNotifications(notification);
                if (result.error) {
                    notificationLogger.error('External notification failed in createPostNotifs', {
                        notificationId: notification.id,
                        error: result.error,
                    });
                }
                else {
                    notificationLogger.info('External notification sent successfully in createPostNotifs', {
                        notificationId: notification.id,
                        result: result.success,
                    });
                }
            }
            catch (error) {
                notificationLogger.error('Failed to send external notifications in createPostNotifs', {
                    notificationId: notification.id,
                    error: error instanceof Error ? error.message : String(error),
                    errorStack: error instanceof Error ? error.stack : undefined,
                });
            }
        }
        revalidatePath('/');
        const events = [];
        for (const personId of personIds) {
            const notificationQueryDefinition = getNotificationQuery(personId);
            events.push({
                channel: notificationQueryDefinition.pusherChannel,
                name: notificationQueryDefinition.pusherEvent,
                data: { message: 'Data updated' },
            });
        }
        if (events.length > 0) {
            await getPusherServer().triggerBatch(events);
        }
        else {
            notificationLogger.debug('No events to send for post notification');
        }
        return {
            success: createdNotifications.length,
        };
    }
    catch (_e) {
        notificationLogger.error({
            error: _e instanceof Error ? _e.message : String(_e),
            errorStack: _e instanceof Error ? _e.stack : undefined,
            postId,
            type,
        }, 'Error in createPostNotifs function');
        return {
            error: 'Notification not found',
        };
    }
};
export const sendExternalNotifications = async (notification) => {
    try {
        const userId = notification.personId;
        notificationLogger.info({
            notificationId: notification.id,
            userId,
            notificationType: notification.type,
        }, 'Starting sendExternalNotifications');
        if (!userId) {
            notificationLogger.error({
                notificationId: notification.id,
            }, 'User ID not found in notification');
            return {
                error: 'User not found',
            };
        }
        // Route given notification to given services based on user's notification settings
        const person = await db.person.findUnique({
            where: {
                id: userId,
            },
            include: {
                settings: {
                    include: {
                        notificationMethods: {
                            include: {
                                notifications: true,
                            },
                        },
                    },
                },
            },
        });
        notificationLogger.debug({
            notificationId: notification.id,
            personFound: !!person,
            settingsFound: !!person?.settings,
            notificationMethodsCount: person?.settings?.notificationMethods?.length || 0,
        }, 'Retrieved person and settings');
        if (!person) {
            notificationLogger.error({
                notificationId: notification.id,
                userId,
            }, 'Person not found');
            return {
                error: 'Person not found',
            };
        }
        if (!person.settings) {
            notificationLogger.error({
                notificationId: notification.id,
                userId,
            }, 'Settings not found for person');
            return {
                error: 'Settings not found',
            };
        }
        const methods = person.settings.notificationMethods.filter(method => method.notifications.some(notif => notif.notificationType === notification.type && notif.enabled));
        notificationLogger.info({
            notificationId: notification.id,
            totalMethods: person.settings.notificationMethods.length,
            enabledMethods: methods.length,
            allMethods: person.settings.notificationMethods.map(m => ({
                type: m.type,
                value: m.value,
                notificationConfigs: m.notifications.map(n => ({
                    type: n.notificationType,
                    enabled: n.enabled,
                })),
            })),
            enabledMethodTypes: methods.map(m => m.type),
        }, 'Filtered notification methods');
        // Handle each method
        notificationLogger.debug({
            notificationId: notification.id,
            notificationType: notification.type,
            methodsCount: methods.length,
            methodTypes: methods.map(m => m.type),
        }, 'Processing notification methods');
        const results = [];
        for (const method of methods.filter(m => m.enabled)) {
            notificationLogger.debug({
                methodType: method.type,
                methodValue: method.value,
                notificationId: notification.id,
            }, 'Processing method');
            switch (method.type) {
                case 'EMAIL': {
                    emailLogger.info({
                        recipientEmail: method.value,
                        notificationId: notification.id,
                        notificationType: notification.type,
                    }, 'Sending email notification');
                    const res = await sendEmailNotification({ notification, method });
                    if (res.error) {
                        emailLogger.error({
                            error: res.error,
                            recipientEmail: method.value,
                            notificationId: notification.id,
                        }, 'Failed to send email notification');
                        results.push({ method: 'EMAIL', success: false, error: res.error });
                    }
                    else {
                        emailLogger.info({
                            result: res.success,
                            recipientEmail: method.value,
                            notificationId: notification.id,
                        }, 'Email notification sent successfully');
                        results.push({ method: 'EMAIL', success: true });
                    }
                    break;
                }
                case 'PUSH': {
                    // Send push notification
                    notificationLogger.info({
                        recipientUserId: method.value,
                        notificationId: notification.id,
                        notificationType: notification.type,
                    }, 'Sending push notification');
                    const pushResult = await sendPushNotificationToUser({
                        notification,
                        targetUserId: method.value,
                    });
                    if (pushResult.error) {
                        notificationLogger.error({
                            error: pushResult.error,
                            recipientUserId: method.value,
                            notificationId: notification.id,
                        }, 'Failed to send push notification');
                        results.push({
                            method: 'PUSH',
                            success: false,
                            error: pushResult.error,
                        });
                    }
                    else {
                        notificationLogger.info({
                            result: pushResult.success,
                            recipientUserId: method.value,
                            notificationId: notification.id,
                        }, 'Push notification sent successfully');
                        results.push({ method: 'PUSH', success: true });
                    }
                    break;
                }
                case 'WEBHOOK': {
                    const webhookResult = await sendWebhookNotification({
                        notification,
                        method,
                    });
                    if (webhookResult.error) {
                        results.push({
                            method: 'WEBHOOK',
                            success: false,
                            error: webhookResult.error,
                        });
                    }
                    else {
                        results.push({ method: 'WEBHOOK', success: true });
                    }
                    break;
                }
                default:
                    notificationLogger.warn({
                        methodType: method.type,
                        notificationId: notification.id,
                    }, 'Unknown notification method');
                    results.push({
                        method: method.type,
                        success: false,
                        error: 'Unknown method type',
                    });
            }
        }
        const failedMethods = results.filter(r => !r.success);
        const successfulMethods = results.filter(r => r.success);
        notificationLogger.info({
            notificationId: notification.id,
            methodsProcessed: methods.length,
            successfulMethods: successfulMethods.length,
            failedMethods: failedMethods.length,
            results: results,
        }, 'Completed processing all notification methods');
        if (failedMethods.length > 0 && successfulMethods.length === 0) {
            // All methods failed
            return {
                error: `All notification methods failed: ${failedMethods.map(f => `${f.method}: ${f.error}`).join(', ')}`,
            };
        }
        else if (failedMethods.length > 0) {
            // Some methods failed, some succeeded
            return {
                success: `Partial success: ${successfulMethods.length}/${methods.length} methods succeeded. Failed: ${failedMethods.map(f => f.method).join(', ')}`,
            };
        }
        else {
            // All methods succeeded
            return {
                success: `All ${methods.length} notification methods sent successfully`,
            };
        }
    }
    catch (_e) {
        notificationLogger.error({
            notificationId: notification.id,
            error: _e instanceof Error ? _e.message : String(_e),
            errorStack: _e instanceof Error ? _e.stack : undefined,
        }, 'Error in sendExternalNotifications');
        return {
            error: 'Notification could not be sent',
        };
    }
};
const sendEmailNotification = async ({ notification, method, }) => {
    try {
        // turn notification details into email title and content
        if (!notification) {
            emailLogger.error({
                methodValue: method.value,
            }, 'Notification details missing');
            return {
                error: 'Notification details are required',
            };
        }
        let emailSubject;
        try {
            emailSubject = getNotificationSubject(notification);
            emailLogger.debug({
                notificationId: notification.id,
                subject: emailSubject,
                notificationType: notification.type,
            }, 'Generated email subject');
        }
        catch (error) {
            emailLogger.error({
                notificationId: notification.id,
                notificationType: notification.type,
                error: error instanceof Error ? error.message : String(error),
                errorStack: error instanceof Error ? error.stack : undefined,
            }, 'Failed to generate email subject');
            throw new Error(`Failed to generate email subject: ${error instanceof Error ? error.message : String(error)}`);
        }
        const fromEmail = getRESEND_FROM_EMAIL();
        emailLogger.debug({
            notificationId: notification.id,
            recipientEmail: method.value,
            fromEmail: fromEmail,
            subject: emailSubject,
            notificationType: notification.type,
            hasEvent: !!notification.event,
            hasPost: !!notification.post,
            hasAuthor: !!notification.author,
        }, 'Preparing email notification');
        let emailData, emailError;
        try {
            emailLogger.info({
                notificationId: notification.id,
                fromEmail,
                toEmail: method.value,
                subject: emailSubject,
                notificationType: notification.type,
                hasEvent: !!notification.event,
                hasPost: !!notification.post,
                hasAuthor: !!notification.author,
                eventTitle: notification.event?.title,
                postTitle: notification.post?.title,
                authorName: notification.author?.firstName ||
                    notification.author?.lastName ||
                    notification.author?.username,
            }, 'Calling Resend API');
            const result = await resend.emails.send({
                from: fromEmail,
                to: method.value,
                subject: emailSubject,
                react: NotificationEmailTemplate({
                    notification: createNotificationFeedDTO(notification),
                }),
            });
            emailData = result.data;
            emailError = result.error;
            emailLogger.info({
                notificationId: notification.id,
                hasData: !!emailData,
                hasError: !!emailError,
                emailId: emailData?.id || 'none',
                recipientEmail: method.value,
                subject: emailSubject,
                resultData: emailData,
                resultError: emailError,
            }, 'Resend API call completed');
        }
        catch (apiError) {
            emailLogger.error({
                notificationId: notification.id,
                recipientEmail: method.value,
                fromEmail,
                subject: emailSubject,
                notificationType: notification.type,
                error: apiError instanceof Error ? apiError.message : String(apiError),
                errorStack: apiError instanceof Error ? apiError.stack : undefined,
                errorName: apiError instanceof Error ? apiError.name : 'Unknown',
                errorCode: apiError?.code,
                errorType: typeof apiError,
                fullError: apiError,
                hasEvent: !!notification.event,
                hasPost: !!notification.post,
                hasAuthor: !!notification.author,
            }, 'Exception during Resend API call');
            throw new Error(`Resend API call failed: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
        }
        if (emailError) {
            emailLogger.error({
                notificationId: notification.id,
                recipientEmail: method.value,
                resendError: emailError,
                errorMessage: emailError.message || 'Unknown error',
            }, 'Resend API returned error');
            return {
                error: `Failed to send email: ${emailError.message || 'Unknown error'}`,
            };
        }
        if (!emailData) {
            emailLogger.error({
                notificationId: notification.id,
                recipientEmail: method.value,
            }, 'No data returned from Resend API');
            return {
                error: 'No data returned from email service',
            };
        }
        emailLogger.info({
            notificationId: notification.id,
            recipientEmail: method.value,
            emailId: emailData.id,
        }, 'Email sent successfully via Resend');
        return {
            success: emailData,
        };
    }
    catch (error) {
        emailLogger.error({
            notificationId: notification?.id || 'unknown',
            recipientEmail: method?.value || 'unknown',
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
            errorName: error instanceof Error ? error.name : 'Unknown',
        }, 'Exception in sendEmailNotification');
        return {
            error: `Email sending failed: ${error instanceof Error ? error.message : String(error)}`,
        };
    }
};
const sendWebhookNotification = async ({ notification, method, }) => {
    try {
        notificationLogger.info({
            webhookUrl: method.value,
            webhookFormat: method.webhookFormat,
            notificationId: notification.id,
            notificationType: notification.type,
        }, 'Sending webhook notification');
        // Generate webhook payload using the template system
        const { generateWebhookPayload } = await import('./webhook-templates');
        const { payload, headers: defaultHeaders } = generateWebhookPayload(notification, method.webhookFormat || 'GENERIC', method.customTemplate || undefined);
        // Parse custom headers if provided
        let customHeaders = {};
        if (method.webhookHeaders) {
            try {
                // Convert webhookHeaders to string if it's not already a string
                const headersStr = typeof method.webhookHeaders === 'string'
                    ? method.webhookHeaders
                    : JSON.stringify(method.webhookHeaders);
                customHeaders = JSON.parse(headersStr);
            }
            catch (error) {
                notificationLogger.warn({
                    webhookHeaders: method.webhookHeaders,
                    error: error instanceof Error ? error.message : String(error),
                }, 'Failed to parse webhook headers, using default headers only');
            }
        }
        // Merge headers (custom headers override defaults)
        const finalHeaders = {
            ...defaultHeaders,
            ...customHeaders,
        };
        // Send the webhook
        const response = await fetch(method.value, {
            method: 'POST',
            headers: finalHeaders,
            body: payload,
        });
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            notificationLogger.error({
                webhookUrl: method.value,
                status: response.status,
                statusText: response.statusText,
                responseBody: errorText,
                notificationId: notification.id,
            }, 'Webhook notification failed');
            return {
                error: `HTTP ${response.status}: ${response.statusText}`,
            };
        }
        else {
            notificationLogger.info({
                webhookUrl: method.value,
                status: response.status,
                notificationId: notification.id,
            }, 'Webhook notification sent successfully');
            return {
                success: 'Webhook notification sent successfully',
            };
        }
    }
    catch (error) {
        notificationLogger.error({
            webhookUrl: method.value,
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
            notificationId: notification.id,
        }, 'Failed to send webhook notification');
        return {
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};
const sendPushNotificationToUser = async ({ notification, targetUserId, }) => {
    try {
        // Generate push notification payload from notification data
        const payload = generatePushNotificationPayload(notification);
        notificationLogger.info({
            targetUserId,
            notificationId: notification.id,
            notificationType: notification.type,
            title: payload.title,
            body: payload.body,
        }, 'Sending push notification via Pusher Beams');
        // Use Pusher Beams to send notification to authenticated user
        const { sendPusherBeamsNotification } = await import('./pusher-beams-server');
        const result = await sendPusherBeamsNotification(targetUserId, {
            title: payload.title,
            body: payload.body,
            data: payload.data,
            url: payload.url,
            tag: payload.tag,
        });
        if (result.success) {
            notificationLogger.info({
                targetUserId,
                notificationId: notification.id,
            }, 'Push notification sent successfully via Pusher Beams');
            return {
                success: `Push notification sent successfully`,
            };
        }
        else {
            notificationLogger.error({
                targetUserId,
                notificationId: notification.id,
                error: result.error,
            }, 'Failed to send push notification via Pusher Beams');
            return {
                error: result.error || 'Failed to send push notification',
            };
        }
    }
    catch (error) {
        notificationLogger.error({
            targetUserId,
            notificationId: notification.id,
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
        }, 'Exception in sendPushNotificationToUser');
        return {
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};
const generatePushNotificationPayload = (notification) => {
    const { event, post, type, datetime, author, rsvp } = notification;
    // Generate notification link
    const getNotificationLink = () => {
        const baseUrl = getNEXT_PUBLIC_BASE_URL();
        switch (type) {
            case 'EVENT_EDITED':
            case 'DATE_CHANGED':
            case 'DATE_CHOSEN':
            case 'DATE_RESET':
            case 'USER_JOINED':
            case 'USER_LEFT':
            case 'USER_PROMOTED':
            case 'USER_DEMOTED':
            case 'USER_RSVP':
                return `${baseUrl}/event/${event?.id}`;
            case 'NEW_POST':
            case 'NEW_REPLY':
                return `${baseUrl}/post/${post?.id}`;
            default:
                return `${baseUrl}/event/${event?.id}`;
        }
    };
    // Generate notification title and body
    const getNotificationTitleAndBody = () => {
        const authorName = author?.firstName || author?.lastName || author?.username || 'Someone';
        switch (type) {
            case 'EVENT_EDITED':
                return {
                    title: `Event Updated: ${event?.title}`,
                    body: `The details of ${event?.title} have been updated.`,
                };
            case 'DATE_CHANGED':
                return {
                    title: `Date Changed: ${event?.title}`,
                    body: `The date of ${event?.title} has changed to ${datetime ? new Date(datetime).toLocaleString() : 'a new time'}.`,
                };
            case 'DATE_CHOSEN':
                return {
                    title: `Date Set: ${event?.title}`,
                    body: `${event?.title} will be held on ${datetime ? new Date(datetime).toLocaleString() : 'the chosen date'}.`,
                };
            case 'DATE_RESET':
                return {
                    title: `New Poll: ${event?.title}`,
                    body: `A new poll has started for the date of ${event?.title}.`,
                };
            case 'NEW_POST':
                return {
                    title: `New Post: ${post?.title}`,
                    body: `${authorName} created a new post in ${event?.title}.`,
                };
            case 'NEW_REPLY':
                return {
                    title: `New Reply: ${post?.title}`,
                    body: `${authorName} replied to a post in ${event?.title}.`,
                };
            case 'USER_JOINED':
                return {
                    title: `User Joined: ${event?.title}`,
                    body: `${authorName} has joined ${event?.title}.`,
                };
            case 'USER_LEFT':
                return {
                    title: `User Left: ${event?.title}`,
                    body: `${authorName} has left ${event?.title}.`,
                };
            case 'USER_PROMOTED':
                return {
                    title: `Promoted: ${event?.title}`,
                    body: `You are now a Moderator of ${event?.title}.`,
                };
            case 'USER_DEMOTED':
                return {
                    title: `Role Changed: ${event?.title}`,
                    body: `You are no longer a Moderator of ${event?.title}.`,
                };
            case 'USER_RSVP':
                return {
                    title: `New RSVP: ${event?.title}`,
                    body: `${authorName} has RSVP'd ${rsvp || 'to'} ${event?.title}.`,
                };
            default:
                return {
                    title: 'Groupi Notification',
                    body: 'You have a new notification from Groupi.',
                };
        }
    };
    const { title, body } = getNotificationTitleAndBody();
    return {
        title,
        body,
        data: {
            notificationId: notification.id,
            type: notification.type,
            eventId: event?.id,
            postId: post?.id,
            url: getNotificationLink(),
        },
        url: getNotificationLink(),
        tag: `groupi-${notification.type}-${event?.id || post?.id}`,
    };
};
