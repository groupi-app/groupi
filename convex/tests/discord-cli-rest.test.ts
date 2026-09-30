import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { components, internal } from '../_generated/api';
import { cliRestBridge } from './cli-rest-bridge.helpers';

beforeEach(() => {
  vi.stubEnv(
    'BETTER_AUTH_SECRET',
    'discord-cli-test-secret-at-least-32-characters'
  );
  vi.stubEnv('SITE_URL', 'https://www.groupi.gg');
  vi.stubEnv('DISCORD_CLIENT_ID', 'discord-client');
  vi.stubEnv('DISCORD_CLIENT_SECRET', 'discord-secret');
  vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-secret');
  vi.stubEnv('GOOGLE_CLIENT_ID', 'test-google-client');
  vi.stubEnv('GOOGLE_CLIENT_SECRET', 'test-google-secret');
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

it('refreshes rotated linked credentials through the public CLI and authorizes only its owner’s manageable bot guilds', async () => {
  const bridge = await cliRestBridge();
  try {
    const user = await bridge.actor('discord-owner');
    const other = await bridge.actor('discord-other');
    const account = await bridge.t.mutation(
      components.betterAuth.adapter.create,
      {
        input: {
          model: 'account',
          data: {
            userId: user.user._id,
            providerId: 'discord',
            accountId: 'discord-owner-id',
            accessToken: 'expired-secret',
            refreshToken: 'refresh-secret',
            accessTokenExpiresAt: Date.now() - 60000,
            scope: 'identify email guilds',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        },
      }
    );
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
        const url = input instanceof Request ? input.url : String(input);
        calls.push(url);
        if (url === 'https://discord.com/api/oauth2/token')
          return json({
            access_token: 'rotated-secret',
            refresh_token: 'rotated-refresh-secret',
            expires_in: 3600,
            token_type: 'Bearer',
          });
        expect(url).toMatch(
          /^https:\/\/discord.com\/api\/v10\/users\/@me\/guilds\?limit=200/
        );
        expect(init?.redirect).toBe('error');
        expect(init?.signal).toBeDefined();
        const authorization = new Headers(init?.headers).get('authorization');
        if (authorization === 'Bot bot-secret')
          return json([{ id: '1', name: 'Friends' }]);
        expect(authorization).toBe('Bearer rotated-secret');
        return json([
          { id: '1', name: 'Friends', icon: null, permissions: '32' },
          { id: '2', name: 'Invite bot', icon: null, permissions: '32' },
          { id: '3', name: 'No permissions', icon: null, permissions: '0' },
        ]);
      })
    );
    const refresh = await bridge.cli(user.rawKey, [
      'discord',
      'guilds',
      'refresh',
    ]);
    expect(refresh.code, refresh.stderr).toBe(0);
    expect(JSON.parse(refresh.stdout).count).toBe(2);
    expect(refresh.stdout + refresh.stderr).not.toMatch(
      /rotated-secret|refresh-secret|bot-secret/
    );
    expect(calls).toHaveLength(3);
    const stored = await bridge.t.query(components.betterAuth.adapter.findOne, {
      model: 'account',
      where: [{ field: '_id', value: account._id }],
    });
    expect(stored).toMatchObject({
      accessToken: 'rotated-secret',
      refreshToken: 'rotated-refresh-secret',
    });
    const firstPage = await (
      await user.request('/discord/guilds?limit=1')
    ).json();
    expect(
      (
        await other.request(
          '/discord/guilds?cursor=' + encodeURIComponent(firstPage.nextCursor)
        )
      ).status
    ).toBe(400);
    expect((await user.request('/discord/guilds?cursor=invalid')).status).toBe(
      400
    );
    const list = await bridge.cli(user.rawKey, [
      'discord',
      'guilds',
      'list',
      '--limit',
      '1',
      '--all',
    ]);
    expect(list.code, list.stderr).toBe(0);
    expect(JSON.parse(list.stdout).items).toMatchObject([
      { id: '1', status: 'available' },
      { id: '2', status: 'invitable' },
    ]);
    expect(
      (await (await other.request('/discord/guilds')).json()).items
    ).toEqual([]);
    expect(
      (
        await other.request('/discord/guilds/refresh', 'POST', {
          userId: user.user._id,
        })
      ).status
    ).toBe(409);
    const created = await (
      await user.request('/events', 'POST', { title: 'Discord test' })
    ).json();
    expect(
      (
        await user.request(
          `/events/${created.eventId}/addons/discord/enable`,
          'POST',
          { config: { guildId: '1', guildName: 'Friends' } }
        )
      ).status
    ).toBe(200);
    expect(
      (
        await user.request(
          `/events/${created.eventId}/addons/discord/config`,
          'PATCH',
          { config: { guildId: '2', guildName: 'Invite bot' } }
        )
      ).status
    ).toBe(400);
    await bridge.t.run(async ctx => {
      const rows = await ctx.db.query('discordGuildAuthorizations').collect();
      for (const row of rows)
        await ctx.db.patch(row._id, { authorizedAt: Date.now() - 900001 });
    });
    expect(
      (
        await user.request(
          `/events/${created.eventId}/addons/discord/config`,
          'PATCH',
          { config: { guildId: '1', guildName: 'Friends' } }
        )
      ).status
    ).toBe(400);
    await expect(
      bridge.t.action(internal.discord.cli.refreshGuilds, {
        userId: user.user._id,
        personId: other.personId,
      })
    ).rejects.toThrow('Discord identity mismatch');
  } finally {
    await bridge.close();
  }
});

