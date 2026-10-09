import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ mutation: vi.fn() }));
vi.mock('convex/browser', () => ({
  ConvexHttpClient: class {
    mutation = mocks.mutation;
  },
}));
import { ConvexSeeder } from '../e2e/helpers/convex-seeder';
beforeEach(() => {
  mocks.mutation.mockReset();
  vi.stubEnv('CONVEX_URL', 'https://fixture.convex.cloud');
  vi.stubEnv('E2E_FIXTURE_KEY', 'test-only-fixture-key-at-least-32-characters');
});
afterEach(() => vi.unstubAllEnvs());
it('cleans verification-only authentication fixtures', async () => {
  mocks.mutation
    .mockResolvedValueOnce({ token: 'test-token', url: '/test-link' })
    .mockResolvedValueOnce(undefined);
  const seeder = new ConvexSeeder();
  await seeder.createMagicLinkToken('fixture@example.invalid');
  await seeder.cleanup();
  expect(mocks.mutation).toHaveBeenLastCalledWith(
    'e2e/mutations:cleanupTestData',
    expect.objectContaining({ verificationIdentifiers: ['test-token'] })
  );
});
it('cleanup failures fail verification and retain IDs for a retry', async () => {
  mocks.mutation
    .mockResolvedValueOnce({ token: 'test-token' })
    .mockRejectedValueOnce(new Error('unavailable'))
    .mockResolvedValueOnce(undefined);
  const seeder = new ConvexSeeder();
  await seeder.createMagicLinkToken('fixture@example.invalid');
  await expect(seeder.cleanup()).rejects.toThrow(
    'Failed to clean up E2E fixture data'
  );
  await seeder.cleanup();
  expect(mocks.mutation).toHaveBeenLastCalledWith(
    'e2e/mutations:cleanupTestData',
    expect.objectContaining({ verificationIdentifiers: ['test-token'] })
  );
});
