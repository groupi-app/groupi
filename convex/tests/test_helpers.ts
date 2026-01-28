import { convexTest } from 'convex-test';
import { expect } from 'vitest';
import schema from '../schema';
import { Id } from '../_generated/dataModel';

// Extract API references to avoid deep type instantiation
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const api: any = require('../_generated/api').api;

// Type declaration for import.meta.glob (Vite feature)
declare global {
  interface ImportMeta {
    glob: (
      pattern: string,
      options?: { eager?: boolean }
    ) => Record<string, () => Promise<unknown>>;
  }
}

/**
 * Test helpers for Convex function testing
 *
 * These helpers reduce boilerplate and ensure consistent test patterns.
 *
 * Note: Users are managed by the Better Auth component.
 * For testing, we create person records with mock userIds and use
 * withIdentity to simulate authentication.
 */

// Type definitions for test return values
export interface TestUser {
  userId: string; // Better Auth component user ID (string)
  personId: Id<'persons'>;
}

export interface TestEventWithUser extends TestUser {
  eventId: Id<'events'>;
  membershipId: Id<'memberships'>;
}

export interface TestEventWithMultipleUsers {
  organizer: TestUser & {
    eventId: Id<'events'>;
    membershipId: Id<'memberships'>;
  };
  attendee: TestUser & { membershipId: Id<'memberships'> };
  eventId: Id<'events'>;
}

/**
 * Initialize a convex-test instance with proper configuration
 */
export function createTestInstance() {
  const modules = import.meta.glob('../**/*.{ts,js}', {
    eager: false,
  });
  return convexTest(schema, modules);
}

/**
 * Generate a mock user ID for testing
 * In production, this would be an ID from the Better Auth component
 */
function generateMockUserId(seed?: string): string {
  return `test_user_${seed || Math.random().toString(36).substring(7)}`;
}

/**
 * Create a basic user (no event involvement)
 * Note: This creates a person record with a mock userId.
 * The actual user is managed by Better Auth component.
 */
export async function createTestUser(
  t: ReturnType<typeof convexTest>,
  userData: {
    email?: string;
    username?: string;
    name?: string;
    bio?: string;
    role?: string;
  } = {}
): Promise<TestUser> {
  return await t.run(async ctx => {
    // Generate a mock userId (in production this comes from Better Auth)
    const userId = generateMockUserId(userData.username || userData.email);

    // Create person record in our schema
    const personId = await ctx.db.insert('persons', {
      userId: userId,
      bio: userData.bio || 'Test user bio',
    });

    return { userId, personId };
  });
}

/**
 * Create user + event + membership (user as organizer)
 */
export async function createTestEventWithUser(
  t: ReturnType<typeof convexTest>,
  options: {
    userEmail?: string;
    username?: string;
    userName?: string;
    eventTitle?: string;
    eventDescription?: string;
    eventLocation?: string;
    userRole?: 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';
    rsvpStatus?: 'YES' | 'MAYBE' | 'NO' | 'PENDING';
  } = {}
): Promise<TestEventWithUser> {
  return await t.run(async ctx => {
    // Generate a mock userId
    const userId = generateMockUserId(options.username || options.userEmail);

    // Create person
    const personId = await ctx.db.insert('persons', {
      userId: userId,
      bio: 'Test user bio',
    });

    // Create event
    const eventId = await ctx.db.insert('events', {
      title: options.eventTitle || 'Test Event',
      description: options.eventDescription || 'A test event',
      creatorId: personId,
      location: options.eventLocation || 'Test Location',
      potentialDateTimes: [],
      chosenDateTime: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      timezone: 'UTC',
    });

    // Create membership
    const membershipId = await ctx.db.insert('memberships', {
      personId: personId,
      eventId: eventId,
      role: options.userRole || 'ORGANIZER',
      rsvpStatus: options.rsvpStatus || 'YES',
    });

    return { userId, personId, eventId, membershipId };
  });
}

/**
 * Create event with multiple users (organizer + attendee)
 */
