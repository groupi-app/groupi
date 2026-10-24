import { afterEach, expect, it, vi } from 'vitest';
import { api, internal } from '../../../convex/_generated/api';
import { setupDiscordAcceptance } from '../../../convex/tests/discord-acceptance.helpers';
import {
  authorize,
  token,
  exchange,
} from '../../../convex/tests/delegated-protocol.helpers';
import { Groupi } from '../src/index.js';

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it.each(['role', 'membership'] as const)(
  'native, delegated REST/SDK and hosted status agree through %s identity retirement, denied cleanup and recovery',
  async mode => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const f = await setupDiscordAcceptance(mode);
    async function mintAccess() {
      const approval = await authorize(f, {
        scopes: 'openid groups.discord.read groups.discord.connect',
        actions: ['groups.discord.read', 'groups.discord.connect'],
        selector: { kind: 'selected-group', groupId: f.groupId },
        background: false,
      });
      return (await (await token(f.t, exchange(f.appId, approval.code))).json())
        .access_token as string;
    }
    let access = await mintAccess();
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
    const nativeStatus = () =>
      f.owner.auth.query(api.groupDiscord.enrollment.getStatus, {
        groupId: f.groupId,
      });
    const sdkStatus = () =>
      client.readOwnGroupDiscordStatus({ path: { groupId: f.groupId } });
    const restStatus = async () => {
      const response = await f.t.fetch(`/api/v2/groups/${f.groupId}/discord`, {
        headers: { Authorization: `Bearer ${access}` },
      });
      expect(response.status).toBe(200);
      return response.json();
    };
    await f.owner.auth.action(api.groupDiscord.connect.connect, {
      groupId: f.groupId,
      consent: true,
    });
    expect(await sdkStatus()).toMatchObject({
      mode,
      status: 'connected',
      linkedDiscordUserId: 'old-discord',
      cleanupPending: false,
    });
    const journey = await client.beginOwnGroupDiscordConnect({
      path: { groupId: f.groupId },
      body: { returnUrl: 'https://app.example/callback' },
    });
    let state = new URL(journey.url).searchParams.get('state')!;
    const hostedStatus = async () =>
      (await f.owner.auth.query(api.groupDiscord.delegated.inspect, { state }))
        ?.status;
    expect(await hostedStatus()).toEqual(await nativeStatus());

    const oldAccount = (
      await f.owner.auth.query(api.accounts.queries.getLinkedAccounts, {})
    ).find(a => a.accountId === 'old-discord')!;
    await f.owner.auth.mutation(api.accounts.mutations.unlinkAccount, {
      accountId: oldAccount.id,
    });
    await f.linkFixtureIdentity('new-discord');
    f.faults.denyRemoval = true;
    await f.t.action(internal.groupDiscord.reconcile.dispatch, {});
    const pending = await nativeStatus();
    expect(pending).toMatchObject({
      mode,
      status: 'blocked',
      linkedDiscordUserId: 'new-discord',
      cleanupPending: true,
      error: expect.any(String),
    });
    expect(await restStatus()).toEqual(pending);
    expect(await sdkStatus()).toEqual(pending);
    expect(await hostedStatus()).toEqual(pending);
    await expect(
      f.owner.auth.action(api.groupDiscord.connect.connectHosted, {
        state,
        consent: true,
      })
    ).rejects.toThrow(/cleanup/);
    expect(
      f.members
        .get('old-discord')
        ?.has(mode === 'role' ? 'managed-role' : 'unrelated-role')
    ).toBe(true);
    expect(
      f.effects.some(
        e => e.method === 'PUT' && e.path.includes('/members/new-discord')
      )
    ).toBe(false);

    f.faults.denyRemoval = false;
    vi.setSystemTime(Date.now() + 301000);
    await f.t.action(internal.groupDiscord.reconcile.dispatch, {});
    // The existing short-lived delegated authority expires during the cleanup retry.
    // A fresh request, rather than reusing an expired hosted consent, is required.
    await expect(sdkStatus()).rejects.toMatchObject({ status: 401 });
    expect(await hostedStatus()).toBeUndefined();
    access = await mintAccess();
    const resumed = await client.beginOwnGroupDiscordConnect({
      path: { groupId: f.groupId },
      body: { returnUrl: 'https://app.example/callback' },
    });
    state = new URL(resumed.url).searchParams.get('state')!;
    expect(await sdkStatus()).toMatchObject({ cleanupPending: false });
    if (mode === 'role')
      expect(f.members.get('old-discord')).toEqual(new Set(['unrelated-role']));
    else expect(f.members.has('old-discord')).toBe(false);
    await f.owner.auth.action(api.groupDiscord.connect.connectHosted, {
      state,
      consent: true,
    });
    const connected = await nativeStatus();
    expect(connected).toMatchObject({
      status: 'connected',
      linkedDiscordUserId: 'new-discord',
      cleanupPending: false,
    });
    expect(await restStatus()).toEqual(connected);
    expect(await sdkStatus()).toEqual(connected);
    expect(await hostedStatus()).toEqual(connected);
    expect(JSON.stringify(connected)).not.toMatch(
      /fixture-member-token|acceptance-bot|credential|stateHash/
    );
    expect(
      await f.owner.auth.mutation(api.groupDiscord.delegated.finish, {
        state,
        consent: true,
      })
    ).toEqual({ returnUrl: 'https://app.example/callback' });
    expect(
      await f.owner.auth.query(api.groupDiscord.delegated.inspect, { state })
    ).toBeNull();
  }
);
