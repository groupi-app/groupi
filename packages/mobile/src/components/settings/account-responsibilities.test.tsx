import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { createElement, act, type ReactNode } from 'react';
import { beforeEach, expect, it, vi } from 'vitest';
import { getFunctionName } from 'convex/server';
import { setToastAdapter } from '@groupi/shared/platform';
const require = createRequire(import.meta.url);
interface Host {
  props: Record<string, unknown>;
  children: (Host | string)[];
}
interface Mounted {
  root: { findAllByType: (type: string) => Host[] };
  unmount: () => void;
}
const renderer = require(
  require.resolve('react-test-renderer', {
    paths: [
      dirname(require.resolve('@testing-library/react-native/package.json')),
    ],
  })
) as { create: (element: ReactNode) => Mounted };
const boundary = vi.hoisted(() => ({
  watchQuery: vi.fn(),
  mutation: vi.fn(),
  setAuth: vi.fn(),
  clearAuth: vi.fn(),
  session: {
    data: { user: { id: 'owner' }, session: { id: 'session' } },
    isPending: false,
  },
}));
vi.unmock('react');
vi.unmock('convex/react');
vi.unmock('@groupi/shared/hooks');
vi.unmock('convex/_generated/api');
vi.unmock('@convex-dev/better-auth/react');
vi.unmock('../../providers/convex-provider');
vi.mock('uniwind', () => ({
  withUniwind: (component: unknown) => component,
  useCSSVariable: () => 'currentColor',
}));
vi.mock('../../lib/convex', () => ({ convex: boundary }));
vi.mock('../../lib/auth-client', () => ({
  signOut: vi.fn().mockResolvedValue(undefined),
  authClient: {
    useSession: () => boundary.session,
    convex: { token: async () => ({ data: { token: 'token' } }) },
  },
}));
vi.mock('../../context/global-user-context', () => ({
  useGlobalUser: () => ({ user: { username: 'owner' } }),
}));
// The surrounding settings sections are independently tested; keep the real account flow and Convex hooks mounted.
vi.mock('./username-section', () => ({ UsernameSection: () => null }));
vi.mock('./email-section', () => ({ EmailSection: () => null }));
vi.mock('./linked-accounts-section', () => ({
  LinkedAccountsSection: () => null,
}));
vi.mock('./passkey-section', () => ({ PasskeySection: () => null }));
vi.mock('./api-keys-section', () => ({ ApiKeysSection: () => null }));
import { ConvexClientProvider } from '../../providers/convex-provider';
import AccountSettingsScreen from '../../../app/settings/account';
let queryFailure = false;
let owned = true,
  pending = false;
const observers = new Set<() => void>();
beforeEach(() => {
  setToastAdapter({
    show: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  });
  vi.clearAllMocks();
  observers.clear();
  queryFailure = false;
  owned = true;
  pending = false;
  boundary.watchQuery.mockImplementation((reference, args) => {
    if (queryFailure) throw new Error('Ownership unavailable');
    return {
      localQueryResult: () =>
        getFunctionName(reference).endsWith(':readiness')
          ? { hasOwnedGroups: false, hasOwnedEvents: owned, canDelete: !owned }
          : getFunctionName(reference).endsWith(':recipients')
            ? {
                page: [{ personId: 'recipient', label: 'Recipient' }],
                isDone: true,
                continueCursor: '',
              }
            : {
                page:
                  args.kind === 'EVENT' && owned
                    ? [
                        {
                          kind: 'EVENT',
                          id: 'event',
                          title: 'Owned gathering',
                          status: pending ? 'PENDING' : 'NONE',
                          transferId: pending ? 'offer' : null,
                          recipientId: pending ? 'recipient' : null,
                          resolved: false,
                        },
                      ]
                    : [],
                isDone: true,
                continueCursor: '',
              },
      onUpdate: (callback: () => void) => {
        observers.add(callback);
        return () => observers.delete(callback);
      },
      journal: () => undefined,
    };
  });
  boundary.setAuth.mockImplementation((_fetch, onChange) => onChange(true));
  boundary.mutation.mockImplementation(async reference => {
    const name = getFunctionName(reference);
    if (name.endsWith(':offer')) pending = true;
    if (name.endsWith(':deleteOwnedEvent')) owned = false;
    for (const update of observers) update();
    return { success: true };
  });
});
function text(host: Host): string {
  return host.children
    .map(child => (typeof child === 'string' ? child : text(child)))
    .join('');
}
function button(mounted: Mounted, label: string) {
  const match = mounted.root
    .findAllByType('Pressable')
    .find(
      host => host.props.accessibilityLabel === label || text(host) === label
    );
  expect(match?.props.accessibilityRole ?? match?.props.role).toBe('button');
  return match!;
}
it('mounts the actual native account screen and app SDK; accepted/deleted progress unlocks final deletion but a pending offer does not', async () => {
  let mounted: Mounted | undefined;
  await act(async () => {
    mounted = renderer.create(
      createElement(
        ConvexClientProvider,
        null,
        createElement(AccountSettingsScreen)
      )
    );
  });
  await act(async () => {
    (button(mounted!, 'Delete Account').props.onPress as () => void)();
  });
  const input = mounted!.root
    .findAllByType('TextInput')
    .find(host =>
      String(host.props.accessibilityLabel).includes('Type owner')
    )!;
  await act(async () => {
    (input.props.onChangeText as (value: string) => void)('owner');
  });
  expect(button(mounted!, 'Delete Forever').props.disabled).toBe(true);
  await act(async () => {
    await (
      button(mounted!, 'Offer transfer to Recipient').props
        .onPress as () => Promise<void>
    )();
  });
  expect(button(mounted!, 'Delete Forever').props.disabled).toBe(true);
  expect(
    mounted!.root
      .findAllByType('Text')
      .some(host => text(host).includes('Pending acceptance'))
  ).toBe(true);
  await act(async () => {
    (button(mounted!, 'Delete Event').props.onPress as () => void)();
  });
  await act(async () => {
    await (
      button(mounted!, 'Confirm resource deletion').props
        .onPress as () => Promise<void>
    )();
  });
  expect(button(mounted!, 'Delete Forever').props.disabled).toBe(false);
  await act(async () => {
    await (
      button(mounted!, 'Delete Forever').props.onPress as () => Promise<void>
    )();
  });
  expect(
    boundary.mutation.mock.calls.map(([ref]) => getFunctionName(ref))
  ).toEqual([
    'eventTransfers/mutations:offer',
    'accountResolution/mutations:deleteOwnedEvent',
    'users/mutations:deleteUserAccount',
  ]);
  await act(async () => mounted!.unmount());
});

it('recovers unavailable ownership through an accessible retry on the actual account screen', async () => {
  queryFailure = true;
  vi.spyOn(console, 'error').mockImplementation(() => {});
  let mounted: Mounted | undefined;
  await act(async () => {
    mounted = renderer.create(
      createElement(
        ConvexClientProvider,
        null,
        createElement(AccountSettingsScreen)
      )
    );
  });
  expect(
    mounted!.root
      .findAllByType('Text')
      .some(
        host =>
          host.props.accessibilityRole === 'alert' &&
          text(host).includes('ownership')
      )
  ).toBe(true);
  queryFailure = false;
  await act(async () => {
    (button(mounted!, 'Retry ownership check').props.onPress as () => void)();
  });
  expect(button(mounted!, 'Delete Account')).toBeDefined();
  await act(async () => mounted!.unmount());
  vi.restoreAllMocks();
});
