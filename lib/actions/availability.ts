'use server';

import { ActionResponse, PotentialDateTimeWithAvailabilities } from '@/types';
import { auth } from '@clerk/nextjs/server';
import { $Enums } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { BatchEvent } from 'pusher';
import { db } from '../db';
import { pusherServer } from '../pusher-server';
import { eventLogger } from '../logger';
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
      eventLogger.warn('User not found during availability update');
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
      eventLogger.warn(
        {
          eventId,
        },
        'Event not found during availability update'
      );
      return { error: 'Event not found' };
    }

    const userMembership = event.memberships.find(
      membership => membership.personId === userId
    );

    if (!userMembership) {
      eventLogger.warn(
        'User not a member of this event during availability update',
        { userId, eventId }
      );
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
          eventLogger.warn(
            {
              potentialDateTimeId: availability.potentialDateTimeId,
            },
            'Availability not found for update'
          );
          return { error: 'Availability not found' };
        }
      });
      eventLogger.debug(
        {
          originalCount: availabilities?.length,
          updatedCount: tempAvailabilities.length,
        },
        'Updated availabilities'
      );
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
    eventLogger.error('Failed to update availability', error);
    return { error: 'Unable to update availability' };
  }
}

export async function chooseDateTime(eventId: string, pdtId: string) {
  try {
    const { userId }: { userId: string | null } = await auth();

    if (!userId) {
      eventLogger.warn('User not found during date time selection');
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
      eventLogger.warn(
        {
          eventId,
        },
        'Event not found during date time selection'
      );
      return { error: 'Event not found' };
    }

    const userMembership = event.memberships.find(
      membership => membership.personId === userId
    );

    if (!userMembership) {
      eventLogger.warn(
        'User not a member of event during date time selection',
        { userId, eventId }
      );
      return { error: 'User not a member of this event' };
    }

    if (userMembership.role !== 'ORGANIZER') {
      eventLogger.warn(
        {
          userId,
          eventId,
          role: userMembership.role,
        },
        'User not an organizer, cannot choose date time'
      );
      return { error: 'User not an organizer' };
    }

    const dateTime = event.potentialDateTimes.find(
      pdt => pdt.id === pdtId
    )?.dateTime;

    if (!dateTime) {
      eventLogger.warn({ eventId, pdtId }, 'Date not found for selection');
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
      eventLogger.debug('No pusher events to send for date time selection');
    }

    await createEventNotifs({
      eventId,
      type: 'DATE_CHOSEN',
      datetime: dateTime,
    });

    return { success: true };
  } catch (error) {
    eventLogger.error('Failed to choose date time', error);
    return { error: 'Unable to choose date' };
  }
}
