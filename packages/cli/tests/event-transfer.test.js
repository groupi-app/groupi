import { afterEach, describe, expect, it, vi } from 'vitest';
import { eventTransfer } from '../src/event-transfer.js';
const profile = { apiUrl: 'https://fixture.invalid/api/v2', name: 'test' };
afterEach(() => vi.unstubAllGlobals());
describe('ownership transfer HTTP capability preflight', () => {
  it.each(['offer', 'accept', 'decline', 'cancel'])(
    'sends no %s write to an unsupported server',
    async action => {
      const fetch = vi.fn();
      fetch.mockResolvedValue(
        new Response(JSON.stringify({ capabilities: {} }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      );
      vi.stubGlobal('fetch', fetch);
      await expect(
        eventTransfer(profile, 'synthetic-key', 'event1', action, {
          recipientId: 'person1',
          transferId: 'offer1',
          yes: true,
          json: true,
        })
      ).rejects.toMatchObject({ code: 'UNSUPPORTED_SERVER' });
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.calls[0][0]).toBe(
        'https://fixture.invalid/api/v2/health'
      );
      expect(
        fetch.mock.calls.some(([, options]) => options?.method === 'POST')
      ).toBe(false);
    }
  );
});
