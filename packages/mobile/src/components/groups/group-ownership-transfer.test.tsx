import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { createElement, act, type ReactNode } from 'react';
import { it, expect, vi, beforeEach } from 'vitest';
import { getFunctionName } from 'convex/server';
import type { Id } from 'convex/_generated/dataModel';
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
    data: { user: { id: 'fixture-user' }, session: { id: 'fixture-session' } },
    isPending: false,
  },
}));
vi.mock('uniwind', () => ({
  withUniwind: (component: unknown) => component,
  useCSSVariable: () => '#333',
}));
vi.mock('@expo/vector-icons', () => ({ Ionicons: 'Icon' }));
vi.unmock('react');
vi.unmock('convex/react');
vi.unmock('@groupi/shared/hooks');
vi.unmock('convex/_generated/api');
vi.unmock('@convex-dev/better-auth/react');
vi.unmock('../../providers/convex-provider');
vi.mock('../../lib/convex', () => ({ convex: boundary }));
vi.mock('../../lib/auth-client', () => ({
  authClient: {
    useSession: () => boundary.session,
    convex: { token: async () => ({ data: { token: 'fixture-token' } }) },
  },
}));
import { Alert } from 'react-native';
import { ConvexClientProvider } from '../../providers/convex-provider';
import { GroupOwnershipTransfer } from './group-ownership-transfer';
import { GroupDetailScreen } from './group-screen';
const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  push: vi.fn(),
  back: vi.fn(),
}));
vi.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ groupId: 'group' }),
  router: navigation,
}));
const groupId = 'group' as Id<'groups'>;
let result: Record<string, unknown>,
  reject = false;
