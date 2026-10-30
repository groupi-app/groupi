// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { sendFeedback } from '../bugReports/sender';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
// Focused wire seam: binary attachment framing and upstream acceptance cannot
// be established by a UI assertion about a returned identifier.
it('sends a private feedback envelope to the pinned project and waits for 2xx', async () => {
  vi.stubEnv(
    'BUG_REPORT_SENTRY_DSN',
    'https://publickey@o123.ingest.us.sentry.io/456'
  );
  const fetch = vi.fn().mockResolvedValue(new Response('', { status: 200 }));
  vi.stubGlobal('fetch', fetch);
  const receipt = await sendFeedback(
    { message: 'Login button is broken.', email: 'reply@example.com' },
    'a'.repeat(32),
    []
  );
  expect(receipt).toEqual({ status: 'accepted', eventId: 'a'.repeat(32) });
  expect(fetch).toHaveBeenCalledTimes(1);
  const [url, request] = fetch.mock.calls[0];
  expect(url).toBe(
    'https://o123.ingest.us.sentry.io/api/456/envelope/?sentry_key=publickey&sentry_version=7'
  );
  const lines = new TextDecoder().decode(request.body).trim().split('\n');
  expect(JSON.parse(lines[0])).toMatchObject({ event_id: 'a'.repeat(32) });
  expect(JSON.parse(lines[1])).toMatchObject({ type: 'feedback' });
  const event = JSON.parse(lines[2]);
  expect(event).toMatchObject({
    type: 'feedback',
    platform: 'javascript',
    contexts: {
      feedback: {
        message: 'Login button is broken.',
        contact_email: 'reply@example.com',
      },
    },
  });
  expect(event).not.toHaveProperty('user');
  expect(event).not.toHaveProperty('exception');
  expect(event.contexts.feedback).not.toHaveProperty('replay_id');
});

it('keeps chosen image bytes in the same event envelope with byte-exact framing', async () => {
  vi.stubEnv(
    'BUG_REPORT_SENTRY_DSN',
    'https://publickey@o123.ingest.us.sentry.io/456'
  );
  const fetch = vi.fn().mockResolvedValue(new Response('', { status: 202 }));
  vi.stubGlobal('fetch', fetch);
  await sendFeedback(
    { message: 'A bug', replayId: 'b'.repeat(32) },
    'a'.repeat(32),
    [
      {
        bytes: new Uint8Array([0, 10, 255]),
        mimeType: 'image/png',
        filename: 'image-1.png',
      },
    ]
  );
  const body = Buffer.from(fetch.mock.calls[0][1].body);
  const prefix = body.subarray(0, body.length - 4).toString();
  expect(prefix).toContain('"replay_id":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"');
  expect(prefix).toContain('"type":"attachment"');
  expect(prefix).toContain('"length":3');
  expect(prefix).toContain('"filename":"image-1.png"');
  expect([...body.subarray(-4)]).toEqual([0, 10, 255, 10]);
});

it.each([
  '',
  'http://key@o123.ingest.sentry.io/1',
  'https://key@attacker.example/1',
  'https://key@o123.ingest.sentry.io/1?redirect=elsewhere',
])('fails closed for missing or invalid destination %s', async dsn => {
  vi.stubEnv('BUG_REPORT_SENTRY_DSN', dsn);
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  expect(await sendFeedback({ message: 'A bug' }, 'a'.repeat(32), [])).toEqual({
    status: 'failed',
    code: 'unavailable',
  });
  expect(fetch).not.toHaveBeenCalled();
});

it.each([
  [400, { status: 'failed', code: 'upstream-rejected' }],
  [429, { status: 'failed', code: 'rate-limited', retryAfterMs: 120000 }],
  [503, { status: 'outcome-unknown', code: 'upstream-unavailable' }],
])('reports nonacceptance truthfully for HTTP %s', async (status, expected) => {
  vi.stubEnv(
    'BUG_REPORT_SENTRY_DSN',
    'https://publickey@o123.ingest.us.sentry.io/456'
  );
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response('', { status, headers: { 'retry-after': '120' } })
    );
  vi.stubGlobal('fetch', fetch);
  expect(await sendFeedback({ message: 'A bug' }, 'a'.repeat(32), [])).toEqual(
    expected
  );
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('does not claim a lost network response failed or automatically retry', async () => {
  vi.stubEnv(
    'BUG_REPORT_SENTRY_DSN',
    'https://publickey@o123.ingest.us.sentry.io/456'
  );
  const fetch = vi
    .fn()
    .mockRejectedValue(new Error('could contain sensitive upstream data'));
  vi.stubGlobal('fetch', fetch);
  expect(await sendFeedback({ message: 'A bug' }, 'a'.repeat(32), [])).toEqual({
    status: 'outcome-unknown',
    code: 'network-uncertain',
  });
  expect(fetch).toHaveBeenCalledTimes(1);
});

it('bounds a stalled upstream request and labels the result uncertain', async () => {
  vi.useFakeTimers();
  try {
    vi.stubEnv(
      'BUG_REPORT_SENTRY_DSN',
      'https://publickey@o123.ingest.us.sentry.io/456'
    );
    const fetch = vi
      .fn()
      .mockImplementation(
        (_url, options) =>
          new Promise((_resolve, reject) =>
            options.signal.addEventListener('abort', () =>
              reject(new Error('aborted'))
            )
          )
      );
    vi.stubGlobal('fetch', fetch);
    const promise = sendFeedback({ message: 'A bug' }, 'a'.repeat(32), []);
    await vi.advanceTimersByTimeAsync(15000);
    expect(await promise).toEqual({
      status: 'outcome-unknown',
      code: 'network-uncertain',
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
  } finally {
    vi.useRealTimers();
  }
});
