"use server";

import { revalidatePath } from "next/cache";
import { db } from "../db";
import { $Enums, Invite } from "@prisma/client";

export async function createInvite({
  name,
  eventId,
  createdById,
  maxUses: uses,
  expiresAt,
}: {
  name?: string;
  eventId: string;
  createdById: string;
  maxUses: number | null;
  expiresAt: Date | null;
}) {
  try {
    await db.invite.create({
      data: {
        name: name,
        eventId: eventId,
        createdById: createdById,
        expiresAt: expiresAt,
        usesRemaining: uses,
        maxUses: uses,
      },
    });
    revalidatePath("/");
    return { success: "Invite Created" };
  } catch (error) {
    console.log(error);
    return { error: "Unable to create invite." };
  }
}

export async function deleteInvite(id: string) {
  try {
    await db.invite.delete({ where: { id: id } });
    revalidatePath("/");
    return { success: "Invite Deleted" };
  } catch (error) {
    console.log(error);
    return { error: "Unable to delete invite." };
  }
}

export async function deleteInvites(ids: string[]) {
  try {
    await db.invite.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/");
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

    return { success: "Invite successfully used" };
  } catch (error) {
    console.log(error);
    return { error: "Unable to use invite." };
  }
}
