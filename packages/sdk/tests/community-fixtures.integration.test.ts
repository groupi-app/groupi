import { expect, it } from 'vitest';
import { CommunityContextSchema } from '../../../convex/api/v2/schemas/community';
import {
  communityFixtures,
  communityOperations,
} from '../src/community-contract.js';
import type { CommunityContext } from '../src/community-contract.js';
import { handleBoundedRequest, boundedCors } from '../../../convex/api/bounded';
import type { ActionCtx } from '../../../convex/_generated/server';
import type { Id } from '../../../convex/_generated/dataModel';

it('ships implemented read fixtures accepted by the public response contract without pretending proposed operations are live', () => {
  for (const fixture of Object.values(communityFixtures)) {
    if (fixture.status === 'implemented' && fixture.context) {
      const context: CommunityContext = fixture.context;
      expect(CommunityContextSchema.safeParse(context).success).toBe(true);
    }
  }
  expect(communityOperations.context.status).toBe('implemented');
  expect(communityOperations.submitApplication.status).toBe('proposed');
  expect(
    communityFixtures.historicalApprovalWithoutMembership.context?.membership
  ).toBeNull();
  expect(communityFixtures.joinedPending.event).toMatchObject({
    participation: { rsvp: 'PENDING' },
  });
});

it('returns retryable unavailable service without fabricating business absence or publicly caching the result', async () => {
  // The Convex gateway is the system boundary; no domain collaborator is mocked.
  const gateway = {
    runQuery: async () => {
      throw new Error('Convex service unavailable');
    },
  } as unknown as ActionCtx;
  const response = await boundedCors(
    await handleBoundedRequest(
      gateway,
      new Request(
        'https://synthetic.example/api/v2/groups/synthetic/community-context'
      ),
      'synthetic-credential' as Id<'authorizationCredentials'>
    )
  );
  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({
    error: { code: 'UNAVAILABLE', message: 'Community service unavailable.' },
  });
  expect(response.headers.get('cache-control')).toContain('no-store');
});
