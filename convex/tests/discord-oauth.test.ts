import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, components } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth_helpers';
import { createTestInstance } from './test_helpers';

const TOKEN_URL = 'https://discord.com/api/oauth2/token';
const USER_URL = 'https://discord.com/api/v10/users/@me';
const GUILDS_URL = `${USER_URL}/guilds`;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const fetchMock = vi.fn<typeof fetch>();

async function seedDiscord(
  t: ReturnType<typeof createTestInstance>,
  username: string,
  options: { expired?: boolean; noRefreshToken?: boolean } = {}
) {
  const user = await createAuthAccount(t, username);
  const now = Date.now();
  const account = await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'account',
      data: {
        userId: user.user._id,
        providerId: 'discord',
        accountId: `${username}-discord-id`,
        accessToken: `${username}-access`,
        refreshToken: options.noRefreshToken
          ? undefined
          : `${username}-refresh`,
        accessTokenExpiresAt: now + (options.expired ? -60_000 : 3_600_000),
        scope: 'identify email guilds',
        createdAt: now,
        updatedAt: now,
      },
    },
  });
  return { ...user, account };
}

async function readAccount(
  t: ReturnType<typeof createTestInstance>,
  id: string
) {
  return t.query(components.betterAuth.adapter.findOne, {
    model: 'account',
    where: [{ field: '_id', value: id }],
  });
}

function refreshedTokens() {
  return json({
    access_token: 'rotated-access',
    refresh_token: 'rotated-refresh',
    expires_in: 3600,
    token_type: 'Bearer',
    scope: 'identify email guilds',
  });
}

function requestUrl(input: Parameters<typeof fetch>[0]) {
  return input instanceof Request ? input.url : String(input);
}

function authorization(init?: RequestInit) {
  return new Headers(init?.headers).get('Authorization');
}

