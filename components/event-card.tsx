import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Icons } from "./icons";
import { getFullName, getInitials } from "@/lib/utils";
import { EventWithOwner } from "@/types";

export function EventCard({ event }: { event: EventWithOwner }) {
  const {
    id,
    title,
    description,
    location,
    chosenDateTime,
    createdAt,
    updatedAt,
    owner,
  } = event;
  return (
    <Link href={`/event/${id}`}>
      <div className="flex flex-col gap-2 border border-border shadow-md p-4 px-6 hover:bg-accent transition-all cursor-pointer rounded-md">
        <div className="flex flex-col md:flex-row gap-2 md:gap-8">
          <div className="flex flex-col flex-grow gap-2 md:w-1/2">
            <h1 className="font-heading text-2xl">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
            <div className="flex items-center gap-1">
              <Avatar className="w-8 h-8">
                <AvatarImage src={owner.imageUrl} />
                <AvatarFallback>
                  {getInitials(owner.firstName, owner.lastName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground">
                {getFullName(owner.firstName, owner.lastName) !== ""
                  ? getFullName(owner.firstName, owner.lastName)
                  : owner.username}
              </span>
            </div>
          </div>
          <div className="flex flex-col md:w-1/2 justify-between gap-2">
            <div className="flex flex-col gap-2">
              {location && (
                <div className="flex items-center gap-1 ">
                  <Icons.location className="w-6 h-6 text-muted-foreground" />
                  <span>{location}</span>
                </div>
              )}
              <div className="flex items-center gap-1 ">
                <Icons.date className="w-6 h-6 text-muted-foreground" />
                {chosenDateTime != null ? (
                  <span>
                    {new Date(chosenDateTime).toLocaleString([], {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </span>
                ) : (
                  <span>TBD</span>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              {/* Created at */}
              <div className="flex items-center gap-1 ">
                <span className="text-muted-foreground">
                  Created at:{" "}
                  {new Date(createdAt).toLocaleString([], {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </div>
              {/* Last activity at*/}
              <div className="flex items-center gap-1 ">
                <span className="text-muted-foreground">
                  Last activity at:{" "}
                  {new Date(updatedAt).toLocaleString([], {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
