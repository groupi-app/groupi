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
it('explicit Connect adopts an existing linked member without joining and exposes managed access', async () => {
  const { owner, groupId } = await setup();
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
  });
  const base = provider.getMockImplementation()!;
  let granted = false;
  provider.mockImplementation(async (input, init) => {
    const path = String(input);
    if (path.endsWith('/bans/manager-discord'))
      return json({ code: 10026 }, 404);
    if (path.endsWith('/guilds/100')) return json({ owner_id: 'someone-else' });
    if (path.endsWith('/members/manager-discord'))
      return json({ roles: granted ? ['created-role'] : [], pending: false });
    if (
      path.endsWith('/members/manager-discord/roles/created-role') &&
      init?.method === 'PUT'
    ) {
      granted = true;
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
  ).toMatchObject({
    status: 'connected',
    linked: true,
    openUrl: 'https://discord.com/channels/100',
  });
  expect(
    provider.mock.calls.some(
      ([input, init]) =>
        String(input).endsWith('/members/manager-discord') &&
        init?.method === 'PUT'
    )
  ).toBe(false);
});
it.each(['role', 'membership'] as const)(
  'missing server membership requires separate guilds.join consent without silently enrolling (%s)',
  async mode => {
    const { owner, groupId } = await setup();
    await owner.auth.action(api.groupDiscord.actions.configure, {
      groupId,
      guildId: '100',
      mode,
    });
    const base = provider.getMockImplementation()!;
    provider.mockImplementation(async (input, init) => {
      if (String(input).endsWith('/bans/manager-discord'))
        return json({ code: 10026 }, 404);
      if (String(input).endsWith('/members/manager-discord'))
        return json({ code: 10007 }, 404);
      if (String(input).endsWith('/oauth2/@me'))
        return json({
          application: { id: 'client' },
          scopes: ['identify', 'guilds'],
          expires: new Date(Date.now() + 3600000).toISOString(),
        });
      return base(input, init);
    });
    expect(
      await owner.auth.action(api.groupDiscord.connect.connect, {
        groupId,
        consent: true,
      })
    ).toEqual({ requiresConsent: true });
    expect(
      await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
    ).toMatchObject({ status: 'not_connected', linked: true });
    expect(provider.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(
      false
    );
  }
);
it.each(['role', 'membership'] as const)(
  'screening remains incomplete and never grants the role (%s)',
  async mode => {
    const { owner, groupId } = await setup();
    await owner.auth.action(api.groupDiscord.actions.configure, {
      groupId,
      guildId: '100',
      mode,
    });
    const base = provider.getMockImplementation()!;
    provider.mockImplementation(async (input, init) => {
      if (String(input).endsWith('/bans/manager-discord'))
        return json({ code: 10026 }, 404);
      if (String(input).endsWith('/members/manager-discord'))
        return json({ roles: [], pending: true });
      return base(input, init);
    });
    await owner.auth.action(api.groupDiscord.connect.connect, {
      groupId,
      consent: true,
    });
    expect(
      await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
    ).toMatchObject({ status: 'screening' });
    expect(provider.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(
      false
    );
  }
);
it('initial role-grant intent survives a transient provider failure without another Connect', async () => {
  vi.useFakeTimers();
  try {
    const { t, owner, groupId } = await setup();
    await owner.auth.action(api.groupDiscord.actions.configure, {
      groupId,
      guildId: '100',
    });
    const base = provider.getMockImplementation()!;
    let attempts = 0;
    let granted = false;
    provider.mockImplementation(async (input, init) => {
      if (String(input).endsWith('/bans/manager-discord'))
        return json({ code: 10026 }, 404);
      if (String(input).endsWith('/members/manager-discord'))
        return json({ roles: granted ? ['created-role'] : [], pending: false });
      if (
        String(input).endsWith('/roles/created-role') &&
        init?.method === 'PUT'
      ) {
        if (++attempts === 1) throw new TypeError('network unavailable');
        granted = true;
        return new Response(null, { status: 204 });
      }
      return base(input, init);
    });
    await owner.auth
      .action(api.groupDiscord.connect.connect, { groupId, consent: true })
      .catch(() => {});
    await t.finishAllScheduledFunctions(() => vi.runAllTimers());
    expect(
      await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
    ).toMatchObject({ status: 'connected' });
  } finally {
    vi.useRealTimers();
  }
});
it.each([
  { joinStatus: 201, mode: 'role' },
  { joinStatus: 204, mode: 'role' },
  { joinStatus: 201, mode: 'membership' },
  { joinStatus: 204, mode: 'membership' },
] as const)(
  'a separately consented join (%j) uses server credentials and observes screening before role access',
  async ({ joinStatus, mode }) => {
    const { owner, groupId } = await setup();
    await owner.auth.action(api.groupDiscord.actions.configure, {
      groupId,
      guildId: '100',
      mode,
    });
    const base = provider.getMockImplementation()!;
    let joined = false;
    provider.mockImplementation(async (input, init) => {
      const path = String(input);
      if (path.endsWith('/oauth2/@me'))
        return json({
          application: { id: 'client' },
          scopes: ['identify', 'guilds.join'],
          expires: new Date(Date.now() + 3600000).toISOString(),
        });
      if (
        path.endsWith('/users/@me') &&
        new Headers(init?.headers).get('Authorization')?.startsWith('Bearer')
      )
        return json({ id: 'manager-discord' });
      if (path.endsWith('/bans/manager-discord'))
        return json({ code: 10026 }, 404);
      if (path.endsWith('/members/manager-discord') && init?.method === 'PUT') {
        joined = true;
        return joinStatus === 204
          ? new Response(null, { status: 204 })
          : json({ pending: true, roles: [] }, 201);
      }
      if (path.endsWith('/members/manager-discord'))
        return joined
          ? json({ pending: true, roles: [] })
          : json({ code: 10007 }, 404);
      return base(input, init);
    });
    await owner.auth.action(api.groupDiscord.connect.connect, {
      groupId,
      consent: true,
    });
    expect(
      await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
    ).toMatchObject({ status: 'screening' });
    const writes = provider.mock.calls.filter(
      ([, init]) => init?.method === 'PUT'
    );
    expect(writes).toHaveLength(1);
    expect(JSON.parse(String(writes[0][1]?.body))).toEqual({
      access_token: 'manager-token',
    });
  }
);
it('a changed connection generation fences a late grant and compensates the exact old role', async () => {
  const { t, owner, groupId } = await setup();
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
  });
  const base = provider.getMockImplementation()!;
  let granted = false;
  provider.mockImplementation(async (input, init) => {
    const path = String(input);
    if (path.endsWith('/bans/manager-discord'))
      return json({ code: 10026 }, 404);
    if (path.endsWith('/members/manager-discord'))
      return json({ roles: granted ? ['created-role'] : [], pending: false });
    if (path.endsWith('/roles/created-role') && init?.method === 'PUT') {
      granted = true;
      await t.run(async ctx => {
        const c = await ctx.db
          .query('groupDiscordConnections')
          .withIndex('by_group', q => q.eq('groupId', groupId))
          .unique();
        await ctx.db.patch(c!._id, { generation: 2 });
      });
      return new Response(null, { status: 204 });
    }
    if (path.endsWith('/roles/created-role') && init?.method === 'DELETE') {
      granted = false;
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
  ).toMatchObject({ status: 'blocked' });
  expect(granted).toBe(false);
});
it('reports independent server-owner access as an external exception while managing only the dedicated role', async () => {
  const { owner, groupId } = await setup();
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
  });
  const base = provider.getMockImplementation()!;
  let granted = false;
  provider.mockImplementation(async (input, init) => {
    const path = String(input);
    if (path.endsWith('/guilds/100'))
      return json({ owner_id: 'manager-discord' });
    if (path.endsWith('/bans/manager-discord'))
      return json({ code: 10026 }, 404);
    if (path.endsWith('/members/manager-discord'))
      return json({ roles: granted ? ['created-role'] : [], pending: false });
    if (path.endsWith('/roles/created-role') && init?.method === 'PUT') {
      granted = true;
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
  ).toMatchObject({
    status: 'connected',
    externalException: expect.stringContaining('server owner'),
  });
});
it('a fresh explicit Connect can re-enroll after external role removal while duplicate Connect is idempotent', async () => {
  const { owner, groupId } = await setup();
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
  });
  const base = provider.getMockImplementation()!;
  let granted = false;
  let grants = 0;
  provider.mockImplementation(async (input, init) => {
    const path = String(input);
    if (path.endsWith('/bans/manager-discord'))
      return json({ code: 10026 }, 404);
    if (path.endsWith('/members/manager-discord'))
      return json({ roles: granted ? ['created-role'] : [], pending: false });
    if (path.endsWith('/roles/created-role') && init?.method === 'PUT') {
      granted = true;
      grants++;
      return new Response(null, { status: 204 });
    }
    return base(input, init);
  });
  await owner.auth.action(api.groupDiscord.connect.connect, {
    groupId,
    consent: true,
  });
  await owner.auth.action(api.groupDiscord.connect.connect, {
    groupId,
    consent: true,
  });
  expect(grants).toBe(1);
  granted = false;
  await owner.auth.action(api.groupDiscord.connect.connect, {
    groupId,
    consent: true,
  });
  expect(grants).toBe(2);
  expect(
    await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
  ).toMatchObject({ status: 'connected' });
});
it('required incomplete onboarding denies explicit Connect before any provider operation', async () => {
  const { t, owner, groupId } = await setup();
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
  });
  await owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    {
      groupId,
      enabled: true,
      requiredCompletion: true,
      questions: [
        {
          id: 'rules',
          label: 'Confirm rules',
          type: 'SHORT_ANSWER',
          required: true,
        },
      ],
    }
  );
  await t.run(async ctx => {
    const m = await ctx.db
      .query('groupMemberships')
      .withIndex('by_groupId_and_personId', q =>
        q.eq('groupId', groupId).eq('personId', owner.personId)
      )
      .unique();
    await ctx.db.patch(m!._id, { role: 'MEMBER' });
  });
  provider.mockClear();
  await expect(
    owner.auth.action(api.groupDiscord.connect.connect, {
      groupId,
      consent: true,
    })
  ).rejects.toThrow('completed required Group onboarding');
  expect(provider).not.toHaveBeenCalled();
  expect(
    await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
  ).toMatchObject({ status: 'not_connected', eligible: false });
});
it.each(['role', 'membership'] as const)(
  'Discord bans block enrollment without changing Group admission or unbanning (%s)',
  async mode => {
    const { owner, groupId } = await setup();
    await owner.auth.action(api.groupDiscord.actions.configure, {
      groupId,
      guildId: '100',
      mode,
    });
    const base = provider.getMockImplementation()!;
    provider.mockImplementation(async (input, init) =>
      String(input).endsWith('/bans/manager-discord')
        ? json({ user: { id: 'manager-discord' } })
        : base(input, init)
    );
    provider.mockClear();
    await expect(
      owner.auth.action(api.groupDiscord.connect.connect, {
        groupId,
        consent: true,
      })
    ).rejects.toThrow('Discord staff have banned');
    expect(
      await owner.auth.query(api.groups.queries.getGroup, { groupId })
    ).toMatchObject({ viewerRole: 'OWNER' });
    expect(
      await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
    ).toMatchObject({ status: 'blocked' });
    expect(
      provider.mock.calls.some(([, init]) =>
        ['PUT', 'DELETE'].includes(init?.method ?? '')
      )
    ).toBe(false);
  }
);
it.each([
  [
    'wrong application',
    'other-client',
    ['guilds.join'],
    'future',
    'manager-discord',
  ],
  ['missing scope', 'client', ['identify'], 'future', 'manager-discord'],
  ['expired consent', 'client', ['guilds.join'], 'past', 'manager-discord'],
  ['invalid expiry', 'client', ['guilds.join'], 'invalid', 'manager-discord'],
  [
    'different identity',
    'client',
    ['guilds.join'],
    'future',
    'different-discord',
  ],
])(
  'never joins with %s',
  async (_label, applicationId, scopes, expiry, identity) => {
    const { owner, groupId } = await setup();
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
        return json({ code: 10007 }, 404);
      if (path.endsWith('/oauth2/@me'))
        return json({
          application: { id: applicationId },
          scopes,
          expires:
            expiry === 'future'
              ? new Date(Date.now() + 3600000).toISOString()
              : expiry === 'past'
                ? new Date(Date.now() - 3600000).toISOString()
                : 'invalid',
        });
      if (
        path.endsWith('/users/@me') &&
        new Headers(init?.headers).get('Authorization')?.startsWith('Bearer')
      )
        return json({ id: identity });
      return base(input, init);
    });
    provider.mockClear();
    expect(
      await owner.auth.action(api.groupDiscord.connect.connect, {
        groupId,
        consent: true,
      })
    ).toEqual({ requiresConsent: true });
    expect(
      await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
    ).toMatchObject({ status: 'not_connected', linked: true });
    expect(provider.mock.calls.some(([, init]) => init?.method === 'PUT')).toBe(
      false
    );
  }
);
it('Role access can manage a dedicated lower role for a target with a higher unrelated staff role', async () => {
  const { owner, groupId } = await setup();
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
  });
  const base = provider.getMockImplementation()!;
  let granted = false;
  provider.mockImplementation(async (input, init) => {
    const path = String(input);
    if (path.endsWith('/bans/manager-discord'))
      return json({ code: 10026 }, 404);
    if (path.endsWith('/members/manager-discord'))
      return json({
        roles: granted ? ['high-staff', 'created-role'] : ['high-staff'],
        pending: false,
      });
    if (path.endsWith('/roles') && init?.method !== 'POST') {
      const response = await base(input, init);
      return json([
        ...(await response.json()),
        { id: 'high-staff', name: 'Staff', position: 20, permissions: '32' },
      ]);
    }
    if (path.endsWith('/roles/created-role') && init?.method === 'PUT') {
      granted = true;
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
  ).toMatchObject({ status: 'connected' });
  expect(granted).toBe(true);
});

