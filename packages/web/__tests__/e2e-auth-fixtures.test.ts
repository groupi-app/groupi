import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  cleanup: vi.fn(),
  createMagicLinkToken: vi.fn(),
  fixtures: {} as Record<
    string,
    (
      dependencies: Record<string, unknown>,
      use: () => Promise<void>
    ) => Promise<void>
  >,
}));
vi.mock('@playwright/test', () => ({
  test: {
    extend: (fixtures: typeof mocks.fixtures) => {
      mocks.fixtures = fixtures;
      return {};
    },
  },
  expect: {},
}));
vi.mock('../e2e/helpers/convex-seeder', () => ({
  ConvexSeeder: class {
    cleanup = mocks.cleanup;
    createMagicLinkToken = mocks.createMagicLinkToken;
  },
}));
import '../e2e/fixtures/base.fixture';

describe('authenticated fixture prerequisites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.cleanup.mockResolvedValue(undefined);
    mocks.createMagicLinkToken.mockResolvedValue(null);
  });
  for (const name of ['authenticatedContext', 'unonboardedContext']) {
    it(`${name} fails and releases resources when authentication is unavailable`, async () => {
      const page = {
        on: vi.fn(),
        request: { post: vi.fn().mockResolvedValue({ ok: () => false }) },
        close: vi.fn(),
      };
      const context = {
        newPage: vi.fn().mockResolvedValue(page),
        close: vi.fn(),
      };
      const use = vi.fn();
      await expect(
        mocks.fixtures[name](
          {
            browser: { newContext: vi.fn().mockResolvedValue(context) },
            baseURL: 'https://test.groupi.gg',
            authenticatedUser: { email: 'fixture@example.invalid' },
            unonboardedUser: { email: 'fixture@example.invalid' },
          },
          use
        )
      ).rejects.toThrow('fixture setup failed');
      expect(use).not.toHaveBeenCalled();
      expect(mocks.cleanup).toHaveBeenCalledOnce();
      expect(context.close).toHaveBeenCalledOnce();
    });
  }
  it('closes the context even when test execution and cleanup fail', async () => {
    const page = {
      on: vi.fn(),
      request: {
        get: vi.fn().mockResolvedValue({
          ok: () => true,
          json: async () => ({
            session: { id: 'session', userId: 'user' },
            user: { id: 'user', email: 'fixture@example.invalid' },
          }),
        }),
        post: vi.fn().mockResolvedValue({
          ok: () => true,
          json: async () => ({
            magicLinkUrl: 'https://test.groupi.gg/login',
          }),
        }),
      },
      url: () => 'https://test.groupi.gg/events',
      goto: vi.fn(),
      waitForURL: vi.fn(),
      close: vi.fn(),
    };
    const context = {
      newPage: vi.fn().mockResolvedValue(page),
      close: vi.fn(),
    };
    mocks.cleanup.mockRejectedValueOnce(new Error('cleanup failed'));
    await expect(
      mocks.fixtures.authenticatedContext(
        {
          browser: { newContext: vi.fn().mockResolvedValue(context) },
          baseURL: 'https://test.groupi.gg',
          authenticatedUser: { email: 'fixture@example.invalid' },
        },
        async () => {
          throw new Error('test failed');
        }
      )
    ).rejects.toThrow('cleanup failed');
    expect(context.close).toHaveBeenCalledOnce();
  });
  for (const fastPath of [true, false]) {
    for (const [destination, sessionAvailable, expectedSuccess] of [
      ['https://test.groupi.gg/sign-in?callbackURL=/events', true, false],
      [
        'https://test.groupi.gg/api/auth/verify?callbackURL=/events',
        true,
        false,
      ],
      ['https://wrong-origin.example/events', true, false],
      ['https://test.groupi.gg/events-old', true, false],
      ['https://test.groupi.gg/events', false, false],
      ['https://test.groupi.gg/events', true, true],
    ] as const) {
      it(`${fastPath ? 'fast' : 'fallback'} requires pathname and authenticated session: ${destination}, session=${sessionAvailable}`, async () => {
        mocks.createMagicLinkToken.mockResolvedValue(
          'https://test.groupi.gg/api/auth/verify'
        );
        const page = {
          on: vi.fn(),
          url: () => destination,
          request: {
            post: vi.fn().mockResolvedValue({
              ok: () => fastPath,
              json: async () => ({
                magicLinkUrl: 'https://test.groupi.gg/api/auth/verify',
              }),
            }),
            get: vi.fn().mockResolvedValue({
              ok: () => true,
              json: async () =>
                sessionAvailable
                  ? {
                      session: { id: 'session', userId: 'user' },
                      user: { id: 'user', email: 'fixture@example.invalid' },
                    }
                  : null,
            }),
          },
          goto: vi.fn(),
          waitForURL: vi.fn(async (predicate: (url: URL) => boolean) => {
            if (!predicate(new URL(destination)))
              throw new Error('destination did not match');
          }),
          close: vi.fn(),
        };
        const context = {
          newPage: vi.fn().mockResolvedValue(page),
          close: vi.fn(),
        };
        const use = vi.fn();
        const result = mocks.fixtures.authenticatedContext(
          {
            browser: { newContext: vi.fn().mockResolvedValue(context) },
            baseURL: 'https://test.groupi.gg',
            authenticatedUser: { email: 'fixture@example.invalid' },
          },
          use
        );
        if (expectedSuccess) {
          await result;
          expect(use).toHaveBeenCalledOnce();
          expect(page.request.get).toHaveBeenCalledWith(
            'https://test.groupi.gg/api/auth/get-session',
            { maxRedirects: 0 }
          );
        } else {
          await expect(result).rejects.toThrow('fixture setup failed');
          expect(use).not.toHaveBeenCalled();
        }
        expect(context.close).toHaveBeenCalledOnce();
      });
    }
  }
});
