'use server';
import { db } from './db';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { getPusherServer } from './pusher-server';
import { getEventQuery, getPersonQuery } from '@groupi/schema/queries';
import { createEventModNotifs, createNotification } from './notification';
export async function updateMembershipRole({ membership, role, }) {
    try {
        const { userId } = await auth();
        if (!userId)
            return { error: 'Current user not found' };
        const currentUserMembership = await db.membership.findFirst({
            where: {
                personId: userId,
                eventId: membership.eventId,
            },
        });
        if (!currentUserMembership)
            return { error: 'You are not a member of this event' };
        if (currentUserMembership.role !== 'ORGANIZER') {
            return { error: 'Only organizers can update roles' };
        }
        if (membership.role === 'ORGANIZER') {
            return { error: 'Organizer role cannot be updated' };
        }
        await db.membership.update({
            where: {
                id: membership.id,
            },
            data: {
                role: role,
            },
        });
        revalidatePath('/');
        const queryDefinition = getEventQuery(membership.eventId);
        getPusherServer().trigger(queryDefinition.pusherChannel, queryDefinition.pusherEvent, { message: 'Data updated' });
        if (role === 'MODERATOR') {
            await createNotification({
                type: 'USER_PROMOTED',
                personId: membership.personId,
                eventId: membership.eventId,
                authorId: userId,
                datetime: null,
                postId: null,
                read: false,
                rsvp: null,
            });
        }
        else if (role === 'ATTENDEE') {
            await createNotification({
                type: 'USER_DEMOTED',
                personId: membership.personId,
                eventId: membership.eventId,
                authorId: userId,
                datetime: null,
                postId: null,
                read: false,
                rsvp: null,
            });
        }
        return { success: 'Role Updated' };
    }
    catch (error) {
        return { error: error };
    }
}
export async function deleteMembership(membership) {
    try {
        const { userId } = await auth();
        if (!userId)
            return { error: 'Current user not found' };
        const currentUserMembership = await db.membership.findFirst({
            where: {
                personId: userId,
                eventId: membership.eventId,
            },
        });
        if (!currentUserMembership)
            return { error: 'You are not a member of this event' };
        if (currentUserMembership.role === 'ATTENDEE') {
            return { error: 'Only moderators and organizers can kick members' };
        }
        if (membership.role === 'ORGANIZER') {
            return { error: 'Cannot kick organizer' };
        }
        if (membership.role === 'MODERATOR' &&
            currentUserMembership.role === 'MODERATOR') {
            return { error: 'Only the organizer can kick a moderator' };
        }
        await db.membership.delete({
            where: {
                id: membership.id,
            },
        });
        revalidatePath('/');
        const eventQueryDefinition = getEventQuery(membership.eventId);
        getPusherServer().trigger(eventQueryDefinition.pusherChannel, eventQueryDefinition.pusherEvent, { message: 'Data updated' });
        const personQueryDefinition = getPersonQuery(membership.personId);
        getPusherServer().trigger(personQueryDefinition.pusherChannel, personQueryDefinition.pusherEvent, { message: 'Data updated' });
        return { success: 'Membership Deleted' };
    }
    catch (error) {
        return { error: error };
    }
}
export async function updateRSVP(eventId, status) {
    try {
        const { userId } = await auth();
        if (!userId)
            return { error: 'Current user not found' };
        const membership = await db.membership.findFirst({
            where: {
                personId: userId,
                eventId: eventId,
            },
        });
        if (!membership)
            return { error: 'You are not a member of this event' };
        if (membership.role === 'ORGANIZER') {
            return { error: 'Organizer cannot RSVP' };
        }
        await db.membership.update({
            where: {
                id: membership.id,
            },
            data: {
                rsvpStatus: status,
            },
        });
        revalidatePath('/');
        const queryDefinition = getEventQuery(eventId);
        getPusherServer().trigger(queryDefinition.pusherChannel, queryDefinition.pusherEvent, { message: 'Data updated' });
        createEventModNotifs({
            type: 'USER_RSVP',
            eventId: eventId,
            rsvp: status,
        });
        return { success: 'RSVP Updated' };
    }
    catch (error) {
        return { error: error };
    }
}