it.each([
  { action: 25, mode: 'role' },
  { action: 20, mode: 'role' },
  { action: 22, mode: 'role' },
  { action: 20, mode: 'membership' },
  { action: 22, mode: 'membership' },
] as const)(
  'durable moderation observation (%j) requires fresh Connect after removal reversed between snapshots',
  async ({ action, mode }) => {
    const { t, owner, groupId } = await setup();
    await owner.auth.action(api.groupDiscord.actions.configure, {
      groupId,
      guildId: '100',
      mode,
    });
    const base = provider.getMockImplementation()!;
    let granted = false;
    let audit: unknown[] = [];
    provider.mockImplementation(async (input, init) => {
      const path = String(input);
      if (path.includes('/audit-logs?'))
        return json({
          audit_log_entries: path.includes(`action_type=${action}`)
            ? audit
            : [],
        });
      if (path.endsWith('/bans/manager-discord'))
        return json({ code: 10026 }, 404);
      if (path.endsWith('/members/manager-discord'))
        return json({
          roles: granted ? ['created-role', 'unrelated'] : ['unrelated'],
        });
      if (path.endsWith('/roles/created-role') && init?.method === 'PUT') {
        granted = true;
        return new Response(null, { status: 204 });
      }
      return base(input, init);
    });
    await owner.auth.action(api.groupDiscord.connect.connect, {
      groupId,
      consent: true,
    });
    vi.advanceTimersByTime(2000);
    audit = [
      {
        id: String(BigInt(Date.now() - 1420070400000) << 22n),
        action_type: action,
        user_id: 'staff',
        target_id: 'manager-discord',
        changes: [{ key: '$remove', new_value: [{ id: 'created-role' }] }],
      },
    ];
    vi.advanceTimersByTime(300000);
    await t.action(internal.groupDiscord.reconcile.dispatch, {});
    expect(
      await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
    ).toMatchObject({
      status: 'blocked',
      eligible: true,
      error: expect.stringContaining('Connect'),
    });
    expect(granted).toBe(mode === 'role');
    vi.advanceTimersByTime(2000);
    await owner.auth.action(api.groupDiscord.connect.connect, {
      groupId,
      consent: true,
    });
    vi.advanceTimersByTime(300000);
    await t.action(internal.groupDiscord.reconcile.dispatch, {});
    expect(
      await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
    ).toMatchObject({ status: 'connected' });
  }
);

