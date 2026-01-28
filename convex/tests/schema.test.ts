import { expect, test, describe } from 'vitest';
import { createTestInstance, createTestUser } from './test_helpers';

describe('Database Schema Tests', () => {
  test('should initialize with empty database', async () => {
    const t = createTestInstance();

    const result = await t.run(async ctx => {
      // Verify we can access the database context and it starts empty
      const events = await ctx.db.query('events').collect();
      return events.length;
    });

    // Should start with empty database
    expect(result).toBe(0);
  });

  test('should support basic database operations', async () => {
    const t = createTestInstance();

    // Test using our helper functions instead of manual setup
    // Note: Users are managed by Better Auth component, not in our schema
    // So we only test with person records
    const { userId, personId } = await createTestUser(t, {
      email: 'test@example.com',
      username: 'testuser',
      name: 'Test User',
      bio: 'Test user bio',
    });

    // Create an event using the helper-created user
    const { eventId } = await t.run(async ctx => {
      const eventId = await ctx.db.insert('events', {
        title: 'Test Event',
        description: 'A test event',
        creatorId: personId,
        location: 'Test Location',
        potentialDateTimes: [],
        chosenDateTime: undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        timezone: 'UTC',
      });

      return { eventId };
    });

    // Verify all data was created correctly
    const { event, creator } = await t.run(async ctx => {
      const event = await ctx.db.get(eventId);
      const creator = await ctx.db.get(personId);
      return { event, creator };
    });

    expect(event).toBeTruthy();
    expect(event!.title).toBe('Test Event');
    expect(event!.creatorId).toBe(personId);

    expect(creator).toBeTruthy();
    expect(creator!.userId).toBe(userId);
    expect(creator!.bio).toBe('Test user bio');

    // Verify userId is a string (mock user ID in tests)
    expect(typeof userId).toBe('string');
  });
});
