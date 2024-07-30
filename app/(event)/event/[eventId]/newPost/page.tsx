import { auth, currentUser } from "@clerk/nextjs";
import { Editor } from "@/components/editor";
import { db } from "@/lib/db";

export default async function Page({
  params,
}: {
  params: { eventId: string };
}) {
  const { userId }: { userId: string | null } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const { eventId } = params;
  const event = await db.event.findUnique({
    where: {
      id: eventId,
    },
    include: {
      memberships: true,
    },
  });

  if (!event) {
    throw new Error("Event not found.");
  }

  if (!event.memberships.some((membership) => membership.personId === userId)) {
    throw new Error("You are not a member of this event.");
  }

  return (
    <div className="container pt-6">
      <Editor authorId={userId} eventId={eventId} />
    </div>
  );
}