it('persists a bounded audit frontier and freezes grants until the next page is observed', async () => {
  const { t, owner, groupId } = await setup();
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
  });
  const base = provider.getMockImplementation()!;
  const start = BigInt(Date.now() - 1420070400000) << 22n;
  let backlog = true;
  let granted = false;
  provider.mockImplementation(async (input, init) => {
    const path = String(input);
    if (path.includes('/audit-logs?')) {
      const url = new URL(path);
      const after = BigInt(url.searchParams.get('after')!);
      return json({
        audit_log_entries:
          backlog &&
          url.searchParams.get('action_type') === '20' &&
          after < start + 100n
            ? Array.from({ length: 100 }, (_, index) => ({
                id: String(start + BigInt(index + 1)),
                target_id: 'unenrolled',
                user_id: 'staff',
              }))
            : [],
      });
    }
    if (path.endsWith('/bans/manager-discord'))
      return json({ code: 10026 }, 404);
    if (path.endsWith('/members/manager-discord'))
      return json({ roles: granted ? ['created-role'] : [] });
    if (path.endsWith('/roles/created-role') && init?.method === 'PUT') {
      granted = true;
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
  ).toMatchObject({
    status: 'blocked',
    error: expect.stringContaining('catching up'),
  });
  expect(granted).toBe(false);
  backlog = false;
  await owner.auth.action(api.groupDiscord.connect.connect, {
    groupId,
    consent: true,
  });
  expect(
    provider.mock.calls.some(([input]) =>
      String(input).includes(`action_type=20&after=${start + 100n}`)
    )
  ).toBe(true);
  expect(
    await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
  ).toMatchObject({ status: 'connected' });
  expect(granted).toBe(true);
  await t.action(internal.groupDiscord.reconcile.dispatch, {});
});

