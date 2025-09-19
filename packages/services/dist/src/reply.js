'use server';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { db } from './db';
import { getPusherServer } from './pusher-server';
import { getEventQuery, getPersonQuery, getPostQuery, } from '@groupi/schema/queries';
import { createPostNotifs } from './notification';
import { log } from './logger';
export async function createReply({ postId, text, authorId, }) {
    try {
        const post = await db.post.findUnique({
            where: {
                id: postId,
            },
            include: {
                event: {
                    include: {
                        memberships: true,
                    },
                },
            },
        });
        if (!post)
            return { error: 'Post not found' };
        const { userId } = await auth();
        if (!userId)
            return { error: 'User not found' };
        if (authorId !== userId)
            return { error: 'User not authorized' };
        if (!post.event.memberships.find(membership => membership.personId === userId))
            return { error: 'You are not a member of this event' };
        const reply = await db.reply.create({
            data: {
                text,
                postId,
                authorId,
            },
        });
        await db.post.update({
            where: {
                id: postId,
            },
            data: {
                updatedAt: new Date().toISOString(),
                event: {
                    update: {
                        updatedAt: new Date().toISOString(),
                    },
                },
            },
        });
        revalidatePath('/');
        const eventQueryDefinition = getEventQuery(post.eventId);
        const postQueryDefinition = getPostQuery(post.id);
        const events = [
            {
                channel: eventQueryDefinition.pusherChannel,
                name: eventQueryDefinition.pusherEvent,
                data: { message: 'Event data updated' },
            },
            {
                channel: postQueryDefinition.pusherChannel,
                name: postQueryDefinition.pusherEvent,
                data: { message: 'Post data updated' },
            },
        ];
        for (const membership of post.event.memberships) {
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
            log.debug('No events to send for reply creation');
        }
        await createPostNotifs({ postId, type: 'NEW_REPLY' });
        return { success: reply };
    }
    catch (error) {
        return { error: error };
    }
}
export async function updateReply({ replyId, text, }) {
    try {
        const { userId } = await auth();
        if (!userId)
            return { error: 'User not found' };
        const reply = await db.reply.findUnique({
            where: {
                id: replyId,
            },
            include: {
                post: true,
            },
        });
        if (!reply)
            return { error: 'Reply not found' };
        if (reply.authorId !== userId)
            return { error: 'User not authorized' };
        await db.reply.update({
            where: {
                id: replyId,
            },
            data: {
                text: text,
            },
        });
        revalidatePath('/');
        const eventQueryDefinition = getEventQuery(reply.post.eventId);
        const postQueryDefinition = getPostQuery(reply.post.id);
        getPusherServer().trigger(eventQueryDefinition.pusherChannel, eventQueryDefinition.pusherEvent, { message: 'Event data updated' });
        getPusherServer().trigger(postQueryDefinition.pusherChannel, postQueryDefinition.pusherEvent, { message: 'Post data updated' });
        return { success: 'Reply updated' };
    }
    catch (error) {
        return { error: error };
    }
}
export async function deleteReply({ id }) {
    try {
        const reply = await db.reply.findUnique({
            where: {
                id: id,
            },
            include: {
                post: {
                    include: {
                        event: {
                            include: {
                                memberships: true,
                            },
                        },
                    },
                },
            },
        });
        if (!reply)
            return { error: 'Reply not found' };
        const { userId } = await auth();
        if (!userId)
            return { error: 'User not found' };
        const currentUserMembership = reply.post.event.memberships.find(membership => membership.personId === userId);
        if (!currentUserMembership)
            return { error: 'You are not a member of this event' };
        if (reply.authorId !== userId && currentUserMembership.role === 'ATTENDEE')
            return { error: 'User not authorized' };
        await db.reply.delete({
            where: {
                id: id,
            },
        });
        revalidatePath('/');
        const eventQueryDefinition = getEventQuery(reply.post.eventId);
        const postQueryDefinition = getPostQuery(reply.post.id);
        getPusherServer().trigger(eventQueryDefinition.pusherChannel, eventQueryDefinition.pusherEvent, { message: 'Event data updated' });
        getPusherServer().trigger(postQueryDefinition.pusherChannel, postQueryDefinition.pusherEvent, { message: 'Post data updated' });
        return { success: 'Reply deleted' };
    }
    catch (error) {
        return { error: error };
    }
}
