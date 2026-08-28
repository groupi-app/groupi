import { afterEach, beforeEach, describe, expect, it } from 'vitest';
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
});
