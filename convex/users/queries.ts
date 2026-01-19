import { query } from '../_generated/server';
import { v } from 'convex/values';
import {
  getCurrentPerson,
  authComponent,
  ExtendedAuthUser,
  AuthUserId,
} from '../auth';

/**
 * Users queries for the Convex backend
 *
 * These functions handle user data retrieval with proper authentication
 * and authorization checks.
 *
 * Note: Users are managed by the Better Auth component.
 * We use authComponent.getAnyUserById() to look up user data.
 */

/**
 * Get current authenticated user's profile
 * Used by navigation and user state management
 */
export const getCurrentUserProfile = query({
  args: {
    _traceId: v.optional(v.string()),
  },
  handler: async ctx => {
    const currentPerson = await getCurrentPerson(ctx);
    if (!currentPerson) {
      return null;
    }

    // Look up user via Better Auth component
    const user = await authComponent.getAnyUserById(
      ctx,
      currentPerson.userId as AuthUserId
    );
    if (!user) {
      return null;
    }

    return {
      user: {
        id: user._id,
        name: user.name || null,
        email: user.email,
        image: user.image || null,
        username: (user as ExtendedAuthUser).username || null,
        bio: currentPerson.bio || null,
        pronouns: currentPerson.pronouns || null,
        lastSeen: currentPerson.lastSeen || null,
      },
      person: {
        id: currentPerson._id,
        bio: currentPerson.bio || null,
        pronouns: currentPerson.pronouns || null,
        lastSeen: currentPerson.lastSeen || null,
      },
    };
  },
});

/**
 * Get user profile by username
 * Used for profile lookups by username
 *
 * Note: Since users are in the Better Auth component, we need to
 * search through persons and look up each user to find by username.
 */
export const getUserByUsername = query({
  args: {
    username: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { username }) => {
    const searchUsername = username.toLowerCase();

    // Get all persons and find the one with matching username
    const persons = await ctx.db.query('persons').collect();

    for (const person of persons) {
      const user = await authComponent.getAnyUserById(
        ctx,
        person.userId as AuthUserId
      );
      if (
        user &&
        (user as ExtendedAuthUser).username?.toLowerCase() === searchUsername
      ) {
        return {
          user: {
            id: user._id,
            name: user.name || null,
            email: user.email,
            image: user.image || null,
            username: (user as ExtendedAuthUser).username || null,
            bio: person.bio || null,
            pronouns: person.pronouns || null,
            lastSeen: person.lastSeen || null,
          },
        };
      }
    }

    return null;
  },
});

/**
 * Get user profile by person ID
 * Used by profile dialogs and user information displays
 */
