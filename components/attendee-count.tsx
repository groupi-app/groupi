"use client";
import { useEventMembers } from "@/data/event-hooks";
import { MembershipWithAvailabilities } from "@/types";
import { Icons } from "./icons";

export function AttendeeCount({ eventId }: { eventId: string }) {
  const { data: memberData } = useEventMembers(eventId);

  const {
    members,
    eventDateTime,
  }: {
    members: MembershipWithAvailabilities[];
    eventDateTime: Date | null;
  } = memberData;

  if (eventDateTime === null) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:divide-x border border-border rounded-md p-2 w-max sm:w-full max-w-md flex-wrap justify-between ">
      <div className="flex items-center gap-1 px-3">
        <Icons.check className="text-green-500" />
        <span className="text-muted-foreground">Yes:</span>
        <span>
          {members.filter((member) => member.rsvpStatus === "YES").length}
        </span>
      </div>
      <div className="flex items-center gap-1 px-3">
        <span className="font-semibold w-6 text-xl text-yellow-500 text-center">
          ?
        </span>
        <span className="text-muted-foreground">Maybe:</span>
        <span>
          {members.filter((member) => member.rsvpStatus === "MAYBE").length}
        </span>
      </div>
      <div className="flex items-center gap-1 px-3">
        <Icons.close className="text-red-500" />
        <span className="text-muted-foreground">No:</span>
        <span>
          {members.filter((member) => member.rsvpStatus === "NO").length}
        </span>
      </div>
      <div className="flex items-center gap-1 px-3">
        <span className="text-muted-foreground">Pending:</span>
        <span>
          {members.filter((member) => member.rsvpStatus === "PENDING").length}
        </span>
      </div>
    </div>
  );
}
