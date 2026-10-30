import { afterEach, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import { BugReportPage } from './bug-report-page';
import { forwardBugReport } from '@/lib/bug-report-ingress';
import { createTestInstance } from '../../../../convex/tests/test_helpers';

vi.unmock('@/convex/_generated/api');
vi.mock('@/lib/auth-client', () => ({
  authClient: { convex: { token: async () => ({ data: null }) } },
}));
vi.mock('@sentry/nextjs', () => ({ getReplay: () => undefined }));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it.each([200, 400])(
  'public form reaches trusted ingress, Convex intake and mocked Sentry (HTTP %s)',
  async status => {
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
    vi.stubGlobal('crypto', webcrypto);
    const t = createTestInstance();
    const envelopes: Uint8Array[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
        const url = String(input);
        if (url.startsWith('/api/bug-reports')) {
          const headers = new Headers(init?.headers);
          headers.set('x-vercel-forwarded-for', '192.0.2.1');
          return forwardBugReport(
            new Request(`https://groupi.gg${url}`, { ...init, headers }),
            url.endsWith('/receipt') ? 'receipt' : 'submit'
          );
        }
        if (url.startsWith('https://groupi-test.convex.site/'))
          return t.fetch(new URL(url).pathname, init);
        if (
          url.startsWith('https://o123.ingest.us.sentry.io/api/456/envelope/')
        ) {
          envelopes.push(
            new Uint8Array(await new Response(init?.body).arrayBuffer())
          );
          return new Response('', { status });
        }
        throw new Error('Unexpected external request');
      })
    );
    render(<BugReportPage />);
    fireEvent.change(screen.getByLabelText('What happened?'), {
      target: { value: 'Login button does not respond.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send report' }));
    if (status === 200)
      await screen.findByText(
        'Thanks — your report was accepted.',
        {},
        { timeout: 15000 }
      );
    else {
      await screen.findByText(/could not be sent/, {}, { timeout: 15000 });
      expect(screen.getByLabelText('What happened?')).toHaveValue(
        'Login button does not respond.'
      );
    }
    expect(envelopes).toHaveLength(1);
    const envelope = new TextDecoder().decode(envelopes[0]);
    expect(envelope).toContain('Login button does not respond.');
    expect(envelope).toContain('feedback');
    expect(envelope).not.toContain('replay_id');
    expect(envelope).not.toContain('contact_email');
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3);
  },
  20000
);
