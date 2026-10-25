import { ConvexError, v } from 'convex/values';
import { internalMutation } from '../_generated/server';
import { components, internal } from '../_generated/api';

/** Administrative provisioning only; no public fixture or session-minting API. */
export const provision = internalMutation({
  args: { email: v.string(), accessKeyHash: v.string(), expiresAt: v.number() },
  returns: v.object({
    userId: v.string(),
    accountId: v.id('appReviewAccounts'),
    email: v.string(),
  }),
  handler: async (ctx, { email, accessKeyHash, expiresAt }) => {
    const now = Date.now();
    if (
      !/^app-review-[a-f0-9]{16}@groupi\.gg$/.test(email) ||
      !/^[a-f0-9]{64}$/.test(accessKeyHash) ||
      !Number.isFinite(expiresAt) ||
      expiresAt <= now ||
      expiresAt > now + 90 * 24 * 60 * 60 * 1000
    ) {
      throw new ConvexError('Invalid review account configuration');
    }
    const registered = await ctx.db
      .query('appReviewAccounts')
      .withIndex('by_email', q => q.eq('email', email))
      .unique();
    if (registered) {
      if (
        registered.accessKeyHash !== accessKeyHash ||
        registered.revokedAt !== undefined
      ) {
        throw new ConvexError('Review account already exists');
      }
      return { userId: registered.userId, accountId: registered._id, email };
    }
    const existing = await ctx.runQuery(components.betterAuth.adapter.findOne, {
      model: 'user',
      where: [{ field: 'email', operator: 'eq', value: email }],
    });
    if (existing)
      throw new ConvexError(
        'Cannot repurpose an existing user as a review account'
      );
    const user = await ctx.runMutation(components.betterAuth.adapter.create, {
      input: {
        model: 'user',
        data: {
          email,
          name: 'Groupi Reviewer',
          username: `review_${email.slice(11, 27)}`,
          emailVerified: true,
          role: 'user',
          createdAt: now,
          updatedAt: now,
        },
      },
    });
    const userId = user._id as string;
    const personId = await ctx.db.insert('persons', {
      userId,
      bio: 'Store-review demo account with synthetic sample events.',
      updatedAt: now,
    });
    await ctx.db.insert('personSettings', {
      personId,
      allowFriendRequestsFrom: 'NO_ONE',
      allowEventInvitesFrom: 'NO_ONE',
      updatedAt: now,
    });
    const eventIds = [];
    for (const poll of [false, true]) {
      const eventId = await ctx.db.insert('events', {
        title: poll ? 'Demo: Plan a game night' : 'Demo: Weekend picnic',
        description:
          'Synthetic sample event for store review. Explore invitations, posts, replies, and event settings, or create your own event.',
        location: 'Demo Community Park',
        creatorId: personId,
        visibility: 'PRIVATE',
        potentialDateTimes: [],
        chosenDateTime: poll ? undefined : now + 7 * 24 * 60 * 60 * 1000,
        timezone: 'America/New_York',
        memberCount: 1,
        createdAt: now,
        updatedAt: now,
      });
      eventIds.push(eventId);
      const membershipId = await ctx.db.insert('memberships', {
        personId,
        eventId,
        role: 'ORGANIZER',
        rsvpStatus: 'YES',
        updatedAt: now,
      });
      if (poll) {
        for (const offset of [7, 8, 9]) {
          const potentialDateTimeId = await ctx.db.insert(
            'potentialDateTimes',
            {
              eventId,
              dateTime: now + offset * 24 * 60 * 60 * 1000,
              updatedAt: now,
            }
          );
          await ctx.db.insert('availabilities', {
            membershipId,
            potentialDateTimeId,
            status: offset === 8 ? 'MAYBE' : 'YES',
            updatedAt: now,
          });
        }
      }
      const postId = await ctx.db.insert('posts', {
        eventId,
        authorId: personId,
        membershipId,
        title: 'Welcome to the demo event',
        content:
          '<p>This is sample content for store review. Try <strong>rich-text formatting</strong>, replies, and attachments.</p>',
        updatedAt: now,
      });
      await ctx.db.insert('replies', {
        postId,
        authorId: personId,
        membershipId,
        text: '<p>A sample <em>rich-text reply</em>.</p>',
        updatedAt: now,
      });
    }
    const accountId = await ctx.db.insert('appReviewAccounts', {
      email,
      userId,
      personId,
      accessKeyHash,
      expiresAt,
      eventIds,
      createdAt: now,
    });
    return { userId, accountId, email };
  },
});

/** Disable inbox, ban further sign-in, and revoke existing demo sessions. */
export const revoke = internalMutation({
  args: { accountId: v.id('appReviewAccounts') },
  returns: v.null(),
  handler: async (ctx, { accountId }) => {
    const account = await ctx.db.get(accountId);
    if (!account) throw new ConvexError('Review account not found');
    await ctx.db.patch(accountId, { revokedAt: Date.now() });
    await ctx.runMutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', operator: 'eq', value: account.userId }],
        update: {
          banned: true,
          banReason: 'Store-review access revoked',
          updatedAt: Date.now(),
        },
      },
    });
    const sessions = await ctx.runQuery(
      components.betterAuth.adapter.findMany,
      {
        model: 'session',
        where: [{ field: 'userId', operator: 'eq', value: account.userId }],
        paginationOpts: { cursor: null, numItems: 100 },
      }
    );
    for (const session of sessions.page) {
      await ctx.runMutation(components.betterAuth.adapter.deleteOne, {
        input: {
          model: 'session',
          where: [
            { field: '_id', operator: 'eq', value: session._id as string },
          ],
        },
      });
    }
    if (!sessions.isDone) {
      await ctx.scheduler.runAfter(0, internal.appReview.mutations.revoke, {
        accountId,
      });
    }
    return null;
  },
});