export async function createTestEventWithMultipleUsers(
  t: ReturnType<typeof convexTest>,
  options: {
    organizerEmail?: string;
    attendeeEmail?: string;
    eventTitle?: string;
    eventLocation?: string;
  } = {}
): Promise<TestEventWithMultipleUsers> {
  return await t.run(async ctx => {
    // Create organizer
    const organizerId = generateMockUserId('organizer');
    const organizerPersonId = await ctx.db.insert('persons', {
      userId: organizerId,
      bio: 'Event organizer',
    });

    // Create attendee
    const attendeeId = generateMockUserId('attendee');
    const attendeePersonId = await ctx.db.insert('persons', {
      userId: attendeeId,
      bio: 'Event attendee',
    });

    // Create event (organizer creates it)
    const eventId = await ctx.db.insert('events', {
      title: options.eventTitle || 'Multi-User Test Event',
      description: 'Event with multiple users',
      creatorId: organizerPersonId,
      location: options.eventLocation || 'Test Location',
      potentialDateTimes: [],
      chosenDateTime: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      timezone: 'UTC',
    });

    // Create organizer membership
    const organizerMembershipId = await ctx.db.insert('memberships', {
      personId: organizerPersonId,
      eventId: eventId,
      role: 'ORGANIZER',
      rsvpStatus: 'YES',
    });

    // Create attendee membership
    const attendeeMembershipId = await ctx.db.insert('memberships', {
      personId: attendeePersonId,
      eventId: eventId,
      role: 'ATTENDEE',
      rsvpStatus: 'PENDING',
    });

    return {
      organizer: {
        userId: organizerId,
        personId: organizerPersonId,
        eventId,
        membershipId: organizerMembershipId,
      },
      attendee: {
        userId: attendeeId,
        personId: attendeePersonId,
        membershipId: attendeeMembershipId,
      },
      eventId,
    };
  });
}

/**
 * Create an authenticated test client for a user
 * Uses withIdentity to simulate Better Auth authentication
 */
export function createAuthenticatedUser(
  t: ReturnType<typeof convexTest>,
  userId: string
) {
  return t.withIdentity({ subject: userId });
}

/**
 * Helper to create post in event
 */
export async function createTestPost(
  authenticatedClient: ReturnType<typeof createAuthenticatedUser>,
  data: {
    eventId: Id<'events'>;
    title?: string;
    content?: string;
  }
) {
  return await authenticatedClient.mutation(api.posts.mutations.createPost, {
    eventId: data.eventId,
    title: data.title || 'Test Post',
    content: data.content || 'Test post content',
  });
}

/**
 * Common test patterns for setting up different scenarios
 */
export const TestScenarios = {
  /**
   * Simple user scenario - just user, no events
   */
  async simpleUser(t: ReturnType<typeof convexTest>) {
    const { userId, personId } = await createTestUser(t);
    const auth = createAuthenticatedUser(t, userId);
    return { userId, personId, auth };
  },

  /**
   * Single event scenario - user creates and joins event
   */
  async singleEvent(t: ReturnType<typeof convexTest>) {
    const { userId, personId, eventId, membershipId } =
      await createTestEventWithUser(t);
    const auth = createAuthenticatedUser(t, userId);
    return { userId, personId, eventId, membershipId, auth };
  },

  /**
   * Multi-user scenario - organizer and attendee in same event
   */
  async multiUser(t: ReturnType<typeof convexTest>) {
    const setup = await createTestEventWithMultipleUsers(t);
    const organizerAuth = createAuthenticatedUser(t, setup.organizer.userId);
    const attendeeAuth = createAuthenticatedUser(t, setup.attendee.userId);

    return {
      ...setup,
      organizerAuth,
      attendeeAuth,
    };
  },

  /**
   * Permission testing scenario - user NOT in event
   */
  async outsiderUser(t: ReturnType<typeof convexTest>) {
    // Create event with one user
    const { userId: eventUserId, eventId } = await createTestEventWithUser(t);

    // Create separate outsider user
    const { userId: outsiderUserId, personId: outsiderPersonId } =
      await createTestUser(t, {
        email: 'outsider@example.com',
        username: 'outsider',
        name: 'Outsider User',
      });

    const eventUserAuth = createAuthenticatedUser(t, eventUserId);
    const outsiderAuth = createAuthenticatedUser(t, outsiderUserId);

    return {
      eventUserId,
      eventId,
      outsiderUserId,
      outsiderPersonId,
      eventUserAuth,
      outsiderAuth,
    };
  },
};

