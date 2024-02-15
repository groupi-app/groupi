"use server";

import { revalidatePath } from "next/cache";
import { db } from "../db";
import { $Enums, Invite } from "@prisma/client";

export async function createInvite({
  eventId,
  createdById,
  usesRemaining,
  expiresAt,
}: {
  eventId: string;
  createdById: string;
  usesRemaining: number;
  expiresAt: Date;
}) {
  try {
    await db.invite.create({
      data: {
        eventId: eventId,
        createdById: createdById,
        expiresAt: expiresAt,
        usesRemaining: usesRemaining,
      },
    });
    revalidatePath("/");
    return { success: "Invite Created" };
  } catch (error) {
    return { error: error };
  };
}

export async function deleteInvite(id: string) {
  try {
    await db.invite.delete({where: {id: id}});
  } catch (error) {
    return {error: error};
  };
}

export async function useInvite({
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
    if (invite.usesRemaining !== null && invite.usesRemaining >= 1) {
      return { error: "Invite is out of uses" };
    }

    // decrement remaining uses
    db.invite.update({
      where: { id: inviteId },
      data: { usesRemaining: { decrement: 1 } },
    });

    // create membership
    db.membership.create({
      data: {
        personId: personId,
        eventId: invite.eventId,
      },
    });
  } catch (error) {
    return { error: error };
  };
}
