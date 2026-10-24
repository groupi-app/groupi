import { afterEach, expect, it, vi } from 'vitest';
import { createAuthAccount } from './auth.helpers';
import { api } from '../_generated/api';
import {
  setup,
  authorize,
  token,
  exchange,
} from './delegated-protocol.helpers';
afterEach(() => vi.unstubAllEnvs());
it('exposes only consented own selected Group Discord status through authenticated REST', async () => {
  const f = await setup();
  const groupId = await f.owner.auth.mutation(
    api.groups.mutations.createGroup,
    { name: 'Community' }
  );
  const result = await authorize(f, {
    scopes: 'openid groups.discord.read',
    actions: ['groups.discord.read'],
    selector: { kind: 'selected-group', groupId },
    background: false,
  });
  const tokens = await (
    await token(f.t, exchange(f.appId, result.code))
  ).json();
  const read = (id: string) =>
    f.t.fetch(`/api/v2/groups/${id}/discord`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
  expect((await read(groupId)).status).toBe(200);
  expect(await (await read(groupId)).json()).toBeNull();
  expect((await read('unrelated')).status).toBe(403);
});
it('binds hosted consent to member, application, selected Group and current connection generation', async () => {
  const f = await setup();
  const groupId = await f.owner.auth.mutation(
    api.groups.mutations.createGroup,
    { name: 'Community' }
  );
  const connectionId = await f.t.run(ctx =>
    ctx.db.insert('groupDiscordConnections', {
      groupId,
      guildId: '123',
      guildName: 'Community Discord',
      mode: 'role',
      roleId: '456',
      generation: 1,
      status: 'active',
      updatedAt: Date.now(),
    })
  );
  const result = await authorize(f, {
    scopes: 'openid groups.discord.connect',
    actions: ['groups.discord.connect'],
    selector: { kind: 'selected-group', groupId },
    background: false,
  });
  const tokens = await (
    await token(f.t, exchange(f.appId, result.code))
  ).json();
  const initiate = (returnUrl: string) =>
    f.t.fetch(`/api/v2/groups/${groupId}/discord/connect`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ returnUrl }),
    });
  expect((await initiate('https://evil.example/callback')).status).toBe(403);
  const response = await initiate('https://app.example/callback');
  expect(response.status).toBe(200);
  const journey = await response.json();
  expect(journey.url).toMatch(/^https:\/\/ui.example\/oauth\/discord\?state=/);
  const state = new URL(journey.url).searchParams.get('state')!;
  const stranger = await createAuthAccount(f.t, 'discord-stranger');
  expect(
    await stranger.auth.query(api.groupDiscord.delegated.inspect, { state })
  ).toBeNull();
  await expect(
    stranger.auth.action(api.groupDiscord.connect.connectHosted, {
      state,
      consent: true,
    })
  ).rejects.toThrow();
  const view = await f.owner.auth.query(api.groupDiscord.delegated.inspect, {
    state,
  });
  expect(view).toMatchObject({
    groupId,
    generation: 1,
    status: { mode: 'role', linked: false },
  });
  expect(JSON.stringify(view)).not.toMatch(
    /token|credential|stateHash|secret/i
  );
  await f.t.run(ctx => ctx.db.patch(connectionId, { generation: 2 }));
  await expect(
    f.owner.auth.action(api.groupDiscord.connect.connectHosted, {
      state,
      consent: true,
    })
  ).rejects.toThrow();
  await expect(
    f.owner.auth.action(api.groupDiscord.connect.connect, {
      groupId,
      consent: true,
      expectedGeneration: 1,
    })
  ).rejects.toThrow(/configuration changed/);
  await expect(
    f.owner.auth.mutation(api.groupDiscord.delegated.finish, {
      state,
      consent: true,
    })
  ).rejects.toThrow(/configuration changed/);
});
it('expires hosted requests, prevents replay and never grants connect from an older read-only approval', async () => {
  const f = await setup();
  const groupId = await f.owner.auth.mutation(
    api.groups.mutations.createGroup,
    { name: 'Community' }
  );
  await f.t.run(ctx =>
    ctx.db.insert('groupDiscordConnections', {
      groupId,
      guildId: '123',
      guildName: 'Community Discord',
      mode: 'membership',
      generation: 1,
      status: 'active',
      updatedAt: Date.now(),
    })
  );
  async function credential(
    actions: ('groups.discord.read' | 'groups.discord.connect')[]
  ) {
    const result = await authorize(f, {
      scopes: `openid ${actions.join(' ')}`,
      actions,
      selector: { kind: 'selected-group', groupId },
      background: false,
    });
    return (await (await token(f.t, exchange(f.appId, result.code))).json())
      .access_token;
  }
  const readToken = await credential(['groups.discord.read']);
  const request = (access: string) =>
    f.t.fetch(`/api/v2/groups/${groupId}/discord/connect`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ returnUrl: 'https://app.example/callback' }),
    });
  expect((await request(readToken)).status).toBe(403);
  const access = await credential(['groups.discord.connect']);
  const start = async () =>
    new URL((await (await request(access)).json()).url).searchParams.get(
      'state'
    )!;
  const state = await start();
  expect(
    await f.owner.auth.query(api.groupDiscord.delegated.inspect, { state })
  ).toMatchObject({ status: { mode: 'membership' } });
  expect(
    await f.owner.auth.mutation(api.groupDiscord.delegated.finish, {
      state,
      consent: true,
    })
  ).toEqual({ returnUrl: 'https://app.example/callback' });
  await expect(
    f.owner.auth.mutation(api.groupDiscord.delegated.finish, {
      state,
      consent: true,
    })
  ).rejects.toThrow();
  const expiring = await start();
  vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 11 * 60 * 1000);
  expect(
    await f.owner.auth.query(api.groupDiscord.delegated.inspect, {
      state: expiring,
    })
  ).toBeNull();
  await expect(
    f.owner.auth.mutation(api.groupDiscord.delegated.finish, {
      state: expiring,
      consent: true,
    })
  ).rejects.toThrow();
  vi.restoreAllMocks();
});
it('keeps onboarding failures visible in the hosted journey and allows a safe return without granting', async () => {
  const f = await setup();
  const groupId = await f.owner.auth.mutation(
    api.groups.mutations.createGroup,
    { name: 'Community' }
  );
  await f.t.run(ctx =>
    ctx.db.insert('groupDiscordConnections', {
      groupId,
      guildId: '123',
      guildName: 'Community Discord',
      mode: 'role',
      roleId: '456',
      generation: 1,
      status: 'active',
      updatedAt: Date.now(),
    })
  );
  const result = await authorize(f, {
    scopes: 'openid groups.discord.connect',
    actions: ['groups.discord.connect'],
    selector: { kind: 'selected-group', groupId },
    background: false,
  });
  const tokens = await (
    await token(f.t, exchange(f.appId, result.code))
  ).json();
  const response = await f.t.fetch(
    `/api/v2/groups/${groupId}/discord/connect`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ returnUrl: 'https://app.example/callback' }),
    }
  );
  const state = new URL((await response.json()).url).searchParams.get('state')!;
  // A required form introduced after initiation must not erase status or imply access.
  await f.owner.auth.mutation(
    api.groupQuestionnaires.mutations.configureJoiningQuestionnaire,
    {
      groupId,
      enabled: true,
      requiredCompletion: true,
      questions: [
        {
          id: 'welcome',
          label: 'Welcome',
          type: 'LONG_ANSWER',
          required: true,
        },
      ],
    }
  );
  expect(
    await f.owner.auth.query(api.groupDiscord.delegated.inspect, { state })
  ).toMatchObject({ status: { eligible: false } });
  await expect(
    f.owner.auth.action(api.groupDiscord.connect.connectHosted, {
      state,
      consent: true,
    })
  ).rejects.toThrow();
  expect(
    await f.owner.auth.mutation(api.groupDiscord.delegated.finish, {
      state,
      consent: true,
    })
  ).toEqual({ returnUrl: 'https://app.example/callback' });
});
it('keeps registered hosted appearance and stops the journey when the app connection is revoked', async () => {
  const f = await setup();
  const groupId = await f.owner.auth.mutation(
    api.groups.mutations.createGroup,
    { name: 'Community' }
  );
  await f.t.run(async ctx => {
    await ctx.db.insert('groupDiscordConnections', {
      groupId,
      guildId: '123',
      guildName: 'Community Discord',
      mode: 'role',
      roleId: '456',
      generation: 1,
      status: 'active',
      updatedAt: Date.now(),
    });
    await ctx.db.patch(f.appId, {
      appearance: {
        brandName: 'Registered community',
        senderName: 'Registered community',
        accent: '#991b1b',
      },
    });
  });
  const result = await authorize(f, {
    scopes: 'openid groups.discord.connect',
    actions: ['groups.discord.connect'],
    selector: { kind: 'selected-group', groupId },
    background: false,
  });
  const tokens = await (
    await token(f.t, exchange(f.appId, result.code))
  ).json();
  const response = await f.t.fetch(
    `/api/v2/groups/${groupId}/discord/connect`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ returnUrl: 'https://app.example/callback' }),
    }
  );
  const state = new URL((await response.json()).url).searchParams.get('state')!;
  expect(
    await f.owner.auth.query(api.delegatedApps.hosted.getAppearance, {
      interactionId: state,
    })
  ).toMatchObject({
    appName: 'Calendar',
    providerName: 'Groupi',
    appearance: { brandName: 'Registered community' },
  });
  const connections = await f.owner.auth.query(
    api.delegatedApps.queries.listConnections,
    { now: Date.now() }
  );
  await f.owner.auth.mutation(api.delegatedApps.mutations.disconnect, {
    grantId: connections[0].grantId,
  });
  expect(
    await f.owner.auth.query(api.groupDiscord.delegated.inspect, { state })
  ).toBeNull();
  await expect(
    f.owner.auth.action(api.groupDiscord.connect.connectHosted, {
      state,
      consent: true,
    })
  ).rejects.toThrow();
  await expect(
    f.owner.auth.mutation(api.groupDiscord.delegated.finish, {
      state,
      consent: true,
    })
  ).rejects.toThrow();
});
