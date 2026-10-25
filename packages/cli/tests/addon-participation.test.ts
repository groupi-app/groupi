import { afterEach, expect, it, vi } from 'vitest';
import { participate, participationData } from '../src/addon-participation.js';
const profile = { name: 'test', apiUrl: 'https://example.test/api/v2' };
const health = () =>
  new Response(
    JSON.stringify({ capabilities: { addonParticipation: { version: 1 } } })
  );
afterEach(() => vi.unstubAllGlobals());
it('does not send writes to an unsupported server', async () => {
  const fetch = vi.fn().mockResolvedValue(new Response('{}'));
  vi.stubGlobal('fetch', fetch);
  await expect(
    participate(
      profile,
      'private',
      'event',
      'questionnaire',
      'respond',
      { meal: 'Pasta' },
      {}
    )
  ).rejects.toMatchObject({ code: 'UNSUPPORTED_SERVER' });
  expect(fetch).toHaveBeenCalledTimes(1);
});
it('does not retry a lost participant write and gives inspection recovery', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(health())
    .mockRejectedValueOnce(Error('lost response'));
  vi.stubGlobal('fetch', fetch);
  await expect(
    participate(
      profile,
      'private',
      'event',
      'questionnaire',
      'respond',
      { meal: 'Pasta' },
      {}
    )
  ).rejects.toMatchObject({
    code: 'UNCERTAIN_OUTCOME',
    message: expect.stringContaining('addons data event questionnaire'),
  });
  expect(fetch).toHaveBeenCalledTimes(2);
});
it('requires confirmation before executing a custom button', async () => {
  const fetch = vi.fn().mockResolvedValueOnce(health());
  vi.stubGlobal('fetch', fetch);
  await expect(
    participate(
      profile,
      'private',
      'event',
      'custom:template',
      'execute',
      null,
      { fieldId: 'button', json: true }
    )
  ).rejects.toMatchObject({ code: 'CONFIRMATION_REQUIRED' });
  expect(fetch).toHaveBeenCalledTimes(1);
});
it('rejects incomplete success and never presents an unconfirmed opt-out as successful', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(health())
    .mockResolvedValueOnce(new Response('{"isOptedOut":false}'));
  vi.stubGlobal('fetch', fetch);
  await expect(
    participate(profile, 'private', 'event', 'reminders', 'opt-out', null, {})
  ).rejects.toMatchObject({ code: 'UNCERTAIN_OUTCOME' });
});
it('rejects a repeated cursor instead of looping or silently truncating', async () => {
  const fetch = vi
    .fn()
    .mockImplementation(
      async () =>
        new Response('{"items":[],"nextCursor":"same","isOptedOut":false}')
    );
  vi.stubGlobal('fetch', fetch);
  await expect(
    participationData(profile, 'private', 'event', 'questionnaire', {
      all: true,
    })
  ).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  expect(fetch).toHaveBeenCalledTimes(2);
});
