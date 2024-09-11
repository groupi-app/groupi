"use client";

import { Icons } from "@/components/icons";
import { Button } from "./ui/button";
import { useEventHeader } from "@/data/event-hooks";
import { Event } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { DeleteEventDialog } from "./deleteEventDialog";
import { LeaveEventDialog } from "./leaveEventDialog";
import { HeaderData } from "@/types";
import Link from "next/link";

export function EventHeader({ eventId }: { eventId: string }) {
  const { data: headerData } = useEventHeader(eventId);
  const { title, location, chosenDateTime, description, userRole }: HeaderData =
    headerData;

  const eventDateStr =
    chosenDateTime != null
      ? chosenDateTime.toLocaleString([], {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

  return (
    <Dialog>
      <header className="flex flex-col md:my-5 max-w-4xl mx-auto gap-3">
        <div className="flex justify-between flex-col-reverse gap-3 md:flex-row">
          <h1 className="text-5xl font-heading font-medium">{title}</h1>
          <DropdownMenu>
            <DropdownMenuTrigger className="w-12 h-12 hover:bg-accent transition-all rounded-md flex items-center justify-center">
              <Icons.more className="w-8 h-8" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {userRole === "ORGANIZER" ? (
                <>
                  <Link href={`/event/${eventId}/edit`}>
                    <DropdownMenuItem className="cursor-pointer">
                      <div className="flex items-center gap-1">
                        <Icons.edit className="w-4 h-4" />
                        <span>Edit Details</span>
                      </div>
                    </DropdownMenuItem>
                  </Link>
                  <Link href={`/event/${eventId}/date`}>
                    <DropdownMenuItem className="cursor-pointer">
                      <div className="flex items-center gap-1">
                        <Icons.date className="w-4 h-4" />
                        <span>Change Date</span>
                      </div>
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem className="cursor-pointer focus:bg-destructive focus:text-destructive-foreground">
                    <DialogTrigger className="flex items-center gap-1">
                      <Icons.delete className="w-4 h-4" />
                      <span>Delete Event</span>
                    </DialogTrigger>
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem className="cursor-pointer focus:bg-destructive focus:text-destructive-foreground">
                  <DialogTrigger className="flex items-center gap-1">
                    <Icons.leave className="w-4 h-4" />
                    <span>Leave Event</span>
                  </DialogTrigger>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-col gap-2">
          {location && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Icons.location className="w-6 h-6 text-primary" />
              <span>{location}</span>
            </div>
          )}
          <div className="flex items-center gap-1 text-muted-foreground">
            <Icons.date className="w-6 h-6 text-primary" />
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
        {description && <p>{description}</p>}
      </header>
      {userRole === "ORGANIZER" ? (
        <DeleteEventDialog id={eventId} />
      ) : (
        <LeaveEventDialog id={eventId} />
      )}
    </Dialog>
  );
}
