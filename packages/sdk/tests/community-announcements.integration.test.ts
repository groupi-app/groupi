import { afterEach, expect, it, vi } from 'vitest';
import { applicant } from '../../../convex/tests/community-applications.helpers';
import { Groupi } from '../src/index.js';
import { CommunityContextSchema } from '../../../convex/api/v2/schemas/community';
import {
  communityFixtures,
  communityOperations,
} from '../src/community-contract.js';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it('uses the generated SDK preference operation against authenticated HTTP with lost-response replay', async () => {
  const f = await applicant([
    'groups.context.read',
    'groups.announcements.preferences.update',
  ]);
  await f.t.run(async ctx => {
    await ctx.db.insert('groupMemberships', {
      groupId: f.groupId,
      personId: f.owner.personId,
      role: 'MEMBER',
      joinedAt: Date.now(),
    });
  });
  let lose = true;
  vi.stubGlobal(
    'fetch',
    async (url: string | URL | Request, init?: RequestInit) => {
      const target = new URL(
        typeof url === 'string' ? url : url instanceof URL ? url.href : url.url
      );
      const response = await f.t.fetch(target.pathname + target.search, init);
      if (lose && init?.method === 'PUT' && response.ok) {
        lose = false;
        throw new Error('Lost committed response');
      }
      return response;
    }
  );
  const client = new Groupi({
    instance: 'https://some.convex.site',
    credential: {
      type: 'delegated',
      audience: 'https://some.convex.site/api/v2',
      getToken: async () => ({
        accessToken: f.accessToken,
        instance: 'https://some.convex.site',
        audience: 'https://some.convex.site/api/v2',
      }),
    },
    retries: 0,
  });
  const input = { path: { groupId: f.groupId }, body: { subscribed: true } };
  const options = { idempotencyKey: crypto.randomUUID() };
  expect(
    (await client.readOwnCommunityContext({ path: input.path }))
      .announcementPreference
  ).toEqual({ supported: true, subscribed: false });
  await expect(
    client.setCommunityAnnouncementPreference(input, options)
  ).rejects.toMatchObject({ code: 'TRANSPORT_ERROR', uncertain: true });
  const receipt = await client.setCommunityAnnouncementPreference(
    input,
    options
  );
  expect(receipt.result).toEqual({ subscribed: true });
  expect(
    await client.setCommunityAnnouncementPreference(input, options)
  ).toEqual(receipt);
  await expect(
    client.setCommunityAnnouncementPreference(
      { ...input, body: { subscribed: false } },
      options
    )
  ).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT', status: 409 });
  expect(communityOperations.preference.status).toBe('implemented');
  for (const fixture of [
    communityFixtures.subscribed,
    communityFixtures.unsubscribed,
  ])
    expect(CommunityContextSchema.safeParse(fixture.context).success).toBe(
      true
    );
});