it('explicit Connect adopts existing Server membership without granting a role', async () => {
  const { owner, groupId } = await setup();
  const fallback = provider.getMockImplementation()!;
  provider.mockImplementation(async (input, init) => {
    const path = String(input);
    if (path.endsWith('/bans/manager-discord'))
      return json({ code: 10026 }, 404);
    if (path.endsWith('/members/manager-discord'))
      return json({ roles: [], pending: false });
    return fallback(input, init);
  });
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
    mode: 'membership',
  });
  await owner.auth.action(api.groupDiscord.connect.connect, {
    groupId,
    consent: true,
  });
  expect(
    await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
  ).toMatchObject({ mode: 'membership', status: 'connected' });
  expect(
    provider.mock.calls.filter(([, init]) =>
      ['PUT', 'DELETE', 'POST'].includes(init?.method ?? '')
    )
  ).toEqual([]);
});

it.each([
  'remove',
  'ban',
  'leave',
  'exclude',
  'escalate',
  'onboarding',
  'permissionLoss',
  'restore',
] as const)(
  'Server membership %s dispatches the owed provider outcome',
  async operation => {
    const { t, owner, groupId } = await setup();
    const member = await createAuthAccount(t, 'membership-reader');
    await t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: 'account',
        data: {
          userId: member.user._id,
          providerId: 'discord',
          accountId: 'reader',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    });
    await t.run(ctx =>
      ctx.db.insert('groupMemberships', {
        groupId,
        personId: member.personId,
        role: 'MEMBER',
        joinedAt: Date.now(),
      })
    );
    let present = true;
    let banned = false;
    let canRemove = true;
    const fallback = provider.getMockImplementation()!;
    provider.mockImplementation(async (input, init) => {
      const path = String(input);
      if (!canRemove && path.endsWith('/roles'))
        return json([
          { id: '100', permissions: '0', position: 0 },
          { id: 'bot-role', permissions: '128', position: 10 },
        ]);
      if (path.endsWith('/bans/reader')) {
        if (init?.method === 'PUT') {
          banned = true;
          present = false;
          return new Response(null, { status: 204 });
        }
        return banned
          ? json({ user: { id: 'reader' } })
          : json({ code: 10026 }, 404);
      }
      if (path.endsWith('/members/reader')) {
        if (init?.method === 'DELETE') {
          if (operation === 'escalate')
            await owner.auth.mutation(
              api.groupModeration.mutations.banGroupPerson,
              { groupId, personId: member.personId }
            );
          present = false;
          return new Response(null, { status: 204 });
        }
        return present ? json({ roles: [] }) : json({ code: 10007 }, 404);
      }
      return fallback(input, init);
    });
    await owner.auth.action(api.groupDiscord.actions.configure, {
      groupId,
      guildId: '100',
      mode: 'membership',
    });
    await member.auth.action(api.groupDiscord.connect.connect, {
      groupId,
      consent: true,
    });
    if (operation === 'onboarding') {
      await owner.auth.mutation(
        api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
        {
          groupId,
          enabled: true,
          requiredCompletion: true,
          questions: [
            {
              id: 'book',
              label: 'Favorite book',
              type: 'SHORT_ANSWER',
              required: true,
            },
          ],
        }
      );
      await t.finishAllScheduledFunctions(vi.runAllTimers);
    } else if (operation === 'leave')
      await member.auth.mutation(api.groupModeration.mutations.leaveGroup, {
        groupId,
      });
    else if (operation === 'exclude')
      await owner.auth.mutation(api.groups.expulsions.expel, {
        groupId,
        personId: member.personId,
        operationId: crypto.randomUUID(),
      });
    else
      await owner.auth.mutation(
        operation === 'ban'
          ? api.groupModeration.mutations.banGroupPerson
          : api.groupModeration.mutations.removeGroupMember,
        { groupId, personId: member.personId }
      );
    if (operation === 'permissionLoss') canRemove = false;
    await t.action(internal.groupDiscord.reconcile.dispatch, {});
    if (operation === 'permissionLoss') {
      expect(present).toBe(true);
      canRemove = true;
      await vi.advanceTimersByTimeAsync(300000);
      await t.action(internal.groupDiscord.reconcile.dispatch, {});
    }
    if (operation === 'restore') {
      expect(present).toBe(false);
      present = true;
      await vi.advanceTimersByTimeAsync(300000);
      await t.action(internal.groupDiscord.reconcile.dispatch, {});
      await t.action(internal.groupDiscord.reconcile.dispatch, {});
    }
    if (operation === 'escalate') {
      await vi.advanceTimersByTimeAsync(60000);
      await t.action(internal.groupDiscord.reconcile.dispatch, {});
    }
    expect({ present, banned }).toEqual({
      present: false,
      banned:
        operation === 'ban' ||
        operation === 'exclude' ||
        operation === 'escalate',
    });
    expect(
      provider.mock.calls.some(
        ([input, init]) =>
          String(input).includes('/roles/') && init?.method === 'DELETE'
      )
    ).toBe(false);
  }
);

