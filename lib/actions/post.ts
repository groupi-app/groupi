"use server";

import { revalidatePath } from "next/cache";
import { db } from "../db";
import { auth } from "@clerk/nextjs";
import { ReplyAuthorEventPost } from "@/types";
import { pusherServer } from "../pusher-server";
import { getEventQuery, getPostQuery } from "../query-definitions";

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

  if (!post) return { error: "Post not found" };

  const { userId }: { userId: string | null } = auth();

  if (!userId) return { error: "User not found" };

  if (
    !post.event.memberships.find((membership) => membership.personId === userId)
  )
    return { error: "You are not a member of this event" };

  const userRole = post.event.memberships.find(
    (membership) => membership.personId === userId
  )?.role;

  if (!userRole) return { error: "Role not found" };

  const eventTitle = post.event.title;

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
  authorId,
}: {
  title: string;
  content: string;
  eventId: string;
  authorId: string;
}) {
  try {
    const { userId }: { userId: string | null } = auth();

    if (!userId) return { error: "Current user not found" };

    if (userId !== authorId) return { error: "User not authorized" };

    const res = await db.post.create({
      data: {
        title: title,
        content: content,
        eventId: eventId,
        authorId: authorId,
      },
    });
    revalidatePath("/");

    const queryDefinition = getEventQuery(eventId);
    pusherServer.trigger(
      queryDefinition.pusherChannel,
      queryDefinition.pusherEvent,
      { message: "Data updated" }
    );

    return { success: "Post Created" };
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
    const { userId }: { userId: string | null } = auth();

    if (!userId) return { error: "Current user not found" };

    const post = await db.post.findUnique({
      where: {
        id: id,
      },
    });

    if (!post) return { error: "Post not found" };

    if (userId !== post.authorId) return { error: "User not authorized" };

    const res = await db.post.update({
      where: {
        id: id,
      },
      data: {
        title: title,
        content: content,
        editedAt: new Date().toISOString(),
      },
    });
    revalidatePath("/");

    const eventQueryDefinition = getEventQuery(post.eventId);
    const postQueryDefinition = getPostQuery(id);

    pusherServer.trigger(
      eventQueryDefinition.pusherChannel,
      eventQueryDefinition.pusherEvent,
      { message: "Event data updated" }
    );
    pusherServer.trigger(
      postQueryDefinition.pusherChannel,
      postQueryDefinition.pusherEvent,
      { message: "Post data updated" }
    );

    return { success: "Post Updated" };
  } catch (error) {
    return { error: error };
  }
}

export async function deletePost({ id }: { id: string }) {
  try {
    const { userId }: { userId: string | null } = auth();

    if (!userId) return { error: "Current user not found" };

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

    if (!post) return { error: "Post not found" };

    const currentUserMembership = post.event.memberships.find(
      (membership) => membership.personId === userId
    );

    if (!currentUserMembership)
      return { error: "You are not a member of this event" };

    if (userId !== post.authorId && currentUserMembership.role === "ATTENDEE")
      return { error: "User not authorized" };

    const res = await db.post.delete({
      where: {
        id: id,
      },
    });
    revalidatePath("/");

    const eventQueryDefinition = getEventQuery(post.eventId);
    const postQueryDefinition = getPostQuery(id);

    pusherServer.trigger(
      eventQueryDefinition.pusherChannel,
      eventQueryDefinition.pusherEvent,
      { message: "Event data updated" }
    );
    pusherServer.trigger(
      postQueryDefinition.pusherChannel,
      postQueryDefinition.pusherEvent,
      { message: "Post data updated" }
    );

    return { success: { message: "Post Deleted", post: res } };
  } catch (error) {
    return { error: error };
  }
}