it('fails closed for missing link, missing bot and rejected refresh without exposing provider errors', async () => {
  const bridge = await cliRestBridge();
  try {
    const user = await bridge.actor('discord-error');
    expect((await user.request('/discord/guilds/refresh', 'POST')).status).toBe(
      409
    );
    vi.stubEnv('DISCORD_BOT_TOKEN', '');
    expect((await user.request('/discord/guilds/refresh', 'POST')).status).toBe(
      503
    );
    vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-secret');
    await bridge.t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: 'account',
        data: {
          userId: user.user._id,
          providerId: 'discord',
          accountId: 'error-id',
          accessToken: 'expired-secret',
          refreshToken: 'refresh-secret',
          accessTokenExpiresAt: Date.now() - 60000,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    });
    const network = vi.fn(async () =>
      json({ error: 'refresh-secret internal credential failure' }, 400)
    );
    vi.stubGlobal('fetch', network);
    const response = await user.request('/discord/guilds/refresh', 'POST');
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('refresh-secret');
    expect(network).toHaveBeenCalledOnce();
    expect(
      (await (await user.request('/discord/guilds')).json()).items
    ).toEqual([]);
  } finally {
    await bridge.close();
  }
});

it('exhausts external pages and keeps prior authorization timestamps unchanged after a late Discord failure', async () => {
  const bridge = await cliRestBridge();
  try {
    const user = await bridge.actor('discord-paging');
    await bridge.t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: 'account',
        data: {
          userId: user.user._id,
          providerId: 'discord',
          accountId: 'paging-id',
          accessToken: 'access-secret',
          accessTokenExpiresAt: Date.now() + 3600000,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    });
    const priorTime = Date.now() - 30000;
    await bridge.t.run(ctx =>
      ctx.db.insert('discordGuildAuthorizations', {
        personId: user.personId,
        guildId: 'old',
        guildName: 'Prior',
        botInstalled: true,
        authorizedAt: priorTime,
      })
    );
    let failLate = true;
    const network = vi.fn(
      async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
        expect(init?.redirect).toBe('error');
        expect(init?.signal).toBeDefined();
        const url = new URL(
          input instanceof Request ? input.url : String(input)
        );
        if (new Headers(init?.headers).get('authorization')?.startsWith('Bot '))
          return json([{ id: '201', name: 'Last page' }]);
        if (url.searchParams.get('after') === '200')
          return failLate
            ? json({ error: 'upstream-secret' }, 503)
            : json([{ id: '201', name: 'Last page', permissions: '32' }]);
        return json(
          Array.from({ length: 200 }, (_, index) => ({
            id: String(index + 1),
            name: `Guild ${index + 1}`,
            permissions: '0',
          }))
        );
      }
    );
    vi.stubGlobal('fetch', network);
    expect((await user.request('/discord/guilds/refresh', 'POST')).status).toBe(
      503
    );
    const retained = await bridge.t.run(ctx =>
      ctx.db.query('discordGuildAuthorizations').collect()
    );
    expect(retained).toMatchObject([
      { guildId: 'old', authorizedAt: priorTime },
    ]);
    failLate = false;
    const refreshed = await user.request('/discord/guilds/refresh', 'POST');
    expect(refreshed.status).toBe(200);
    expect((await refreshed.json()).count).toBe(1);
    expect(
      (await (await user.request('/discord/guilds')).json()).items
    ).toMatchObject([{ id: '201', status: 'available' }]);
  } finally {
    await bridge.close();
  }
});
