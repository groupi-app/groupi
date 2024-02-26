"use server";

import { auth } from "@clerk/nextjs";
import { db } from "../db";
import { revalidatePath } from "next/cache";
import { getEventQuery, getPostQuery } from "../query-definitions";
import { pusherServer } from "../pusher-server";

export async function createReply({
  postId,
  text,
  authorId,
}: {
  postId: string;
  text: string;
  authorId: string;
}) {
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
    if (!post) return { error: "Post not found" };

    const { userId }: { userId: string | null } = auth();
    if (!userId) return { error: "User not found" };

    if (authorId !== userId) return { error: "User not authorized" };

    if (
      !post.event.memberships.find(
        (membership) => membership.personId === userId
      )
    )
      return { error: "You are not a member of this event" };

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
      },
    });

    revalidatePath("/");

    const eventQueryDefinition = getEventQuery(post.eventId);
    const postQueryDefinition = getPostQuery(post.id);

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

    return { success: reply };
  } catch (error) {
    return { error: error };
  }
}

export async function updateReply({
  replyId,
  text,
}: {
  replyId: string;
  text: string;
}) {
  try {
    const { userId }: { userId: string | null } = auth();
    if (!userId) return { error: "User not found" };

    const reply = await db.reply.findUnique({
      where: {
        id: replyId,
      },
      include: {
        post: true,
      },
    });
    if (!reply) return { error: "Reply not found" };

    if (reply.authorId !== userId) return { error: "User not authorized" };

    const res = await db.reply.update({
      where: {
        id: replyId,
      },
      data: {
        text: text,
      },
    });

    revalidatePath("/");

    const eventQueryDefinition = getEventQuery(reply.post.eventId);
    const postQueryDefinition = getPostQuery(reply.post.id);

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

    return { success: "Reply updated" };
  } catch (error) {
    return { error: error };
  }
}

export async function deleteReply({ id }: { id: string }) {
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
    if (!reply) return { error: "Reply not found" };

    const { userId }: { userId: string | null } = auth();
    if (!userId) return { error: "User not found" };

    const currentUserMembership = reply.post.event.memberships.find(
      (membership) => membership.personId === userId
    );

    if (!currentUserMembership)
      return { error: "You are not a member of this event" };

    if (reply.authorId !== userId && currentUserMembership.role === "ATTENDEE")
      return { error: "User not authorized" };

    await db.reply.delete({
      where: {
        id: id,
      },
    });

    revalidatePath("/");

    const eventQueryDefinition = getEventQuery(reply.post.eventId);
    const postQueryDefinition = getPostQuery(reply.post.id);

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

    return { success: "Reply deleted" };
  } catch (error) {
    return { error: error };
  }
}
