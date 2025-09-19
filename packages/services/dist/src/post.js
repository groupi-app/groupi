'use server';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { db } from './db';
import { getPusherServer } from './pusher-server';
import { getEventQuery, getPersonQuery, getPostQuery, } from '@groupi/schema/queries';
import { createEventNotifs } from './notification';
import { log } from './logger';
import { createPostPageDTO, createPostReplyFeedDTO, } from '@groupi/schema';
// Fetch post data for post page display
export const fetchPostPageData = async (postId) => {
    const post = await db.post.findUnique({
        where: {
            id: postId,
        },
        include: {
            replies: {
                include: {
                    author: true,
                },
            },
            author: true,
            event: {
                include: {
                    memberships: {
                        include: {
                            person: true,
                        },
                    },
                },
            },
        },
    });
    if (!post)
        return { error: 'Post not found' };
    const { userId } = await auth();
    if (!userId)
        return { error: 'User not found' };
    if (!post.event.memberships.find(membership => membership.personId === userId))
        return { error: 'You are not a member of this event' };
    const userRole = post.event.memberships.find(membership => membership.personId === userId)?.role;
    if (!userRole)
        return { error: 'Role not found' };
    // Transform to DTO for post page display
    const postDTO = createPostPageDTO(post);
    return {
        success: {
            post: postDTO,
            userId,
            userRole,
        },
    };
};
// Fetch post data with event context for reply components
export const fetchPostWithEventData = async (postId) => {
    const post = await db.post.findUnique({
        where: {
            id: postId,
        },
        include: {
            replies: {
                include: {
                    author: true,
                },
            },
            author: true,
            event: {
                include: {
                    memberships: {
                        include: {
                            person: true,
                        },
                    },
                },
            },
        },
    });
    if (!post)
        return { error: 'Post not found' };
    const { userId } = await auth();
    if (!userId)
        return { error: 'User not found' };
    if (!post.event.memberships.find(membership => membership.personId === userId))
        return { error: 'You are not a member of this event' };
    const userRole = post.event.memberships.find(membership => membership.personId === userId)?.role;
    if (!userRole)
        return { error: 'Role not found' };
    // Transform to DTO with event context
    const postDTO = createPostReplyFeedDTO(post);
    return {
        success: {
            post: postDTO,
            userId,
            userRole,
        },
    };
};
export const fetchPostData = fetchPostPageData;
export async function createPost({ title, content, eventId, }) {
    try {
        const { userId } = await auth();
        if (!userId)
            return { error: 'Current user not found' };
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
        if (!event.memberships.find(membership => membership.personId === userId))
            return { error: 'You are not a member of this event' };
        const res = await db.post.create({
            data: {
                title: title,
                content: content,
                eventId: eventId,
                authorId: userId,
            },
        });
        await db.event.update({
            where: { id: eventId },
            data: {
                updatedAt: new Date(),
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
            log.debug('No events to send for post creation');
        }
        await createEventNotifs({ eventId, type: 'NEW_POST', postId: res.id });
        return { success: 'Post Created' };
    }
    catch (error) {
        return { error: error };
    }
}
export async function updatePost({ id, title, content, }) {
    try {
        const { userId } = await auth();
        if (!userId)
            return { error: 'Current user not found' };
        const post = await db.post.findUnique({
            where: {
                id: id,
            },
        });
        if (!post)
            return { error: 'Post not found' };
        if (userId !== post.authorId)
            return { error: 'User not authorized' };
        await db.post.update({
            where: {
                id: id,
            },
            data: {
                title: title,
                content: content,
                editedAt: new Date().toISOString(),
            },
        });
        revalidatePath('/');
        const eventQueryDefinition = getEventQuery(post.eventId);
        const postQueryDefinition = getPostQuery(id);
        getPusherServer().trigger(eventQueryDefinition.pusherChannel, eventQueryDefinition.pusherEvent, { message: 'Event data updated' });
        getPusherServer().trigger(postQueryDefinition.pusherChannel, postQueryDefinition.pusherEvent, { message: 'Post data updated' });
        return { success: 'Post Updated' };
    }
    catch (error) {
        return { error: error };
    }
}
export async function deletePost({ id }) {
    try {
        const { userId } = await auth();
        if (!userId)
            return { error: 'Current user not found' };
        const post = await db.post.findUnique({
            where: {
                id: id,
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
        const currentUserMembership = post.event.memberships.find(membership => membership.personId === userId);
        if (!currentUserMembership)
            return { error: 'You are not a member of this event' };
        if (userId !== post.authorId && currentUserMembership.role === 'ATTENDEE')
            return { error: 'User not authorized' };
        const res = await db.post.delete({
            where: {
                id: id,
            },
        });
        revalidatePath('/');
        const eventQueryDefinition = getEventQuery(post.eventId);
        const postQueryDefinition = getPostQuery(id);
        getPusherServer().trigger(eventQueryDefinition.pusherChannel, eventQueryDefinition.pusherEvent, { message: 'Event data updated' });
        getPusherServer().trigger(postQueryDefinition.pusherChannel, postQueryDefinition.pusherEvent, { message: 'Post data updated' });
        return { success: { message: 'Post Deleted', post: res } };
    }
    catch (error) {
        return { error: error };
    }
}
