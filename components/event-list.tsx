"use client";

import { usePersonEvents } from "@/data/person-hooks";
import { EventWithOwner } from "@/types";

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
import { EventCard } from "./event-card";

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
              <EventCard event={event} />
            </motion.div>
          ))}
        </LayoutGroup>
      </motion.div>
    </div>
  );
}