const observers = new Set<() => void>();
beforeEach(() => {
  vi.clearAllMocks();
  observers.clear();
  reject = false;
  result = {
    groupId,
    ownerId: 'owner',
    status: 'NONE',
    transferId: null,
    recipient: null,
    canOffer: true,
    canAccept: false,
    canDecline: false,
    canCancel: false,
    explanation:
      'The current owner remains responsible until acceptance. The former owner becomes Moderator. Independent Events stay unchanged.',
  };
  boundary.watchQuery.mockImplementation(reference => ({
    localQueryResult: () => {
      const name = getFunctionName(reference);
      if (name === 'groupTransfers/queries:status') return result;
      if (name === 'groups/queries:getGroup')
        return {
          _id: groupId,
          name: 'Readers',
          ownerId: 'owner',
          viewerRole: 'OWNER',
          memberCount: 2,
          canManageIdentity: true,
          canLeave: false,
        };
      if (name === 'groups/queries:listGroupMembers')
        return {
          page: [{ personId: 'recipient', name: 'Jordan', role: 'MEMBER' }],
          isDone: true,
          continueCursor: '',
        };
      return { page: [], isDone: true, continueCursor: '' };
    },
    onUpdate: (callback: () => void) => {
      observers.add(callback);
      return () => observers.delete(callback);
    },
    journal: () => undefined,
  }));
  boundary.setAuth.mockImplementation((_token, onChange) => onChange(true));
  boundary.mutation.mockImplementation(async reference => {
    if (reject) throw new Error('Recipient no longer eligible');
    const name = getFunctionName(reference);
    if (name.endsWith(':offer'))
      result = {
        ...result,
        status: 'PENDING',
        transferId: 'offer',
        canOffer: false,
        canCancel: true,
        recipient: { name: 'Jordan' },
      };
    else if (name.endsWith(':accept'))
      result = {
        ...result,
        status: 'ACCEPTED',
        ownerId: 'recipient',
        canAccept: false,
        canDecline: false,
      };
    else if (name.endsWith(':decline') || name.endsWith(':cancel'))
      result = {
        ...result,
        status: name.endsWith(':decline') ? 'DECLINED' : 'CANCELLED',
        canAccept: false,
        canDecline: false,
        canCancel: false,
      };
    observers.forEach(update => update());
    return result;
  });
});
async function mount(detail = false) {
  let mounted: Mounted | undefined;
  await act(async () => {
    mounted = renderer.create(
      createElement(
        ConvexClientProvider,
        null,
        createElement(detail ? GroupDetailScreen : GroupOwnershipTransfer, {
          groupId,
        })
      )
    );
  });
  return mounted!;
}
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
  expect(match).toBeDefined();
  return match!;
}
function announcement(mounted: Mounted) {
  return mounted.root.findAllByType('Text').map(text).join(' ');
}
it('offers a named member and announces pending responsibility using actual native provider, SDK and React state', async () => {
  const mounted = await mount();
  await act(async () => {
    await (
      button(mounted, 'Offer ownership to Jordan').props
        .onPress as () => Promise<void>
    )();
  });
  expect(getFunctionName(boundary.mutation.mock.calls[0][0])).toBe(
    'groupTransfers/mutations:offer'
  );
  expect(boundary.mutation.mock.calls[0][1]).toEqual({
    groupId,
    recipientId: 'recipient',
  });
  expect(announcement(mounted)).toContain('current owner remains responsible');
  await act(async () => {
    await (
      button(mounted, 'Cancel offer').props.onPress as () => Promise<void>
    )();
  });
  expect(announcement(mounted)).toContain('cancelled');
  await act(async () => mounted.unmount());
});
it('recipient accept/decline controls use the observed offer; failed acceptance stays pending', async () => {
  result = {
    ...result,
    status: 'PENDING',
    transferId: 'offer',
    canOffer: false,
    canAccept: true,
    canDecline: true,
  };
  const mounted = await mount();
  reject = true;
  await act(async () => {
    await (
      button(mounted, 'Accept ownership').props.onPress as () => Promise<void>
    )();
  });
  expect(announcement(mounted)).toContain('no longer eligible');
  expect(announcement(mounted)).toContain('pending');
  reject = false;
  await act(async () => {
    await (
      button(mounted, 'Decline ownership').props.onPress as () => Promise<void>
    )();
  });
  expect(announcement(mounted)).toContain('declined');
  expect(boundary.mutation.mock.calls[1][1]).toEqual({
    groupId,
    transferId: 'offer',
  });
  await act(async () => mounted.unmount());
});
it('accepted responsibility updates the accessible status and explicit retirement returns to stable landing', async () => {
  result = {
    ...result,
    status: 'PENDING',
    transferId: 'offer',
    canOffer: false,
    canAccept: true,
    canDecline: true,
  };
  let mounted = await mount();
  await act(async () => {
    await (
      button(mounted, 'Accept ownership').props.onPress as () => Promise<void>
    )();
  });
  expect(announcement(mounted)).toContain('accepted');
  await act(async () => mounted.unmount());
  mounted = await mount(true);
  await act(async () => {
    (button(mounted, 'Delete Group').props.onPress as () => void)();
  });
  expect(Alert.alert).toHaveBeenCalledWith(
    'Delete Group',
    expect.stringContaining('Independent Events'),
    expect.any(Array)
  );
  const controls = vi.mocked(Alert.alert).mock.calls[0][2];
  await act(async () => {
    await controls
      ?.find(control => control.text === 'Delete Group')
      ?.onPress?.();
  });
  expect(navigation.replace).toHaveBeenCalledWith('/g/group');
  expect(getFunctionName(boundary.mutation.mock.calls.at(-1)![0])).toBe(
    'groups/mutations:deleteGroup'
  );
  await act(async () => mounted.unmount());
});
it('requires the actual SDK provider', async () => {
  let failure: unknown;
  try {
    await act(async () => {
      renderer.create(createElement(GroupOwnershipTransfer, { groupId }));
    });
  } catch (error) {
    failure = error;
  }
  expect(failure).toBeInstanceOf(Error);
  expect((failure as Error).message).toContain('Could not find Convex client');
});
