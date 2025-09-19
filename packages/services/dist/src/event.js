'use server';
import { db } from './db';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';
import { getPusherServer } from './pusher-server';
import { getEventQuery, getPersonQuery } from '@groupi/schema/queries';
import { eventLogger } from './logger';
import { createEventModNotifs, createEventNotifs } from './notification';
import { createEventDetailsDTO, createEventPageDTO, createEventMemberAvailabilityDTO, } from '@groupi/schema';
export const fetchEventData = cache(async (eventId) => {
    try {
        const event = await db.event.findUnique({
            where: {
                id: eventId,
            },
            include: {
                posts: {
                    include: {
                        replies: {
                            include: {
                                author: true,
                            },
                        },
                        author: true,
                    },
                },
                memberships: {
                    include: {
                        person: true,
                        availabilities: {
                            include: {
                                potentialDateTime: true,
                            },
                        },
                        event: true,
                    },
                },
            },
        });
        if (!event)
            return { error: 'Event not found' };
        const { userId } = await auth();
        if (!userId)
            return { error: 'User not found' };
        if (!event.memberships.find(membership => membership.personId === userId))
            return { error: 'You are not a member of this event' };
        const userMembership = event.memberships.find(membership => membership.personId === userId);
        if (!userMembership)
            return { error: 'Role not found' };
        // Transform to DTOs
        const eventDTO = createEventDetailsDTO(event, userId);
        const userMembershipDTO = createEventMemberAvailabilityDTO(userMembership);
        return {
            success: {
                event: eventDTO,
                userMembership: userMembershipDTO,
                userId,
            },
        };
    }
    catch {
        return { error: 'Could not fetch event data' };
    }
});
export const fetchEventPageData = cache(async (eventId) => {
    try {
        const event = await db.event.findUnique({
            where: {
                id: eventId,
            },
            include: {
                posts: {
                    include: {
                        replies: {
                            include: {
                                author: true,
                            },
                        },
                        author: true,
                    },
                },
                memberships: {
                    include: {
                        person: true,
                        availabilities: {
                            include: {
                                potentialDateTime: true,
                            },
                        },
                        event: true,
                    },
                },
            },
        });
        if (!event)
            return { error: 'Event not found' };
        const { userId } = await auth();
        if (!userId)
            return { error: 'User not found' };
        if (!event.memberships.find(membership => membership.personId === userId))
            return { error: 'You are not a member of this event' };
        const userMembership = event.memberships.find(membership => membership.personId === userId);
        if (!userMembership)
            return { error: 'Role not found' };
        // Transform to DTOs
        const eventDTO = createEventPageDTO(event, userId);
        const userMembershipDTO = createEventMemberAvailabilityDTO(userMembership);
        return {
            success: {
                event: eventDTO,
                userMembership: userMembershipDTO,
                userId,
            },
        };
    }
    catch {
        return { error: 'Could not fetch event page data' };
    }
});
export async function createEvent({ title, description, location, dateTime, potentialDateTimes, }) {
    try {
        const { userId } = await auth();
        if (!userId)
            return { error: 'User not found' };
        const event = await db.event.create({
            data: {
                title,
                description,
                location,
                chosenDateTime: dateTime,
                memberships: {
                    create: {
                        personId: userId,
                        role: 'ORGANIZER',
                        rsvpStatus: 'YES',
                    },
                },
            },
            include: {
                memberships: true,
            },
        });
        if (!event)
            return { error: 'Event not created' };
        if (potentialDateTimes) {
            eventLogger.debug({
                eventId: event.id,
                dateCount: potentialDateTimes.length,
            }, 'Adding potential date times to event');
            const eventRes = await db.event.update({
                where: {
                    id: event.id,
                },
                data: {
                    potentialDateTimes: {
                        createMany: {
                            data: potentialDateTimes.map(dateTime => ({
                                dateTime,
                            })),
                        },
                    },
                },
                include: {
                    potentialDateTimes: true,
                },
            });
            if (!eventRes) {
                await db.event.delete({
                    where: {
                        id: event.id,
                    },
                });
                return { error: 'Could not update event' };
            }
            for (const potentialDateTime of eventRes.potentialDateTimes) {
                const eventRes = await db.availability.create({
                    data: {
                        membershipId: event.memberships[0].id,
                        status: 'YES',
                        potentialDateTimeId: potentialDateTime.id,
                    },
                });
                if (!eventRes) {
                    await db.event.delete({
                        where: {
                            id: event.id,
                        },
                    });
                    return { error: 'Could not update availability' };
                }
            }
        }
        return { success: event };
    }
    catch (error) {
        eventLogger.error({
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
        }, 'Failed to create event');
        return { error: 'Could not create event' };
    }
}
export async function updateEventDetails({ id, title, description, location, }) {
    try {
        const { userId } = await auth();
        if (!userId)
            return { error: 'User not found' };
        const event = await db.event.findUnique({
            where: {
                id,
            },
            include: {
                memberships: true,
                potentialDateTimes: true,
            },
        });
        if (!event)
            return { error: 'Event not found' };
        const userMembership = event.memberships.find(membership => membership.personId === userId);
        if (!userMembership)
            return { error: 'User not a member of this event' };
        if (userMembership.role !== 'ORGANIZER')
            return { error: 'You do not have permission to edit this event' };
        const updatedEvent = await db.event.update({
            where: {
                id,
            },
            data: {
                title,
                description,
                location,
                updatedAt: new Date(),
            },
        });
        if (!updatedEvent)
            return { error: 'Could not update event' };
        revalidatePath('/');
        const eventQueryDefinition = getEventQuery(id);
        const events = [
            {
                channel: eventQueryDefinition.pusherChannel,
                name: eventQueryDefinition.pusherEvent,
                data: { message: 'Event Data updated' },
            },
        ];
        for (const membership of event.memberships) {
            const personQueryDefinition = getPersonQuery(membership.personId);
            events.push({
                channel: personQueryDefinition.pusherChannel,
                name: personQueryDefinition.pusherEvent,
                data: { message: 'Data updated' },
            });
        }
        if (events.length > 0) {
            await getPusherServer().triggerBatch(events);
        }
        else {
            eventLogger.debug('No events to send for event update');
        }
        await createEventNotifs({ eventId: id, type: 'EVENT_EDITED' });
        return { success: updatedEvent };
    }
    catch (error) {
        eventLogger.error({
            eventId: id,
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
        }, 'Failed to update event details');
        return { error: 'Could not update event' };
    }
}
export async function updateEventDateTime({ eventId, dateTime, }) {
    try {
        const { userId } = await auth();
        if (!userId)
            return { error: 'User not found' };
        const event = await db.event.findUnique({
            where: {
                id: eventId,
            },
            include: {
                memberships: true,
            },
        });
        if (!event)
            return { error: 'Event not found' };
        const userMembership = event.memberships.find(membership => membership.personId === userId);
        if (!userMembership)
            return { error: 'User not a member of this event' };
        if (userMembership.role !== 'ORGANIZER')
            return { error: 'You do not have permission to edit this event' };
        const updatedEvent = await db.event.update({
            where: {
                id: eventId,
            },
            data: {
                chosenDateTime: dateTime,
            },
        });
        await db.membership.updateMany({
            where: {
                eventId,
                role: {
                    not: 'ORGANIZER',
                },
            },
            data: {
                rsvpStatus: 'PENDING',
            },
        });
        if (!updatedEvent)
            return { error: 'Could not update event' };
        const eventQueryDefinition = getEventQuery(eventId);
        const events = [
            {
                channel: eventQueryDefinition.pusherChannel,
                name: eventQueryDefinition.pusherEvent,
                data: { message: 'Data updated' },
            },
        ];
        for (const membership of event.memberships) {
            const personQueryDefinition = getPersonQuery(membership.personId);
            events.push({
                channel: personQueryDefinition.pusherChannel,
                name: personQueryDefinition.pusherEvent,
                data: { message: 'Data updated' },
            });
        }
        if (events.length > 0) {
            await getPusherServer().triggerBatch(events);
        }
        else {
            eventLogger.debug('No events to send for event date update');
        }
        revalidatePath('/');
        await createEventNotifs({
            eventId,
            type: 'DATE_CHANGED',
            datetime: new Date(dateTime),
        });
        return { success: updatedEvent };
    }
    catch (error) {
        eventLogger.error({
            eventId,
            dateTime,
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
        }, 'Failed to update event date/time');
        return { error: 'Could not update event' };
    }
}
export async function updateEventPotentialDateTimes({ eventId, potentialDateTimes, }) {
    try {
        const { userId } = await auth();
        if (!userId)
            return { error: 'User not found' };
        const event = await db.event.findUnique({
            where: {
                id: eventId,
            },
            include: {
                memberships: true,
                potentialDateTimes: true,
            },
        });
        if (!event)
            return { error: 'Event not found' };
        const userMembership = event.memberships.find(membership => membership.personId === userId);
        if (!userMembership)
            return { error: 'User not a member of this event' };
        if (userMembership.role !== 'ORGANIZER')
            return { error: 'You do not have permission to edit this event' };
        const updatedEvent = await db.event.update({
            where: {
                id: eventId,
            },
            data: {
                potentialDateTimes: {
                    deleteMany: {},
                    createMany: {
                        data: potentialDateTimes.map(dateTime => ({
                            dateTime,
                        })),
                    },
                },
                chosenDateTime: null,
            },
            include: {
                potentialDateTimes: true,
            },
        });
        if (!updatedEvent)
            return { error: 'Could not update event' };
        for (const potentialDateTime of updatedEvent.potentialDateTimes) {
            const eventRes = await db.availability.create({
                data: {
                    membershipId: userMembership.id,
                    status: 'YES',
                    potentialDateTimeId: potentialDateTime.id,
                },
            });
            if (!eventRes) {
                return { error: 'Could not update availability' };
            }
        }
        await db.membership.updateMany({
            where: {
                eventId,
                role: {
                    not: 'ORGANIZER',
                },
            },
            data: {
                rsvpStatus: 'PENDING',
            },
        });
        revalidatePath('/');
        const eventQueryDefinition = getEventQuery(eventId);
        const events = [
            {
                channel: eventQueryDefinition.pusherChannel,
                name: eventQueryDefinition.pusherEvent,
                data: { message: 'Data updated' },
            },
        ];
        for (const membership of event.memberships) {
            const personQueryDefinition = getPersonQuery(membership.personId);
            events.push({
                channel: personQueryDefinition.pusherChannel,
                name: personQueryDefinition.pusherEvent,
                data: { message: 'Data updated' },
            });
        }
        if (events.length > 0) {
            await getPusherServer().triggerBatch(events);
        }
        else {
            eventLogger.debug('No events to send for event date reset');
        }
        await createEventNotifs({ eventId, type: 'DATE_RESET' });
        return { success: updatedEvent };
    }
    catch (error) {
        eventLogger.error({
            eventId,
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
        }, 'Failed to reset event date');
        return { error: 'Could not update event' };
    }
}
export async function deleteEvent(eventId) {
    try {
        const { userId } = await auth();
        if (!userId)
            return { error: 'User not found' };
        const event = await db.event.findUnique({
            where: {
                id: eventId,
            },
            include: {
                memberships: true,
            },
        });
        if (!event)
            return { error: 'Event not found' };
        const userMembership = event.memberships.find(membership => membership.personId === userId);
        if (!userMembership)
            return { error: 'User not a member of this event' };
        if (userMembership.role !== 'ORGANIZER')
            return { error: 'You do not have permission to delete this event' };
        await db.event.delete({
            where: {
                id: eventId,
            },
        });
        for (const membership of event.memberships) {
            const personQueryDefinition = getPersonQuery(membership.personId);
            getPusherServer().trigger(personQueryDefinition.pusherChannel, personQueryDefinition.pusherEvent, { message: 'Data updated' });
        }
        revalidatePath('/');
        return { success: 'Event deleted' };
    }
    catch (error) {
        eventLogger.error({
            eventId,
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
        }, 'Failed to delete event');
        return { error: 'Could not delete event' };
    }
}
export async function leaveEvent(eventId) {
    try {
        const { userId } = await auth();
        if (!userId)
            return { error: 'User not found' };
        const event = await db.event.findUnique({
            where: {
                id: eventId,
            },
            include: {
                memberships: true,
            },
        });
        if (!event)
            return { error: 'Event not found' };
        const userMembership = event.memberships.find(membership => membership.personId === userId);
        if (!userMembership)
            return { error: 'User not a member of this event' };
        if (userMembership.role === 'ORGANIZER')
            return { error: 'Organizers cannot leave the event' };
        await createEventModNotifs({ eventId, type: 'USER_LEFT' });
        await db.membership.delete({
            where: {
                id: userMembership.id,
            },
        });
        revalidatePath('/');
        const eventQueryDefinition = getEventQuery(eventId);
        getPusherServer().trigger(eventQueryDefinition.pusherChannel, eventQueryDefinition.pusherEvent, { message: 'Data updated' });
        return { success: 'Left event' };
    }
    catch (error) {
        eventLogger.error({
            eventId,
            error: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
        }, 'Failed to leave event');
        return { error: 'Could not leave event' };
    }
}
