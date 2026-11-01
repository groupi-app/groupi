import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sentry = vi.hoisted(() => ({
  init: vi.fn(),
  addIntegration: vi.fn(),
  captureException: vi.fn(),
  captureRouterTransitionStart: vi.fn(),
}));
vi.mock('@sentry/nextjs', () => sentry);

let listener: EventListenerOrEventListenerObject | undefined;
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.useFakeTimers();
});
afterEach(() => {
  if (listener) window.removeEventListener('load', listener);
  listener = undefined;
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.doUnmock('./sentry-replay');
});

async function initialize({
  development = false,
  dsn = 'https://public@example.invalid/1',
  failure,
}: { development?: boolean; dsn?: string; failure?: Error } = {}) {
  vi.stubEnv('NODE_ENV', development ? 'development' : 'production');
  vi.stubEnv('NEXT_PUBLIC_SENTRY_DSN', dsn);
  const integration = { name: 'Replay' };
  const replayIntegration = vi.fn(() => integration);
  // Mock only the optional module-loading boundary. The actual instrumentation
  // registration, DOM load event, defer timer and promise handling run unchanged.
  const loadChunk = vi.fn(async () => {
    if (failure) throw failure;
    return { replayIntegration };
  });
  vi.doMock('./sentry-replay', loadChunk);
  const registrations = vi.spyOn(window, 'addEventListener');
  const instrumentation = await import('../instrumentation-client');
  listener = registrations.mock.calls.find(([event]) => event === 'load')?.[1];
  return {
    integration,
    replayIntegration,
    loadChunk,
    registrations,
    instrumentation,
  };
}

describe('optional app-served Sentry Replay initialization', () => {
  it('loads the app chunk only three seconds after load and registers it once without changing sampling or routing', async () => {
    const f = await initialize();
    expect(f.instrumentation.onRouterTransitionStart).toBe(
      sentry.captureRouterTransitionStart
    );
    expect(sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
        dsn: 'https://public@example.invalid/1',
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      })
    );
    expect(f.registrations).toHaveBeenCalledWith('load', expect.any(Function), {
      once: true,
    });
    expect(f.loadChunk).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('load'));
    await vi.advanceTimersByTimeAsync(2999);
    expect(f.loadChunk).not.toHaveBeenCalled();
    expect(sentry.addIntegration).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await vi.waitFor(() =>
      expect(sentry.addIntegration).toHaveBeenCalledWith(f.integration)
    );
    expect(f.loadChunk).toHaveBeenCalledTimes(1);
    expect(f.replayIntegration).toHaveBeenCalledTimes(1);
    expect(sentry.captureException).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('load'));
    await vi.advanceTimersByTimeAsync(3000);
    expect(sentry.addIntegration).toHaveBeenCalledTimes(1);
  });

  it.each([
    { label: 'without a DSN', development: false, dsn: '' },
    {
      label: 'in development',
      development: true,
      dsn: 'https://public@example.invalid/1',
    },
  ])('skips optional Replay $label', async ({ development, dsn }) => {
    const f = await initialize({ development, dsn });
    expect(listener).toBeUndefined();
    window.dispatchEvent(new Event('load'));
    await vi.advanceTimersByTimeAsync(10_000);
    expect(f.loadChunk).not.toHaveBeenCalled();
    expect(sentry.addIntegration).not.toHaveBeenCalled();
    expect(sentry.captureException).not.toHaveBeenCalled();
  });

  it('reports a rejected optional chunk without an unhandled rejection or disabling monitoring', async () => {
    const failure = new Error('Optional app chunk unavailable');
    const unhandled = vi.fn();
    window.addEventListener('unhandledrejection', unhandled);
    try {
      const f = await initialize({ failure });
      window.dispatchEvent(new Event('load'));
      await vi.advanceTimersByTimeAsync(3000);
      await vi.waitFor(() =>
        // Vitest wraps a rejected module factory and retains the import failure as its cause.
        expect(sentry.captureException).toHaveBeenCalledWith(
          expect.objectContaining({ cause: failure }),
          {
            tags: { optionalIntegration: 'replay' },
          }
        )
      );
      expect(f.loadChunk).toHaveBeenCalledTimes(1);
      expect(sentry.addIntegration).not.toHaveBeenCalled();
      expect(unhandled).not.toHaveBeenCalled();
      expect(sentry.init).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true })
      );
    } finally {
      window.removeEventListener('unhandledrejection', unhandled);
    }
  });
});
