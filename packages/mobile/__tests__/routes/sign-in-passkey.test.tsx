import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  passkeySignIn: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('react', async importOriginal => {
  const actual = (await importOriginal()) as typeof import('react');
  return {
    ...actual,
    useEffect: vi.fn(),
    useRef: <T,>(initial: T) => ({ current: initial }),
    useState: <T,>(initial: T) => [initial, vi.fn()],
  };
});
vi.mock('expo-router', () => ({
  router: { replace: mocks.replace },
  useLocalSearchParams: () => ({ returnTo: '/settings/account' }),
}));
vi.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: vi.fn() }));
vi.mock('react-native-svg', () => ({
  default: 'Svg',
  Path: 'Path',
}));
vi.mock('../../src/components/atoms/logo-sticker', () => ({
  LogoSticker: 'LogoSticker',
}));
vi.mock('../../src/components/ui/text', () => ({ Text: 'Text' }));
vi.mock('../../src/lib/native-auth-actions', () => ({
  requestNativeSignIn: vi.fn(),
  signInWithNativeSocial: vi.fn(),
  verifyNativeEmailOtp: vi.fn(),
}));
vi.mock('../../src/lib/native-passkey-client', () => ({
  isNativePasskeyAvailable: () => true,
}));
vi.mock('../../src/lib/auth-client', () => ({
  authClient: { signIn: { passkey: mocks.passkeySignIn } },
}));
vi.mock('uniwind', () => ({ useCSSVariable: () => '#111827' }));

import SignInScreen from '../../app/(auth)/sign-in';

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [
    node,
    ...Children.toArray(node.props.children as ReactNode).flatMap(child =>
      elements(child)
    ),
  ];
}

describe('native passkey sign-in', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.passkeySignIn.mockResolvedValue({ data: { user: {} } });
  });

  it('offers passkey sign-in and returns to the requested screen', async () => {
    const tree = elements(SignInScreen());
    const button = tree.find(
      element => element.props.accessibilityLabel === 'Continue with a passkey'
    );

    expect(button).toBeDefined();
    await (button?.props.onPress as () => Promise<void>)();

    expect(mocks.passkeySignIn).toHaveBeenCalledOnce();
    expect(mocks.replace).toHaveBeenCalledWith('/settings/account');
  });

  it('places passkey after the social sign-in options', () => {
    const labels = elements(SignInScreen())
      .map(element => element.props.accessibilityLabel)
      .filter((label): label is string => typeof label === 'string');

    expect(labels).toEqual([
      'Continue with Discord',
      'Continue with Google',
      'Continue with a passkey',
    ]);
  });
});
