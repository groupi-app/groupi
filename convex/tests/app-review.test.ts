import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import betterAuthSchema from '../betterAuth/schema';
import { createTestInstance } from './test_helpers';

// Avoid deep generated API instantiation in component tests.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { internal, components }: any = require('../_generated/api');
const betterAuthModules = import.meta.glob('../betterAuth/**/*.ts');
const email = 'app-review-0123456789abcdef@groupi.gg';
const accessKey = 'ab'.repeat(32);

async function setup() {
  const t = createTestInstance();
  t.registerComponent('betterAuth', betterAuthSchema, betterAuthModules);
  const hash = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(accessKey)
  );
  const accessKeyHash = Array.from(new Uint8Array(hash), byte =>
    byte.toString(16).padStart(2, '0')
  ).join('');
  const args = {
    email,
    accessKeyHash,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
  const account = await t.mutation(
    internal.appReview.mutations.provision,
    args
  );
  vi.stubEnv('APP_REVIEW_USER_ID', account.userId);
  return { t, account, args };
}

async function insertCode(
  t: ReturnType<typeof createTestInstance>,
  identifier = `sign-in-otp-${email}`,
  value = '123456:0',
  expiresAt = Date.now() + 60_000,
  createdAt = Date.now()
) {
  return t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'verification',
      data: {
        identifier,
        value,
        expiresAt,
        createdAt,
        updatedAt: createdAt,
      },
    },
  });
}

async function read(t: ReturnType<typeof createTestInstance>, key = accessKey) {
  return t.query(internal.appReview.queries.readInbox, { accessKey: key });
}

