import { afterEach, expect, it, vi } from 'vitest';
import { applicant } from '../../../convex/tests/community-applications.helpers';
import { Groupi } from '../src/index.js';
import { CommunityApplicationReceiptSchema } from '../../../convex/api/v2/schemas/community';
import { communityFixtures } from '../src/community-contract.js';
afterEach(() => vi.unstubAllEnvs());
it('uses the generated delegated SDK to submit, replay, edit and withdraw against authenticated HTTP', async () => {
  const f = await applicant();
  const originalFetch = globalThis.fetch;
  let loseCommittedResponse = true;
  vi.stubGlobal(
    'fetch',
    async (url: string | URL | Request, init?: RequestInit) => {
      const target = new URL(
        typeof url === 'string' ? url : url instanceof URL ? url.href : url.url
      );
      const response = await f.t.fetch(target.pathname + target.search, init);
      if (
        loseCommittedResponse &&
        init?.method === 'POST' &&
        target.pathname.endsWith('/community-applications') &&
        response.ok
      ) {
        loseCommittedResponse = false;
        throw new Error('Response lost after authoritative commit');
      }
      return response;
    }
  );
  try {
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
    const context = await client.readOwnCommunityContext({
      path: { groupId: f.groupId },
    });
    const input = {
      path: { groupId: f.groupId },
      body: {
        formRevision: context.form.revision,
        answers: { welcome: 'SDK applicant' },
      },
    };
    const options = { idempotencyKey: crypto.randomUUID() };
    await expect(
      client.submitCommunityApplication(input, options)
    ).rejects.toMatchObject({ code: 'TRANSPORT_ERROR', uncertain: true });
    const receipt = await client.submitCommunityApplication(input, options);
    expect(CommunityApplicationReceiptSchema.safeParse(receipt).success).toBe(
      true
    );
    expect(
      CommunityApplicationReceiptSchema.safeParse(
        communityFixtures.lostResponseRecovery.mutation
      ).success
    ).toBe(true);
    expect(await client.submitCommunityApplication(input, options)).toEqual(
      receipt
    );
    await expect(
      client.submitCommunityApplication(
        {
          ...input,
          body: { ...input.body, answers: { welcome: 'Different' } },
        },
        options
      )
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT', status: 409 });
    const path = {
      groupId: f.groupId,
      applicationId: receipt.result.applicationId,
    };
    const edited = await client.editCommunityApplication(
      {
        path,
        body: {
          expectedRevision: receipt.result.revision,
          answers: { welcome: 'Edited via SDK' },
        },
      },
      { idempotencyKey: crypto.randomUUID() }
    );
    const withdrawn = await client.withdrawCommunityApplication(
      { path, body: { expectedRevision: edited.result.revision } },
      { idempotencyKey: crypto.randomUUID() }
    );
    expect(withdrawn.result.status).toBe('WITHDRAWN');
    expect(
      (await client.readOwnCommunityContext({ path: { groupId: f.groupId } }))
        .applications[0].answers
    ).toEqual({ welcome: 'Edited via SDK' });
    expect(
      (await client.readOwnCommunityContext({ path: { groupId: f.groupId } }))
        .applications
    ).toHaveLength(1);
  } finally {
    globalThis.fetch = originalFetch;
    vi.unstubAllGlobals();
  }
});