/**
 * Create user + event + invite (for testing invite functionality)
 */
export async function createTestEventWithInvite(
  t: ReturnType<typeof convexTest>,
  options: {
    inviteName?: string;
    usesTotal?: number;
    expiresAt?: number;
  } = {}
): Promise<
  TestEventWithUser & { inviteId: Id<'invites'>; inviteToken: string }
> {
  const eventSetup = await createTestEventWithUser(t);

  const { inviteId, inviteToken } = await t.run(async ctx => {
    const token = `test_invite_${Math.random().toString(36).substring(7)}`;
    const inviteId = await ctx.db.insert('invites', {
      eventId: eventSetup.eventId,
      createdById: eventSetup.membershipId,
      token,
      name: options.inviteName,
      usesTotal: options.usesTotal,
      usesRemaining: options.usesTotal,
      expiresAt: options.expiresAt,
    });
    return { inviteId, inviteToken: token };
  });

  return { ...eventSetup, inviteId, inviteToken };
}

/**
 * Create event with potential date times (for testing availability)
 */
export async function createTestEventWithDates(
  t: ReturnType<typeof convexTest>,
  options: {
    dateCount?: number;
  } = {}
): Promise<
  TestEventWithUser & { potentialDateTimeIds: Id<'potentialDateTimes'>[] }
> {
  const eventSetup = await createTestEventWithUser(t);
  const dateCount = options.dateCount ?? 3;

  const { potentialDateTimeIds } = await t.run(async ctx => {
    const ids: Id<'potentialDateTimes'>[] = [];
    const baseTime = Date.now();
    for (let i = 0; i < dateCount; i++) {
      const id = await ctx.db.insert('potentialDateTimes', {
        eventId: eventSetup.eventId,
        dateTime: baseTime + i * 24 * 60 * 60 * 1000, // Each day apart
      });
      ids.push(id);
    }
    return { potentialDateTimeIds: ids };
  });

  return { ...eventSetup, potentialDateTimeIds };
}

/**
 * Create user with notification settings
 */
export async function createTestUserWithSettings(
  t: ReturnType<typeof convexTest>,
  options: {
    enabledMethods?: Array<{
      type: 'EMAIL' | 'PUSH' | 'WEBHOOK';
      value: string;
      name?: string;
    }>;
  } = {}
): Promise<TestUser & { personSettingsId: Id<'personSettings'> }> {
  const userSetup = await createTestUser(t);

  const { personSettingsId } = await t.run(async ctx => {
    const settingsId = await ctx.db.insert('personSettings', {
      personId: userSetup.personId,
    });

    // Create notification methods if provided
    for (const method of options.enabledMethods ?? []) {
      await ctx.db.insert('notificationMethods', {
        settingsId,
        type: method.type,
        enabled: true,
        value: method.value,
        name: method.name,
      });
    }

    return { personSettingsId: settingsId };
  });

  return { ...userSetup, personSettingsId };
}

/**
 * Assertion helpers for common test patterns
 */
