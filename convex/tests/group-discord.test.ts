import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { api, components } from '../_generated/api';
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
    if (path === '/users/@me/guilds')
      return json([{ id: '100', name: 'Reading room', permissions: '32' }]);
    if (path === '/users/@me') return json({ id: 'bot' });
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
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it('a manager creates a separate persistent ordinary-member role connection by default', async () => {
  const { owner, groupId } = await setup();
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
  });
  expect(
    await owner.auth.query(api.groupDiscord.queries.getConnection, { groupId })
  ).toMatchObject({
    guildId: '100',
    guildName: 'Reading room',
    mode: 'role',
    roleId: 'created-role',
    generation: 1,
    status: 'active',
  });
  const write = provider.mock.calls.find(([, init]) => init?.method === 'POST');
  expect(JSON.parse(String(write?.[1]?.body))).toMatchObject({
    permissions: '0',
    mentionable: false,
    hoist: false,
  });
});
it('rejects a current ordinary member before making provider writes', async () => {
  const { t, groupId } = await setup();
  const member = await createAuthAccount(t, 'ordinary');
  await t.run(async ctx => {
    await ctx.db.insert('groupMemberships', {
      groupId,
      personId: member.personId,
      role: 'MEMBER',
      joinedAt: Date.now(),
    });
  });
  await expect(
    member.auth.action(api.groupDiscord.actions.configure, {
      groupId,
      guildId: '100',
    })
  ).rejects.toThrow('manager access');
  expect(provider).not.toHaveBeenCalled();
});
it('requires fresh Discord authority even when the server was previously discoverable', async () => {
  const { owner, groupId } = await setup();
  provider.mockResolvedValue(
    json([{ id: '100', name: 'Reading room', permissions: '0' }])
  );
  await expect(
    owner.auth.action(api.groupDiscord.actions.configure, {
      groupId,
      guildId: '100',
    })
  ).rejects.toThrow('Manage Server');
  expect(
    await owner.auth.query(api.groupDiscord.queries.getConnection, { groupId })
  ).toBeNull();
});
it('deliberately adopts an ordinary dedicated role with member permissions', async () => {
  const { owner, groupId } = await setup();
  const base = provider.getMockImplementation()!;
  provider.mockImplementation(async (input, init) =>
    String(input).endsWith('/roles') && init?.method !== 'POST'
      ? json([
          { id: '100', name: '@everyone', permissions: '0', position: 0 },
          {
            id: 'bot-role',
            name: 'Bot',
            permissions: '268435591',
            position: 10,
          },
          {
            id: 'adopt-role',
            name: 'Readers',
            permissions: '3072',
            position: 1,
          },
        ])
      : base(input, init)
  );
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
    roleId: 'adopt-role',
  });
  expect(
    await owner.auth.query(api.groupDiscord.queries.getConnection, { groupId })
  ).toMatchObject({ roleId: 'adopt-role', status: 'active' });
  expect(provider.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(
    false
  );
});
it('requires audit observation capability before promising managed role access', async () => {
  const { owner, groupId } = await setup();
  const base = provider.getMockImplementation()!;
  provider.mockImplementation(async (input, init) =>
    String(input).endsWith('/roles')
      ? json([
          { id: '100', name: '@everyone', permissions: '0', position: 0 },
          {
            id: 'bot-role',
            name: 'Bot',
            permissions: '268435456',
            position: 10,
          },
        ])
      : base(input, init)
  );
  await expect(
    owner.auth.action(api.groupDiscord.actions.configure, {
      groupId,
      guildId: '100',
    })
  ).rejects.toThrow('View Audit Log');
  expect(
    await owner.auth.query(api.groupDiscord.queries.getConnection, { groupId })
  ).toBeNull();
});
it('does not report active role access when provider creation returns no role', async () => {
  const { owner, groupId } = await setup();
  const base = provider.getMockImplementation()!;
  provider.mockImplementation(async (input, init) =>
    init?.method === 'POST' ? json({}) : base(input, init)
  );
  await expect(
    owner.auth.action(api.groupDiscord.actions.configure, {
      groupId,
      guildId: '100',
    })
  ).rejects.toThrow('role creation');
  expect(
    await owner.auth.query(api.groupDiscord.queries.getConnection, { groupId })
  ).toMatchObject({ status: 'blocked' });
});
it('isolates dedicated roles and excludes concurrent server membership reservations', async () => {
  const { owner, groupId } = await setup();
  const other = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Other readers',
  });
  const outcomes = await Promise.allSettled([
    owner.auth.action(api.groupDiscord.actions.configure, {
      groupId,
      guildId: '100',
      roleId: 'adopt-role',
    }),
    owner.auth.action(api.groupDiscord.actions.configure, {
      groupId: other,
      guildId: '100',
      mode: 'membership',
    }),
  ]);
  expect(outcomes.filter(o => o.status === 'fulfilled')).toHaveLength(1);
  expect(outcomes.filter(o => o.status === 'rejected')).toHaveLength(1);
});
it('refuses adopting a role already reserved by another Group', async () => {
  const { owner, groupId } = await setup();
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
    roleId: 'adopt-role',
  });
  const other = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Other readers',
  });
  await expect(
    owner.auth.action(api.groupDiscord.actions.configure, {
      groupId: other,
      guildId: '100',
      roleId: 'adopt-role',
    })
  ).rejects.toThrow('reserved');
  expect(
    await owner.auth.query(api.groupDiscord.queries.getConnection, {
      groupId: other,
    })
  ).toBeNull();
});
it.each([
  ['staff permissions', 'adopt-role', '8', 1, false],
  ['bot hierarchy', 'adopt-role', '0', 10, false],
  ['managed integration role', 'adopt-role', '0', 1, true],
  ['everyone role', '100', '0', 0, false],
])(
  'rejects an unsuitable dedicated role: %s',
  async (_case, id, permissions, position, managed) => {
    const { owner, groupId } = await setup();
    const base = provider.getMockImplementation()!;
    provider.mockImplementation(async (input, init) =>
      String(input).endsWith('/roles')
        ? json([
            { id: '100', name: '@everyone', permissions: '0', position: 0 },
            {
              id: 'bot-role',
              name: 'Bot',
              permissions: '268435591',
              position: 10,
            },
            { id, name: 'Unsuitable', permissions, position, managed },
          ])
        : base(input, init)
    );
    await expect(
      owner.auth.action(api.groupDiscord.actions.configure, {
        groupId,
        guildId: '100',
        roleId: id,
      })
    ).rejects.toThrow('dedicated ordinary-member role');
    expect(
      await owner.auth.query(api.groupDiscord.queries.getConnection, {
        groupId,
      })
    ).toBeNull();
  }
);
it('persists an actionable blocked setup without disclosing provider credentials', async () => {
  const { owner, groupId } = await setup();
  const base = provider.getMockImplementation()!;
  provider.mockImplementation(async (input, init) =>
    init?.method === 'POST'
      ? json({ message: 'private-provider-details' }, 403)
      : base(input, init)
  );
  await expect(
    owner.auth.action(api.groupDiscord.actions.configure, {
      groupId,
      guildId: '100',
    })
  ).rejects.toThrow('Check installation and permissions');
  const state = await owner.auth.query(api.groupDiscord.queries.getConnection, {
    groupId,
  });
  expect(state).toMatchObject({
    status: 'blocked',
    generation: 1,
    error:
      'Discord bot access failed (403). Check installation and permissions.',
  });
  expect(JSON.stringify(state)).not.toMatch(
    /bot-token|manager-token|private-provider-details/
  );
});
it('accepts only landing channels belonging to the selected server', async () => {
  const { owner, groupId } = await setup();
  const base = provider.getMockImplementation()!;
  provider.mockImplementation(async (input, init) =>
    String(input).includes('/channels/')
      ? json({ guild_id: 'other-server', type: 0 })
      : base(input, init)
  );
  await expect(
    owner.auth.action(api.groupDiscord.actions.configure, {
      groupId,
      guildId: '100',
      landingChannelId: '200',
    })
  ).rejects.toThrow('selected Discord server');
  expect(
    await owner.auth.query(api.groupDiscord.queries.getConnection, { groupId })
  ).toBeNull();
});
it('withholds setup when current Group authority ends during Discord inspection', async () => {
  const { t, owner, groupId } = await setup();
  const base = provider.getMockImplementation()!;
  provider.mockImplementation(async (input, init) => {
    if (String(input).endsWith('/roles'))
      await t.run(async ctx => {
        const membership = await ctx.db
          .query('groupMemberships')
          .withIndex('by_groupId_and_personId', q =>
            q.eq('groupId', groupId).eq('personId', owner.personId)
          )
          .unique();
        await ctx.db.patch(membership!._id, { role: 'MEMBER' });
      });
    return base(input, init);
  });
  await expect(
    owner.auth.action(api.groupDiscord.actions.configure, {
      groupId,
      guildId: '100',
    })
  ).rejects.toThrow('manager access');
  expect(provider.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(
    false
  );
});
it('accepts Discord administrators who hold effective Manage Server authority', async () => {
  const { owner, groupId } = await setup();
  const base = provider.getMockImplementation()!;
  provider.mockImplementation(async (input, init) =>
    String(input).endsWith('/users/@me/guilds')
      ? json([{ id: '100', name: 'Reading room', permissions: '8' }])
      : base(input, init)
  );
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
  });
  expect(
    await owner.auth.query(api.groupDiscord.queries.getConnection, { groupId })
  ).toMatchObject({ status: 'active' });
});
it('keeps a newly created dedicated role exclusive when another Group races to adopt it', async () => {
  const { owner, groupId } = await setup();
  const other = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Other readers',
  });
  const base = provider.getMockImplementation()!;
  let created!: () => void;
  const roleCreated = new Promise<void>(resolve => {
    created = resolve;
  });
  let release!: () => void;
  const releaseCreate = new Promise<void>(resolve => {
    release = resolve;
  });
  let creating = false;
  provider.mockImplementation(async (input, init) => {
    if (init?.method === 'POST') {
      creating = true;
      created();
      await releaseCreate;
      return json({
        id: 'created-role',
        name: 'Readers',
        permissions: '0',
        position: 1,
      });
    }
    if (creating && String(input).endsWith('/roles'))
      return json([
        { id: '100', name: '@everyone', permissions: '0', position: 0 },
        { id: 'bot-role', name: 'Bot', permissions: '268435591', position: 10 },
        { id: 'created-role', name: 'Readers', permissions: '0', position: 1 },
      ]);
    return base(input, init);
  });
  const original = owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
  });
  await roleCreated;
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId: other,
    guildId: '100',
    roleId: 'created-role',
  });
  release();
  await expect(original).rejects.toThrow('reserved');
  expect(
    await owner.auth.query(api.groupDiscord.queries.getConnection, { groupId })
  ).toMatchObject({ status: 'blocked', provisionedRoleId: 'created-role' });
  expect(
    await owner.auth.query(api.groupDiscord.queries.getConnection, {
      groupId: other,
    })
  ).toMatchObject({ status: 'active', roleId: 'created-role' });
});
it('reserves exclusive Server membership scope without creating a role or granting membership', async () => {
  const { owner, groupId } = await setup();
  const base = provider.getMockImplementation()!;
  provider.mockImplementation(async (input, init) =>
    String(input).includes('/channels/')
      ? json({ guild_id: '100', type: 0 })
      : base(input, init)
  );
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
    mode: 'membership',
    landingChannelId: '200',
  });
  expect(
    await owner.auth.query(api.groupDiscord.queries.getConnection, { groupId })
  ).toMatchObject({
    mode: 'membership',
    landingChannelId: '200',
    status: 'active',
  });
  expect(
    provider.mock.calls.some(
      ([, init]) =>
        init?.method === 'POST' ||
        init?.method === 'PUT' ||
        init?.method === 'DELETE'
    )
  ).toBe(false);
  const other = await owner.auth.mutation(api.groups.mutations.createGroup, {
    name: 'Other readers',
  });
  await expect(
    owner.auth.action(api.groupDiscord.actions.configure, {
      groupId: other,
      guildId: '100',
    })
  ).rejects.toThrow('reserved');
});
it('requires Kick Members and Ban Members for exclusive Server membership', async () => {
  const { owner, groupId } = await setup();
  const base = provider.getMockImplementation()!;
  provider.mockImplementation(async (input, init) =>
    String(input).endsWith('/roles')
      ? json([
          { id: '100', name: '@everyone', permissions: '0', position: 0 },
          {
            id: 'bot-role',
            name: 'Bot',
            permissions: '268435585',
            position: 10,
          },
        ])
      : base(input, init)
  );
  await expect(
    owner.auth.action(api.groupDiscord.actions.configure, {
      groupId,
      guildId: '100',
      mode: 'membership',
    })
  ).rejects.toThrow('Kick Members and Ban Members');
  expect(
    await owner.auth.query(api.groupDiscord.queries.getConnection, { groupId })
  ).toBeNull();
});
