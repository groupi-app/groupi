import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  addPasskey: vi.fn(),
  replace: vi.fn(),
  showConfirmDialog: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('react', async importOriginal => {
  const actual = (await importOriginal()) as typeof import('react');
  return {
    ...actual,
    useEffect: vi.fn(),
    useState: <T,>(initial: T) => [initial === true ? false : initial, vi.fn()],
  };
});
vi.mock('expo-router', () => ({ router: { replace: mocks.replace } }));
vi.mock('../ui/confirm-dialog', () => ({
  showConfirmDialog: mocks.showConfirmDialog,
}));
vi.mock('../ui/text', () => ({ Text: 'Text' }));
vi.mock('../ui/input', () => ({ Input: 'Input' }));
vi.mock('../ui/button', () => ({ Button: 'Button' }));
vi.mock('../ui/card', () => ({
  Card: 'Card',
  CardContent: 'CardContent',
  CardHeader: 'CardHeader',
  CardTitle: 'CardTitle',
}));
vi.mock('../../lib/native-passkey-client', () => ({
  isNativePasskeyAvailable: () => true,
}));
vi.mock('../../lib/auth-client', () => ({
  authClient: {
    passkey: {
      addPasskey: mocks.addPasskey,
      listUserPasskeys: vi.fn(),
    },
    signOut: mocks.signOut,
  },
}));
vi.mock('expo-modules-core', () => ({
  requireOptionalNativeModule: () => ({}),
}));
vi.mock('uniwind', () => ({ useCSSVariable: () => '#111827' }));

import { PasskeySection } from './passkey-section';

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [
    node,
    ...Children.toArray(node.props.children as ReactNode).flatMap(child =>
      elements(child)
    ),
  ];
}

describe('PasskeySection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.addPasskey.mockResolvedValue({
      error: { code: 'SESSION_NOT_FRESH', message: 'Session is not fresh' },
    });
    mocks.signOut.mockResolvedValue({});
  });

  it('offers a secure sign-in restart when registration needs freshness', async () => {
    const tree = elements(PasskeySection());
    const addButton = tree.find(
      element =>
        element.type === 'Button' &&
        elements(element).some(
          child =>
            child.type === 'Text' && child.props.children === 'Add Passkey'
        )
    );

    await (addButton?.props.onPress as () => Promise<void>)();

    const dialog = mocks.showConfirmDialog.mock.calls[0]?.[0] as {
      onConfirm: () => void;
    };
    expect(dialog).toBeDefined();
    dialog.onConfirm();

    await vi.waitFor(() => expect(mocks.signOut).toHaveBeenCalledOnce());
    expect(mocks.replace).toHaveBeenCalledWith({
      pathname: '/(auth)/sign-in',
      params: { returnTo: '/settings/account' },
    });
  });
});
