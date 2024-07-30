import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { InviteCardList } from "@/components/invite-card-list";
import Link from "next/link";
import { AddInvite } from "@/components/add-invite";

export default async function Page({
  params,
}: {
  params: { eventId: string };
}) {
  const { eventId } = params;
  const { userId }: { userId: string | null } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

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
    throw new Error("Event not found.");
  }

  const membership = event.memberships.find(
    (membership) => membership.personId === userId
  );

  const memberId = membership?.id;

  if (!memberId) {
    throw new Error("You are not a member of this event.");
  }

  if (membership.role === "ATTENDEE") {
    throw new Error("You do not have permission to view this page");
  }

  const { invites } = event;

  return (
    <div className="container max-w-5xl py-4">
      <Link href={`/event/${eventId}`}>
        <Button variant={"ghost"} className="flex items-center gap-1 pl-2">
          <Icons.back />
          <span>{event.title}</span>
        </Button>
      </Link>

      <InviteCardList
        eventId={eventId}
        createdById={memberId}
        invites={invites}
      />
    </div>
  );
}