it.each([
  { targetRole: '2000', owner: false, exception: false },
  { targetRole: '500', owner: false, exception: true },
  { targetRole: '2000', owner: true, exception: true },
])(
  'membership Connect reports known owner/hierarchy exceptions with snowflake ties: %j',
  async scenario => {
    const { owner, groupId } = await setup();
    const fallback = provider.getMockImplementation()!;
    provider.mockImplementation(async (input, init) => {
      const path = String(input);
      if (path.endsWith('/bans/manager-discord'))
        return json({ code: 10026 }, 404);
      if (path.endsWith('/members/manager-discord'))
        return json({ roles: [scenario.targetRole] });
      if (path.endsWith('/members/bot')) return json({ roles: ['1000'] });
      if (path.endsWith('/guilds/100/roles'))
        return json([
          { id: '100', permissions: '0', position: 0 },
          { id: '1000', permissions: '135', position: 10 },
          { id: scenario.targetRole, permissions: '0', position: 10 },
        ]);
      if (path.endsWith('/guilds/100'))
        return json({ owner_id: scenario.owner ? 'manager-discord' : 'other' });
      return fallback(input, init);
    });
    await owner.auth.action(api.groupDiscord.actions.configure, {
      groupId,
      guildId: '100',
      mode: 'membership',
    });
    await owner.auth.action(api.groupDiscord.connect.connect, {
      groupId,
      consent: true,
    });
    const status = await owner.auth.query(
      api.groupDiscord.enrollment.getStatus,
      { groupId }
    );
    expect(status?.status).toBe('connected');
    expect(!!status?.externalException).toBe(scenario.exception);
  }
);

it.each([10004, 50001])(
  'membership Connect treats ban lookup code %i as unavailable rather than unknown ban',
  async code => {
    const { owner, groupId } = await setup();
    const fallback = provider.getMockImplementation()!;
    provider.mockImplementation(async (input, init) =>
      String(input).endsWith('/bans/manager-discord')
        ? json({ code }, 404)
        : fallback(input, init)
    );
    await owner.auth.action(api.groupDiscord.actions.configure, {
      groupId,
      guildId: '100',
      mode: 'membership',
    });
    await expect(
      owner.auth.action(api.groupDiscord.connect.connect, {
        groupId,
        consent: true,
      })
    ).rejects.toThrow('ban verification');
    expect(
      provider.mock.calls.some(([, init]) =>
        ['PUT', 'DELETE'].includes(init?.method ?? '')
      )
    ).toBe(false);
  }
);

it('membership join that loses its connection generation retains and compensates the old server target', async () => {
  const { t, owner, groupId } = await setup();
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
    mode: 'membership',
  });
  const fallback = provider.getMockImplementation()!;
  let present = false;
  provider.mockImplementation(async (input, init) => {
    const path = String(input);
    if (path.endsWith('/oauth2/@me'))
      return json({
        application: { id: 'client' },
        scopes: ['identify', 'guilds.join'],
        expires: new Date(Date.now() + 3600000).toISOString(),
      });
    if (
      path.endsWith('/users/@me') &&
      new Headers(init?.headers).get('Authorization')?.startsWith('Bearer')
    )
      return json({ id: 'manager-discord' });
    if (path.endsWith('/bans/manager-discord'))
      return json({ code: 10026 }, 404);
    if (path.endsWith('/members/manager-discord')) {
      if (init?.method === 'PUT') {
        present = true;
        await t.run(async ctx => {
          const connection = await ctx.db
            .query('groupDiscordConnections')
            .withIndex('by_group', q => q.eq('groupId', groupId))
            .unique();
          await ctx.db.patch(connection!._id, { generation: 2 });
        });
        return new Response(null, { status: 204 });
      }
      if (init?.method === 'DELETE') {
        present = false;
        return new Response(null, { status: 204 });
      }
      return present ? json({ roles: [] }) : json({ code: 10007 }, 404);
    }
    return fallback(input, init);
  });
  await expect(
    owner.auth.action(api.groupDiscord.connect.connect, {
      groupId,
      consent: true,
    })
  ).rejects.toThrow('Group access changed');
  expect(present).toBe(false);
  expect(
    await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
  ).toMatchObject({ status: 'blocked' });
});

it('membership managers see moderation observation failures', async () => {
  const { t, owner, groupId } = await setup();
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
    mode: 'membership',
  });
  const fallback = provider.getMockImplementation()!;
  provider.mockImplementation(async (input, init) =>
    String(input).includes('/audit-logs?')
      ? json({ code: 50013 }, 403)
      : fallback(input, init)
  );
  await expect(
    t.action(internal.groupDiscord.reconcile.observeGuild, { guildId: '100' })
  ).rejects.toThrow('View Audit Log');
  expect(
    await owner.auth.query(api.groupDiscord.queries.getConnection, { groupId })
  ).toMatchObject({
    synchronizationError: expect.stringContaining('View Audit Log'),
  });
});

it('membership checks current removal capability before joining a screening-pending account', async () => {
  const { owner, groupId } = await setup();
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
    mode: 'membership',
  });
  const fallback = provider.getMockImplementation()!;
  let joined = false;
  provider.mockImplementation(async (input, init) => {
    const path = String(input);
    if (path.endsWith('/roles'))
      return json([
        { id: '100', permissions: '0', position: 0 },
        { id: 'bot-role', permissions: '128', position: 10 },
      ]);
    if (path.endsWith('/oauth2/@me'))
      return json({
        application: { id: 'client' },
        scopes: ['guilds.join'],
        expires: new Date(Date.now() + 3600000).toISOString(),
      });
    if (
      path.endsWith('/users/@me') &&
      new Headers(init?.headers).get('Authorization')?.startsWith('Bearer')
    )
      return json({ id: 'manager-discord' });
    if (path.endsWith('/bans/manager-discord'))
      return json({ code: 10026 }, 404);
    if (path.endsWith('/members/manager-discord')) {
      if (init?.method === 'PUT') {
        joined = true;
        return new Response(null, { status: 204 });
      }
      return joined
        ? json({ roles: [], pending: true })
        : json({ code: 10007 }, 404);
    }
    return fallback(input, init);
  });
  await expect(
    owner.auth.action(api.groupDiscord.connect.connect, {
      groupId,
      consent: true,
    })
  ).rejects.toThrow('Kick Members');
  expect(joined).toBe(false);
});

