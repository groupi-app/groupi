import { expect, test, describe } from 'vitest';
import {
  createTestInstance,
  createTestUser,
  createTestEventWithUser,
} from './test_helpers';
import { api } from './_generated/api';

describe('Events Operations', () => {
  describe('createEvent', () => {
    test('should create event successfully', async () => {
      const t = createTestInstance();

      // Setup test data using helper
      const { userId, personId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });

      // Test creating event with authentication
      const asUser = t.withIdentity({ subject: userId });
      const result = await asUser.mutation(api.events.mutations.createEvent, {
        title: 'Test Event',
        description: 'Test Description',
        location: 'Test Location',
        potentialDateTimes: [
          new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          new Date(Date.now() + 2 * 86400000).toISOString(), // Day after tomorrow
        ],
      });

      expect(result.eventId).toBeDefined();

      // Verify event was returned and has correct structure
      expect(result.event?.title).toBe('Test Event');
      expect(result.event?.description).toBe('Test Description');
      expect(result.event?.location).toBe('Test Location');
      expect(result.event?.creatorId).toBe(personId);
      expect(result.event?.potentialDateTimes).toHaveLength(2);

      // Verify creator membership was created
      const membership = await t.run(async ctx => {
        return await ctx.db
          .query('memberships')
          .withIndex('by_person_event', q =>
            q.eq('personId', personId).eq('eventId', result.eventId)
          )
          .first();
      });

      expect(membership?.role).toBe('ORGANIZER');
      expect(membership?.rsvpStatus).toBe('YES');
    });

    test('should fail when user is not authenticated', async () => {
      const t = createTestInstance();

      await expect(
        t.mutation(api.events.mutations.createEvent, {
          title: 'Test Event',
          description: 'Test Description',
          potentialDateTimes: [new Date(Date.now() + 86400000).toISOString()],
        })
      ).rejects.toThrow('Authentication required');
    });

    test('should fail when title is empty', async () => {
      const t = createTestInstance();

      // Setup user
      const { userId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });

      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.events.mutations.createEvent, {
          title: '',
          description: 'Test Description',
          potentialDateTimes: [new Date(Date.now() + 86400000).toISOString()],
        })
      ).rejects.toThrow('Event title is required');
    });

    test('should create event with minimal data', async () => {
      const t = createTestInstance();

      const { userId, personId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });

      const asUser = t.withIdentity({ subject: userId });
      const result = await asUser.mutation(api.events.mutations.createEvent, {
        title: 'Minimal Event',
      });

      expect(result.eventId).toBeDefined();

      // Verify event was returned and has correct structure
      expect(result.event?.title).toBe('Minimal Event');
      expect(result.event?.description).toBe('');
      expect(result.event?.location).toBe('');
      expect(result.event?.creatorId).toBe(personId);
      expect(result.event?.potentialDateTimes).toEqual([]);
    });

    test('should handle potential date times correctly', async () => {
      const t = createTestInstance();

      const { userId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });

      const tomorrow = new Date(Date.now() + 86400000);
      const dayAfter = new Date(Date.now() + 2 * 86400000);

      const asUser = t.withIdentity({ subject: userId });
      const result = await asUser.mutation(api.events.mutations.createEvent, {
        title: 'Date Time Test Event',
        potentialDateTimes: [tomorrow.toISOString(), dayAfter.toISOString()],
      });

      const event = await t.run(async ctx => {
        return await ctx.db.get(result.eventId);
      });

      expect(event?.potentialDateTimes).toHaveLength(2);
      expect(event?.potentialDateTimes[0]).toBe(tomorrow.getTime());
      expect(event?.potentialDateTimes[1]).toBe(dayAfter.getTime());
    });

    test('should create event without imageStorageId', async () => {
      const t = createTestInstance();

      const { userId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });

      const asUser = t.withIdentity({ subject: userId });
      const result = await asUser.mutation(api.events.mutations.createEvent, {
        title: 'Event Without Image',
      });

      const event = await t.run(async ctx => {
        return await ctx.db.get(result.eventId);
      });

      expect(event?.imageStorageId).toBeUndefined();
    });

    test('should create event with visibility', async () => {
      const t = createTestInstance();

      const { userId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });

      const asUser = t.withIdentity({ subject: userId });
      const result = await asUser.mutation(api.events.mutations.createEvent, {
        title: 'Friends Event',
        visibility: 'FRIENDS',
      });

      const event = await t.run(async ctx => {
        return await ctx.db.get(result.eventId);
      });

      expect(event?.visibility).toBe('FRIENDS');
    });

    test('should default visibility to undefined (treated as PRIVATE)', async () => {
      const t = createTestInstance();

      const { userId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });

      const asUser = t.withIdentity({ subject: userId });
      const result = await asUser.mutation(api.events.mutations.createEvent, {
        title: 'Default Visibility Event',
      });

      const event = await t.run(async ctx => {
        return await ctx.db.get(result.eventId);
      });

      expect(event?.visibility).toBeUndefined();
    });
  });

  describe('updateEvent visibility', () => {
    test('should allow organizer to update visibility', async () => {
      const t = createTestInstance();

      const { userId, eventId } = await createTestEventWithUser(t);
      const asUser = t.withIdentity({ subject: userId });

      await asUser.mutation(api.events.mutations.updateEvent, {
        eventId,
        visibility: 'FRIENDS',
      });

      const event = await t.run(async ctx => {
        return await ctx.db.get(eventId);
      });

      expect(event?.visibility).toBe('FRIENDS');
    });

    test('should allow organizer to clear visibility with null', async () => {
      const t = createTestInstance();

      // Create event with FRIENDS visibility
      const { userId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });

      const asUser = t.withIdentity({ subject: userId });
      const result = await asUser.mutation(api.events.mutations.createEvent, {
        title: 'Friends Event',
        visibility: 'FRIENDS',
      });

      // Update to clear visibility
      await asUser.mutation(api.events.mutations.updateEvent, {
        eventId: result.eventId,
        visibility: null,
      });

      const event = await t.run(async ctx => {
        return await ctx.db.get(result.eventId);
      });

      expect(event?.visibility).toBeUndefined();
    });

    test('should prevent non-organizer from changing visibility', async () => {
      const t = createTestInstance();

      // Create event with organizer
      const { eventId } = await createTestEventWithUser(t, {
        username: 'organizer',
      });

      // Create an attendee
      const { userId: attendeeUserId, personId: attendeePersonId } =
        await createTestUser(t, {
          email: 'attendee@example.com',
          username: 'attendee',
          name: 'Attendee User',
        });

      // Add attendee as MODERATOR (not ORGANIZER)
      await t.run(async ctx => {
        await ctx.db.insert('memberships', {
          personId: attendeePersonId,
          eventId,
          role: 'MODERATOR',
          rsvpStatus: 'YES',
        });
      });

      const asAttendee = t.withIdentity({ subject: attendeeUserId });

      await expect(
        asAttendee.mutation(api.events.mutations.updateEvent, {
          eventId,
          visibility: 'FRIENDS',
        })
      ).rejects.toThrow('Only organizers can change event visibility');
    });
  });

  describe('joinDiscoverableEvent', () => {
    test('should allow friend to join FRIENDS-visible event', async () => {
      const t = createTestInstance();

      // Create organizer with FRIENDS event
      const { userId: organizerUserId } = await createTestUser(t, {
        email: 'organizer@example.com',
        username: 'organizer',
        name: 'Organizer',
      });

      const asOrganizer = t.withIdentity({ subject: organizerUserId });
      const eventResult = await asOrganizer.mutation(
        api.events.mutations.createEvent,
        {
          title: 'Friends Event',
          visibility: 'FRIENDS',
        }
      );

      // Create friend user
      const { userId: friendUserId, personId: friendPersonId } =
        await createTestUser(t, {
          email: 'friend@example.com',
          username: 'friend',
          name: 'Friend User',
        });

      // Create accepted friendship
      await t.run(async ctx => {
        const organizerPerson = await ctx.db
          .query('persons')
          .withIndex('by_user_id', q => q.eq('userId', organizerUserId))
          .first();

        await ctx.db.insert('friendships', {
          requesterId: organizerPerson!._id,
          addresseeId: friendPersonId,
          status: 'ACCEPTED',
          createdAt: Date.now(),
        });
      });

      // Friend joins the event
      const asFriend = t.withIdentity({ subject: friendUserId });
      const result = await asFriend.mutation(
        api.events.mutations.joinDiscoverableEvent,
        {
          eventId: eventResult.eventId,
        }
      );

      expect(result.membershipId).toBeDefined();
      expect(result.success).toBe(true);

      // Verify membership was created
      const membership = await t.run(async ctx => {
        return await ctx.db
          .query('memberships')
          .withIndex('by_person_event', q =>
            q.eq('personId', friendPersonId).eq('eventId', eventResult.eventId)
          )
          .first();
      });

      expect(membership?.role).toBe('ATTENDEE');
      expect(membership?.rsvpStatus).toBe('YES');
    });

    test('should reject joining PRIVATE event', async () => {
      const t = createTestInstance();

      const { userId: organizerUserId } = await createTestUser(t, {
        email: 'organizer@example.com',
        username: 'organizer',
        name: 'Organizer',
      });

      const asOrganizer = t.withIdentity({ subject: organizerUserId });
      const eventResult = await asOrganizer.mutation(
        api.events.mutations.createEvent,
        {
          title: 'Private Event',
        }
      );

      // Create another user (not a friend)
      const { userId: otherUserId } = await createTestUser(t, {
        email: 'other@example.com',
        username: 'other',
        name: 'Other User',
      });

      const asOther = t.withIdentity({ subject: otherUserId });

      await expect(
        asOther.mutation(api.events.mutations.joinDiscoverableEvent, {
          eventId: eventResult.eventId,
        })
      ).rejects.toThrow('not open for discovery');
    });

    test('should reject non-friend joining FRIENDS event', async () => {
      const t = createTestInstance();

      const { userId: organizerUserId } = await createTestUser(t, {
        email: 'organizer@example.com',
        username: 'organizer',
        name: 'Organizer',
      });

      const asOrganizer = t.withIdentity({ subject: organizerUserId });
      const eventResult = await asOrganizer.mutation(
        api.events.mutations.createEvent,
        {
          title: 'Friends Event',
          visibility: 'FRIENDS',
        }
      );

      // Create stranger (no friendship)
      const { userId: strangerUserId } = await createTestUser(t, {
        email: 'stranger@example.com',
        username: 'stranger',
        name: 'Stranger',
      });

      const asStranger = t.withIdentity({ subject: strangerUserId });

      await expect(
        asStranger.mutation(api.events.mutations.joinDiscoverableEvent, {
          eventId: eventResult.eventId,
        })
      ).rejects.toThrow('friends with the event organizer');
    });

    test('should reject joining if already a member', async () => {
      const t = createTestInstance();

      // Create organizer with FRIENDS event
      const { userId: organizerUserId } = await createTestUser(t, {
        email: 'organizer@example.com',
        username: 'organizer',
        name: 'Organizer',
      });

      const asOrganizer = t.withIdentity({ subject: organizerUserId });
      const eventResult = await asOrganizer.mutation(
        api.events.mutations.createEvent,
        {
          title: 'Friends Event',
          visibility: 'FRIENDS',
        }
      );

      // Create friend and add friendship
      const { userId: friendUserId, personId: friendPersonId } =
        await createTestUser(t, {
          email: 'friend@example.com',
          username: 'friend',
          name: 'Friend User',
        });

      await t.run(async ctx => {
        const organizerPerson = await ctx.db
          .query('persons')
          .withIndex('by_user_id', q => q.eq('userId', organizerUserId))
          .first();

        await ctx.db.insert('friendships', {
          requesterId: organizerPerson!._id,
          addresseeId: friendPersonId,
          status: 'ACCEPTED',
          createdAt: Date.now(),
        });

        // Also add friend as member already
        await ctx.db.insert('memberships', {
          personId: friendPersonId,
          eventId: eventResult.eventId,
          role: 'ATTENDEE',
          rsvpStatus: 'YES',
        });
      });

      const asFriend = t.withIdentity({ subject: friendUserId });

      await expect(
        asFriend.mutation(api.events.mutations.joinDiscoverableEvent, {
          eventId: eventResult.eventId,
        })
      ).rejects.toThrow('already a member');
    });

    test('should reject joining if banned', async () => {
      const t = createTestInstance();

      const { userId: organizerUserId } = await createTestUser(t, {
        email: 'organizer@example.com',
        username: 'organizer',
        name: 'Organizer',
      });

      const asOrganizer = t.withIdentity({ subject: organizerUserId });
      const eventResult = await asOrganizer.mutation(
        api.events.mutations.createEvent,
        {
          title: 'Friends Event',
          visibility: 'FRIENDS',
        }
      );

      const { userId: friendUserId, personId: friendPersonId } =
        await createTestUser(t, {
          email: 'friend@example.com',
          username: 'friend',
          name: 'Friend User',
        });

      await t.run(async ctx => {
        const organizerPerson = await ctx.db
          .query('persons')
          .withIndex('by_user_id', q => q.eq('userId', organizerUserId))
          .first();

        await ctx.db.insert('friendships', {
          requesterId: organizerPerson!._id,
          addresseeId: friendPersonId,
          status: 'ACCEPTED',
          createdAt: Date.now(),
        });

        // Ban the friend
        await ctx.db.insert('eventBans', {
          personId: friendPersonId,
          eventId: eventResult.eventId,
          bannedAt: Date.now(),
          bannedById: organizerPerson!._id,
        });
      });

      const asFriend = t.withIdentity({ subject: friendUserId });

      await expect(
        asFriend.mutation(api.events.mutations.joinDiscoverableEvent, {
          eventId: eventResult.eventId,
        })
      ).rejects.toThrow('banned');
    });
  });

  describe('date and reminder validation', () => {
    test('should reject createEvent with chosenDateTime in the past', async () => {
      const t = createTestInstance();
      const { userId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.events.mutations.createEvent, {
          title: 'Past Event',
          chosenDateTime: new Date(
            Date.now() - 24 * 60 * 60 * 1000
          ).toISOString(),
        })
      ).rejects.toThrow('Event date must be in the future');
    });

    test('should reject createEvent with potential date options in the past', async () => {
      const t = createTestInstance();
      const { userId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.events.mutations.createEvent, {
          title: 'Past Options Event',
          potentialDateTimeOptions: [
            {
              start: new Date(Date.now() - 86400000).toISOString(),
            },
            {
              start: new Date(Date.now() + 86400000).toISOString(),
            },
          ],
        })
      ).rejects.toThrow('All date options must be in the future');
    });

    test('should reject createEvent with reminder offset that would fire in the past', async () => {
      const t = createTestInstance();
      const { userId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });
      const asUser = t.withIdentity({ subject: userId });

      // Event is 30 minutes from now, but reminder is 1 day before
      await expect(
        asUser.mutation(api.events.mutations.createEvent, {
          title: 'Bad Reminder Event',
          chosenDateTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          reminderOffset: '1_DAY',
        })
      ).rejects.toThrow('Reminder time would be in the past');
    });

    test('should accept createEvent with valid future date and valid reminder', async () => {
      const t = createTestInstance();
      const { userId } = await createTestUser(t, {
        email: 'test@example.com',
        username: 'testuser',
        name: 'Test User',
      });
      const asUser = t.withIdentity({ subject: userId });

      const result = await asUser.mutation(api.events.mutations.createEvent, {
        title: 'Future Event',
        chosenDateTime: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        reminderOffset: '1_DAY',
      });

      expect(result.eventId).toBeDefined();
      expect(result.event?.reminderOffset).toBe('1_DAY');
    });

    test('should reject chooseEventDate with date in the past', async () => {
      const t = createTestInstance();
      const { userId, eventId: testEventId } = await createTestEventWithUser(
        t,
        {
          userEmail: 'test@example.com',
          eventTitle: 'Date Test',
        }
      );
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.events.mutations.chooseEventDate, {
          eventId: testEventId,
          chosenDateTime: Date.now() - 86400000,
        })
      ).rejects.toThrow('Event date must be in the future');
    });

    test('should reject chooseEventDate with reminder offset that would fire in the past', async () => {
      const t = createTestInstance();
      const { userId, eventId: testEventId } = await createTestEventWithUser(
        t,
        {
          userEmail: 'test@example.com',
          eventTitle: 'Reminder Test',
        }
      );
      const asUser = t.withIdentity({ subject: userId });

      // Event in 2 hours, but reminder is 1 day before
      await expect(
        asUser.mutation(api.events.mutations.chooseEventDate, {
          eventId: testEventId,
          chosenDateTime: Date.now() + 2 * 60 * 60 * 1000,
          reminderOffset: '1_DAY',
        })
      ).rejects.toThrow('Reminder time would be in the past');
    });

    // Note: reminderOffset validation on updateEvent was removed.
    // Reminder management is now handled via addon mutations (enableAddon/updateAddonConfig).

    test('should reject updatePotentialDateTimes with dates in the past', async () => {
      const t = createTestInstance();
      const { userId, eventId: testEventId } = await createTestEventWithUser(
        t,
        {
          userEmail: 'test@example.com',
          eventTitle: 'Potential Date Test',
        }
      );
      const asUser = t.withIdentity({ subject: userId });

      await expect(
        asUser.mutation(api.events.mutations.updatePotentialDateTimes, {
          eventId: testEventId,
          potentialDateTimeOptions: [
            { start: Date.now() - 86400000 },
            { start: Date.now() + 86400000 },
          ],
        })
      ).rejects.toThrow('All date options must be in the future');
    });
  });
});
