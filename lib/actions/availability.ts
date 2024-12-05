"use server";

import { auth } from "@clerk/nextjs";
import { db } from "../db";
import { $Enums } from "@prisma/client";
import { ActionResponse, PotentialDateTimeWithAvailabilities } from "@/types";
import { revalidatePath } from "next/cache";

export interface PDTData {
  potentialDateTimes: PotentialDateTimeWithAvailabilities[];
  userRole: $Enums.Role;
  userId: string;
}

export async function getEventPotentialDateTimes(
  eventId: string
): Promise<ActionResponse<PDTData>> {
  const { userId }: { userId: string | null } = auth();

  if (!userId) {
    return { error: "User not found" };
  }

  const event = await db.event.findUnique({
    where: {
      id: eventId,
    },
    include: {
      potentialDateTimes: {
        include: {
          availabilities: {
            include: {
              membership: {
                include: {
                  person: true,
                },
              },
            },
          },
          event: {
            include: {
              memberships: {
                include: {
                  availabilities: true,
                },
              },
            },
          },
        },
      },
      memberships: true,
    },
  });

  if (!event) {
    return { error: "Event not found" };
  }

  const userMembership = event.memberships.find(
    (membership) => membership.personId === userId
  );

  if (!userMembership) {
    return { error: "User not a member of this event" };
  }

  if (event.chosenDateTime) {
    return { error: "A date has already been chosen for this event" };
  }

  return {
    success: {
      potentialDateTimes: event.potentialDateTimes,
      userId: userId,
      userRole: userMembership.role,
    },
  };
}

export async function updateMembershipAvailabilities(
  eventId: string,
  availabilityUpdates: {
    potentialDateTimeId: string;
    status: "YES" | "NO" | "MAYBE";
  }[]
) {
  try {
    const { userId }: { userId: string | null } = auth();

    if (!userId) {
      console.log("User not found");
      return { error: "User not found" };
    }

    const event = await db.event.findUnique({
      where: {
        id: eventId,
      },
      include: {
        memberships: {
          include: {
            availabilities: true,
          },
        },
      },
    });

    if (!event) {
      console.log("Event not found");
      return { error: "Event not found" };
    }

    const userMembership = event.memberships.find(
      (membership) => membership.personId === userId
    );

    if (!userMembership) {
      console.log("User not a member of this event");
      return { error: "User not a member of this event" };
    }

    const availabilities = event.memberships.find(
      (m) => m.personId === userId
    )?.availabilities;

    let tempAvailabilities = [];

    if (availabilities && availabilities.length > 0) {
      tempAvailabilities = [...availabilities];

      tempAvailabilities.forEach(async (availability) => {
        const update = availabilityUpdates.find(
          (update) =>
            update.potentialDateTimeId === availability.potentialDateTimeId
        );

        if (update) {
          availability.status = update.status;
        } else {
          console.log("Availability not found");
          return { error: "Availability not found" };
        }
      });
      console.log(availabilities, tempAvailabilities);
      for (const update of availabilityUpdates) {
        await db.availability.updateMany({
          where: {
            membershipId: userMembership.id,
            potentialDateTimeId: update.potentialDateTimeId,
          },
          data: {
            status: update.status,
          },
        });
      }
    } else {
      //   availabilityUpdates.forEach(async (update) => {
      //     await db.availability.create({
      //       data: {
      //         status: update.status,
      //         membershipId: userMembership.id,
      //         potentialDateTimeId: update.potentialDateTimeId,
      //       },
      //     });
      //   });
      await db.availability.createMany({
        data: availabilityUpdates.map((update) => ({
          status: update.status,
          membershipId: userMembership.id,
          potentialDateTimeId: update.potentialDateTimeId,
        })),
      });
    }

    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.log(error);
    return { error: "Unable to update availability" };
  }
}
