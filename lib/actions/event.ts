"use server";

import { db } from "@/lib/db";
import { ActionResponse, Member, ReplyAuthorPost } from "@/types";
import { auth } from "@clerk/nextjs";
import { $Enums, Event } from "@prisma/client";
import { cache } from "react";
import { getEventQuery } from "../query-definitions";
import { pusherServer } from "../pusher-server";
import { revalidatePath } from "next/cache";

export interface EventData {
  event: Event & { posts: ReplyAuthorPost[]; memberships: Member[] };
  userRole: $Enums.Role;
  userId: string;
}

interface CreateEventProps {
  title: string;
  description?: string;
  location?: string;
  dateTime?: string;
  potentialDateTimes?: string[];
}

interface UpdateEventDetailsProps {
  id: string;
  title: string;
  description?: string;
  location?: string;
}

export const fetchEventData = cache(
  async (eventId: string): Promise<ActionResponse<EventData>> => {
    try {
      const event = await db.event.findUnique({
        where: {
          id: eventId,
        },
        include: {
          posts: {
            include: {
              replies: {
                include: {
                  author: true,
                },
              },
              author: true,
            },
          },
          memberships: {
            include: {
              person: true,
            },
          },
        },
      });

      if (!event) return { error: "Event not found" };

      const { userId }: { userId: string | null } = auth();

      if (!userId) return { error: "User not found" };

      if (
        !event.memberships.find((membership) => membership.personId === userId)
      )
        return { error: "You are not a member of this event" };

      const userRole = event.memberships.find(
        (membership) => membership.personId === userId
      )?.role;

      if (!userRole) return { error: "Role not found" };

      return { success: { event, userRole, userId } };
    } catch (error) {
      return { error: "Could not fetch event data" };
    }
  }
);

export async function createEvent({
  title,
  description,
  location,
  dateTime,
  potentialDateTimes,
}: CreateEventProps) {
  try {
    const { userId }: { userId: string | null } = auth();

    if (!userId) return { error: "User not found" };

    const event = await db.event.create({
      data: {
        title,
        description,
        location,
        chosenDateTime: dateTime,
        memberships: {
          create: {
            personId: userId,
            role: "ORGANIZER",
            rsvpStatus: "YES",
          },
        },
      },
      include: {
        memberships: true,
      },
    });

    if (!event) return { error: "Event not created" };

    if (potentialDateTimes) {
      console.log(potentialDateTimes);
      const eventRes = await db.event.update({
        where: {
          id: event.id,
        },
        data: {
          potentialDateTimes: {
            createMany: {
              data: potentialDateTimes.map((dateTime) => ({
                dateTime,
              })),
            },
          },
        },
        include: {
          potentialDateTimes: true,
        },
      });

      if (!eventRes) {
        await db.event.delete({
          where: {
            id: event.id,
          },
        });
        return { error: "Could not update event" };
      }

      for (const potentialDateTime of eventRes.potentialDateTimes) {
        const eventRes = await db.availability.create({
          data: {
            membershipId: event.memberships[0].id,
            status: "YES",
            potentialDateTimeId: potentialDateTime.id,
          },
        });
        if (!eventRes) {
          await db.event.delete({
            where: {
              id: event.id,
            },
          });
          return { error: "Could not update availability" };
        }
      }
    }

    return { success: event };
  } catch (error) {
    console.log(error);
    return { error: "Could not create event" };
  }
}

export async function updateEventDetails({
  id,
  title,
  description,
  location,
}: UpdateEventDetailsProps) {
  try {
    const { userId }: { userId: string | null } = auth();

    if (!userId) return { error: "User not found" };

    const event = await db.event.findUnique({
      where: {
        id,
      },
      include: {
        memberships: true,
        potentialDateTimes: true,
      },
    });

    if (!event) return { error: "Event not found" };

    const userMembership = event.memberships.find(
      (membership) => membership.personId === userId
    );

    if (!userMembership) return { error: "User not a member of this event" };

    if (userMembership.role !== "ORGANIZER")
      return { error: "You do not have permission to edit this event" };

    const updatedEvent = await db.event.update({
      where: {
        id,
      },
      data: {
        title,
        description,
        location,
      },
    });

    if (!updatedEvent) return { error: "Could not update event" };

    const eventQueryDefinition = getEventQuery(id);

    pusherServer.trigger(
      eventQueryDefinition.pusherChannel,
      eventQueryDefinition.pusherEvent,
      { message: "Event data updated" }
    );

    revalidatePath("/");

    return { success: updatedEvent };
  } catch (error) {
    console.log(error);
    return { error: "Could not update event" };
  }
}

export async function deleteEvent(eventId: string) {
  try {
    const { userId }: { userId: string | null } = auth();

    if (!userId) return { error: "User not found" };

    const event = await db.event.findUnique({
      where: {
        id: eventId,
      },
      include: {
        memberships: true,
      },
    });

    if (!event) return { error: "Event not found" };

    const userMembership = event.memberships.find(
      (membership) => membership.personId === userId
    );

    if (!userMembership) return { error: "User not a member of this event" };

    if (userMembership.role !== "ORGANIZER")
      return { error: "You do not have permission to delete this event" };

    await db.event.delete({
      where: {
        id: eventId,
      },
    });

    revalidatePath("/");

    return { success: "Event deleted" };
  } catch (error) {
    console.log(error);
    return { error: "Could not delete event" };
  }
}

export async function leaveEvent(eventId: string) {
  try {
    const { userId }: { userId: string | null } = auth();

    if (!userId) return { error: "User not found" };

    const event = await db.event.findUnique({
      where: {
        id: eventId,
      },
      include: {
        memberships: true,
      },
    });

    if (!event) return { error: "Event not found" };

    const userMembership = event.memberships.find(
      (membership) => membership.personId === userId
    );

    if (!userMembership) return { error: "User not a member of this event" };

    if (userMembership.role === "ORGANIZER")
      return { error: "Organizers cannot leave the event" };

    await db.membership.delete({
      where: {
        id: userMembership.id,
      },
    });

    revalidatePath("/");

    const eventQueryDefinition = getEventQuery(eventId);
    pusherServer.trigger(
      eventQueryDefinition.pusherChannel,
      eventQueryDefinition.pusherEvent,
      { message: "Data updated" }
    );

    return { success: "Left event" };
  } catch (error) {
    console.log(error);
    return { error: "Could not leave event" };
  }
}
