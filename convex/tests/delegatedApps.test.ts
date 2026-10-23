import { expect, test } from 'vitest';
import { api, components } from '../_generated/api';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance, createTestUser } from './test_helpers';
const register = api.delegatedApps.mutations.registerApp;
const list = api.delegatedApps.queries.listOwnedApps;

test('registration keeps testing apps private to their owner and rejects wildcard callbacks', async () => {
  const t = createTestInstance();
  const owner = await createTestUser(t);
  const stranger = await createTestUser(t);
  const authenticated = t.withIdentity({ subject: owner.userId });
  await expect(
    authenticated.mutation(register, {
      name: 'Calendar',
      purpose: 'Display my events',
      clientType: 'native',
      redirectUris: ['https://*.example.com/callback'],
    })
  ).rejects.toThrow('callback');
  const appId = await authenticated.mutation(register, {
    name: 'Calendar',
    purpose: 'Display my events',
    clientType: 'native',
    redirectUris: ['https://app.example.com/callback'],
  });
  expect(await authenticated.query(list, {})).toMatchObject([
    { _id: appId, status: 'testing', reviewStatus: 'not-requested' },
  ]);
  expect(
    await t.withIdentity({ subject: stranger.userId }).query(list, {})
  ).toEqual([]);
  await expect(
    t.mutation(register, {
      name: 'Calendar',
      purpose: 'Display my events',
      clientType: 'native',
      redirectUris: ['https://app.example.com/callback'],
    })
  ).rejects.toThrow('Authentication required');
});

test('only platform administrators can review apps, and rejected wider access preserves owner-only testing', async () => {
  const t = createTestInstance();
  registerBetterAuth(t);
  const owner = await createAuthAccount(t, 'app-review-owner');
  const operator = await createAuthAccount(t, 'app-review-operator');
  const appId = await owner.auth.mutation(
    api.delegatedApps.mutations.registerApp,
    {
      name: 'Calendar',
      purpose: 'Read chosen events',
      clientType: 'native',
      redirectUris: ['com.example.calendar:/callback'],
    }
  );
  await owner.auth.mutation(api.delegatedApps.mutations.requestReview, {
    appId,
  });
  expect(
    await owner.auth.query(api.delegatedApps.queries.listReviewableApps, {})
  ).toEqual([]);
  await expect(
    owner.auth.mutation(api.delegatedApps.mutations.reviewApp, {
      appId,
      status: 'approved',
    })
  ).rejects.toThrow('Platform administrator required');
  await t.mutation(components.betterAuth.adapter.updateOne, {
    input: {
      model: 'user',
      where: [{ field: '_id', operator: 'eq', value: operator.user._id }],
      update: { role: 'admin' },
    },
  });
  const pending = await operator.auth.query(
    api.delegatedApps.queries.listReviewableApps,
    {}
  );
  expect(pending).toMatchObject([
    {
      _id: appId,
      ownerDisplayName: 'app-review-owner',
      reviewStatus: 'pending',
      status: 'testing',
    },
  ]);
  expect(pending[0]).not.toHaveProperty('publicJwks');
  await operator.auth.mutation(api.delegatedApps.mutations.reviewApp, {
    appId,
    status: 'rejected',
  });
  expect(
    await owner.auth.query(api.delegatedApps.queries.listOwnedApps, {})
  ).toMatchObject([{ status: 'testing', reviewStatus: 'rejected' }]);
  await owner.auth.mutation(api.delegatedApps.mutations.requestReview, {
    appId,
  });
  await operator.auth.mutation(api.delegatedApps.mutations.reviewApp, {
    appId,
    status: 'approved',
  });
  expect(
    await owner.auth.query(api.delegatedApps.queries.listOwnedApps, {})
  ).toMatchObject([{ status: 'approved', reviewStatus: 'reviewed' }]);
  await operator.auth.mutation(api.delegatedApps.mutations.reviewApp, {
    appId,
    status: 'suspended',
  });
  expect(
    await owner.auth.query(api.delegatedApps.queries.listOwnedApps, {})
  ).toMatchObject([{ status: 'suspended' }]);
});
