"use server";

import { ActionResponse, EventInviteData } from "@/types";
import { auth } from "@clerk/nextjs";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { db } from "../db";
import { pusherServer } from "../pusher-server";
import { getEventQuery, getInviteQuery } from "../query-definitions";
import { createEventModNotifs } from "./notification";

export const getEventInviteData = cache(
  async (eventId: string): Promise<ActionResponse<EventInviteData>> => {
    try {
      const event = await db.event.findUnique({
        where: {
          id: eventId,
        },
        include: {
          invites: {
            include: {
              createdBy: {
                include: {
                  person: true,
                },
              },
            },
          },
          memberships: true,
        },
      });

      if (!event) {
        return { error: "Event not found." };
      }

      const { userId }: { userId: string | null } = auth();

      if (!userId) {
        return { error: "User not found." };
      }

      const membership = event.memberships.find(
        (membership) => membership.personId === userId
      );

      if (!membership) {
        return { error: "You are not a member of this event." };
      }

      if (membership.role === "ATTENDEE") {
        return { error: "You do not have permission to view this page" };
      }

      return { success: event };
    } catch (error) {
      return { error: "Unable to get invites." };
    }
  }
);

export async function createInvite({
  name,
  eventId,
  maxUses: uses,
  expiresAt,
}: {
  name?: string;
  eventId: string;
  maxUses: number | null;
  expiresAt: Date | null;
}) {
  try {
    const { userId }: { userId: string | null } = auth();

    if (!userId) {
      return { error: "User not found" };
    }

    const membership = await db.membership.findFirst({
      where: {
        personId: userId,
        eventId: eventId,
      },
    });

    if (!membership || membership.role === "ATTENDEE") {
      return { error: "You do not have permission to create invites." };
    }

    await db.invite.create({
      data: {
        name: name,
        eventId: eventId,
        createdById: membership.id,
        expiresAt: expiresAt,
        usesRemaining: uses,
        maxUses: uses,
      },
    });
    revalidatePath("/");

    const queryDefinition = getInviteQuery(eventId);
    pusherServer.trigger(
      queryDefinition.pusherChannel,
      queryDefinition.pusherEvent,
      { message: "Data updated" }
    );

    return { success: "Invite Created" };
  } catch (error) {
    console.log(error);
    return { error: "Unable to create invite." };
  }
}

export async function deleteInvite(id: string) {
  try {
    const { userId }: { userId: string | null } = auth();

    if (!userId) {
      return { error: "User not found" };
    }

    const invite = await db.invite.findUnique({
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

    if (!invite) {
      return { error: "Invite not found." };
    }

    const membership = invite.event.memberships.find(
      (membership) => membership.personId === userId
    );

    if (!membership || membership.role === "ATTENDEE") {
      return { error: "You do not have permission to delete this invite." };
    }

    await db.invite.delete({ where: { id: id } });

    revalidatePath("/");

    const queryDefinition = getInviteQuery(invite.eventId);
    pusherServer.trigger(
      queryDefinition.pusherChannel,
      queryDefinition.pusherEvent,
      { message: "Data updated" }
    );

    return { success: "Invite Deleted" };
  } catch (error) {
    console.log(error);
    return { error: "Unable to delete invite." };
  }
}

export async function deleteInvites(ids: string[]) {
  try {
    const { userId }: { userId: string | null } = auth();

    if (!userId) {
      return { error: "User not found" };
    }

    const invites = await db.invite.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        event: {
          include: {
            memberships: true,
          },
        },
      },
    });

    if (!invites) {
      return { error: "Invites not found." };
    }

    const membership = invites[0].event.memberships.find(
      (membership) => membership.personId === userId
    );

    if (!membership || membership.role === "ATTENDEE") {
      return { error: "You do not have permission to delete these invites." };
    }

    await db.invite.deleteMany({ where: { id: { in: ids } } });

    revalidatePath("/");

    const queryDefinition = getInviteQuery(invites[0].eventId);
    pusherServer.trigger(
      queryDefinition.pusherChannel,
      queryDefinition.pusherEvent,
      { message: "Data updated" }
    );

    return { success: "Invites Deleted" };
  } catch (error) {
    console.log(error);
    return { error: "Unable to delete invites." };
  }
}

export async function acceptInvite({
  inviteId,
  personId,
}: {
  inviteId: string;
  personId: string;
}) {
  // there may be potential for a race condition here since there are multiple sequential db operations

  try {
    // get invite
    const invite = await db.invite.findUnique({
      where: {
        id: inviteId,
      },
    });

    // check if invite exists
    if (!invite) {
      return { error: "Invite does not exist" };
    }

    // check if invite has expired
    if (
      invite.expiresAt !== null &&
      new Date().getTime() > invite.expiresAt.getTime()
    ) {
      return { error: "Invite has expired" };
    }

    // check if invite is out of uses
    if (invite.usesRemaining !== null && invite.usesRemaining < 1) {
      return { error: "Invite is out of uses" };
    }

    // check if membership exists
    const currentMembership = await db.membership.findFirst({
      where: {
        personId: personId,
        eventId: invite.eventId,
      },
    });

    // if membership does not already exist
    if (currentMembership) {
      return { error: "Membership already exists" };
    }

    // create membership
    const mem = await db.membership.create({
      data: {
        personId: personId,
        eventId: invite.eventId,
      },
    });

    console.log(mem);

    // decrement remaining uses
    await db.invite.update({
      where: { id: inviteId },
      data: { usesRemaining: { decrement: 1 } },
    });

    const inviteQueryDefinition = getInviteQuery(invite.eventId);
    pusherServer.trigger(
      inviteQueryDefinition.pusherChannel,
      inviteQueryDefinition.pusherEvent,
      { message: "Data updated" }
    );

    const eventQueryDefinition = getEventQuery(invite.eventId);
    pusherServer.trigger(
      eventQueryDefinition.pusherChannel,
      eventQueryDefinition.pusherEvent,
      { message: "Data updated" }
    );

    await createEventModNotifs({
      eventId: invite.eventId,
      type: "USER_JOINED",
    });

    return { success: "Invite successfully used" };
  } catch (error) {
    console.log(error);
    return { error: "Unable to use invite." };
  }
}
