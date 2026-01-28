import { ConvexHttpClient } from 'convex/browser';

/**
 * Convex data seeder for E2E tests.
 *
 * Uses ConvexHttpClient to call test-only Convex mutations
 * for seeding test data and managing test state.
 *
 * IMPORTANT: The e2e mutations in Convex are guarded by E2E_TESTING env var.
 */
export class ConvexSeeder {
  private client: ConvexHttpClient;
  private createdIds: {
    users: string[];
    persons: string[];
    events: string[];
    posts: string[];
    invites: string[];
    memberships: string[];
  };

  constructor() {
    const convexUrl =
      process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!convexUrl) {
      throw new Error(
        'CONVEX_URL or NEXT_PUBLIC_CONVEX_URL environment variable is required'
      );
    }

    this.client = new ConvexHttpClient(convexUrl);
    this.createdIds = {
      users: [],
      persons: [],
      events: [],
      posts: [],
      invites: [],
      memberships: [],
    };
  }

  /**
   * Create a test session with user, person, and session token.
   * @param skipPerson - If true, skips creating person record (for onboarding tests)
   */
  async createTestSession(userData: {
    email: string;
    name?: string;
    username?: string;
    skipPerson?: boolean;
  }): Promise<{
    userId: string;
    personId: string | null;
    sessionToken: string;
  }> {
    const result = await this.client.mutation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'e2e/mutations:createTestSession' as any,
      {
        email: userData.email,
        name: userData.name || 'Test User',
        username: userData.username || userData.email.split('@')[0],
        skipPerson: userData.skipPerson || false,
      }
    );

    this.createdIds.users.push(result.userId);
    if (result.personId) {
      this.createdIds.persons.push(result.personId);
    }

    return result;
  }

  /**
   * Get the last magic link sent to an email (for testing).
   * Returns null if no verification found.
   */
  async getLastMagicLink(email: string): Promise<string | null> {
    const result = await this.client.query(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'e2e/mutations:getLastMagicLink' as any,
      { email }
    );

    return result?.url ?? null;
  }

  /**
   * Poll for magic link with retries.
   * Waits for verification record to be created and returns the URL.
   */
  async waitForMagicLink(
    email: string,
    maxAttempts: number = 15,
    delayMs: number = 500
  ): Promise<string | null> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const url = await this.getLastMagicLink(email);
      if (url) {
        return url;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    return null;
  }

  /**
   * Create a test event.
   */
  async createEvent(data: {
    creatorPersonId: string;
    title: string;
    description?: string;
    location?: string;
    chosenDateTime?: number;
  }): Promise<{
    eventId: string;
    membershipId: string;
  }> {
    const result = await this.client.mutation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'e2e/mutations:seedEvent' as any,
      {
        creatorPersonId: data.creatorPersonId,
        title: data.title,
        description: data.description || 'Test event description',
        location: data.location || 'Test Location',
        chosenDateTime: data.chosenDateTime,
      }
    );

    this.createdIds.events.push(result.eventId);
    this.createdIds.memberships.push(result.membershipId);

    return result;
  }

  /**
   * Create a test post in an event.
   */
  async createPost(data: {
    eventId: string;
    authorPersonId: string;
    title: string;
    content: string;
  }): Promise<{
    postId: string;
  }> {
    const result = await this.client.mutation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'e2e/mutations:seedPost' as any,
      data
    );

    this.createdIds.posts.push(result.postId);

    return result;
  }

  /**
   * Create a test invite for an event.
   */
  async createInvite(data: {
    eventId: string;
    creatorMembershipId: string;
    name?: string;
    maxUses?: number;
  }): Promise<{
    inviteId: string;
    inviteToken: string;
  }> {
    const result = await this.client.mutation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'e2e/mutations:seedInvite' as any,
      data
    );

    this.createdIds.invites.push(result.inviteId);

    return result;
  }

  /**
   * Add a user as a member of an event.
   */
  async addMembership(data: {
    personId: string;
    eventId: string;
    role?: 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';
    rsvpStatus?: 'YES' | 'MAYBE' | 'NO' | 'PENDING';
  }): Promise<{
    membershipId: string;
  }> {
    const result = await this.client.mutation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'e2e/mutations:seedMembership' as any,
      {
        personId: data.personId,
        eventId: data.eventId,
        role: data.role || 'ATTENDEE',
        rsvpStatus: data.rsvpStatus || 'YES',
      }
    );

    this.createdIds.memberships.push(result.membershipId);

    return result;
  }

  /**
   * Clean up all test data created by this seeder instance.
   */
  async cleanup(): Promise<void> {
    if (
      this.createdIds.users.length === 0 &&
      this.createdIds.events.length === 0 &&
      this.createdIds.posts.length === 0 &&
      this.createdIds.invites.length === 0
    ) {
      return;
    }

    try {
      await this.client.mutation(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'e2e/mutations:cleanupTestData' as any,
        {
          userIds: this.createdIds.users,
          personIds: this.createdIds.persons,
          eventIds: this.createdIds.events,
          postIds: this.createdIds.posts,
          inviteIds: this.createdIds.invites,
          membershipIds: this.createdIds.memberships,
        }
      );

      // Reset tracking
      this.createdIds = {
        users: [],
        persons: [],
        events: [],
        posts: [],
        invites: [],
        memberships: [],
      };
    } catch (error) {
      console.warn('Failed to cleanup test data:', error);
    }
  }

  /**
   * Get the count of created resources (for debugging).
   */
  getCreatedCounts(): Record<string, number> {
    return {
      users: this.createdIds.users.length,
      persons: this.createdIds.persons.length,
      events: this.createdIds.events.length,
      posts: this.createdIds.posts.length,
      invites: this.createdIds.invites.length,
      memberships: this.createdIds.memberships.length,
    };
  }
}
