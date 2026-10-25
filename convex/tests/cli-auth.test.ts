import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, components } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';

const SECRET = 'cli-auth-test-secret-with-at-least-32-characters';
async function setup() {
  const t = createTestInstance();
  registerBetterAuth(t);
  const account = await createAuthAccount(t, 'cli-user');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(account.session.token)
  );
  const cookie = `better-auth.session_token=${encodeURIComponent(`${account.session.token}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`)}`;
  return { t, ...account, cookie };
}
function authRequest(cookie: string, body?: unknown) {
  return {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      cookie,
      origin: 'http://localhost:3000',
      'content-type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  };
}

describe('CLI browser authorization', () => {
  beforeEach(() => {
    vi.stubEnv('BETTER_AUTH_SECRET', SECRET);
    vi.stubEnv('SITE_URL', 'http://localhost:3000');
    vi.stubEnv('DISCORD_CLIENT_ID', 'test');
    vi.stubEnv('DISCORD_CLIENT_SECRET', 'test');
    vi.stubEnv('GOOGLE_CLIENT_ID', 'test');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'test');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it('creates, lists, and deletes real Better Auth keys while keeping legacy keys usable', async () => {
    const { t, cookie, user } = await setup();
    const created = await t.fetch(
      '/api/auth/api-key/create',
      authRequest(cookie, { name: 'Groupi CLI', expiresIn: 86400 })
    );
    expect(created.status).toBe(200);
    const key = await created.json();
    expect(
      (await t.fetch('/api/v2/events', { headers: { 'x-api-key': key.key } }))
        .status
    ).toBe(200);
    const listed = await t.fetch('/api/auth/api-key/list', authRequest(cookie));
    expect(listed.status).toBe(200);
    expect((await listed.json()).apiKeys).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: key.id })])
    );
    const legacyKey = 'grp_legacy_test_long_secret';
    const digest = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(legacyKey)
    );
    await t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: 'apikey',
        data: {
          userId: user._id,
          key: btoa(String.fromCharCode(...new Uint8Array(digest)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, ''),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          enabled: true,
        },
      },
    });
    expect(
      (await t.fetch('/api/v2/events', { headers: { 'x-api-key': legacyKey } }))
        .status
    ).toBe(200);
    const legacyList = await t.fetch(
      '/api/auth/api-key/list',
      authRequest(cookie)
    );
    expect((await legacyList.json()).apiKeys).toHaveLength(2);
    const revoked = await t.fetch(
      '/api/auth/api-key/delete',
      authRequest(cookie, { keyId: key.id })
    );
    expect(revoked.status).toBe(200);
    expect(
      (await t.fetch('/api/v2/events', { headers: { 'x-api-key': key.key } }))
        .status
    ).toBe(401);
  });
  it('exchanges an authenticated grant once and revokes only the presented key', async () => {
    const { t, auth, user } = await setup();
    // RFC 7636 Appendix B test vector.
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const challenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';
    const state = 'a'.repeat(43);
    const callbackPort = 54321;
    const grant = await auth.mutation(api.cliAuth.mutations.authorize, {
      state,
      challenge,
      callbackPort,
    });
    const request = { code: grant.code, verifier, state, callbackPort };
    const exchange = () =>
      t.fetch('/api/v2/auth/cli/exchange', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(request),
      });
    const response = await exchange();
    expect(response.status).toBe(200);
    const credentials = await response.json();
    expect(credentials.account).toEqual({
      id: user._id,
      name: 'cli-user',
      email: 'cli-user@example.com',
    });
    expect(credentials.expiresAt).toBeGreaterThan(Date.now() + 89 * 86400000);
    expect((await exchange()).status).toBe(401);
    expect(
      (
        await t.fetch('/api/v2/events', {
          headers: { 'x-api-key': credentials.apiKey },
        })
      ).status
    ).toBe(200);
    const revoke = await t.fetch('/api/v2/auth/cli/revoke', {
      method: 'POST',
      headers: { 'x-api-key': credentials.apiKey },
    });
    expect(revoke.status).toBe(200);
    expect(
      (
        await t.fetch('/api/v2/events', {
          headers: { 'x-api-key': credentials.apiKey },
        })
      ).status
    ).toBe(401);
  });

  it('allows a rate-limited key to revoke itself without touching another key', async () => {
    const { t, cookie } = await setup();
    const create = async () =>
      (
        await (
          await t.fetch(
            '/api/auth/api-key/create',
            authRequest(cookie, { name: 'CLI cleanup' })
          )
        ).json()
      ).key;
    const first = await create();
    const second = await create();
    for (let index = 0; index < 10; index++)
      expect(
        (await t.fetch('/api/v2/events', { headers: { 'x-api-key': first } }))
          .status
      ).toBe(200);
    expect(
      (await t.fetch('/api/v2/events', { headers: { 'x-api-key': first } }))
        .status
    ).toBe(429);
    expect(
      (
        await t.fetch('/api/v2/auth/cli/revoke', {
          method: 'POST',
          headers: { 'x-api-key': first },
        })
      ).status
    ).toBe(200);
    expect(
      (await t.fetch('/api/v2/events', { headers: { 'x-api-key': first } }))
        .status
    ).toBe(401);
    expect(
      (await t.fetch('/api/v2/events', { headers: { 'x-api-key': second } }))
        .status
    ).toBe(200);
  });

  it.each([
    { field: 'state', value: 'b'.repeat(43) },
    { field: 'verifier', value: 'b'.repeat(43) },
    { field: 'callbackPort', value: 54322 },
    { field: 'code', value: 'b'.repeat(43) },
  ])(
    'rejects mismatched $field without consuming the legitimate grant',
    async ({ field, value }) => {
      const { t, auth } = await setup();
      const args = {
        state: 'a'.repeat(43),
        challenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
        callbackPort: 54321,
      };
      const grant = await auth.mutation(api.cliAuth.mutations.authorize, args);
      const body = {
        code: grant.code,
        verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
        state: args.state,
        callbackPort: args.callbackPort,
      };
      const exchange = (payload: unknown) =>
        t.fetch('/api/v2/auth/cli/exchange', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
      expect((await exchange({ ...body, [field]: value })).status).toBe(401);
      expect((await exchange(body)).status).toBe(200);
    }
  );

  it.each([0, 65536, 4.2])(
    'rejects invalid listener port %s',
    async callbackPort => {
      const { auth } = await setup();
      await expect(
        auth.mutation(api.cliAuth.mutations.authorize, {
          state: 'a'.repeat(43),
          challenge: 'b'.repeat(43),
          callbackPort,
        })
      ).rejects.toThrow('Invalid CLI authorization');
    }
  );

  it('requires a signed-in browser account to authorize', async () => {
    const { t } = await setup();
    await expect(
      t.mutation(api.cliAuth.mutations.authorize, {
        state: 'a'.repeat(43),
        challenge: 'b'.repeat(43),
        callbackPort: 54321,
      })
    ).rejects.toThrow('Authentication required');
  });

  it.each(['expired', 'banned', 'deleted'] as const)(
    'rejects a grant after its account is %s',
    async condition => {
      const { t, auth, user, personId } = await setup();
      const args = {
        state: 'a'.repeat(43),
        challenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
        callbackPort: 54321,
      };
      const grant = await auth.mutation(api.cliAuth.mutations.authorize, args);
      if (condition === 'expired') vi.setSystemTime(Date.now() + 300001);
      if (condition === 'banned')
        await t.mutation(components.betterAuth.adapter.updateOne, {
          input: {
            model: 'user',
            where: [{ field: '_id', value: user._id }],
            update: { banned: true },
          },
        });
      if (condition === 'deleted') await t.run(ctx => ctx.db.delete(personId));
      const response = await t.fetch('/api/v2/auth/cli/exchange', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          code: grant.code,
          verifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
          state: args.state,
          callbackPort: args.callbackPort,
        }),
      });
      expect(response.status).toBe(401);
      expect(response.headers.get('Cache-Control')).toBe('no-store');
    }
  );

  it('does not exempt other authentication routes or methods from API-key authentication', async () => {
    const { t } = await setup();
    for (const path of [
      '/api/v2/auth/cli/revoke',
      '/api/v2/auth/cli/exchange/extra',
    ])
      expect((await t.fetch(path, { method: 'POST' })).status).toBe(401);
    expect((await t.fetch('/api/v2/auth/cli/exchange')).status).toBe(401);
  });
  it('returns the REST error contract for malformed exchange input', async () => {
    const { t } = await setup();
    const response = await t.fetch('/api/v2/auth/cli/exchange', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: 'bad' }),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid CLI authorization exchange request.',
      },
    });
  });
});
