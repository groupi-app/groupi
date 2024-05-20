import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { currentUser } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { AcceptInviteButton } from "@/components/invite-accept";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function handleError(error: string | null) {
  return (
    <div className="container mt-24">
      <h1 className="font-heading font-medium text-3xl mb-1">Invalid invite</h1>
      <p className="mb-4">{error}</p>
    </div>
  );
}

export default async function Page({
  params,
}: {
  params: { inviteId: string };
}) {
  const user = await currentUser();
  const userId = user ? user.id : "";

  async function getEventDetails(inviteId: string) {
    // get event ID associated with this invite
    const res = await db.invite.findUnique({
      where: {
        id: inviteId,
      },
      include: {
        event: {
          select: {
            title: true,
            id: true,
          },
        },
      },
    });
    if (res) {
      return res.event;
    } else {
      return { error: "Invite or event does not exist." };
    }
  }

  async function validateInvite(inviteId: string) {
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
    return { success: "Invite is valid" };
  }

  const eventDetails = await getEventDetails(params.inviteId);

  if ("error" in eventDetails) {
    return handleError(eventDetails.error);
  }

  const inviteValidation = await validateInvite(params.inviteId);

  if ("error" in inviteValidation) {
    return handleError(inviteValidation.error ?? "Unknown validation error.");
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <Card className="w-[600px]">
        <CardHeader>
          <CardDescription>You have been invited to</CardDescription>
          <CardTitle>{eventDetails.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <AcceptInviteButton
            inviteId={params.inviteId}
            eventId={eventDetails.id}
            personId={userId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
