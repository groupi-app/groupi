// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Infer } from 'convex/values';
import { submission } from '../bugReports/contracts';
import { createAuthAccount, registerBetterAuth } from './auth.helpers';
import { createTestInstance } from './test_helpers';

vi.setConfig({ testTimeout: 15_000 });
const proxySecret = 'test-only-proxy-secret-with-at-least-32-characters';
beforeEach(() => {
  vi.stubEnv('BUG_REPORT_PROXY_SECRET', proxySecret);
});
async function submit(
  t: ReturnType<typeof createTestInstance>,
  input: Infer<typeof submission>,
  networkKey = 'a'.repeat(64)
) {
  const response = await t.fetch('/bug-reports', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-groupi-bug-proxy': proxySecret,
      'x-groupi-bug-network': networkKey,
    },
    body: JSON.stringify(input),
  });
  return response.json();
}
// Approved seam: public intake -> intercepted Sentry HTTP transport.
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe('private bug report intake', () => {
  it('counts the final combined message including steps and emoji without truncation', async () => {
    const t = createTestInstance();
    const base = {
      submissionId: '12345678-1234-4123-8123-123456789abc',
      includeReplay: false,
    };
    expect(
      await submit(t, {
        ...base,
        description: 'x'.repeat(4071),
        reproductionSteps: '😀😀😀',
      })
    ).toEqual({ status: 'failed', code: 'unavailable' });
    expect(
      await submit(t, {
        ...base,
        description: 'x'.repeat(4072),
        reproductionSteps: '😀😀😀',
      })
    ).toEqual({ status: 'failed', code: 'message-too-long' });
  });
  it.each([
    { replyEmail: 'not an email', code: 'invalid-email' },
    { replyEmail: 'a'.repeat(250) + '@x.com', code: 'invalid-email' },
    { description: '😀'.repeat(3000), code: 'feedback-too-large' },
  ])(
    'rejects invalid contact or context budget: $code',
    async ({ code, ...fields }) => {
      const t = createTestInstance();
      expect(
        await submit(t, {
          submissionId: '12345678-1234-4123-8123-123456789abc',
          description: 'A useful bug',
          includeReplay: false,
          ...fields,
        })
      ).toEqual({ status: 'failed', code });
    }
  );
  it.each([
    { replayId: 'a'.repeat(32), code: 'replay-without-consent' },
    { includeReplay: true, replayId: 'invalid', code: 'invalid-replay' },
    { includeReplay: true, code: 'replay-unavailable' },
    {
      context: {
        platform: 'web' as const,
        release: 'https://site/path?secret=value',
      },
      code: 'invalid-context',
    },
    { submissionId: 'guessable', code: 'invalid-submission-id' },
  ])(
    'rejects unsafe submission context: $code',
    async ({ code, ...fields }) => {
      const t = createTestInstance();
      expect(
        await submit(t, {
          submissionId: '12345678-1234-4123-8123-123456789abc',
          description: 'A useful bug',
          includeReplay: false,
          ...fields,
        })
      ).toEqual({ status: 'failed', code });
    }
  );
  it('rejects direct origin requests without the trusted proxy proof', async () => {
    const t = createTestInstance();
    const response = await t.fetch('/bug-reports', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    expect(response.status).toBe(403);
  });
  it('accepts an anonymous description only after Sentry accepts the private envelope', async () => {
    vi.stubEnv(
      'BUG_REPORT_SENTRY_DSN',
      'https://publickey@o123.ingest.us.sentry.io/456'
    );
    const fetch = vi.fn().mockResolvedValue(new Response('', { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    const t = createTestInstance();
    const receipt = await submit(t, {
      submissionId: '12345678-1234-4123-8123-123456789abc',
      description: 'Cannot log in.',
      includeReplay: false,
    });
    expect(receipt).toMatchObject({ status: 'accepted' });
    expect(receipt.eventId).toMatch(/^[0-9a-f]{32}$/);
    expect(fetch).toHaveBeenCalledTimes(1);
    const body = new TextDecoder().decode(fetch.mock.calls[0][1].body);
    expect(body).toContain('Cannot log in.');
    expect(body).not.toContain('replay_id');
    expect(body).not.toContain('exception');
  });
  it('returns the accepted receipt on retry without forwarding again and rejects changed payloads', async () => {
    vi.stubEnv(
      'BUG_REPORT_SENTRY_DSN',
      'https://publickey@o123.ingest.us.sentry.io/456'
    );
    const fetch = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(new Response('', { status: 200 }))
      );
    vi.stubGlobal('fetch', fetch);
    const t = createTestInstance();
    const report = {
      submissionId: '12345678-1234-4123-8123-123456789abc',
      description: 'Cannot log in.',
      includeReplay: false,
    };
    const first = await submit(t, report);
    expect(await submit(t, report)).toEqual(first);
    expect(
      await submit(t, { ...report, description: 'Changed report' })
    ).toEqual({ status: 'failed', code: 'submission-conflict' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('rejects concurrent duplicates and resolves an accepted receipt after the response is lost', async () => {
    vi.stubEnv(
      'BUG_REPORT_SENTRY_DSN',
      'https://publickey@o123.ingest.us.sentry.io/456'
    );
    let accept!: (response: Response) => void;
    const fetch = vi.fn().mockImplementation(
      () =>
        new Promise<Response>(resolve => {
          accept = resolve;
        })
    );
    vi.stubGlobal('fetch', fetch);
    const t = createTestInstance();
    const report = {
      submissionId: '12345678-1234-4123-8123-123456789abc',
      description: 'Cannot log in.',
      includeReplay: false,
    };
    const pending = submit(t, report);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(await submit(t, report)).toMatchObject({ status: 'in-progress' });
    accept(new Response('', { status: 200 }));
    const accepted = await pending;
    const response = await t.fetch('/bug-reports/receipt', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-groupi-bug-proxy': proxySecret,
        'x-groupi-bug-network': 'b'.repeat(64),
      },
      body: JSON.stringify({ submissionId: report.submissionId }),
    });
    expect(await response.json()).toEqual(accepted);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('allows five anonymous attempts per ten minutes and rejects the sixth before Sentry', async () => {
    vi.stubEnv(
      'BUG_REPORT_SENTRY_DSN',
      'https://publickey@o123.ingest.us.sentry.io/456'
    );
    const fetch = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(new Response('', { status: 200 }))
      );
    vi.stubGlobal('fetch', fetch);
    const t = createTestInstance();
    for (let i = 0; i < 5; i++)
      expect(
        await submit(t, {
          submissionId: `12345678-1234-4123-8123-123456789ab${i}`,
          description: 'A bug',
          includeReplay: false,
        })
      ).toMatchObject({ status: 'accepted' });
    expect(
      await submit(t, {
        submissionId: '12345678-1234-4123-8123-123456789ab6',
        description: 'A bug',
        includeReplay: false,
      })
    ).toMatchObject({ status: 'failed', code: 'rate-limited' });
    expect(fetch).toHaveBeenCalledTimes(5);
  });
  it('derives signed-in rate identity without forwarding account identity and caps a shared network', async () => {
    vi.stubEnv(
      'BUG_REPORT_SENTRY_DSN',
      'https://publickey@o123.ingest.us.sentry.io/456'
    );
    const fetch = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(new Response('', { status: 200 }))
      );
    vi.stubGlobal('fetch', fetch);
    const t = createTestInstance();
    registerBetterAuth(t);
    for (let user = 0; user < 4; user++) {
      const { auth } = await createAuthAccount(t, `bug-reporter-${user}`);
      for (let attempt = 0; attempt < 5; attempt++)
        expect(
          await submit(auth, {
            submissionId: `12345678-1234-4123-8123-123456789a${user}${attempt}`,
            description: 'A signed-in bug',
            includeReplay: false,
          })
        ).toMatchObject({ status: 'accepted' });
    }
    const { auth } = await createAuthAccount(t, 'one-more-reporter');
    expect(
      await submit(auth, {
        submissionId: '12345678-1234-4123-8123-123456789aff',
        description: 'A signed-in bug',
        includeReplay: false,
      })
    ).toMatchObject({ status: 'failed', code: 'rate-limited' });
    expect(fetch).toHaveBeenCalledTimes(20);
    for (const call of fetch.mock.calls)
      expect(new TextDecoder().decode(call[1].body)).not.toContain(
        '@example.com'
      );
  });
  it('caps global in-flight sends at eight across distinct networks', async () => {
    vi.stubEnv(
      'BUG_REPORT_SENTRY_DSN',
      'https://publickey@o123.ingest.us.sentry.io/456'
    );
    const accepts: Array<(response: Response) => void> = [];
    const fetch = vi
      .fn()
      .mockImplementation(
        () => new Promise<Response>(resolve => accepts.push(resolve))
      );
    vi.stubGlobal('fetch', fetch);
    const t = createTestInstance();
    const pending = [];
    for (let i = 0; i < 8; i++) {
      pending.push(
        submit(
          t,
          {
            submissionId: `12345678-1234-4123-8123-123456789ab${i}`,
            description: 'A bug',
            includeReplay: false,
          },
          i.toString(16).repeat(64)
        )
      );
      await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(i + 1));
    }
    const ninth = submit(
      t,
      {
        submissionId: '12345678-1234-4123-8123-123456789ab9',
        description: 'A bug',
        includeReplay: false,
      },
      'f'.repeat(64)
    );
    // Release all blocked network requests after observing the admission result.
    const result = await Promise.race([
      ninth,
      new Promise(resolve =>
        setTimeout(() => resolve({ status: 'test-timeout' }), 100)
      ),
    ]);
    accepts.forEach(accept => accept(new Response('', { status: 200 })));
    await Promise.all(pending);
    await ninth;
    expect(result).toMatchObject({ status: 'failed', code: 'busy' });
    expect(fetch).toHaveBeenCalledTimes(8);
  });
  it('rejects invalid selected images without accepting or silently dropping them', async () => {
    vi.stubEnv(
      'BUG_REPORT_SENTRY_DSN',
      'https://publickey@o123.ingest.us.sentry.io/456'
    );
    const fetch = vi.fn().mockResolvedValue(new Response('', { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    const t = createTestInstance();
    expect(
      await submit(t, {
        submissionId: '12345678-1234-4123-8123-123456789abc',
        description: 'A bug',
        includeReplay: false,
        images: [{ base64: btoa('not a PNG'), mimeType: 'image/png' }],
      })
    ).toEqual({ status: 'failed', code: 'invalid-image' });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('allows deliberate same-payload retry after a confirmed rejection cooldown but never blindly retries unknown delivery', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.stubEnv(
      'BUG_REPORT_SENTRY_DSN',
      'https://publickey@o123.ingest.us.sentry.io/456'
    );
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response('', { status: 429, headers: { 'retry-after': '1' } })
      )
      .mockResolvedValueOnce(new Response('', { status: 200 }))
      .mockRejectedValue(new Error('lost response'));
    vi.stubGlobal('fetch', fetch);
    const t = createTestInstance();
    const report = {
      submissionId: '12345678-1234-4123-8123-123456789abc',
      description: 'A bug',
      includeReplay: false,
    };
    expect(await submit(t, report)).toEqual({
      status: 'failed',
      code: 'rate-limited',
      retryAfterMs: 1000,
    });
    expect(await submit(t, report)).toMatchObject({
      status: 'failed',
      code: 'rate-limited',
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    vi.setSystemTime(Date.now() + 1001);
    expect(await submit(t, report)).toMatchObject({ status: 'accepted' });
    const second = {
      ...report,
      submissionId: '12345678-1234-4123-8123-123456789abd',
    };
    expect(await submit(t, second)).toEqual({
      status: 'outcome-unknown',
      code: 'network-uncertain',
    });
    expect(await submit(t, second)).toEqual({
      status: 'outcome-unknown',
      code: 'network-uncertain',
    });
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it('rate-limits receipt lookups without exposing report contents', async () => {
    const t = createTestInstance();
    const lookup = () =>
      t
        .fetch('/bug-reports/receipt', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-groupi-bug-proxy': proxySecret,
            'x-groupi-bug-network': 'a'.repeat(64),
          },
          body: JSON.stringify({
            submissionId: '12345678-1234-4123-8123-123456789abc',
          }),
        })
        .then(response => response.json());
    for (let i = 0; i < 60; i++)
      expect(await lookup()).toEqual({ status: 'not-found' });
    expect(await lookup()).toMatchObject({
      status: 'failed',
      code: 'rate-limited',
    });
  });
  it('rejects a blank description before forwarding', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const t = createTestInstance();
    expect(
      await submit(t, {
        submissionId: '12345678-1234-4123-8123-123456789abc',
        description: '  \n ',
        includeReplay: false,
      })
    ).toEqual({ status: 'failed', code: 'description-required' });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('fails closed without trusted network admission configuration', async () => {
    vi.stubEnv('BUG_REPORT_SENTRY_DSN', '');
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const t = createTestInstance();
    expect(
      await submit(t, {
        submissionId: '12345678-1234-4123-8123-123456789abc',
        description: 'The login button does nothing.',
        includeReplay: false,
      })
    ).toEqual({ status: 'failed', code: 'unavailable' });
    expect(fetch).not.toHaveBeenCalled();
  });
});

it('retains only technical receipts and expires them after 24 hours', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.stubEnv(
    'BUG_REPORT_SENTRY_DSN',
    'https://publickey@o123.ingest.us.sentry.io/456'
  );
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response('', { status: 200 }))
  );
  const t = createTestInstance();
  const submissionId = '12345678-1234-4123-8123-123456789abc';
  await submit(t, {
    submissionId,
    description: 'Private bug description',
    replyEmail: 'private@example.com',
    includeReplay: false,
  });
  const lookup = () =>
    t
      .fetch('/bug-reports/receipt', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-groupi-bug-proxy': proxySecret,
          'x-groupi-bug-network': 'a'.repeat(64),
        },
        body: JSON.stringify({ submissionId }),
      })
      .then(response => response.json());
  expect(await lookup()).toMatchObject({ status: 'accepted' });
  // Persistence audit is explicitly required by the privacy acceptance criteria.
  const serialized = JSON.stringify(
    await t.run(async ctx => ctx.db.query('bugReportReceipts').collect())
  );
  expect(serialized).not.toContain('Private bug description');
  expect(serialized).not.toContain('private@example.com');
  vi.setSystemTime(Date.now() + 86_400_001);
  expect(await lookup()).toEqual({ status: 'not-found' });
});

it.each([
  {
    images: Array.from({ length: 4 }, () => ({
      base64: 'AAAA',
      mimeType: 'image/png' as const,
    })),
    code: 'image-count',
  },
  {
    images: [{ base64: 'A'.repeat(2796204), mimeType: 'image/png' as const }],
    code: 'images-too-large',
  },
  { includeReplay: false, replayId: '', code: 'replay-without-consent' },
])(
  'rejects bounded attachment and consent edge cases: $code',
  async ({ code, ...fields }) => {
    const t = createTestInstance();
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    expect(
      await submit(t, {
        submissionId: '12345678-1234-4123-8123-123456789abc',
        description: 'A bug',
        includeReplay: false,
        ...fields,
      })
    ).toEqual({ status: 'failed', code });
    expect(fetch).not.toHaveBeenCalled();
  }
);

it('rejects forged identity, destinations, attachment URLs, and arbitrary metadata at the HTTP boundary', async () => {
  const t = createTestInstance();
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  for (const extra of [
    { personId: 'forged' },
    { destination: 'https://attacker.example' },
    { images: [{ url: 'https://attacker.example/image.png' }] },
    { context: { platform: 'web', url: 'https://example.test/?secret=x' } },
  ]) {
    const response = await t.fetch('/bug-reports', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-groupi-bug-proxy': proxySecret,
        'x-groupi-bug-network': 'a'.repeat(64),
      },
      body: JSON.stringify({
        submissionId: '12345678-1234-4123-8123-123456789abc',
        description: 'A bug',
        includeReplay: false,
        ...extra,
      }),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      status: 'failed',
      code: 'invalid-input',
    });
  }
  expect(fetch).not.toHaveBeenCalled();
});

it('forwards validated images and an explicitly consented replay together without account context', async () => {
  const sharp = (await import('sharp')).default;
  const image = await sharp({
    create: { width: 2, height: 2, channels: 3, background: 'red' },
  })
    .png()
    .toBuffer();
  vi.stubEnv(
    'BUG_REPORT_SENTRY_DSN',
    'https://publickey@o123.ingest.us.sentry.io/456'
  );
  const fetch = vi.fn().mockResolvedValue(new Response('', { status: 200 }));
  vi.stubGlobal('fetch', fetch);
  const t = createTestInstance();
  expect(
    await submit(t, {
      submissionId: '12345678-1234-4123-8123-123456789abc',
      description: 'A bug',
      reproductionSteps: 'Press sign in.',
      replyEmail: 'reply@example.com',
      includeReplay: true,
      replayId: 'b'.repeat(32),
      images: [{ base64: image.toString('base64'), mimeType: 'image/png' }],
    })
  ).toMatchObject({ status: 'accepted' });
  const envelope = new TextDecoder().decode(fetch.mock.calls[0][1].body);
  expect(envelope).toContain('Steps to reproduce:');
  expect(envelope).toContain('"replay_id":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"');
  expect(envelope).toContain('"type":"attachment"');
  expect(envelope).toContain('"contact_email":"reply@example.com"');
  expect(envelope).not.toContain('"user"');
});