export const TestAssertions = {
  /**
   * Assert that a person exists and has expected userId
   */
  async assertPersonExists(
    t: ReturnType<typeof convexTest>,
    personId: Id<'persons'>,
    expectedUserId: string
  ) {
    const { person } = await t.run(async ctx => {
      const person = await ctx.db.get(personId);
      return { person };
    });

    expect(person).toBeTruthy();
    expect(person!.userId).toBe(expectedUserId);
    return person!;
  },

  /**
   * Assert that a post was created correctly
   */
  async assertPostCreated(
    t: ReturnType<typeof convexTest>,
    postId: Id<'posts'>,
    expected: { title: string; content: string; authorId: Id<'persons'> }
  ) {
    const { post } = await t.run(async ctx => {
      const post = await ctx.db.get(postId);
      return { post };
    });

    expect(post).toBeTruthy();
    expect(post!.title).toBe(expected.title);
    expect(post!.content).toBe(expected.content);
    expect(post!.authorId).toBe(expected.authorId);
    return post!;
  },

  /**
   * Assert that notifications were created
   */
  async assertNotificationsCreated(
    t: ReturnType<typeof convexTest>,
    expectedCount: number,
    expectedType?: string
  ) {
    const { notifications } = await t.run(async ctx => {
      const notifications = await ctx.db.query('notifications').collect();
      return { notifications };
    });

    expect(notifications).toHaveLength(expectedCount);
    if (expectedType) {
      expect(notifications[0]?.type).toBe(expectedType);
    }
    return notifications;
  },

  /**
   * Assert that an invite was created correctly
   */
  async assertInviteCreated(
    t: ReturnType<typeof convexTest>,
    inviteId: Id<'invites'>,
    expected: { eventId: Id<'events'>; usesTotal?: number; name?: string }
  ) {
    const { invite } = await t.run(async ctx => {
      const invite = await ctx.db.get(inviteId);
      return { invite };
    });

    expect(invite).toBeTruthy();
    expect(invite!.eventId).toBe(expected.eventId);
    if (expected.usesTotal !== undefined) {
      expect(invite!.usesTotal).toBe(expected.usesTotal);
      expect(invite!.usesRemaining).toBe(expected.usesTotal);
    }
    if (expected.name !== undefined) {
      expect(invite!.name).toBe(expected.name);
    }
    return invite!;
  },

  /**
   * Assert that a membership was created for a user in an event
   */
  async assertMembershipCreated(
    t: ReturnType<typeof convexTest>,
    personId: Id<'persons'>,
    eventId: Id<'events'>
  ) {
    const { membership } = await t.run(async ctx => {
      const memberships = await ctx.db.query('memberships').collect();
      const membership = memberships.find(
        m => m.personId === personId && m.eventId === eventId
      );
      return { membership };
    });

    expect(membership).toBeTruthy();
    return membership!;
  },

  /**
   * Assert that availability was submitted for a potential date
   */
  async assertAvailabilityExists(
    t: ReturnType<typeof convexTest>,
    membershipId: Id<'memberships'>,
    potentialDateTimeId: Id<'potentialDateTimes'>,
    expectedStatus?: 'YES' | 'NO' | 'MAYBE'
  ) {
    const { availability } = await t.run(async ctx => {
      const availabilities = await ctx.db.query('availabilities').collect();
      const availability = availabilities.find(
        a =>
          a.membershipId === membershipId &&
          a.potentialDateTimeId === potentialDateTimeId
      );
      return { availability };
    });

    expect(availability).toBeTruthy();
    if (expectedStatus) {
      expect(availability!.status).toBe(expectedStatus);
    }
    return availability!;
  },
};

// Add additional scenarios to TestScenarios
Object.assign(TestScenarios, {
  /**
   * Event with invite scenario
   */
  async eventWithInvite(t: ReturnType<typeof convexTest>) {
    const setup = await createTestEventWithInvite(t);
    const auth = createAuthenticatedUser(t, setup.userId);
    return { ...setup, auth };
  },

  /**
   * Event with potential dates scenario
   */
  async eventWithDates(t: ReturnType<typeof convexTest>) {
    const setup = await createTestEventWithDates(t);
    const auth = createAuthenticatedUser(t, setup.userId);
    return { ...setup, auth };
  },

  /**
   * User with notification settings scenario
   */
  async userWithSettings(t: ReturnType<typeof convexTest>) {
    const setup = await createTestUserWithSettings(t);
    const auth = createAuthenticatedUser(t, setup.userId);
    return { ...setup, auth };
  },
});