describe('Discord OAuth credential renewal', () => {
  beforeEach(() => {
    vi.stubEnv(
      'BETTER_AUTH_SECRET',
      'discord-oauth-test-secret-at-least-32-characters'
    );
    vi.stubEnv('SITE_URL', 'https://www.groupi.gg');
    vi.stubEnv('DISCORD_CLIENT_ID', 'test-discord-client');
    vi.stubEnv('DISCORD_CLIENT_SECRET', 'test-discord-secret');
    vi.stubEnv('GOOGLE_CLIENT_ID', 'test-google-client');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'test-google-secret');
    vi.stubEnv('DISCORD_BOT_TOKEN', 'test-discord-bot');
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('renews expired credentials, persists rotation, and retains the username on a later visit', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const user = await seedDiscord(t, 'avery', { expired: true });
    fetchMock.mockImplementation(async (input, init) => {
      if (requestUrl(input) === TOKEN_URL) {
        const form = new URLSearchParams(String(init?.body));
        expect(form.get('grant_type')).toBe('refresh_token');
        expect(form.get('refresh_token')).toBe('avery-refresh');
        return refreshedTokens();
      }
      expect(requestUrl(input)).toBe(USER_URL);
      expect(authorization(init)).toBe('Bearer rotated-access');
      return json({ id: 'avery-discord-id', username: 'avery.discord' });
    });

    const first = await user.auth.action(
      api.accounts.queries.getLinkedAccountsWithUsernames,
      {}
    );
    expect(first).toEqual([
      {
        id: user.account._id,
        providerId: 'discord',
        accountId: 'avery-discord-id',
        username: 'avery.discord',
        createdAt: user.account.createdAt,
      },
    ]);
    const stored = await readAccount(t, user.account._id);
    expect(stored).toMatchObject({
      accessToken: 'rotated-access',
      refreshToken: 'rotated-refresh',
    });
    expect(stored?.accessTokenExpiresAt).toBeGreaterThan(Date.now());

    const later = await user.auth.action(
      api.accounts.queries.getLinkedAccountsWithUsernames,
      {}
    );
    expect(later).toEqual(first);
    expect(
      fetchMock.mock.calls.filter(([input]) => requestUrl(input) === TOKEN_URL)
    ).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('renews an expired token before loading the Discord server picker', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const user = await seedDiscord(t, 'avery', { expired: true });
    fetchMock.mockImplementation(async (input, init) => {
      if (requestUrl(input) === TOKEN_URL) return refreshedTokens();
      expect(requestUrl(input)).toBe(GUILDS_URL);
      if (authorization(init) === 'Bot test-discord-bot')
        return json([{ id: 'guild-1' }]);
      expect(authorization(init)).toBe('Bearer rotated-access');
      return json([
        { id: 'guild-1', name: 'Friends', icon: null, permissions: '32' },
      ]);
    });

    await expect(
      user.auth.action(api.discord.actions.getAvailableGuilds, {})
    ).resolves.toEqual({
      available: [{ id: 'guild-1', name: 'Friends', icon: null }],
      invitable: [],
    });
    expect(await readAccount(t, user.account._id)).toMatchObject({
      refreshToken: 'rotated-refresh',
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('uses an unexpired access token without requesting a refresh', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const user = await seedDiscord(t, 'avery');
    fetchMock.mockImplementation(async (input, init) => {
      expect(requestUrl(input)).toBe(USER_URL);
      expect(authorization(init)).toBe('Bearer avery-access');
      return json({ username: 'avery.discord' });
    });
    expect(
      await user.auth.action(
        api.accounts.queries.getLinkedAccountsWithUsernames,
        {}
      )
    ).toMatchObject([{ username: 'avery.discord' }]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('does not retry or overwrite credentials when Discord rejects an unexpired token', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const user = await seedDiscord(t, 'avery');
    fetchMock.mockImplementation(async (input, init) => {
      expect(requestUrl(input)).toBe(USER_URL);
      expect(authorization(init)).toBe('Bearer avery-access');
      return json({ message: 'Unauthorized' }, 401);
    });
    const accounts = await user.auth.action(
      api.accounts.queries.getLinkedAccountsWithUsernames,
      {}
    );
    expect(accounts).toHaveLength(1);
    expect(accounts[0].username).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(await readAccount(t, user.account._id)).toMatchObject({
      accessToken: 'avery-access',
      refreshToken: 'avery-refresh',
    });
  });

  it('does not invent refresh credentials for an account without a refresh token', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const user = await seedDiscord(t, 'avery', {
      expired: true,
      noRefreshToken: true,
    });
    fetchMock.mockImplementation(async input => {
      expect(requestUrl(input)).toBe(USER_URL);
      return json({ message: 'Unauthorized' }, 401);
    });
    const accounts = await user.auth.action(
      api.accounts.queries.getLinkedAccountsWithUsernames,
      {}
    );
    expect(accounts).toHaveLength(1);
    expect(accounts[0].username).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(
      (await readAccount(t, user.account._id))?.refreshToken
    ).toBeUndefined();
  });

  it('does not loop or discard the account when refresh authorization is revoked', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const user = await seedDiscord(t, 'avery', { expired: true });
    fetchMock.mockImplementation(async input => {
      expect(requestUrl(input)).toBe(TOKEN_URL);
      return json({ error: 'invalid_grant' }, 400);
    });
    const accounts = await user.auth.action(
      api.accounts.queries.getLinkedAccountsWithUsernames,
      {}
    );
    expect(accounts).toMatchObject([
      { id: user.account._id, providerId: 'discord' },
    ]);
    expect(accounts[0].username).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(await readAccount(t, user.account._id)).toMatchObject({
      accessToken: 'avery-access',
      refreshToken: 'avery-refresh',
    });
  });

  it('keeps credentials and linked accounts isolated to the requesting user', async () => {
    const t = createTestInstance();
    registerBetterAuth(t);
    const user = await seedDiscord(t, 'avery');
    const other = await seedDiscord(t, 'other', { expired: true });
    fetchMock.mockImplementation(async (input, init) => {
      expect(requestUrl(input)).toBe(USER_URL);
      expect(authorization(init)).toBe('Bearer avery-access');
      return json({ username: 'avery.discord' });
    });
    const accounts = await user.auth.action(
      api.accounts.queries.getLinkedAccountsWithUsernames,
      {}
    );
    expect(accounts.map(account => account.id)).toEqual([user.account._id]);
    expect(accounts[0]).not.toHaveProperty('accessToken');
    expect(accounts[0]).not.toHaveProperty('refreshToken');
    expect(accounts[0]).not.toHaveProperty('accessTokenExpiresAt');
    expect(await readAccount(t, other.account._id)).toMatchObject({
      accessToken: 'other-access',
      refreshToken: 'other-refresh',
    });
    await expect(
      t.action(api.accounts.queries.getLinkedAccountsWithUsernames, {})
    ).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
