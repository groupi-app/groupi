import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  effects: [] as Array<() => void | (() => void)>,
  replace: vi.fn(),
  redeemFixture: vi.fn(),
  completeCallback: vi.fn(),
  code: 'mobile_e2e_one-time-code',
}));

vi.mock('react', async importOriginal => {
  const actual = (await importOriginal()) as typeof import('react');
  return {
    ...actual,
    useEffect: (effect: () => void | (() => void)) => {
      mocks.effects.push(effect);
    },
    useRef: <T,>(initial: T) => ({ current: initial }),
    useState: <T,>(initial: T) => [initial, vi.fn()],
  };
});

vi.mock('expo-router', () => ({
  router: { replace: mocks.replace },
  useLocalSearchParams: () => ({ code: mocks.code }),
}));
vi.mock('convex/react', () => ({
  useMutation: () => mocks.redeemFixture,
}));
vi.mock('convex/_generated/api', () => ({
  api: { e2e: { mutations: { redeemMobileFixture: 'redeemFixture' } } },
}));
vi.mock('../../src/lib/native-auth-actions', () => ({
  completeNativeAuthCallback: mocks.completeCallback,
}));
vi.mock('../../src/components/molecules/loading-state', () => ({
  LoadingState: 'LoadingState',
}));
vi.mock('../../src/components/ui/button', () => ({ Button: 'Button' }));
vi.mock('../../src/components/ui/safe-area-view', () => ({
  SafeAreaView: 'SafeAreaView',
}));
vi.mock('../../src/components/ui/text', () => ({ Text: 'Text' }));

import NativeE2ELoginScreen from '../../app/(auth)/e2e';

const originalE2EFlag = process.env.EXPO_PUBLIC_E2E_TESTING;

describe('native E2E one-time login route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.effects.length = 0;
    mocks.code = 'mobile_e2e_one-time-code';
    process.env.EXPO_PUBLIC_E2E_TESTING = 'true';
    mocks.redeemFixture.mockResolvedValue({
      cookieHeader: '__Secure-better-auth.session_token=signed',
      eventId: 'event-123',
    });
    mocks.completeCallback.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    if (originalE2EFlag === undefined) {
      delete process.env.EXPO_PUBLIC_E2E_TESTING;
    } else {
      process.env.EXPO_PUBLIC_E2E_TESTING = originalE2EFlag;
    }
  });

  it('redeems the one-time code, verifies the session, and opens its event', async () => {
    NativeE2ELoginScreen();
    mocks.effects[0]?.();

    await vi.waitFor(() =>
      expect(mocks.redeemFixture).toHaveBeenCalledWith({
        loginCode: 'mobile_e2e_one-time-code',
      })
    );
    expect(mocks.completeCallback).toHaveBeenCalledWith(
      '__Secure-better-auth.session_token=signed'
    );
    await vi.waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith('/event/event-123')
    );
  });

  it('never calls the fixture endpoint in a normal app build', async () => {
    process.env.EXPO_PUBLIC_E2E_TESTING = 'false';

    NativeE2ELoginScreen();
    mocks.effects[0]?.();
    await Promise.resolve();

    expect(mocks.redeemFixture).not.toHaveBeenCalled();
    expect(mocks.completeCallback).not.toHaveBeenCalled();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
