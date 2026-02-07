import { expect, test, describe } from 'vitest';
import { api } from './_generated/api';
import {
  createTestInstance,
  TestScenarios,
  TestAssertions,
  createTestUser,
  createAuthenticatedUser,
  createTestEventWithDates,
  createTestEventWithMultipleUsers,
} from './test_helpers';

// Helper to get auth from dates setup
async function setupEventWithDates(
  t: ReturnType<typeof import('./test_helpers').createTestInstance>
) {
  const setup = await createTestEventWithDates(t);
  const auth = createAuthenticatedUser(t, setup.userId);
  return { ...setup, auth };
}

describe('Availability Domain', () => {
  describe('submitAvailability', () => {
    test('should create new availability responses', async () => {
      const t = createTestInstance();
      const { eventId, membershipId, potentialDateTimeIds, auth } =
        await setupEventWithDates(t);

      const result = await auth.mutation(
        api.availability.mutations.submitAvailability,
        {
          eventId,
          responses: [
            { potentialDateTimeId: potentialDateTimeIds[0], status: 'YES' },
            { potentialDateTimeId: potentialDateTimeIds[1], status: 'NO' },
            { potentialDateTimeId: potentialDateTimeIds[2], status: 'MAYBE' },
          ],
        }
      );

      expect(result.responses).toHaveLength(3);
      expect(result.responses[0].action).toBe('created');

      // Verify in database
      await TestAssertions.assertAvailabilityExists(
        t,
        membershipId,
        potentialDateTimeIds[0],
        'YES'
      );
      await TestAssertions.assertAvailabilityExists(
        t,
        membershipId,
        potentialDateTimeIds[1],
        'NO'
      );
    });

    test('should update existing availability responses', async () => {
      const t = createTestInstance();
      const { eventId, membershipId, potentialDateTimeIds, auth } =
        await setupEventWithDates(t);

      // Create initial response
      await auth.mutation(api.availability.mutations.submitAvailability, {
        eventId,
        responses: [
          { potentialDateTimeId: potentialDateTimeIds[0], status: 'YES' },
        ],
      });

      // Update the response
      const result = await auth.mutation(
        api.availability.mutations.submitAvailability,
        {
          eventId,
          responses: [
            { potentialDateTimeId: potentialDateTimeIds[0], status: 'NO' },
          ],
        }
      );

      expect(result.responses[0].action).toBe('updated');

      // Verify updated status
      await TestAssertions.assertAvailabilityExists(
        t,
        membershipId,
        potentialDateTimeIds[0],
        'NO'
      );
    });

    test('should require membership in the event', async () => {
      const t = createTestInstance();
      const { eventId, potentialDateTimeIds } =
        await createTestEventWithDates(t);
      const { userId } = await createTestUser(t, {
        email: 'outsider@example.com',
      });
      const outsiderAuth = createAuthenticatedUser(t, userId);

      await expect(
        outsiderAuth.mutation(api.availability.mutations.submitAvailability, {
          eventId,
          responses: [
            { potentialDateTimeId: potentialDateTimeIds[0], status: 'YES' },
          ],
        })
      ).rejects.toThrow('You are not a member of this event');
    });
  });

  describe('updateSingleAvailability', () => {
    test('should update availability for single date', async () => {
      const t = createTestInstance();
      const { membershipId, potentialDateTimeIds, auth } =
        await setupEventWithDates(t);

      const result = await auth.mutation(
        api.availability.mutations.updateSingleAvailability,
        {
          potentialDateTimeId: potentialDateTimeIds[0],
          status: 'YES',
        }
      );

      expect(result.status).toBe('YES');
      expect(result.action).toBe('created');

      await TestAssertions.assertAvailabilityExists(
        t,
        membershipId,
        potentialDateTimeIds[0],
        'YES'
      );
    });

    test('should create availability if not exists', async () => {
      const t = createTestInstance();
      const { potentialDateTimeIds, auth } = await setupEventWithDates(t);

      const result = await auth.mutation(
        api.availability.mutations.updateSingleAvailability,
        {
          potentialDateTimeId: potentialDateTimeIds[0],
          status: 'MAYBE',
        }
      );

      expect(result.action).toBe('created');
      expect(result.availabilityId).toBeTruthy();
    });

    test('should update existing availability', async () => {
      const t = createTestInstance();
      const { eventId, potentialDateTimeIds, auth } =
        await setupEventWithDates(t);

      // Create initial
      await auth.mutation(api.availability.mutations.submitAvailability, {
        eventId,
        responses: [
          { potentialDateTimeId: potentialDateTimeIds[0], status: 'YES' },
        ],
      });

      // Update using single method
      const result = await auth.mutation(
        api.availability.mutations.updateSingleAvailability,
        {
          potentialDateTimeId: potentialDateTimeIds[0],
          status: 'NO',
        }
      );

      expect(result.action).toBe('updated');
      expect(result.status).toBe('NO');
    });
  });

  describe('clearAllAvailability', () => {
    test('should delete all availability for user', async () => {
      const t = createTestInstance();
      const { eventId, membershipId, potentialDateTimeIds, auth } =
        await setupEventWithDates(t);

      // Create multiple availability responses
      await auth.mutation(api.availability.mutations.submitAvailability, {
        eventId,
        responses: [
          { potentialDateTimeId: potentialDateTimeIds[0], status: 'YES' },
          { potentialDateTimeId: potentialDateTimeIds[1], status: 'NO' },
          { potentialDateTimeId: potentialDateTimeIds[2], status: 'MAYBE' },
        ],
      });

      const result = await auth.mutation(
        api.availability.mutations.clearAllAvailability,
        { eventId }
      );

      expect(result.deletedCount).toBe(3);
      expect(result.membershipId).toBe(membershipId);

      // Verify all are deleted
      const { availabilities } = await t.run(async ctx => {
        const availabilities = await ctx.db
          .query('availabilities')
          .withIndex('by_membership', q => q.eq('membershipId', membershipId))
          .collect();
        return { availabilities };
      });

      expect(availabilities).toHaveLength(0);
    });

    test('should leave other users availability untouched', async () => {
      const t = createTestInstance();
      const setup = await createTestEventWithMultipleUsers(t);
      const organizerAuth = createAuthenticatedUser(t, setup.organizer.userId);
      const attendeeAuth = createAuthenticatedUser(t, setup.attendee.userId);

      // Create potential dates
      const { potentialDateTimeIds } = await t.run(async ctx => {
        const id = await ctx.db.insert('potentialDateTimes', {
          eventId: setup.eventId,
          dateTime: Date.now(),
        });
        return { potentialDateTimeIds: [id] };
      });

      // Both users submit availability
      await organizerAuth.mutation(
        api.availability.mutations.submitAvailability,
        {
          eventId: setup.eventId,
          responses: [
            { potentialDateTimeId: potentialDateTimeIds[0], status: 'YES' },
          ],
        }
      );

      await attendeeAuth.mutation(
        api.availability.mutations.submitAvailability,
        {
          eventId: setup.eventId,
          responses: [
            { potentialDateTimeId: potentialDateTimeIds[0], status: 'NO' },
          ],
        }
      );

      // Organizer clears their availability
      await organizerAuth.mutation(
        api.availability.mutations.clearAllAvailability,
        { eventId: setup.eventId }
      );

      // Attendee's availability should still exist
      const { attendeeAvailability } = await t.run(async ctx => {
        const attendeeAvailability = await ctx.db
          .query('availabilities')
          .withIndex('by_membership', q =>
            q.eq('membershipId', setup.attendee.membershipId)
          )
          .first();
        return { attendeeAvailability };
      });

      expect(attendeeAvailability).toBeTruthy();
      expect(attendeeAvailability!.status).toBe('NO');
    });
  });

  describe('addPotentialDateTimes', () => {
    test('should add new dates to event', async () => {
      const t = createTestInstance();
      const { eventId, auth } = await TestScenarios.singleEvent(t);

      const dateTimes = [Date.now(), Date.now() + 86400000];
      const result = await auth.mutation(
        api.availability.mutations.addPotentialDateTimes,
        {
          eventId,
          dateTimes,
        }
      );

      expect(result.potentialDateTimes).toHaveLength(2);
      expect(result.potentialDateTimes[0].eventId).toBe(eventId);
    });

    test('should require ORGANIZER role', async () => {
      const t = createTestInstance();
      const { eventId, attendeeAuth } = await TestScenarios.multiUser(t);

      await expect(
        attendeeAuth.mutation(
          api.availability.mutations.addPotentialDateTimes,
          {
            eventId,
            dateTimes: [Date.now()],
          }
        )
      ).rejects.toThrow();
    });
  });

  describe('removePotentialDateTimes', () => {
    test('should remove dates from event', async () => {
      const t = createTestInstance();
      const { eventId, potentialDateTimeIds, auth } =
        await setupEventWithDates(t);

      const result = await auth.mutation(
        api.availability.mutations.removePotentialDateTimes,
        {
          potentialDateTimeIds: [potentialDateTimeIds[0]],
        }
      );

      expect(result.deletedCount).toBe(1);

      // Verify deletion
      const { remainingDates } = await t.run(async ctx => {
        const remainingDates = await ctx.db
          .query('potentialDateTimes')
          .withIndex('by_event', q => q.eq('eventId', eventId))
          .collect();
        return { remainingDates };
      });

      expect(remainingDates).toHaveLength(2);
    });

    test('should cascade delete associated availability', async () => {
      const t = createTestInstance();
      const { eventId, potentialDateTimeIds, auth } =
        await setupEventWithDates(t);

      // Create availability for the date we'll delete
      await auth.mutation(api.availability.mutations.submitAvailability, {
        eventId,
        responses: [
          { potentialDateTimeId: potentialDateTimeIds[0], status: 'YES' },
        ],
      });

      // Remove the date
      await auth.mutation(api.availability.mutations.removePotentialDateTimes, {
        potentialDateTimeIds: [potentialDateTimeIds[0]],
      });

      // Verify availability was also deleted
      const { availabilities } = await t.run(async ctx => {
        const availabilities = await ctx.db
          .query('availabilities')
          .withIndex('by_potential_date', q =>
            q.eq('potentialDateTimeId', potentialDateTimeIds[0])
          )
          .collect();
        return { availabilities };
      });

      expect(availabilities).toHaveLength(0);
    });

    test('should require ORGANIZER role', async () => {
      const t = createTestInstance();
      const setup = await setupEventWithDates(t);

      // Create attendee
      const { userId: attendeeUserId } = await createTestUser(t, {
        email: 'attendee@example.com',
      });

      // Add attendee to event
      await t.run(async ctx => {
        const person = await ctx.db
          .query('persons')
          .filter(q => q.eq(q.field('userId'), attendeeUserId))
          .first();
        if (person) {
          await ctx.db.insert('memberships', {
            personId: person._id,
            eventId: setup.eventId,
            role: 'ATTENDEE',
            rsvpStatus: 'YES',
          });
        }
      });

      const attendeeAuth = createAuthenticatedUser(t, attendeeUserId);

      await expect(
        attendeeAuth.mutation(
          api.availability.mutations.removePotentialDateTimes,
          {
            potentialDateTimeIds: [setup.potentialDateTimeIds[0]],
          }
        )
      ).rejects.toThrow();
    });
  });

  describe('availability notes', () => {
    test('should submit availability with a note', async () => {
      const t = createTestInstance();
      const { eventId, membershipId, potentialDateTimeIds, auth } =
        await setupEventWithDates(t);

      const result = await auth.mutation(
        api.availability.mutations.submitAvailability,
        {
          eventId,
          responses: [
            {
              potentialDateTimeId: potentialDateTimeIds[0],
              status: 'YES',
              note: 'Prefer morning',
            },
          ],
        }
      );

      expect(result.responses).toHaveLength(1);

      // Verify note was saved
      const { availability } = await t.run(async ctx => {
        const availability = await ctx.db
          .query('availabilities')
          .withIndex('by_membership_date', q =>
            q
              .eq('membershipId', membershipId)
              .eq('potentialDateTimeId', potentialDateTimeIds[0])
          )
          .first();
        return { availability };
      });

      expect(availability?.note).toBe('Prefer morning');
    });

    test('should update availability note via updateSingleAvailability', async () => {
      const t = createTestInstance();
      const { eventId, membershipId, potentialDateTimeIds, auth } =
        await setupEventWithDates(t);

      // Create initial availability
      await auth.mutation(api.availability.mutations.submitAvailability, {
        eventId,
        responses: [
          { potentialDateTimeId: potentialDateTimeIds[0], status: 'YES' },
        ],
      });

      // Update with a note
      await auth.mutation(api.availability.mutations.updateSingleAvailability, {
        potentialDateTimeId: potentialDateTimeIds[0],
        status: 'YES',
        note: 'Updated note',
      });

      const { availability } = await t.run(async ctx => {
        const availability = await ctx.db
          .query('availabilities')
          .withIndex('by_membership_date', q =>
            q
              .eq('membershipId', membershipId)
              .eq('potentialDateTimeId', potentialDateTimeIds[0])
          )
          .first();
        return { availability };
      });

      expect(availability?.note).toBe('Updated note');
    });
  });

  describe('updatePotentialDateTimeNote', () => {
    test('should allow organizer to add note to date option', async () => {
      const t = createTestInstance();
      const { potentialDateTimeIds, auth } = await setupEventWithDates(t);

      const result = await auth.mutation(
        api.availability.mutations.updatePotentialDateTimeNote,
        {
          potentialDateTimeId: potentialDateTimeIds[0],
          note: 'Best option for the venue',
        }
      );

      expect(result.success).toBe(true);

      // Verify note was saved
      const { potentialDateTime } = await t.run(async ctx => {
        const potentialDateTime = await ctx.db.get(potentialDateTimeIds[0]);
        return { potentialDateTime };
      });

      expect(potentialDateTime?.note).toBe('Best option for the venue');
    });

    test('should require ORGANIZER role', async () => {
      const t = createTestInstance();
      const setup = await setupEventWithDates(t);

      // Create attendee
      const { userId: attendeeUserId } = await createTestUser(t, {
        email: 'attendee@example.com',
      });

      // Add attendee to event
      await t.run(async ctx => {
        const person = await ctx.db
          .query('persons')
          .filter(q => q.eq(q.field('userId'), attendeeUserId))
          .first();
        if (person) {
          await ctx.db.insert('memberships', {
            personId: person._id,
            eventId: setup.eventId,
            role: 'ATTENDEE',
            rsvpStatus: 'YES',
          });
        }
      });

      const attendeeAuth = createAuthenticatedUser(t, attendeeUserId);

      await expect(
        attendeeAuth.mutation(
          api.availability.mutations.updatePotentialDateTimeNote,
          {
            potentialDateTimeId: setup.potentialDateTimeIds[0],
            note: 'Should not work',
          }
        )
      ).rejects.toThrow();
    });
  });

  describe('getEventAvailabilityData', () => {
    test('should return complete availability data', async () => {
      const t = createTestInstance();
      const { eventId, potentialDateTimeIds, auth } =
        await setupEventWithDates(t);

      // Submit some availability
      await auth.mutation(api.availability.mutations.submitAvailability, {
        eventId,
        responses: [
          { potentialDateTimeId: potentialDateTimeIds[0], status: 'YES' },
        ],
      });

      const result = await auth.query(
        api.availability.queries.getEventAvailabilityData,
        { eventId }
      );

      expect(result.potentialDateTimes).toBeTruthy();
      expect(result.potentialDateTimes.length).toBeGreaterThan(0);
      expect(result.userRole).toBeTruthy();
      expect(result.userId).toBeTruthy();
    });

    test('should require membership in event', async () => {
      const t = createTestInstance();
      const { eventId } = await setupEventWithDates(t);
      const { userId } = await createTestUser(t, {
        email: 'outsider@example.com',
      });
      const outsiderAuth = createAuthenticatedUser(t, userId);

      await expect(
        outsiderAuth.query(api.availability.queries.getEventAvailabilityData, {
          eventId,
        })
      ).rejects.toThrow('You are not a member of this event');
    });
  });
});
