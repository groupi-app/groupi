import { expect, test } from 'vitest';
import { makeFunctionReference } from 'convex/server';
import { createTestInstance, createTestUser } from './test_helpers';
const register = makeFunctionReference<'mutation'>(
  'delegatedApps/mutations:registerApp'
);
const list = makeFunctionReference<'query'>(
  'delegatedApps/queries:listOwnedApps'
);

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
