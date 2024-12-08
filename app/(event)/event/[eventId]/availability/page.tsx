import { AvailabilityForm } from "@/components/availability-form";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { getEventPotentialDateTimes } from "@/lib/actions/availability";
import { member, PotentialDateTimeWithAvailabilities } from "@/types";
import { auth } from "@clerk/nextjs";
import Link from "next/link";

export default async function Page({
  params,
}: {
  params: { eventId: string };
}) {
  const { eventId } = params;

  const { userId }: { userId: string | null } = auth();

  let potentialDateTimes: PotentialDateTimeWithAvailabilities[] = [];

  const res = await getEventPotentialDateTimes(eventId);

  if (res.error) {
    throw new Error(res.error);
  } else if (res.success) {
    potentialDateTimes = res.success.potentialDateTimes;
  }

  if (!potentialDateTimes || potentialDateTimes.length === 0) {
    throw new Error("Voting is not enabled for this event");
  }

  const getTimezoneString = () => {
    return `${Intl.DateTimeFormat().resolvedOptions().timeZone} (UTC${
      new Date().getTimezoneOffset() > 0 ? "-" : "+"
    }${Math.abs(new Date().getTimezoneOffset() / 60).toString()})`;
  };

  const userMembership = potentialDateTimes[0].event.memberships.find(
    (membership) => membership.personId === userId
  );

  if (userMembership?.role === "ORGANIZER") {
    throw new Error("Organizers cannot vote on availabilities");
  }

  const memberAvailabilities = userMembership?.availabilities;

  return (
    <div className="container max-w-5xl py-4">
      <div>
        {memberAvailabilities && memberAvailabilities.length > 0 && (
          <div className="w-max">
            <Link data-test="full-post-back" href={`/event/${eventId}`}>
              <Button
                variant={"ghost"}
                className="flex items-center gap-1 pl-2"
              >
                <Icons.back />
                <span>{potentialDateTimes[0].event.title}</span>
              </Button>
            </Link>
          </div>
        )}

        <div className="my-2">
          <h1 className="font-heading text-4xl">When are you around?</h1>
          <h2 className="text-muted-foreground text-lg">
            Don&apos;t worry. You can update this later.
          </h2>
        </div>
      </div>
      <div className="py-4 w-full">
        <span className="text-sm italic text-muted-foreground">
          Current timezone: {getTimezoneString()}
        </span>
        <AvailabilityForm potentialDateTimes={potentialDateTimes} />
      </div>
    </div>
  );
}
