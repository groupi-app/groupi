import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { createElement, act, type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
import { ConvexClientProvider } from '../../providers/convex-provider';
import { EventOwnershipTransfer } from './event-ownership-transfer';
const eventId = 'event' as Id<'events'>,
  ownerId = 'owner' as Id<'persons'>,
  recipientId = 'recipient' as Id<'persons'>;
const members = [
  { personId: recipientId, role: 'ATTENDEE', user: { name: 'Recipient' } },
];
let result: Record<string, unknown>;
const observers = new Set<() => void>();
beforeEach(() => {
  vi.clearAllMocks();
  observers.clear();
  result = {
    eventId,
    organizerId: ownerId,
    status: 'NONE',
    transferId: null,
    explanation:
      'Friends visibility follows the new Organizer after acceptance.',
  };
  boundary.watchQuery.mockImplementation(() => ({
    localQueryResult: () => result,
    onUpdate: (callback: () => void) => {
      observers.add(callback);
      return () => observers.delete(callback);
    },
    journal: () => undefined,
  }));
  boundary.setAuth.mockImplementation((_token, onChange) => onChange(true));
  boundary.mutation.mockImplementation(async reference => {
    result = getFunctionName(reference).endsWith(':offer')
      ? { ...result, recipientId, transferId: 'offer', status: 'PENDING' }
      : { ...result, organizerId: recipientId, status: 'ACCEPTED' };
    for (const update of observers) update();
    return result;
  });
});
async function mount(personId: Id<'persons'>) {
  let mounted: Mounted | undefined;
  await act(async () => {
    mounted = renderer.create(
      createElement(
        ConvexClientProvider,
        null,
        createElement(EventOwnershipTransfer, { eventId, personId, members })
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
  expect(match?.props.role).toBe('button');
  return match!;
}
describe('mounted native ownership with the production authenticated provider and SDK', () => {
  it('renders an accessible named offer and announces unresolved responsibility after submission', async () => {
    const mounted = await mount(ownerId);
    expect(
      mounted.root
        .findAllByType('Text')
        .some(host => text(host).includes('Friends visibility follows'))
    ).toBe(true);
    await act(async () => {
      await (
        button(mounted, 'Offer ownership to Recipient').props
          .onPress as () => Promise<void>
      )();
    });
    const [reference, args] = boundary.mutation.mock.calls[0];
    expect(getFunctionName(reference)).toBe('eventTransfers/mutations:offer');
    expect(args).toEqual({ eventId, recipientId });
    const announcement = mounted.root
      .findAllByType('Text')
      .find(host => host.props.accessibilityLiveRegion === 'polite');
    expect(text(announcement!)).toContain(
      'current Organizer remains responsible'
    );
    expect(button(mounted, 'Cancel offer')).toBeDefined();
    await act(async () => mounted.unmount());
  });
  it('mounts recipient accept/decline controls and updates their accessibility state after consent', async () => {
    result = { ...result, status: 'PENDING', recipientId, transferId: 'offer' };
    const mounted = await mount(recipientId);
    expect(button(mounted, 'Decline offer')).toBeDefined();
    expect(
      mounted.root
        .findAllByType('Pressable')
        .some(host => text(host) === 'Cancel offer')
    ).toBe(false);
    await act(async () => {
      await (
        button(mounted, 'Accept ownership').props.onPress as () => Promise<void>
      )();
    });
    const [reference, args] = boundary.mutation.mock.calls[0];
    expect(getFunctionName(reference)).toBe('eventTransfers/mutations:accept');
    expect(args).toEqual({ eventId, transferId: 'offer' });
    const announcement = mounted.root
      .findAllByType('Text')
      .find(host => host.props.accessibilityLiveRegion === 'polite');
    expect(text(announcement!)).toContain('accepted');
    expect(
      mounted.root
        .findAllByType('Pressable')
        .some(host => text(host) === 'Accept ownership')
    ).toBe(false);
    await act(async () => mounted.unmount());
  });
  it('requires the actual provider rather than a mocked hook or React state', async () => {
    let failure: unknown;
    try {
      await act(async () => {
        renderer.create(
          createElement(EventOwnershipTransfer, {
            eventId,
            personId: ownerId,
            members,
          })
        );
      });
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(Error);
    expect((failure as Error).message).toContain(
      'Could not find Convex client'
    );
  });
});
