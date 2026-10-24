import { vi } from 'vitest';
import { api, components } from '../_generated/api';
import { setup } from './delegated-protocol.helpers';

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/** Real Group/auth interfaces with only Discord HTTP replaced at the provider boundary. */
export async function setupDiscordAcceptance(mode: 'role' | 'membership') {
  const f = await setup();
  vi.stubEnv(
    'BETTER_AUTH_SECRET',
    'acceptance-secret-at-least-thirty-two-characters'
  );
  vi.stubEnv('DISCORD_CLIENT_ID', 'acceptance-client');
  vi.stubEnv('DISCORD_CLIENT_SECRET', 'acceptance-secret');
  vi.stubEnv('DISCORD_BOT_TOKEN', 'acceptance-bot');
  const members = new Map([
    ['old-discord', new Set(['unrelated-role'])],
    ['new-discord', new Set(['unrelated-role'])],
  ]);
  const remoteEvents = new Map<string, Record<string, unknown>>();
  const effects: {
    method: string;
    path: string;
    body?: Record<string, unknown>;
  }[] = [];
  const faults = { denyRemoval: false };
  const provider = vi.fn<typeof fetch>(async (input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.origin === 'https://some.convex.site')
      return f.t.fetch(url.pathname + url.search, init);
    if (url.origin !== 'https://discord.com')
      throw new Error(`Unexpected HTTP origin ${url.origin}`);
    const path = url.pathname.replace('/api/v10', '');
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    if (method !== 'GET') effects.push({ method, path, body });
    if (path === '/users/@me/guilds')
      return json([
        { id: '100', name: 'Shared guild', icon: null, permissions: '32' },
      ]);
    if (path === '/users/@me') return json({ id: 'bot' });
    if (path === '/guilds/100') return json({ owner_id: 'discord-staff' });
    if (path.includes('/audit-logs')) return json({ audit_log_entries: [] });
    if (path === '/guilds/100/members/bot')
      return json({ roles: ['bot-role'] });
    if (path === '/guilds/100/roles') {
      if (method === 'POST')
        return json({
          id: 'managed-role',
          name: 'Readers',
          position: 1,
          permissions: '0',
          managed: false,
        });
      return json([
        { id: '100', position: 0, permissions: '0' },
        { id: 'unrelated-role', position: 1, permissions: '0' },
        { id: 'managed-role', position: 1, permissions: '0', managed: false },
        { id: 'bot-role', position: 10, permissions: '268435591' },
      ]);
    }
    if (path.startsWith('/guilds/100/bans/')) return json({ code: 10026 }, 404);
    const target = path.match(
      /^\/guilds\/100\/members\/([^/]+)(?:\/roles\/managed-role)?$/
    );
    if (target) {
      const identity = target[1];
      if (method === 'DELETE' && faults.denyRemoval)
        return json({ message: 'Missing Permissions' }, 403);
      if (method === 'PUT') members.get(identity)?.add('managed-role');
      if (method === 'DELETE') {
        if (path.endsWith('/roles/managed-role'))
          members.get(identity)?.delete('managed-role');
        else members.delete(identity);
      }
      if (method !== 'GET') return new Response(null, { status: 204 });
      const roles = members.get(identity);
      return roles
        ? json({ roles: [...roles], pending: false })
        : json({ code: 10007 }, 404);
    }
    if (path === '/guilds/100/scheduled-events' && method === 'POST') {
      remoteEvents.set('scheduled-event', body);
      return json({ id: 'scheduled-event' });
    }
    if (path === '/guilds/100/scheduled-events/scheduled-event') {
      if (method === 'PATCH')
        remoteEvents.set('scheduled-event', {
          ...remoteEvents.get('scheduled-event'),
          ...body,
        });
      if (method === 'DELETE') remoteEvents.delete('scheduled-event');
      return new Response(null, { status: 204 });
    }
    throw new Error(`Unexpected Discord request ${method} ${path}`);
  });
  vi.stubGlobal('fetch', provider);
  async function linkFixtureIdentity(accountId: string) {
    await f.t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: 'account',
        data: {
          userId: f.owner.user._id,
          providerId: 'discord',
          accountId,
          accessToken: 'fixture-member-token',
          accessTokenExpiresAt: Date.now() + 3600000,
          scope: 'identify email guilds',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    });
  }
  await linkFixtureIdentity('old-discord');
  const groupId = await f.owner.auth.mutation(
    api.groups.mutations.createGroup,
    { name: 'Readers' }
  );
  await f.owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
    mode,
  });
  return {
    ...f,
    groupId,
    members,
    remoteEvents,
    effects,
    faults,
    provider,
    linkFixtureIdentity,
  };
}