it.each([
  { boundary: 'native', mode: 'role' },
  { boundary: 'better-auth', mode: 'role' },
  { boundary: 'native', mode: 'membership' },
  { boundary: 'better-auth', mode: 'membership' },
] as const)(
  'durably retires old managed identity through $boundary unlink in $mode mode',
  async ({ boundary, mode }) => {
    const { t, owner, groupId } = await setup();
    await owner.auth.action(api.groupDiscord.actions.configure, {
      groupId,
      guildId: '100',
      mode,
    });
    const base = provider.getMockImplementation()!;
    let granted = mode === 'membership';
    let present = true;
    let failCleanup = true;
    provider.mockImplementation(async (input, init) => {
      const path = String(input);
      if (path.endsWith('/bans/manager-discord'))
        return json({ code: 10026 }, 404);
      if (init?.method === 'DELETE' && failCleanup)
        return json({ message: 'Missing Permissions' }, 403);
      if (path.endsWith('/members/manager-discord')) {
        if (init?.method === 'DELETE') {
          present = false;
          granted = false;
          return new Response(null, { status: 204 });
        }
        return present
          ? json({ roles: granted ? ['created-role'] : [] })
          : json({ code: 10007 }, 404);
      }
      if (path.endsWith('/members/manager-discord/roles/created-role')) {
        if (init?.method === 'PUT') granted = true;
        if (init?.method === 'DELETE') granted = false;
        return new Response(null, { status: 204 });
      }
      return base(input, init);
    });
    await owner.auth.action(api.groupDiscord.connect.connect, {
      groupId,
      consent: true,
    });
    // Better Auth preserves its last-account safeguard; a second login enables unlink.
    await t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: 'account',
        data: {
          userId: owner.user._id,
          providerId: 'google',
          accountId: 'google-manager',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    });
    if (boundary === 'native') {
      const accounts = await owner.auth.query(
        api.accounts.queries.getLinkedAccounts,
        {}
      );
      await owner.auth.mutation(api.accounts.mutations.unlinkAccount, {
        accountId: accounts.find(a => a.providerId === 'discord')!.id,
      });
    } else {
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(
          'discord-group-test-secret-at-least-32-characters'
        ),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        new TextEncoder().encode(owner.session.token)
      );
      const cookie = `__Secure-better-auth.session_token=${encodeURIComponent(`${owner.session.token}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`)}`;
      const response = await t.fetch('/api/auth/unlink-account', {
        method: 'POST',
        headers: {
          cookie,
          origin: 'https://www.groupi.gg',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ providerId: 'discord' }),
      });
      expect(response.status).toBe(200);
    }
    expect(
      await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
    ).toMatchObject({ linked: false, cleanupPending: true, status: 'blocked' });
    // Provider failures must remain visible after OAuth credentials are gone.
    await t.action(internal.groupDiscord.reconcile.dispatch, {});
    expect(granted).toBe(true);
    expect(
      await owner.auth.query(
        api.accounts.queries.getDiscordRetirementStatus,
        {}
      )
    ).toMatchObject({ pending: true, error: expect.any(String) });
    failCleanup = false;
    vi.setSystemTime(Date.now() + 360000);
    await t.action(internal.groupDiscord.reconcile.dispatch, {});
    expect(granted).toBe(false);
    expect(
      await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
    ).toMatchObject({ cleanupPending: false });
  }
);

async function identityCookie(token: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(
      'discord-group-test-secret-at-least-32-characters'
    ),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(token)
  );
  return `__Secure-better-auth.session_token=${encodeURIComponent(`${token}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`)}`;
}
function identityRequest(cookie: string, body: unknown) {
  return {
    method: 'POST',
    headers: {
      cookie,
      origin: 'https://www.groupi.gg',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  };
}
it('an authenticated provider replacement callback retires the previous enrollment and cannot bypass owed cleanup', async () => {
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
      connectionGeneration: 1,
      generation: 1,
      guildId: '100',
      mode: 'role',
      roleId: 'created-role',
      desired: 'granted',
      status: 'connected',
      startedAt: Date.now(),
      updatedAt: Date.now(),
      attempts: 0,
      nextAttemptAt: Date.now(),
      nextObservationAt: Date.now() + 300000,
    });
  });
  const oldAccount = (
    await owner.auth.query(api.accounts.queries.getLinkedAccounts, {})
  ).find(a => a.accountId === 'manager-discord')!;
  const cookie = await identityCookie(owner.session.token);
  const linked = await t.fetch(
    '/api/auth/link-social',
    identityRequest(cookie, {
      provider: 'discord',
      callbackURL: '/settings/account',
      disableRedirect: true,
    })
  );
  expect(linked.status).toBe(200);
  const destination = new URL((await linked.json()).url);
  const stateCookie = linked.headers
    .getSetCookie()
    .map(c => c.split(';')[0])
    .join('; ');
  provider.mockImplementation(async input => {
    if (String(input) === 'https://discord.com/api/oauth2/token')
      return json({
        access_token: 'replacement-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'identify email guilds',
      });
    if (
      decodeURIComponent(String(input)) === 'https://discord.com/api/users/@me'
    )
      return json({
        id: '987654321000000000',
        username: 'replacement',
        discriminator: '0',
        avatar: null,
        email: owner.user.email,
        verified: true,
      });
    throw new Error(`Unexpected replacement request ${String(input)}`);
  });
  const callback = await t.fetch(
    `/api/auth/callback/discord?code=provider-code&state=${destination.searchParams.get('state')}`,
    { headers: { cookie: `${cookie}; ${stateCookie}` } }
  );
  expect(callback.status).toBe(302);
  expect(callback.headers.get('location')).toBe('/settings/account');
  expect(
    await owner.auth.query(api.accounts.queries.getDiscordRetirementStatus, {})
  ).toMatchObject({ pending: true });
  expect(
    await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
  ).toMatchObject({ cleanupPending: true, status: 'blocked' });
  expect(
    await owner.auth.query(api.accounts.queries.getLinkedAccounts, {})
  ).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ accountId: 'manager-discord' }),
      expect.objectContaining({ accountId: '987654321000000000' }),
    ])
  );
  await expect(
    owner.auth.action(api.groupDiscord.connect.connect, {
      groupId,
      consent: true,
    })
  ).rejects.toThrow(/cleanup is still pending/);
  await owner.auth.mutation(api.accounts.mutations.unlinkAccount, {
    accountId: oldAccount.id,
  });
  await expect(
    owner.auth.mutation(api.accounts.mutations.unlinkAccount, {
      accountId: oldAccount.id,
    })
  ).rejects.toThrow(/not found/);
  // Replayed callbacks cannot acquire new authority or cancel cleanup.
  await t.fetch(
    `/api/auth/callback/discord?code=provider-code&state=${destination.searchParams.get('state')}`,
    { headers: { cookie: `${cookie}; ${stateCookie}` } }
  );
  expect(
    await owner.auth.query(api.accounts.queries.getDiscordRetirementStatus, {})
  ).toMatchObject({ pending: true });
});

