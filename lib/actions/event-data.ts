"use server";

import { db } from "@/lib/db";
import { ActionResponse, ExtendedPost, Member } from "@/types";
import { auth } from "@clerk/nextjs";
import { Event } from "@prisma/client";
import { cache } from "react";

export interface EventData {
  event: Event & { posts: ExtendedPost[]; memberships: Member[] };
  isMod: boolean;
  userId: string;
}

export const fetchEventData = cache(
  async (eventId: string): Promise<ActionResponse<EventData>> => {
    const event = await db.event.findUnique({
      where: {
        id: eventId,
      },
      include: {
        posts: {
          include: {
            replies: true,
            author: true,
          },
        },
        memberships: {
          include: {
            person: true,
          },
        },
      },
    });

    if (!event) return { error: "Event not found" };

    const { userId }: { userId: string | null } = auth();

    if (!userId) return { error: "User not found" };

    if (!event.memberships.find((membership) => membership.personId === userId))
      return { error: "You are not a member of this event" };

    const userRole = event.memberships.find(
      (membership) => membership.personId === userId
    )?.role;

    if (!userRole) return { error: "Role not found" };

    const isMod = ["MODERATOR", "ORGANIZER"].includes(userRole);

    return { success: { event, isMod, userId } };
  }
);
