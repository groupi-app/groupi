import { expect, test, describe } from 'vitest';
import { createTestInstance, createTestUser } from './test_helpers';
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
  });
});
