import ErrorPage from "@/components/error";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Page(
  props: {
    params: Promise<{ eventId: string }>;
  }
) {
  const params = await props.params;
  const { eventId } = params;

  const { userId }: { userId: string | null } = await auth();

  const event = await db.event.findFirst({
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

  const userMembership = event.memberships.find(
    (membership) => membership.personId === userId
  );

  if (!userMembership) {
    return <ErrorPage message={"You are not a member of this event."} />;
  }

  if (userMembership.role !== "ORGANIZER") {
    return (
      <ErrorPage
        message={"You do not have permission to change the date of this event."}
      />
    );
  }

  return (
    <div className="container max-w-4xl">
      <div className="w-max my-2">
        <Link data-test="full-post-back" href={`/event/${eventId}`}>
          <Button variant={"ghost"} className="flex items-center gap-1 pl-2">
            <Icons.back />
            <span>{event.title}</span>
          </Button>
        </Link>
      </div>
      <h2 className="font-heading text-4xl mt-10">I would like to...</h2>
      <div className="flex my-12 gap-4 justify-center flex-col md:flex-row items-center">
        <Link
          data-test="single-date-button"
          className="w-full max-w-md"
          href={`/event/${eventId}/change-date/single`}
        >
          <Button
            size="lg"
            variant="outline"
            className="py-12 text-xl w-full flex items-center justify-center gap-3"
          >
            <Icons.organizer className="w-16 h-16 min-w-[4rem]" />
            <span>Choose a date myself</span>
          </Button>
        </Link>
        <Link
          className="w-full max-w-md"
          href={`/event/${eventId}/change-date/multi`}
        >
          <Button
            size="lg"
            variant="outline"
            className="py-12 text-xl w-full flex items-center justify-center gap-3"
          >
            <Icons.group
              color2="fill-muted-foreground"
              className="w-24 h-24 min-w-[4rem]"
            />
            <span>Poll Attendees</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
