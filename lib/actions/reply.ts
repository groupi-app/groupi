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