describe('passwordless store-review inbox', () => {
  beforeEach(() => {
    vi.stubEnv('APP_REVIEW_INBOX_ENABLED', 'true');
    vi.stubEnv(
      'BETTER_AUTH_SECRET',
      'test-review-secret-with-at-least-thirty-two-characters'
    );
    vi.stubEnv('SITE_URL', 'https://www.groupi.gg');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('seeds private synthetic events and retries without repurposing an existing user', async () => {
    const { t, account, args } = await setup();
    expect(
      await t.mutation(internal.appReview.mutations.provision, args)
    ).toEqual(account);
    const data = await t.run(async ctx => ({
      accounts: await ctx.db.query('appReviewAccounts').collect(),
      events: await ctx.db.query('events').collect(),
      posts: await ctx.db.query('posts').collect(),
      dates: await ctx.db.query('potentialDateTimes').collect(),
    }));
    expect(data.accounts).toHaveLength(1);
    expect(data.events).toHaveLength(2);
    expect(data.events.every(event => event.visibility === 'PRIVATE')).toBe(
      true
    );
    expect(data.posts).toHaveLength(2);
    expect(data.dates).toHaveLength(3);
    expect(
      await t.query(components.betterAuth.adapter.findOne, {
        model: 'session',
        where: [{ field: 'userId', operator: 'eq', value: account.userId }],
      })
    ).toBeNull();
    const otherEmail = 'app-review-fedcba9876543210@groupi.gg';
    await t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: 'user',
        data: {
          email: otherEmail,
          name: 'Existing real user',
          emailVerified: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    });
    await expect(
      t.mutation(internal.appReview.mutations.provision, {
        ...args,
        email: otherEmail,
      })
    ).rejects.toThrow('Cannot repurpose');
  });

  it('only returns the configured account’s normal sign-in OTP', async () => {
    const { t } = await setup();
    await insertCode(t);
    await insertCode(t, 'sign-in-otp-other@groupi.gg', '999999:0');
    await insertCode(t, `forget-password-otp-${email}`, '888888:0');
    expect(await read(t)).toMatchObject({ email, otp: '123456' });
    expect(await read(t, 'cd'.repeat(32))).toBeNull();
    expect(await read(t, 'short-key')).toBeNull();
    expect(
      await t.query(internal.appReview.queries.usesPrivateInbox, {
        email: 'other@groupi.gg',
      })
    ).toBe(false);
  });

  it.each(['123456:3', '123456:99', 'hashed-otp:0', '123456', '123456:NaN'])(
    'fails closed for unusable OTP storage %s',
    async value => {
      const { t } = await setup();
      await insertCode(t, undefined, value);
      expect(await read(t)).toMatchObject({
        email,
        otp: null,
        expiresAt: null,
      });
    }
  );

  it.each([
    { value: '654321:0', expired: false, expected: '654321' },
    { value: '654321:0', expired: true, expected: null },
    { value: '654321:3', expired: false, expected: null },
    { value: 'hashed-otp:0', expired: false, expected: null },
  ])('uses only the newest sign-in record: %j', async scenario => {
    const { t } = await setup();
    const now = Date.now();
    await insertCode(t, undefined, '111111:0', now + 60_000, now - 2000);
    await insertCode(
      t,
      undefined,
      scenario.value,
      scenario.expired ? now - 1 : now + 60_000,
      now - 1000
    );
    expect(await read(t)).toMatchObject({ otp: scenario.expected });
  });

  it('never returns expired or consumed codes', async () => {
    const { t } = await setup();
    await insertCode(t, undefined, undefined, Date.now() - 1);
    expect(await read(t)).toMatchObject({ otp: null });
    await t.mutation(components.betterAuth.adapter.deleteOne, {
      input: {
        model: 'verification',
        where: [
          {
            field: 'identifier',
            operator: 'eq',
            value: `sign-in-otp-${email}`,
          },
        ],
      },
    });
    expect(await read(t)).toMatchObject({ otp: null });
  });

  it('requires enabled configuration, exact user ID, and unexpired registry', async () => {
    const { t, account } = await setup();
    vi.stubEnv('APP_REVIEW_INBOX_ENABLED', 'false');
    expect(await read(t)).toBeNull();
    vi.stubEnv('APP_REVIEW_INBOX_ENABLED', 'true');
    vi.stubEnv('APP_REVIEW_USER_ID', 'wrong-user');
    expect(await read(t)).toBeNull();
    vi.stubEnv('APP_REVIEW_USER_ID', account.userId);
    await t.run(ctx =>
      ctx.db.patch(account.accountId, { expiresAt: Date.now() - 1 })
    );
    expect(await read(t)).toBeNull();
  });

  it.each([
    { role: 'admin' },
    { banned: true },
    { email: 'changed@groupi.gg' },
  ])('rejects unsafe account changes %j', async update => {
    const { t, account } = await setup();
    await t.mutation(components.betterAuth.adapter.updateOne, {
      input: {
        model: 'user',
        where: [{ field: '_id', operator: 'eq', value: account.userId }],
        update,
      },
    });
    expect(await read(t)).toBeNull();
    expect(
      await t.query(internal.appReview.queries.usesPrivateInbox, { email })
    ).toBe(false);
  });

  it('revokes sessions and bans the demo account without deleting sample data', async () => {
    const { t, account } = await setup();
    await t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: 'session',
        data: {
          userId: account.userId,
          token: 'test-session',
          expiresAt: Date.now() + 60_000,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    });
    await t.mutation(internal.appReview.mutations.revoke, {
      accountId: account.accountId,
    });
    expect(await read(t)).toBeNull();
    expect(
      await t.query(components.betterAuth.adapter.findOne, {
        model: 'session',
        where: [{ field: 'userId', operator: 'eq', value: account.userId }],
      })
    ).toBeNull();
    expect(
      await t.query(components.betterAuth.adapter.findOne, {
        model: 'user',
        where: [{ field: '_id', operator: 'eq', value: account.userId }],
      })
    ).toMatchObject({ banned: true });
  });

  it('commits revocation even when session cleanup needs multiple batches', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { t, account } = await setup();
    for (let index = 0; index < 105; index += 1) {
      await t.mutation(components.betterAuth.adapter.create, {
        input: {
          model: 'session',
          data: {
            userId: account.userId,
            token: `test-session-${index}`,
            expiresAt: Date.now() + 60_000,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        },
      });
    }
    await t.mutation(internal.appReview.mutations.revoke, {
      accountId: account.accountId,
    });
    expect(await read(t)).toBeNull();
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
    expect(
      await t.query(components.betterAuth.adapter.findOne, {
        model: 'session',
        where: [{ field: 'userId', operator: 'eq', value: account.userId }],
      })
    ).toBeNull();
  });

  it('uses normal Better Auth send and verify endpoints without a session bypass', async () => {
    const { t, account } = await setup();
    const headers = {
      'Content-Type': 'application/json',
      Origin: 'https://www.groupi.gg',
    };
    const sent = await t.fetch('/api/auth/email-otp/send-verification-otp', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, type: 'sign-in' }),
    });
    expect(sent.status).toBe(200);
    const inbox = await read(t);
    expect(inbox?.otp).toMatch(/^\d{6}$/);
    const signedIn = await t.fetch('/api/auth/sign-in/email-otp', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, otp: inbox.otp }),
    });
    expect(signedIn.status).toBe(200);
    expect(
      await t.query(components.betterAuth.adapter.findOne, {
        model: 'session',
        where: [{ field: 'userId', operator: 'eq', value: account.userId }],
      })
    ).not.toBeNull();
    expect(await read(t)).toMatchObject({ otp: null });
    const reused = await t.fetch('/api/auth/sign-in/email-otp', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, otp: inbox.otp }),
    });
    expect(reused.status).not.toBe(200);
  });

  it('returns the code normal Better Auth accepts after a resend', async () => {
    const { t } = await setup();
    await insertCode(
      t,
      undefined,
      '111111:0',
      Date.now() - 1,
      Date.now() - 2000
    );
    vi.useFakeTimers({ toFake: ['Date'] });
    const headers = {
      'Content-Type': 'application/json',
      Origin: 'https://www.groupi.gg',
    };
    for (let attempt = 0; attempt < 2; attempt += 1) {
      vi.setSystemTime(Date.now() + 1000);
      const response = await t.fetch(
        '/api/auth/email-otp/send-verification-otp',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ email, type: 'sign-in' }),
        }
      );
      expect(response.status).toBe(200);
    }
    const inbox = await read(t);
    expect(inbox?.otp).toMatch(/^\d{6}$/);
    const signedIn = await t.fetch('/api/auth/sign-in/email-otp', {
      method: 'POST',
      headers,
      body: JSON.stringify({ email, otp: inbox.otp }),
    });
    expect(signedIn.status).toBe(200);
    // Better Auth may retain earlier unconsumed records. The inbox follows
    // its current verification lookup, rather than changing OTP lifecycle.
  });

  it('requires a same-origin POST body and never echoes or caches its credential', async () => {
    const { t } = await setup();
    await insertCode(t);
    const get = await t.fetch('/app-review/inbox');
    expect(await get.text()).not.toContain(email);
    // Native browser form POSTs must retain their origin; no-referrer can
    // turn it into null and cause our origin validation to reject the form.
    expect(get.headers.get('referrer-policy')).toBe('same-origin');
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    const response = await t.fetch('/app-review/inbox', {
      method: 'POST',
      headers: { ...headers, Origin: 'https://some.convex.site' },
      body: new URLSearchParams({ accessKey }).toString(),
    });
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('123456');
    expect(html).not.toContain(accessKey);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('referrer-policy')).toBe('same-origin');
    expect(response.headers.get('content-security-policy')).toContain(
      "frame-ancestors 'none'"
    );
    const crossOrigin = await t.fetch('/app-review/inbox', {
      method: 'POST',
      headers: { ...headers, Origin: 'https://attacker.example' },
      body: new URLSearchParams({ accessKey }).toString(),
    });
    expect(crossOrigin.status).toBe(400);
    const opaqueOrigin = await t.fetch('/app-review/inbox', {
      method: 'POST',
      headers: { ...headers, Origin: 'null' },
      body: new URLSearchParams({ accessKey }).toString(),
    });
    expect(opaqueOrigin.status).toBe(400);
    const queryKey = await t.fetch(`/app-review/inbox?accessKey=${accessKey}`);
    expect(queryKey.status).toBe(400);
    const denied = await t.fetch('/app-review/inbox', {
      method: 'POST',
      headers,
      body: 'accessKey=bad',
    });
    expect(denied.status).toBe(403);
    const large = await t.fetch('/app-review/inbox', {
      method: 'POST',
      headers,
      body: 'accessKey=' + 'a'.repeat(1000),
    });
    expect(large.status).toBe(400);
    vi.stubEnv('APP_REVIEW_INBOX_ENABLED', 'false');
    expect((await t.fetch('/app-review/inbox')).status).toBe(404);
  });
});