it('raw Better Auth deletion routes cannot bypass Group ownership resolution or consume credentials', async () => {
  const { t, owner } = await setup();
  await t.mutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: 'user',
      where: [{ field: '_id', value: owner.user._id }],
      update: { role: 'admin' },
    },
  });
  const cookie = await identityCookie(owner.session.token);
  const removed = await t.fetch(
    '/api/auth/admin/remove-user',
    identityRequest(cookie, { userId: owner.user._id })
  );
  expect(removed.status).toBe(403);
  expect((await removed.json()).message).toMatch(/Groupi account resolution/);
  const selfDelete = await t.fetch(
    '/api/auth/delete-user',
    identityRequest(cookie, {})
  );
  expect(selfDelete.status).toBe(404);
  expect(
    (await owner.auth.query(api.accounts.queries.getLinkedAccounts, {})).some(
      a => a.providerId === 'discord'
    )
  ).toBe(true);
  await expect(
    owner.auth.mutation(api.users.mutations.deleteUserAccount, {
      confirmation: 'discord-manager',
    })
  ).rejects.toThrow(/owned Groups|own/i);
});

it.each(['role', 'membership'] as const)(
  'account deletion keeps %s bot cleanup durable after the Person and OAuth credentials vanish',
  async mode => {
    const { t, owner, groupId } = await setup();
    await owner.auth.action(api.groupDiscord.actions.configure, {
      groupId,
      guildId: '100',
      mode,
    });
    const member = await createAuthAccount(t, 'retiring-member');
    await t.mutation(components.betterAuth.adapter.create, {
      input: {
        model: 'account',
        data: {
          userId: member.user._id,
          providerId: 'discord',
          accountId: 'retiring-discord',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      },
    });
    await t.run(async ctx => {
      await ctx.db.insert('groupMemberships', {
        groupId,
        personId: member.personId,
        role: 'MEMBER',
        joinedAt: Date.now(),
      });
      await ctx.db.insert('groupDiscordEnrollments', {
        groupId,
        personId: member.personId,
        discordUserId: 'retiring-discord',
        connectionGeneration: 1,
        generation: 1,
        guildId: '100',
        mode,
        roleId: mode === 'role' ? 'created-role' : undefined,
        desired: 'granted',
        status: 'connected',
        startedAt: Date.now(),
        updatedAt: Date.now(),
        attempts: 0,
        nextAttemptAt: Date.now(),
        nextObservationAt: Date.now() + 300000,
      });
    });
    const base = provider.getMockImplementation()!;
    let present = true;
    provider.mockImplementation(async (input, init) => {
      const path = String(input);
      if (path.endsWith('/bans/retiring-discord'))
        return json({ code: 10026 }, 404);
      if (
        path.endsWith('/members/retiring-discord') ||
        path.endsWith('/members/retiring-discord/roles/created-role')
      ) {
        expect(new Headers(init?.headers).get('Authorization')).toBe(
          'Bot bot-token'
        );
        if (init?.method === 'DELETE') {
          present = false;
          return new Response(null, { status: 204 });
        }
        return present
          ? json({ roles: mode === 'role' ? ['created-role'] : [] })
          : json({ code: 10007 }, 404);
      }
      return base(input, init);
    });
    expect(
      await member.auth.mutation(api.users.mutations.deleteUserAccount, {
        confirmation: 'retiring-member',
      })
    ).toEqual({ success: true });
    expect(
      await owner.auth.query(api.groupDiscord.queries.getConnection, {
        groupId,
      })
    ).toMatchObject({ cleanupPending: true });
    await t.action(internal.groupDiscord.reconcile.dispatch, {});
    expect(present).toBe(false);
    expect(
      await owner.auth.query(api.groupDiscord.queries.getConnection, {
        groupId,
      })
    ).toMatchObject({ cleanupPending: false });
  }
);

it('racing explicit links retain login accounts but select one managed identity and never fall back after unlink', async () => {
  const { t, owner, groupId } = await setup();
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
  });
  const cookie = await identityCookie(owner.session.token);
  async function flow() {
    const response = await t.fetch(
      '/api/auth/link-social',
      identityRequest(cookie, {
        provider: 'discord',
        callbackURL: '/settings/account',
        disableRedirect: true,
      })
    );
    expect(response.status).toBe(200);
    return {
      state: new URL((await response.json()).url).searchParams.get('state'),
      cookie: response.headers
        .getSetCookie()
        .map(c => c.split(';')[0])
        .join('; '),
    };
  }
  const first = await flow();
  const second = await flow();
  let markFirstStarted!: () => void;
  const firstStarted = new Promise<void>(resolve => {
    markFirstStarted = resolve;
  });
  let releaseFirst!: () => void;
  const firstReleased = new Promise<void>(resolve => {
    releaseFirst = resolve;
  });
  provider.mockImplementation(async (input, init) => {
    if (String(input) === 'https://discord.com/api/oauth2/token') {
      if (new URLSearchParams(String(init?.body)).get('code') === 'first') {
        markFirstStarted();
        await firstReleased;
      }
      return json({
        access_token: String(
          new URLSearchParams(String(init?.body)).get('code')
        ),
        token_type: 'Bearer',
        expires_in: 3600,
      });
    }
    if (
      decodeURIComponent(String(input)) === 'https://discord.com/api/users/@me'
    ) {
      const token = new Headers(init?.headers).get('authorization');
      return json({
        id: token?.includes('first')
          ? '111111111111111111'
          : '222222222222222222',
        username: 'replacement',
        avatar: 'avatar',
        discriminator: '0',
        email: owner.user.email,
        verified: true,
      });
    }
    throw new Error(`Unexpected callback provider request ${String(input)}`);
  });
  // Pause at the real provider boundary so component transactions never overlap
  // in convex-test, while the older callback completes after the newer one.
  const firstCallback = t.fetch(
    `/api/auth/callback/discord?code=first&state=${first.state}`,
    { headers: { cookie: `${cookie}; ${first.cookie}` } }
  );
  await firstStarted;
  const secondCallback = await t.fetch(
    `/api/auth/callback/discord?code=second&state=${second.state}`,
    { headers: { cookie: `${cookie}; ${second.cookie}` } }
  );
  releaseFirst();
  expect((await firstCallback).status).toBe(302);
  expect(secondCallback.status).toBe(302);
  const status = await owner.auth.query(api.groupDiscord.enrollment.getStatus, {
    groupId,
  });
  expect(status?.linkedDiscordUserId).toBe('222222222222222222');
  const accounts = await owner.auth.query(
    api.accounts.queries.getLinkedAccounts,
    {}
  );
  expect(accounts).toHaveLength(3);
  const winner = accounts.find(
    a => a.accountId === status?.linkedDiscordUserId
  )!;
  await owner.auth.mutation(api.accounts.mutations.unlinkAccount, {
    accountId: winner.id,
  });
  expect(
    await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
  ).toMatchObject({ linked: false });
  const relink = await flow();
  const code = winner.accountId === '111111111111111111' ? 'second' : 'first';
  expect(
    (
      await t.fetch(
        `/api/auth/callback/discord?code=${code}&state=${relink.state}`,
        { headers: { cookie: `${cookie}; ${relink.cookie}` } }
      )
    ).status
  ).toBe(302);
  expect(
    await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
  ).toMatchObject({
    linked: true,
    linkedDiscordUserId:
      code === 'first' ? '111111111111111111' : '222222222222222222',
  });
});

