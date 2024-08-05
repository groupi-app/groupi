"use client";

import { usePersonEvents } from "@/data/person-hooks";
import { getFullName, getInitials } from "@/lib/utils";
import { EventWithOwner } from "@/types";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Icons } from "./icons";
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectGroup,
} from "./ui/select";
import { useState } from "react";
import { LayoutGroup, motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};

export function EventList({ userId }: { userId: string }) {
  const { data: userData } = usePersonEvents(userId);
  const { events }: { events: EventWithOwner[] } = userData;
  const [sortBy, setSortBy] = useState<"title" | "createdat" | "lastactivity">(
    "lastactivity"
  );

  const sort = (a: EventWithOwner, b: EventWithOwner) => {
    switch (sortBy) {
      case "title":
        return a.title.localeCompare(b.title);
      case "createdat":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "lastactivity":
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-4">
        <h1 className="text-5xl font-heading font-medium">My Events</h1>
        <div className="w-36">
          <Select
            value={sortBy}
            onValueChange={(value) =>
              setSortBy(value as "title" | "createdat" | "lastactivity")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Sort By</SelectLabel>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="createdat">Date Created</SelectItem>
                <SelectItem value="lastactivity">Latest Activity</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <motion.div
        initial="hidden"
        animate="show"
        variants={container}
        className="flex flex-col gap-4"
      >
        <LayoutGroup>
          {events.sort(sort).map((event) => (
            <motion.div layout variants={item} key={event.id}>
              <Link href={`/event/${event.id}`}>
                <div className="flex flex-col gap-2 border border-border shadow-md p-4 px-6 hover:bg-accent transition-all cursor-pointer rounded-md">
                  <div className="flex flex-col md:flex-row gap-2 md:gap-8">
                    <div className="flex flex-col flex-grow gap-2 md:w-1/2">
                      <h1 className="font-heading text-2xl">{event.title}</h1>
                      <p className="text-muted-foreground">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-1">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={event.owner.imageUrl} />
                          <AvatarFallback>
                            {getInitials(
                              event.owner.firstName,
                              event.owner.lastName
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-muted-foreground">
                          {getFullName(
                            event.owner.firstName,
                            event.owner.lastName
                          ) !== ""
                            ? getFullName(
                                event.owner.firstName,
                                event.owner.lastName
                              )
                            : event.owner.username}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col md:w-1/2 justify-between gap-2">
                      <div className="flex flex-col gap-2">
                        {location && (
                          <div className="flex items-center gap-1 ">
                            <Icons.location className="w-6 h-6 text-muted-foreground" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 ">
                          <Icons.date className="w-6 h-6 text-muted-foreground" />
                          {event.chosenDateTime != null ? (
                            <span>
                              {new Date(event.chosenDateTime).toLocaleString(
                                [],
                                {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                }
                              )}
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
                            {new Date(event.createdAt).toLocaleString([], {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                        {/* Last activity at*/}
                        <div className="flex items-center gap-1 ">
                          <span className="text-muted-foreground">
                            Last activity at:{" "}
                            {new Date(event.updatedAt).toLocaleString([], {
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
            </motion.div>
          ))}
        </LayoutGroup>
      </motion.div>
    </div>
  );
}
