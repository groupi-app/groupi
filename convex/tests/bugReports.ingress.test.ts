// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { forwardBugReport } from '../../packages/web/lib/bug-report-ingress';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it('fails closed outside the managed trusted ingress and never trusts a supplied ordinary IP header', async () => {
  vi.stubEnv('VERCEL', '');
  vi.stubEnv(
    'BUG_REPORT_PROXY_SECRET',
    'test-only-secret-at-least-32-characters'
  );
  vi.stubEnv('BUG_REPORT_CONVEX_SITE_URL', 'https://groupi-test.convex.site');
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const response = await forwardBugReport(
    new Request('https://groupi.gg/api/bug-reports', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '192.0.2.1',
      },
      body: '{}',
    }),
    'submit'
  );
  expect(await response.json()).toEqual({
    status: 'failed',
    code: 'unavailable',
  });
  expect(fetch).not.toHaveBeenCalled();
});

it('forwards a bounded report through the fixed authenticated Convex ingress to Sentry', async () => {
  vi.stubEnv('VERCEL', '1');
  vi.stubEnv(
    'BUG_REPORT_PROXY_SECRET',
    'test-only-secret-at-least-32-characters'
  );
  vi.stubEnv('BUG_REPORT_CONVEX_SITE_URL', 'https://groupi-test.convex.site');
  vi.stubEnv(
    'BUG_REPORT_SENTRY_DSN',
    'https://publickey@o123.ingest.us.sentry.io/456'
  );
  const { createTestInstance } = await import('./test_helpers');
  const t = createTestInstance();
  const fetch = vi.fn(async (url: string, init: RequestInit) => {
    if (url.startsWith('https://groupi-test.convex.site/'))
      return t.fetch(new URL(url).pathname, init);
    if (url.startsWith('https://o123.ingest.us.sentry.io/api/456/envelope/'))
      return new Response('', { status: 200 });
    throw new Error('Unexpected external request');
  });
  vi.stubGlobal('fetch', fetch);
  const response = await forwardBugReport(
    new Request('https://groupi.gg/api/bug-reports', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-vercel-forwarded-for': '192.0.2.1',
        'x-forwarded-for': 'forged',
        cookie: 'private-cookie',
      },
      body: JSON.stringify({
        submissionId: '12345678-1234-4123-8123-123456789abc',
        description: 'A bug',
        includeReplay: false,
      }),
    }),
    'submit'
  );
  expect(await response.json()).toMatchObject({ status: 'accepted' });
  expect(fetch).toHaveBeenCalledTimes(2);
  const headers = new Headers(fetch.mock.calls[0][1].headers);
  expect(headers.get('x-groupi-bug-network')).toMatch(/^[0-9a-f]{64}$/);
  expect(headers.get('cookie')).toBeNull();
  expect(headers.get('x-forwarded-for')).toBeNull();
  expect(headers.get('x-vercel-forwarded-for')).toBeNull();
  expect(response.headers.get('x-groupi-bug-proxy')).toBeNull();
}, 20000);

it.each([
  [{ 'content-type': 'text/plain' }, '{}', 415],
  [
    { 'content-type': 'application/json', origin: 'https://evil.example' },
    '{}',
    403,
  ],
  [
    { 'content-type': 'application/json' },
    'x'.repeat(4 * 1024 * 1024 + 1),
    413,
  ],
])('rejects unsafe bodies before forwarding', async (extra, body, status) => {
  vi.stubEnv('VERCEL', '1');
  vi.stubEnv(
    'BUG_REPORT_PROXY_SECRET',
    'test-only-secret-at-least-32-characters'
  );
  vi.stubEnv('BUG_REPORT_CONVEX_SITE_URL', 'https://groupi-test.convex.site');
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const response = await forwardBugReport(
    new Request('https://groupi.gg/api/bug-reports', {
      method: 'POST',
      headers: { ...extra, 'x-vercel-forwarded-for': '192.0.2.1' },
      body,
    }),
    'submit'
  );
  expect(response.status).toBe(status);
  expect(fetch).not.toHaveBeenCalled();
});

it('does not relay upstream secrets or call an unbounded JSON response reader', async () => {
  vi.stubEnv('VERCEL', '1');
  vi.stubEnv(
    'BUG_REPORT_PROXY_SECRET',
    'test-only-secret-at-least-32-characters'
  );
  vi.stubEnv('BUG_REPORT_CONVEX_SITE_URL', 'https://groupi-test.convex.site');
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      Response.json({
        status: 'accepted',
        eventId: 'a'.repeat(32),
        secret: 'must-not-leak',
      })
    )
  );
  const response = await forwardBugReport(
    new Request('https://groupi.gg/api/bug-reports', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-vercel-forwarded-for': '192.0.2.1',
      },
      body: '{}',
    }),
    'submit'
  );
  expect(await response.json()).toEqual({
    status: 'accepted',
    eventId: 'a'.repeat(32),
  });
});

it('bounds stalled backend transport without declaring definite failure', async () => {
  vi.useFakeTimers();
  try {
    vi.stubEnv('VERCEL', '1');
    vi.stubEnv(
      'BUG_REPORT_PROXY_SECRET',
      'test-only-secret-at-least-32-characters'
    );
    vi.stubEnv('BUG_REPORT_CONVEX_SITE_URL', 'https://groupi-test.convex.site');
    const fetch = vi
      .fn()
      .mockImplementation(
        (_url, options) =>
          new Promise((_resolve, reject) =>
            options.signal?.addEventListener('abort', () =>
              reject(new Error('aborted'))
            )
          )
      );
    vi.stubGlobal('fetch', fetch);
    const pending = forwardBugReport(
      new Request('https://groupi.gg/api/bug-reports', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-vercel-forwarded-for': '192.0.2.1',
        },
        body: '{}',
      }),
      'submit'
    );
    let settled = false;
    void pending.then(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(45_000);
    expect(settled).toBe(true);
    expect(await (await pending).json()).toEqual({
      status: 'outcome-unknown',
      code: 'network-uncertain',
    });
  } finally {
    vi.useRealTimers();
  }
});