export const getUserProfile = query({
  args: {
    personId: v.id('persons'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { personId }) => {
    // Get the person record
    const person = await ctx.db.get(personId);
    if (!person) {
      throw new Error('Person not found');
    }

    // Look up user via Better Auth component
    const user = await authComponent.getAnyUserById(
      ctx,
      person.userId as AuthUserId
    );
    if (!user) {
      throw new Error('User not found');
    }

    return {
      user: {
        id: user._id,
        name: user.name || null,
        email: user.email,
        image: user.image || null,
        username: (user as ExtendedAuthUser).username || null,
        bio: person.bio || null,
        pronouns: person.pronouns || null,
        lastSeen: person.lastSeen || null,
      },
    };
  },
});

/**
 * Get user profile by user ID (string)
 * Used when we have a user ID from the Better Auth component
 */
export const getUserProfileByUserId = query({
  args: {
    userId: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { userId }) => {
    // Find person by user ID
    const person = await ctx.db
      .query('persons')
      .withIndex('by_user_id', q => q.eq('userId', userId))
      .first();

    if (!person) {
      throw new Error('Person not found for user');
    }

    // Look up user via Better Auth component
    const user = await authComponent.getAnyUserById(ctx, userId as AuthUserId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      user: {
        id: user._id,
        name: user.name || null,
        email: user.email,
        image: user.image || null,
        username: (user as ExtendedAuthUser).username || null,
        bio: person.bio || null,
        pronouns: person.pronouns || null,
        lastSeen: person.lastSeen || null,
      },
    };
  },
});

/**
 * Get mutual events between current user and another user by person ID
 * Used by profile dialogs to show shared events
 */
export const fetchMutualEvents = query({
  args: {
    otherPersonId: v.id('persons'),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { otherPersonId }) => {
    // Require authentication
    const currentPerson = await getCurrentPerson(ctx);
    if (!currentPerson) {
      throw new Error('Authentication required');
    }

    // Get the other person
    const otherPerson = await ctx.db.get(otherPersonId);
    if (!otherPerson) {
      throw new Error('Other user not found');
    }

    // Get current user's memberships
    const currentUserMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_person', q => q.eq('personId', currentPerson._id))
      .collect();

    // Get other user's memberships
    const otherUserMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_person', q => q.eq('personId', otherPerson._id))
      .collect();

    // Find mutual event IDs
    const currentUserEventIds = new Set(
      currentUserMemberships.map(m => m.eventId)
    );
    const mutualEventIds = otherUserMemberships
      .filter(m => currentUserEventIds.has(m.eventId))
      .map(m => m.eventId);

    // Get event details for mutual events
    const mutualEvents = await Promise.all(
      mutualEventIds.map(async eventId => {
        const event = await ctx.db.get(eventId);
        return event;
      })
    );

    // Filter out null events and format response
    const validEvents = mutualEvents
      .filter((event): event is NonNullable<typeof event> => event !== null)
      .map(event => ({
        id: event._id,
        title: event.title,
        description: event.description,
        location: event.location,
        chosenDateTime: event.chosenDateTime,
        createdAt: event._creationTime,
      }));

    return validEvents;
  },
});

/**
 * Get mutual events between current user and another user by user ID
 * Used by profile dialogs when we have a Better Auth user ID
 */
export const fetchMutualEventsByUserId = query({
  args: {
    otherUserId: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { otherUserId }) => {
    // Require authentication
    const currentPerson = await getCurrentPerson(ctx);
    if (!currentPerson) {
      throw new Error('Authentication required');
    }

    // Find the other person by user ID
    const otherPerson = await ctx.db
      .query('persons')
      .withIndex('by_user_id', q => q.eq('userId', otherUserId))
      .first();

    if (!otherPerson) {
      throw new Error('Other user not found');
    }

    // Get current user's memberships
    const currentUserMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_person', q => q.eq('personId', currentPerson._id))
      .collect();

    // Get other user's memberships
    const otherUserMemberships = await ctx.db
      .query('memberships')
      .withIndex('by_person', q => q.eq('personId', otherPerson._id))
      .collect();

    // Find mutual event IDs
    const currentUserEventIds = new Set(
      currentUserMemberships.map(m => m.eventId)
    );
    const mutualEventIds = otherUserMemberships
      .filter(m => currentUserEventIds.has(m.eventId))
      .map(m => m.eventId);

    // Get event details for mutual events
    const mutualEvents = await Promise.all(
      mutualEventIds.map(async eventId => {
        const event = await ctx.db.get(eventId);
        return event;
      })
    );

    // Filter out null events and format response
    const validEvents = mutualEvents
      .filter((event): event is NonNullable<typeof event> => event !== null)
      .map(event => ({
        id: event._id,
        title: event.title,
        description: event.description,
        location: event.location,
        chosenDateTime: event.chosenDateTime,
        createdAt: event._creationTime,
      }));

    return validEvents;
  },
});

/**
 * Check if current user needs onboarding
 * Returns true if user needs to complete onboarding:
 * - Authenticated user with no person record (needs creation via onboarding)
 * - Authenticated user with no username set
 */
export const checkNeedsOnboarding = query({
  args: {
    _traceId: v.optional(v.string()),
  },
  handler: async ctx => {
    // First check if user is authenticated via Better Auth
    let authUser;
    try {
      authUser = await authComponent.getAuthUser(ctx);
    } catch {
      // Not authenticated - don't redirect to onboarding
      return false;
    }

    if (!authUser) {
      // Not authenticated - don't redirect to onboarding
      return false;
    }

    // User is authenticated - check if they have a person record
    const currentPerson = await getCurrentPerson(ctx);
    if (!currentPerson) {
      // Authenticated but no person record - needs onboarding to create it
      console.log(
        `User ${authUser.email} authenticated but has no person record - needs onboarding`
      );
      return true;
    }

    // User needs onboarding if username is missing or empty
    const username = (authUser as ExtendedAuthUser).username;
    return (
      !username || (typeof username === 'string' && username.trim() === '')
    );
  },
});

/**
 * Check if a username is available
 * Searches through all users to check if username is taken
 */
export const checkUsernameAvailability = query({
  args: {
    username: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { username }) => {
    // Check if username is valid format (3-50 characters, alphanumeric + underscore/dash)
    const trimmedUsername = username.trim().toLowerCase();

    if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
      return {
        available: false,
        reason: 'Username must be between 3 and 50 characters',
      };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      return {
        available: false,
        reason:
          'Username can only contain letters, numbers, underscores, and dashes',
      };
    }

    // Get current user to check if it's their own username
    const currentPerson = await getCurrentPerson(ctx);
    let currentUserId: string | null = null;
    if (currentPerson) {
      currentUserId = currentPerson.userId;
    }

    // Search through all persons to find if username is taken
    const persons = await ctx.db.query('persons').collect();

    for (const person of persons) {
      const user = await authComponent.getAnyUserById(
        ctx,
        person.userId as AuthUserId
      );
      if (
        user &&
        (user as ExtendedAuthUser).username?.toLowerCase() === trimmedUsername
      ) {
        // Check if it's the current user's username
        if (currentUserId && person.userId === currentUserId) {
          return {
            available: true,
            reason: 'This is your current username',
          };
        }

        return {
          available: false,
          reason: 'Username is already taken',
        };
      }
    }

    return {
      available: true,
      reason: 'Username is available',
    };
  },
});
