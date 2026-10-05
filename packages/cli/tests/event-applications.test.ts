import { afterEach, expect, it, vi } from 'vitest';
import { writeApplication } from '../src/event-applications.js';
const profile = { name: 'test', apiUrl: 'https://example.test/api/v2' };
afterEach(() => vi.unstubAllGlobals());
it('sends no application write when server does not advertise capability', async () => {
  const fetch = vi.fn(
    async (_url: string) =>
      new Response(JSON.stringify({ capabilities: {} }), {
        headers: { 'content-type': 'application/json' },
      })
  );
  vi.stubGlobal('fetch', fetch);
  await expect(
    writeApplication(profile, 'grp_test', 'event1', 'submit', { answers: {} })
  ).rejects.toMatchObject({ code: 'UNSUPPORTED_SERVER' });
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(fetch.mock.calls[0][0]).toBe(profile.apiUrl + '/health');
});
it('checks capability before approval write and uses ordinary events scope URL', async () => {
  const fetch = vi.fn(
    async (url: string) =>
      new Response(
        JSON.stringify(
          url.endsWith('/health')
            ? { capabilities: { eventApplications: { version: 1 } } }
            : { applicationId: 'application1', status: 'APPROVED' }
        ),
        { headers: { 'content-type': 'application/json' } }
      )
  );
  vi.stubGlobal('fetch', fetch);
  expect(
    await writeApplication(profile, 'grp_test', 'application1', 'approve')
  ).toMatchObject({ status: 'APPROVED' });
  expect(fetch.mock.calls.map(c => c[0])).toEqual([
    profile.apiUrl + '/health',
    profile.apiUrl + '/event-applications/application1/decision',
  ]);
});
it('choosing APPLY on a legacy admission server sends zero writes', async () => {
  const { manageEvent } = await import('../src/event-management.js');
  const fetch = vi.fn(
    async (_url: string) =>
      new Response(
        JSON.stringify({
          capabilities: {
            eventManagement: { version: 1 },
            eventAdmission: { version: 1 },
          },
        }),
        { headers: { 'content-type': 'application/json' } }
      )
  );
  vi.stubGlobal('fetch', fetch);
  await expect(
    manageEvent(profile, 'grp_test', 'event1', 'settings', {
      body: { admissionPolicy: 'APPLY' },
    })
  ).rejects.toMatchObject({ code: 'UNSUPPORTED_SERVER' });
  expect(fetch.mock.calls.every(c => String(c[0]).endsWith('/health'))).toBe(
    true
  );
});
