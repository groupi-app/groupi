import { afterEach, expect, it, vi } from 'vitest';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
  act,
} from '@testing-library/react';
import * as Sentry from '@sentry/nextjs';
import { BugReportPage } from './bug-report-page';
import { observeReplayTransport } from '@/lib/bug-report-replay-delivery';
// Node's default condition selects the server SDK; load its published browser entry for this DOM seam.
vi.mock('@sentry/nextjs', async () => {
  const { createRequire } = await import('node:module');
  const req = createRequire(import.meta.url);
  const path = req
    .resolve('@sentry/nextjs/package.json')
    .replace('package.json', 'build/cjs/index.client.js');
  return req(path);
});
vi.mock('@/lib/auth-client', () => ({
  authClient: { convex: { token: async () => ({ data: null }) } },
}));
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
);
afterEach(async () => {
  await Sentry.getReplay()?.stop();
  await Sentry.close();
  vi.unstubAllGlobals();
});
it('with installed session Replay, manual reporting preserves independent recording', async () => {
  const mode = 'session';
  // jsdom runs in Node; expose the renderer host shape so the unmodified SDK enables its browser integration.
  vi.stubGlobal('process', { ...process, type: 'renderer' });
  const envelopes: unknown[] = [];
  Sentry.init({
    dsn: 'https://public@sentry.invalid/1',
    defaultIntegrations: false,
    integrations: [
      Sentry.replayIntegration({ useCompression: false, minReplayDuration: 0 }),
    ],
    replaysSessionSampleRate: mode === 'session' ? 1 : 0,
    replaysOnErrorSampleRate: 1,
    transport: () =>
      observeReplayTransport({
        send: async envelope => {
          envelopes.push(envelope);
          return { statusCode: 200 };
        },
        flush: async () => true,
      }),
  });
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({ status: 'accepted', eventId: 'a'.repeat(32) })
        )
    )
  );
  render(<BugReportPage />);
  await waitFor(() =>
    expect(Sentry.getReplay()?.getRecordingMode()).toBe(mode)
  );
  const before = envelopes.length;
  fireEvent.change(screen.getByLabelText('What happened?'), {
    target: { value: 'Default-off privacy' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send report' }));
  await screen.findByText('Thanks — your report was accepted.');
  expect(envelopes).toHaveLength(before);
  expect(
    JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))
  ).not.toHaveProperty('replayId');
  cleanup();
  vi.mocked(fetch).mockClear();
  render(<BugReportPage />);
  fireEvent.click(screen.getByLabelText('Include session replay'));
  expect(envelopes).toHaveLength(before);
  fireEvent.change(screen.getByLabelText('What happened?'), {
    target: { value: 'Explicit replay consent' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Send report' }));
  await screen.findByText(
    'Thanks — your report was accepted.',
    {},
    { timeout: 20000 }
  );
  expect(envelopes.length).toBeGreaterThan(before);
  expect(
    JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))
  ).toMatchObject({
    includeReplay: true,
    replayId: expect.stringMatching(/^[a-f0-9]{32}$/),
  });
  expect(Sentry.getReplay()?.getRecordingMode()).toBe(mode);
  const node = document.createElement('div');
  node.id = 'post-report-recording-marker';
  node.textContent = 'post-report-recording-marker';
  document.body.append(node);
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
  });
  const afterSend = envelopes.length;
  await Sentry.getReplay()?.flush();
  expect(envelopes.length).toBeGreaterThan(afterSend);
  expect(JSON.stringify(envelopes.slice(afterSend))).toContain(
    'post-report-recording-marker'
  );
  node.remove();
}, 25000);
