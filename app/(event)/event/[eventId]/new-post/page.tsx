import { Editor } from "@/components/editor";
import ErrorPage from "@/components/error";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export default async function Page(
  props: {
    params: Promise<{ eventId: string }>;
  }
) {
  const params = await props.params;
  const { userId }: { userId: string | null } = await auth();

  if (!userId) {
    return <ErrorPage message={"User not found"} />;
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
    return <ErrorPage message={"Event not found"} />;
  }

  if (!event.memberships.some((membership) => membership.personId === userId)) {
    return <ErrorPage message={"You are not a member of this event."} />;
  }

  return (
    <div className="container pt-6">
      <Editor eventId={eventId} />
    </div>
  );
}
