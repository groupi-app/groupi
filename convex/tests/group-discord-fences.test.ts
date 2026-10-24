import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { api, components, internal } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';
const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
const provider = vi.fn<typeof fetch>();
async function setup() {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'discord-manager');
  await t.mutation(components.betterAuth.adapter.create, {
    input: {
      model: 'account',
      data: {
        userId: owner.user._id,
        providerId: 'discord',
        accountId: 'manager-discord',
        accessToken: 'manager-token',
        accessTokenExpiresAt: Date.now() + 3600000,
        scope: 'identify guilds',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    },
  });
  const groupId = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Readers',
  });
  provider.mockImplementation(async (input, init) => {
    const path = String(input).replace('https://discord.com/api/v10', '');
    if (path.includes('/audit-logs?')) return json({ audit_log_entries: [] });
    if (path === '/users/@me/guilds')
      return json([{ id: '100', name: 'Reading room', permissions: '32' }]);
    if (path === '/users/@me') return json({ id: 'bot' });
    if (path === '/guilds/100') return json({ owner_id: 'someone-else' });
    if (path === '/guilds/100/members/bot')
      return json({ roles: ['bot-role'] });
    if (path === '/guilds/100/roles' && init?.method === 'POST')
      return json({
        id: 'created-role',
        name: 'Readers',
        permissions: '0',
        position: 1,
        managed: false,
      });
    if (path === '/guilds/100/roles')
      return json([
        { id: '100', name: '@everyone', permissions: '0', position: 0 },
        { id: 'created-role', name: 'Readers', permissions: '0', position: 1 },
        { id: 'bot-role', name: 'Bot', permissions: '268435591', position: 10 },
        {
          id: 'adopt-role',
          name: 'Readers',
          permissions: '0',
          position: 1,
          managed: false,
        },
      ]);
    throw new Error(`Unexpected provider request ${path}`);
  });
  return { t, owner, groupId };
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv(
    'BETTER_AUTH_SECRET',
    'discord-group-test-secret-at-least-32-characters'
  );
  vi.stubEnv('SITE_URL', 'https://www.groupi.gg');
  vi.stubEnv('DISCORD_CLIENT_ID', 'client');
  vi.stubEnv('DISCORD_CLIENT_SECRET', 'secret');
  vi.stubEnv('DISCORD_BOT_TOKEN', 'bot-token');
  provider.mockReset();
  vi.stubGlobal('fetch', provider);
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it.each(['same', 'other'])(
  'Connect waits for pending cleanup of the same person in %s Group before replacing enrollment',
  async scope => {
    const { t, owner, groupId } = await setup();
    await owner.auth.action(api.groupDiscord.actions.configure, {
      groupId,
      guildId: '100',
    });
    const cleanupGroupId =
      scope === 'other'
        ? await owner.auth.mutation(api.groups.mutations.createGroup, {
            name: 'Other managed Group',
          })
        : groupId;
    await t.run(async ctx => {
      await ctx.db.insert('groupDiscordCleanup', {
        groupId: String(cleanupGroupId),
        personId: String(owner.personId),
        guildId: '100',
        discordUserId: 'previous-identity',
        roleId: 'created-role',
        generation: 1,
        enrollmentGeneration: 1,
        mode: 'role',
        desired: 'role_removed',
        observed: 'unknown',
        status: 'pending',
        attempts: 0,
        nextAttemptAt: Date.now(),
        updatedAt: Date.now(),
      });
    });
    await expect(
      owner.auth.action(api.groupDiscord.connect.connect, {
        groupId,
        consent: true,
      })
    ).rejects.toThrow('cleanup');
    expect(
      await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
    ).toMatchObject({ status: 'blocked', cleanupPending: true });
  }
);
it('an in-flight grant preserves a removed enrollment and its moderation explanation', async () => {
  const { t, owner, groupId } = await setup();
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
  });
  const base = provider.getMockImplementation()!;
  provider.mockImplementation(async (input, init) => {
    const path = String(input);
    if (path.endsWith('/bans/manager-discord'))
      return json({ code: 10026 }, 404);
    if (path.endsWith('/members/manager-discord'))
      return json({ roles: [], pending: false });
    if (path.endsWith('/roles') && init?.method !== 'POST') {
      await t.run(async ctx => {
        const row = await ctx.db
          .query('groupDiscordEnrollments')
          .withIndex('by_group_person', q =>
            q.eq('groupId', groupId).eq('personId', owner.personId)
          )
          .unique();
        if (row)
          await ctx.db.patch(row._id, {
            desired: 'removed',
            status: 'blocked',
            error: 'Discord staff removed access.',
          });
      });
    }
    return base(input, init);
  });
  await owner.auth.action(api.groupDiscord.connect.connect, {
    groupId,
    consent: true,
  });
  expect(
    await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
  ).toMatchObject({
    status: 'blocked',
    error: 'Discord staff removed access.',
  });
  expect(provider.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(
    false
  );
});
it('Connect freezes role grants when moderation history cannot be observed', async () => {
  const { owner, groupId } = await setup();
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
  });
  const base = provider.getMockImplementation()!;
  provider.mockImplementation(async (input, init) => {
    const path = String(input);
    if (path.includes('/audit-logs?'))
      return json({ message: 'Missing Access' }, 403);
    if (path.endsWith('/bans/manager-discord'))
      return json({ code: 10026 }, 404);
    if (path.endsWith('/members/manager-discord'))
      return json({ roles: ['created-role'], pending: false });
    return base(input, init);
  });
  await owner.auth.action(api.groupDiscord.connect.connect, {
    groupId,
    consent: true,
  });
  expect(
    await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
  ).toMatchObject({ status: 'blocked' });
});
it('identity replacement preserves old cleanup before allowing another Connect', async () => {
  const { t, owner, groupId } = await setup();
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
  });
  await t.run(async ctx => {
    await ctx.db.insert('groupDiscordEnrollments', {
      groupId,
      personId: owner.personId,
      discordUserId: 'old-identity',
      guildId: '100',
      roleId: 'created-role',
      generation: 1,
      connectionGeneration: 1,
      desired: 'granted',
      status: 'connected',
      attempts: 1,
      startedAt: Date.now(),
      updatedAt: Date.now(),
      nextAttemptAt: Date.now(),
    });
  });
  await expect(
    owner.auth.action(api.groupDiscord.connect.connect, {
      groupId,
      consent: true,
    })
  ).rejects.toThrow('cleanup');
  await expect(
    owner.auth.action(api.groupDiscord.connect.connect, {
      groupId,
      consent: true,
    })
  ).rejects.toThrow('cleanup');
  const base = provider.getMockImplementation()!;
  provider.mockImplementation(async (input, init) => {
    const path = String(input);
    if (
      path.endsWith('/members/old-identity/roles/created-role') &&
      init?.method === 'DELETE'
    )
      return new Response(null, { status: 204 });
    if (path.endsWith('/members/old-identity')) return json({ roles: [] });
    if (path.endsWith('/bans/manager-discord'))
      return json({ code: 10026 }, 404);
    if (path.endsWith('/members/manager-discord'))
      return json({ roles: ['created-role'], pending: false });
    return base(input, init);
  });
  await t.action(internal.groupDiscord.reconcile.dispatch, {});
  await owner.auth.action(api.groupDiscord.connect.connect, {
    groupId,
    consent: true,
  });
  expect(
    await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
  ).toMatchObject({ status: 'connected', cleanupPending: false });
});
it('failed compensation remains visible until durable cleanup succeeds', async () => {
  const { t, owner, groupId } = await setup();
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
  });
  const base = provider.getMockImplementation()!;
  let denyCleanup = true;
  provider.mockImplementation(async (input, init) => {
    const path = String(input);
    if (path.endsWith('/bans/manager-discord'))
      return json({ code: 10026 }, 404);
    if (path.endsWith('/members/manager-discord'))
      return json({ roles: [], pending: false });
    if (path.endsWith('/roles/created-role') && init?.method === 'PUT') {
      await t.run(async ctx => {
        const row = await ctx.db
          .query('groupDiscordEnrollments')
          .withIndex('by_group_person', q =>
            q.eq('groupId', groupId).eq('personId', owner.personId)
          )
          .unique();
        if (row)
          await ctx.db.patch(row._id, {
            desired: 'removed',
            status: 'blocked',
            error: 'Discord staff removed access.',
          });
      });
      return new Response(null, { status: 204 });
    }
    if (path.endsWith('/roles/created-role') && init?.method === 'DELETE')
      return denyCleanup
        ? json({ message: 'Missing Permissions' }, 403)
        : new Response(null, { status: 204 });
    return base(input, init);
  });
  await owner.auth.action(api.groupDiscord.connect.connect, {
    groupId,
    consent: true,
  });
  expect(
    await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
  ).toMatchObject({
    status: 'blocked',
    cleanupPending: true,
    error: expect.stringContaining('cleanup denied'),
  });
  denyCleanup = false;
  vi.advanceTimersByTime(5000);
  await t.action(internal.groupDiscord.reconcile.dispatch, {});
  expect(
    await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
  ).toMatchObject({
    status: 'blocked',
    cleanupPending: false,
    error: 'Discord staff removed access.',
  });
});
it('Connect waits out an invalidated grant lease even after role cleanup completes', async () => {
  const { t, owner, groupId } = await setup();
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
  });
  await t.run(async ctx => {
    await ctx.db.insert('groupDiscordEnrollments', {
      groupId,
      personId: owner.personId,
      discordUserId: 'manager-discord',
      guildId: '100',
      roleId: 'created-role',
      generation: 1,
      connectionGeneration: 1,
      desired: 'removed',
      status: 'blocked',
      grantAttemptedAt: Date.now(),
      attempts: 1,
      startedAt: Date.now(),
      updatedAt: Date.now(),
      nextAttemptAt: Date.now() + 60000,
    });
  });
  await expect(
    owner.auth.action(api.groupDiscord.connect.connect, {
      groupId,
      consent: true,
    })
  ).rejects.toThrow('in-flight grant');
  vi.advanceTimersByTime(60000);
  const base = provider.getMockImplementation()!;
  provider.mockImplementation(async (input, init) => {
    const path = String(input);
    if (path.endsWith('/bans/manager-discord'))
      return json({ code: 10026 }, 404);
    if (path.endsWith('/members/manager-discord'))
      return json({ roles: ['created-role'], pending: false });
    return base(input, init);
  });
  await owner.auth.action(api.groupDiscord.connect.connect, {
    groupId,
    consent: true,
  });
  expect(
    await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
  ).toMatchObject({ status: 'connected' });
});
it('managers can see failed cleanup after the affected member has departed', async () => {
  const { t, owner, groupId } = await setup();
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
  });
  const departed = await createAuthAccount(t, 'departed-discord-member');
  await t.run(async ctx => {
    await ctx.db.insert('groupDiscordCleanup', {
      groupId: String(groupId),
      personId: String(departed.personId),
      guildId: '100',
      discordUserId: 'departed-identity',
      roleId: 'created-role',
      generation: 1,
      enrollmentGeneration: 1,
      mode: 'role',
      desired: 'role_removed',
      observed: 'unknown',
      status: 'pending',
      error:
        'Discord role cleanup denied. Check bot permissions and hierarchy.',
      attempts: 1,
      nextAttemptAt: Date.now(),
      updatedAt: Date.now(),
    });
  });
  expect(
    await owner.auth.query(api.groupDiscord.queries.getConnection, { groupId })
  ).toMatchObject({
    status: 'active',
    cleanupPending: true,
    synchronizationError:
      'Discord role cleanup denied. Check bot permissions and hierarchy.',
  });
});
it('a late stale grant cannot compensate away a newer authorized Connect on the same role', async () => {
  const { t, owner, groupId } = await setup();
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
  });
  const base = provider.getMockImplementation()!;
  let granted = false;
  let firstGrant = true;
  let removals = 0;
  provider.mockImplementation(async (input, init) => {
    const path = String(input);
    if (path.endsWith('/bans/manager-discord'))
      return json({ code: 10026 }, 404);
    if (path.endsWith('/members/manager-discord'))
      return json({ roles: granted ? ['created-role'] : [], pending: false });
    if (path.endsWith('/roles/created-role') && init?.method === 'PUT') {
      if (firstGrant) {
        firstGrant = false;
        await t.run(async ctx => {
          const row = await ctx.db
            .query('groupDiscordEnrollments')
            .withIndex('by_group_person', q =>
              q.eq('groupId', groupId).eq('personId', owner.personId)
            )
            .unique();
          if (row)
            await ctx.db.patch(row._id, {
              desired: 'removed',
              status: 'blocked',
              generation: row.generation + 1,
            });
        });
        vi.advanceTimersByTime(60001);
        await owner.auth.action(api.groupDiscord.connect.connect, {
          groupId,
          consent: true,
        });
      }
      granted = true;
      return new Response(null, { status: 204 });
    }
    if (path.endsWith('/roles/created-role') && init?.method === 'DELETE') {
      granted = false;
      removals++;
      return new Response(null, { status: 204 });
    }
    return base(input, init);
  });
  await owner.auth.action(api.groupDiscord.connect.connect, {
    groupId,
    consent: true,
  });
  expect(
    await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
  ).toMatchObject({ status: 'connected', cleanupPending: false });
  expect(granted).toBe(true);
  expect(removals).toBe(0);
});
