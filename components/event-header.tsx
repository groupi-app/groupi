"use client";

import { Icons } from "@/components/icons";
import { Button } from "./ui/button";
import { useEventHeader } from "@/data/event-hooks";

export interface EventHeaderProps {
  eventTitle: string;
  eventLocation: string;
  eventDate?: Date | null;
  eventDescription: string;
}

export function EventHeader({ eventId }: { eventId: string }) {
  const { data: headerData } = useEventHeader(eventId);
  const {
    eventTitle,
    eventLocation,
    eventDate,
    eventDescription,
  }: EventHeaderProps = headerData;

  const eventDateStr =
    eventDate != null
      ? eventDate.toLocaleString([], {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  return (
    <header className="flex flex-col mb-5 max-w-2xl mx-auto gap-3">
      <h1 className="text-4xl font-heading">{eventTitle}</h1>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Icons.location className="w-6 h-6" />
          <span>{eventLocation}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Icons.date className="w-6 h-6" />
          {eventDateStr != null ? (
            <span>{eventDateStr}</span>
          ) : (
            <Button
              className="flex items-center gap-1"
              variant={"ghost"}
              size={"sm"}
            >
              <span>Set Availability</span>
              <Icons.arrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
      <p>{eventDescription}</p>
    </header>
  );
}
