'use server';

import { ActionResponse, PotentialDateTimeWithAvailabilities } from '@/types';
import { auth } from '@clerk/nextjs/server';
import { $Enums } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { BatchEvent } from 'pusher';
import { db } from '../db';
import { pusherServer } from '../pusher-server';
import {
  getEventQuery,
  getPDTQuery,
  getPersonQuery,
} from '../query-definitions';
import { createEventNotifs } from './notification';

export interface PDTData {
  potentialDateTimes: PotentialDateTimeWithAvailabilities[];
  userRole: $Enums.Role;
  userId: string;
}

export async function getEventPotentialDateTimes(
  eventId: string
): Promise<ActionResponse<PDTData>> {
  const { userId }: { userId: string | null } = await auth();

  if (!userId) {
    return { error: 'User not found' };
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
    return { error: 'Event not found' };
  }

  const userMembership = event.memberships.find(
    membership => membership.personId === userId
  );

  if (!userMembership) {
    return { error: 'User not a member of this event' };
  }

  if (event.chosenDateTime) {
    return { error: 'A date has already been chosen for this event' };
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
    status: 'YES' | 'NO' | 'MAYBE';
  }[]
) {
  try {
    const { userId }: { userId: string | null } = await auth();

    if (!userId) {
      console.log('User not found');
      return { error: 'User not found' };
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
      console.log('Event not found');
      return { error: 'Event not found' };
    }

    const userMembership = event.memberships.find(
      membership => membership.personId === userId
    );

    if (!userMembership) {
      console.log('User not a member of this event');
      return { error: 'User not a member of this event' };
    }

    const availabilities = event.memberships.find(
      m => m.personId === userId
    )?.availabilities;

    let tempAvailabilities = [];

    if (availabilities && availabilities.length > 0) {
      tempAvailabilities = [...availabilities];

      tempAvailabilities.forEach(async availability => {
        const update = availabilityUpdates.find(
          update =>
            update.potentialDateTimeId === availability.potentialDateTimeId
        );

        if (update) {
          availability.status = update.status;
        } else {
          console.log('Availability not found');
          return { error: 'Availability not found' };
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
        data: availabilityUpdates.map(update => ({
          status: update.status,
          membershipId: userMembership.id,
          potentialDateTimeId: update.potentialDateTimeId,
        })),
      });
    }

    const eventQueryDefinition = getPDTQuery(eventId);

    pusherServer.trigger(
      eventQueryDefinition.pusherChannel,
      eventQueryDefinition.pusherEvent,
      { message: 'Event data updated' }
    );

    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.log(error);
    return { error: 'Unable to update availability' };
  }
}

export async function chooseDateTime(eventId: string, pdtId: string) {
  try {
    const { userId }: { userId: string | null } = await auth();

    if (!userId) {
      console.log('User not found');
      return { error: 'User not found' };
    }

    const event = await db.event.findUnique({
      where: {
        id: eventId,
      },
      include: {
        potentialDateTimes: true,
        memberships: true,
      },
    });

    if (!event) {
      console.log('Event not found');
      return { error: 'Event not found' };
    }

    const userMembership = event.memberships.find(
      membership => membership.personId === userId
    );

    if (!userMembership) {
      console.log('User not a member of this event');
      return { error: 'User not a member of this event' };
    }

    if (userMembership.role !== 'ORGANIZER') {
      console.log('User not an organizer');
      return { error: 'User not an organizer' };
    }

    const dateTime = event.potentialDateTimes.find(
      pdt => pdt.id === pdtId
    )?.dateTime;

    if (!dateTime) {
      console.log('Date not found');
      return { error: 'Date not found' };
    }

    await db.event.update({
      where: {
        id: eventId,
      },
      data: {
        chosenDateTime: dateTime,
        updatedAt: new Date(),
      },
    });

    revalidatePath('/');

    const eventQueryDefinition = getEventQuery(eventId);

    const events: BatchEvent[] = [
      {
        channel: eventQueryDefinition.pusherChannel,
        name: eventQueryDefinition.pusherEvent,
        data: { message: 'Event Data updated' },
      },
    ];

    for (const membership of event.memberships) {
      const personQueryDefinition = getPersonQuery(membership.personId);
      events.push({
        channel: personQueryDefinition.pusherChannel,
        name: personQueryDefinition.pusherEvent,
        data: { message: 'Data updated' },
      });
    }

    if (events.length > 0) {
      await pusherServer.triggerBatch(events);
    } else {
      console.log('No events to send');
    }

    await createEventNotifs({
      eventId,
      type: 'DATE_CHOSEN',
      datetime: dateTime,
    });

    return { success: true };
  } catch (error) {
    console.log(error);
    return { error: 'Unable to choose date' };
  }
}
