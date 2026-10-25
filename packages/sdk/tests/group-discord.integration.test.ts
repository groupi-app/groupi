import { afterEach, expect, it, vi } from 'vitest';
import { api } from '../../../convex/_generated/api';
import {
  setup,
  authorize,
  token,
  exchange,
} from '../../../convex/tests/delegated-protocol.helpers';
import { Groupi, DelegatedSession, delegatedActions } from '../src/index.js';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it('uses generated Discord methods and explicitly consented actions against authenticated HTTP', async () => {
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
  const result = await authorize(f, {
    scopes: 'openid groups.discord.read groups.discord.connect',
    actions: ['groups.discord.read', 'groups.discord.connect'],
    selector: { kind: 'selected-group', groupId },
    background: false,
  });
  const access = (
    await (await token(f.t, exchange(f.appId, result.code))).json()
  ).access_token;
  vi.stubGlobal(
    'fetch',
    async (url: string | URL | Request, init?: RequestInit) => {
      const target = new URL(
        typeof url === 'string' ? url : url instanceof URL ? url.href : url.url
      );
      return f.t.fetch(target.pathname + target.search, init);
    }
  );
  const client = new Groupi({
    instance: 'https://some.convex.site',
    credential: {
      type: 'delegated',
      audience: 'https://some.convex.site/api/v2',
      getToken: async () => ({
        accessToken: access,
        instance: 'https://some.convex.site',
        audience: 'https://some.convex.site/api/v2',
      }),
    },
    retries: 0,
  });
  expect(delegatedActions).toContain('groups.discord.connect');
  const status = await client.readOwnGroupDiscordStatus({ path: { groupId } });
  expect(status).toMatchObject({
    mode: 'membership',
    openUrl: 'https://discord.com/channels/123',
    status: 'not_connected',
  });
  expect(
    await client.beginOwnGroupDiscordConnect({
      path: { groupId },
      body: { returnUrl: 'https://app.example/callback' },
    })
  ).toMatchObject({
    url: expect.stringMatching(/^https:\/\/ui.example\/oauth\/discord\?state=/),
    expiresAt: expect.any(Number),
  });
  await expect(
    client.readOwnGroupDiscordStatus({ path: { groupId: 'another' } })
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    client.beginOwnGroupDiscordConnect({
      path: { groupId },
      body: { returnUrl: 'https://unapproved.example/callback' },
    })
  ).rejects.toMatchObject({ status: 403 });
  await expect(
    client.explicitlyDeleteAGroupAsOwner({ path: { groupId } })
  ).rejects.toMatchObject({ status: 403 });
  const oauth = await DelegatedSession.authorizationRequest(
    {
      instance: 'https://some.convex.site',
      issuer: 'https://some.convex.site/oauth',
      audience: 'https://some.convex.site/api/v2',
      clientId: f.appId,
      clientType: 'native',
      actions: ['groups.discord.read', 'groups.discord.connect'],
    },
    { redirectUri: 'https://app.example/callback', selectedGroupId: groupId }
  );
  expect(new URL(oauth.url).searchParams.get('scope')).toContain(
    'groups.discord.connect'
  );
});
