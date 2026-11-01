import { createAuthAccount } from './auth.helpers';
import presenceTest from '@convex-dev/presence/test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import betterAuthSchema from '../betterAuth/schema';
import { createTestInstance } from './test_helpers';

// Avoid deep generated API instantiation in Convex test files.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api, components }: any = require('../_generated/api');

const FIXTURE_KEY = 'mobile-e2e-fixture-key-with-32-characters';
const betterAuthModules = import.meta.glob('../betterAuth/**/*.ts');

function createE2ETestInstance() {
  const t = createTestInstance();
  t.registerComponent('betterAuth', betterAuthSchema, betterAuthModules);
  presenceTest.register(t);
  return t;
}

const originalEnvironment = {
  E2E_TESTING: process.env.E2E_TESTING,
  E2E_FIXTURE_KEY: process.env.E2E_FIXTURE_KEY,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  SITE_URL: process.env.SITE_URL,
};

function restoreEnvironment(
  name: keyof typeof originalEnvironment,
  value: string | undefined
) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

describe('native E2E fixtures', () => {
  beforeEach(() => {
    process.env.E2E_TESTING = 'true';
    process.env.E2E_FIXTURE_KEY = FIXTURE_KEY;
    process.env.BETTER_AUTH_SECRET =
      'test-only-better-auth-secret-with-sufficient-length';
    process.env.SITE_URL = 'https://preview.groupi.example';
  });

  afterEach(() => {
    for (const [name, value] of Object.entries(originalEnvironment)) {
      restoreEnvironment(
        name as keyof typeof originalEnvironment,
        value as string | undefined
      );
    }
  });

  it('cleans only the selected fixture Event audience grants while preserving the Group and other independent Events', async () => {
    const t = createE2ETestInstance();
    const owner = await createAuthAccount(t, 'audience-e2e-cleanup');
    const groupId = await owner.auth.mutation(
      api.groups.mutations.createGroup,
      { name: 'Fixture audience' }
    );
    const selected = await owner.auth.mutation(
      api.events.mutations.createEvent,
      { title: 'Selected fixture Event' }
    );
    const retained = await owner.auth.mutation(
      api.events.mutations.createEvent,
      { title: 'Retained Event' }
    );
    for (const eventId of [selected.eventId, retained.eventId])
      await owner.auth.mutation(
        api.groupEventAudiences.mutations.shareEventWithGroup,
        { groupId, eventId }
      );
    expect(
      await t.mutation(api.e2e.mutations.cleanupTestData, {
        fixtureKey: FIXTURE_KEY,
        userIds: [],
        personIds: [],
        eventIds: [selected.eventId],
        postIds: [],
        inviteIds: [],
        membershipIds: [selected.membershipId],
      })
    ).toEqual({ success: true });
    expect(
      await t.run(ctx =>
        ctx.db
          .query('groupEventAudiences')
          .withIndex('by_eventId', q => q.eq('eventId', selected.eventId))
          .collect()
      )
    ).toEqual([]);
    expect(
      (
        await owner.auth.query(
          api.groupEventAudiences.queries.listGroupSharedEvents,
          { groupId, paginationOpts: { numItems: 20, cursor: null } }
        )
      ).page
    ).toMatchObject([{ event: { _id: retained.eventId } }]);
    expect(
      await owner.auth.query(api.groups.queries.getGroup, { groupId })
    ).not.toBeNull();
  });

  it('requires the preview-only fixture key before creating data', async () => {
    const t = createE2ETestInstance();

    await expect(
      t.mutation(api.e2e.mutations.createMobileFixture, {
        fixtureKey: 'incorrect-fixture-key-with-32-characters',
      })
    ).rejects.toThrow('E2E fixtures are unavailable');
  });

  it('stays disabled when a deployment has not explicitly enabled E2E', async () => {
    process.env.E2E_TESTING = 'false';
    const t = createE2ETestInstance();

    await expect(
      t.mutation(api.e2e.mutations.createMobileFixture, {
        fixtureKey: FIXTURE_KEY,
      })
    ).rejects.toThrow('E2E fixtures are unavailable');
    await expect(
      t.mutation(api.e2e.mutations.redeemMobileFixture, {
        loginCode: 'mobile_e2e_unavailable',
      })
    ).rejects.toThrow('E2E fixtures are unavailable');
  });

  it('creates, redeems once, and completely cleans an authenticated fixture', async () => {
    const t = createE2ETestInstance();
    const fixture = await t.mutation(api.e2e.mutations.createMobileFixture, {
      fixtureKey: FIXTURE_KEY,
    });

    const records = await t.run(async ctx => ({
      person: await ctx.db.get(fixture.personId),
      event: await ctx.db.get(fixture.eventId),
      membership: await ctx.db.get(fixture.membershipId),
      post: await ctx.db.get(fixture.postId),
    }));
    expect(records.person?.userId).toBe(fixture.userId);
    expect(records.event?.title).toBe(fixture.eventTitle);
    expect(records.membership?.role).toBe('ORGANIZER');
    expect(records.post?.title).toBe(fixture.postTitle);

    const redeemed = await t.mutation(api.e2e.mutations.redeemMobileFixture, {
      loginCode: fixture.loginCode,
    });
    expect(redeemed.eventId).toBe(fixture.eventId);
    expect(redeemed.cookieHeader).toMatch(
      /^__Secure-better-auth\.session_token=/
    );
    await expect(
      t.mutation(api.e2e.mutations.redeemMobileFixture, {
        loginCode: fixture.loginCode,
      })
    ).rejects.toThrow('Invalid or expired E2E login code');

    await t.mutation(api.e2e.mutations.cleanupTestData, {
      fixtureKey: FIXTURE_KEY,
      userIds: [fixture.userId],
      personIds: [fixture.personId],
      eventIds: [fixture.eventId],
      postIds: [fixture.postId],
      inviteIds: [],
      membershipIds: [fixture.membershipId],
      verificationIdentifiers: [fixture.loginCode],
    });

    const deleted = await t.run(async ctx => ({
      person: await ctx.db.get(fixture.personId),
      event: await ctx.db.get(fixture.eventId),
      membership: await ctx.db.get(fixture.membershipId),
      post: await ctx.db.get(fixture.postId),
    }));
    expect(deleted).toEqual({
      person: null,
      event: null,
      membership: null,
      post: null,
    });

    const session = await t.query(components.betterAuth.adapter.findOne, {
      model: 'session',
      where: [{ field: 'userId', operator: 'eq', value: fixture.userId }],
    });
    const user = await t.query(components.betterAuth.adapter.findOne, {
      model: 'user',
      where: [{ field: '_id', operator: 'eq', value: fixture.userId }],
    });
    expect(session).toBeNull();
    expect(user).toBeNull();
  });
  it('cleans only listed deleted-parent rooms and listed app users, preserving other rooms and shared tokens', async () => {
    vi.useFakeTimers();
    const t = createE2ETestInstance();
    const roomsToClean = new Set<string>();
    try {
      const ids = await t.run(async ctx => {
        const own = await ctx.db.insert('persons', {
          userId: 'fixture-presence-user',
        });
        const other = await ctx.db.insert('persons', {
          userId: 'unlisted-presence-user',
        });
        const eventId = await ctx.db.insert('events', {
          title: 'Owned fixture',
          creatorId: own,
          timezone: 'UTC',
          potentialDateTimes: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        const postId = await ctx.db.insert('posts', {
          eventId,
          authorId: own,
          title: 'Owned post',
          content: 'Fixture',
        });
        const unlistedPostId = await ctx.db.insert('posts', {
          eventId,
          authorId: other,
          title: 'Unlisted post',
          content: 'Keep',
        });
        return { own, other, eventId, postId, unlistedPostId };
      });
      const heartbeat = (roomId: string, userId: string, sessionId: string) => {
        roomsToClean.add(roomId);
        return t.mutation(components.presence.public.heartbeat, {
          roomId,
          userId,
          sessionId,
          interval: 10000,
        });
      };
      const postRoom = `post:${ids.postId}`,
        eventRoom = `event:${ids.eventId}`,
        unlistedRoom = `post:${ids.unlistedPostId}`;
      const selectedPostToken = await heartbeat(
        postRoom,
        ids.own,
        'selected-post'
      );
      await heartbeat(postRoom, ids.other, 'other-in-selected-post');
      const selectedEventToken = await heartbeat(
        eventRoom,
        ids.own,
        'selected-event'
      );
      const retainedToken = await heartbeat(
        unlistedRoom,
        ids.own,
        'owned-user-unlisted-room'
      );
      const appToken = await heartbeat('app', ids.own, 'own-app-session');
      const otherAppToken = await heartbeat(
        'app',
        ids.other,
        'other-app-session'
      );
      const invalidPost = await heartbeat(
        'post:new',
        ids.other,
        'invalid-post-placeholder'
      );
      const invalidEvent = await heartbeat(
        'event:new',
        ids.other,
        'invalid-event-placeholder'
      );
      expect(otherAppToken.roomToken).toBe(appToken.roomToken);
      await t.run(async ctx => {
        for (const [roomId, roomToken] of [
          [postRoom, selectedPostToken.roomToken],
          [eventRoom, selectedEventToken.roomToken],
          [unlistedRoom, retainedToken.roomToken],
          ['app', appToken.roomToken],
          ['post:new', invalidPost.roomToken],
          ['event:new', invalidEvent.roomToken],
        ])
          await ctx.db.insert('presenceRoomAccess', { roomId, roomToken });
        // The cleanup must also recover leaked presence after prior canonical deletion.
        await ctx.db.delete(ids.postId);
        await ctx.db.delete(ids.eventId);
        await ctx.db.delete(ids.own);
      });
      const list = (roomId: string) =>
        t.query(components.presence.public.listRoom, { roomId });
      const registry = () =>
        t.run(ctx => ctx.db.query('presenceRoomAccess').collect());
      const retainedBefore = await list(unlistedRoom),
        appBefore = await list('app'),
        registryBefore = await registry();
      const args = {
        fixtureKey: FIXTURE_KEY,
        userIds: [],
        personIds: [ids.own],
        eventIds: [ids.eventId],
        postIds: [ids.postId],
        inviteIds: [],
        membershipIds: [],
      };
      await expect(
        t.mutation(api.e2e.mutations.cleanupTestData, {
          ...args,
          fixtureKey: 'wrong-fixture-key',
        })
      ).rejects.toThrow('unavailable');
      expect(await list(postRoom)).toHaveLength(2);
      expect(await list('app')).toEqual(appBefore);
      expect(await registry()).toEqual(registryBefore);
      expect(await list('post:new')).toHaveLength(1);
      expect(await list('event:new')).toHaveLength(1);
      await t.mutation(api.e2e.mutations.cleanupTestData, {
        ...args,
        personIds: ['new'],
        eventIds: ['new', ids.own],
        postIds: ['new', ids.eventId],
      });
      expect(await list(postRoom)).toHaveLength(2);
      expect(await list('app')).toEqual(appBefore);
      expect(await registry()).toEqual(registryBefore);
      expect(await list('post:new')).toHaveLength(1);
      expect(await list('event:new')).toHaveLength(1);
      await t.mutation(api.e2e.mutations.cleanupTestData, args);
      expect(await list(postRoom)).toEqual([]);
      expect(await list(eventRoom)).toEqual([]);
      expect(await list(unlistedRoom)).toEqual(retainedBefore);
      expect(await list('app')).toEqual(
        appBefore.filter(row => row.userId === ids.other)
      );
      expect(
        await t.query(components.presence.public.list, {
          roomToken: appToken.roomToken,
        })
      ).toEqual(appBefore.filter(row => row.userId === ids.other));
      expect((await registry()).map(row => row.roomId).sort()).toEqual(
        ['app', unlistedRoom, 'post:new', 'event:new'].sort()
      );
      // Repeating cleanup after parent/user deletion is harmless.
      const once = {
        app: await list('app'),
        retained: await list(unlistedRoom),
        registry: await registry(),
      };
      await t.mutation(api.e2e.mutations.cleanupTestData, args);
      expect({
        app: await list('app'),
        retained: await list(unlistedRoom),
        registry: await registry(),
      }).toEqual(once);
      // Component room tokens are deleted, not merely left behind with an empty list.
      const replacementPost = await heartbeat(
        postRoom,
        ids.other,
        'replacement-post'
      );
      const replacementEvent = await heartbeat(
        eventRoom,
        ids.other,
        'replacement-event'
      );
      expect(replacementPost.roomToken).not.toBe(selectedPostToken.roomToken);
      expect(replacementEvent.roomToken).not.toBe(selectedEventToken.roomToken);
      const preservedApp = await heartbeat(
        'app',
        ids.other,
        'other-app-session'
      );
      expect(preservedApp.roomToken).toBe(appToken.roomToken);
      expect(preservedApp.sessionToken).toBe(otherAppToken.sessionToken);
      const preservedUnlisted = await heartbeat(
        unlistedRoom,
        ids.own,
        'owned-user-unlisted-room'
      );
      expect(preservedUnlisted).toEqual(retainedToken);
    } finally {
      // Cancel heartbeat leases through the component API before restoring timers.
      // Running the component's timeout job cancels itself, which convex-test
      // cannot model as an in-progress scheduled function.
      for (const roomId of roomsToClean) {
        const users = await t.query(components.presence.public.listRoom, {
          roomId,
        });
        for (const user of users)
          await t.mutation(components.presence.public.removeRoomUser, {
            roomId,
            userId: user.userId,
          });
      }
      await t.finishInProgressScheduledFunctions();
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });
});