it('an unlink racing a successful role write fences the stale grant and durably compensates with bot credentials', async () => {
  const { t, owner, groupId } = await setup();
  await owner.auth.action(api.groupDiscord.actions.configure, {
    groupId,
    guildId: '100',
  });
  const account = (
    await owner.auth.query(api.accounts.queries.getLinkedAccounts, {})
  )[0];
  const base = provider.getMockImplementation()!;
  let granted = false;
  let failCleanup = true;
  provider.mockImplementation(async (input, init) => {
    const path = String(input);
    if (path.endsWith('/bans/manager-discord'))
      return json({ code: 10026 }, 404);
    if (path.endsWith('/members/manager-discord'))
      return json({ roles: granted ? ['created-role'] : [] });
    if (path.endsWith('/members/manager-discord/roles/created-role')) {
      expect(new Headers(init?.headers).get('Authorization')).toBe(
        'Bot bot-token'
      );
      if (init?.method === 'PUT') {
        granted = true;
        await owner.auth.mutation(api.accounts.mutations.unlinkAccount, {
          accountId: account.id,
        });
      }
      if (init?.method === 'DELETE') {
        if (failCleanup) return json({}, 403);
        granted = false;
      }
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
  ).toMatchObject({ linked: false, status: 'blocked', cleanupPending: true });
  expect(granted).toBe(true);
  failCleanup = false;
  vi.setSystemTime(Date.now() + 360000);
  await t.action(internal.groupDiscord.reconcile.dispatch, {});
  expect(granted).toBe(false);
  expect(
    await owner.auth.query(api.groupDiscord.enrollment.getStatus, { groupId })
  ).toMatchObject({ cleanupPending: false, status: 'blocked' });
});

it('unlink safeguards reject another account and the last login before creating retirement', async () => {
  const { t, owner } = await setup();
  const account = (
    await owner.auth.query(api.accounts.queries.getLinkedAccounts, {})
  )[0];
  const outsider = await createAuthAccount(t, 'identity-outsider');
  await expect(
    outsider.auth.mutation(api.accounts.mutations.unlinkAccount, {
      accountId: account.id,
    })
  ).rejects.toThrow(/does not belong/);
  const cookie = await identityCookie(owner.session.token);
  expect(
    (
      await t.fetch(
        '/api/auth/unlink-account',
        identityRequest(cookie, { providerId: 'discord' })
      )
    ).status
  ).toBe(400);
  await t.mutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: 'user',
      where: [{ field: '_id', value: owner.user._id }],
      update: { emailVerified: false },
    },
  });
  await expect(
    owner.auth.mutation(api.accounts.mutations.unlinkAccount, {
      accountId: account.id,
    })
  ).rejects.toThrow(/last authentication method/);
  expect(
    await owner.auth.query(api.accounts.queries.getDiscordRetirementStatus, {})
  ).toMatchObject({ pending: false });
  expect(
    await owner.auth.query(api.accounts.queries.getLinkedAccounts, {})
  ).toHaveLength(1);
});
