'use server';

import { ReplyAuthorEventPost } from '@/types';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { BatchEvent } from 'pusher';
import { db } from '../db';
import { pusherServer } from '../pusher-server';
import {
  getEventQuery,
  getPersonQuery,
  getPostQuery,
} from '../query-definitions';
import { createEventNotifs } from './notification';

export interface PostData {
  success?: {
    post: ReplyAuthorEventPost;
    userId: string;
    userRole: string;
  };
  error?: string;
}

export const fetchPostData = async (postId: string): Promise<PostData> => {
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

  if (!post) return { error: 'Post not found' };

  const { userId }: { userId: string | null } = await auth();

  if (!userId) return { error: 'User not found' };

  if (
    !post.event.memberships.find(membership => membership.personId === userId)
  )
    return { error: 'You are not a member of this event' };

  const userRole = post.event.memberships.find(
    membership => membership.personId === userId
  )?.role;

  if (!userRole) return { error: 'Role not found' };

  return {
    success: {
      post,
      userId,
      userRole,
    },
  };
};

export async function createPost({
  title,
  content,
  eventId,
}: {
  title: string;
  content: string;
  eventId: string;
}) {
  try {
    const { userId }: { userId: string | null } = await auth();

    if (!userId) return { error: 'Current user not found' };

    const event = await db.event.findUnique({
      where: {
        id: eventId,
      },
      include: {
        memberships: true,
      },
    });

    if (!event) return { error: 'Event not found' };

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
    const events: BatchEvent[] = [
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
      await pusherServer.triggerBatch(events);
    } else {
      console.log('No events to send');
    }

    await createEventNotifs({ eventId, type: 'NEW_POST', postId: res.id });

    return { success: 'Post Created' };
  } catch (error) {
    return { error: error };
  }
}

export async function updatePost({
  id,
  title,
  content,
}: {
  id: string;
  title: string;
  content: string;
}) {
  try {
    const { userId }: { userId: string | null } = await auth();

    if (!userId) return { error: 'Current user not found' };

    const post = await db.post.findUnique({
      where: {
        id: id,
      },
    });

    if (!post) return { error: 'Post not found' };

    if (userId !== post.authorId) return { error: 'User not authorized' };

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

    pusherServer.trigger(
      eventQueryDefinition.pusherChannel,
      eventQueryDefinition.pusherEvent,
      { message: 'Event data updated' }
    );
    pusherServer.trigger(
      postQueryDefinition.pusherChannel,
      postQueryDefinition.pusherEvent,
      { message: 'Post data updated' }
    );

    return { success: 'Post Updated' };
  } catch (error) {
    return { error: error };
  }
}

export async function deletePost({ id }: { id: string }) {
  try {
    const { userId }: { userId: string | null } = await auth();

    if (!userId) return { error: 'Current user not found' };

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

    if (!post) return { error: 'Post not found' };

    const currentUserMembership = post.event.memberships.find(
      membership => membership.personId === userId
    );

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

    pusherServer.trigger(
      eventQueryDefinition.pusherChannel,
      eventQueryDefinition.pusherEvent,
      { message: 'Event data updated' }
    );
    pusherServer.trigger(
      postQueryDefinition.pusherChannel,
      postQueryDefinition.pusherEvent,
      { message: 'Post data updated' }
    );

    return { success: { message: 'Post Deleted', post: res } };
  } catch (error) {
    return { error: error };
  }
}
