vi.unmock('@groupi/shared/hooks');
vi.unmock('convex/_generated/api');
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Id } from 'convex/_generated/dataModel';
const state = vi.hoisted(() => ({
  status: {} as Record<string, unknown>,
  offer: vi.fn(),
  accept: vi.fn(),
  decline: vi.fn(),
  cancel: vi.fn(),
}));
vi.mock('convex/react', async () => {
  const { getFunctionName } = await import('convex/server');
  return {
    useQuery: () => state.status,
    useMutation: (ref: Parameters<typeof getFunctionName>[0]) => {
      const name = getFunctionName(ref).split(':')[1] as
        | 'offer'
        | 'accept'
        | 'decline'
        | 'cancel';
      return state[name];
    },
  };
});
vi.mock('react', async original => {
  const actual = await original<typeof import('react')>();
  return { ...actual, useState: (value: unknown) => [value, vi.fn()] };
});
vi.mock('@/components/ui/button', () => ({ Button: 'Button' }));
vi.mock('@/components/ui/text', () => ({ Text: 'Text' }));
import { EventOwnershipTransfer } from './event-ownership-transfer';
function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (!isValidElement<Record<string, unknown>>(node)) return [];
  return [
    node,
    ...Children.toArray(node.props.children as ReactNode).flatMap(elements),
  ];
}
const eventId = 'event' as Id<'events'>,
  ownerId = 'owner' as Id<'persons'>,
  recipientId = 'recipient' as Id<'persons'>;
const members = [
  { personId: recipientId, role: 'ATTENDEE', user: { name: 'Recipient' } },
];
describe('native ownership controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.status = {
      organizerId: ownerId,
      status: 'NONE',
      explanation:
        'Friends visibility follows the new Organizer after acceptance.',
    };
  });
  it('explains the audience consequence and names the intended recipient in an accessible offer button', async () => {
    const tree = elements(
      EventOwnershipTransfer({ eventId, personId: ownerId, members })
    );
    expect(tree.some(e => e.props.children === state.status.explanation)).toBe(
      true
    );
    const button = tree.find(
      e => e.props.accessibilityLabel === 'Offer ownership to Recipient'
    );
    expect(button).toBeDefined();
    await (button!.props.onPress as () => Promise<void>)();
    expect(state.offer).toHaveBeenCalledWith({ eventId, recipientId });
  });
  it('announces unresolved responsibility and exposes recipient accept and decline', async () => {
    state.status = {
      ...state.status,
      status: 'PENDING',
      recipientId,
      transferId: 'offer',
    };
    const tree = elements(
      EventOwnershipTransfer({ eventId, personId: recipientId, members })
    );
    expect(
      tree.find(e => e.props.accessibilityLiveRegion === 'polite')?.props
        .children
    ).toContain('current Organizer remains responsible');
    const buttons = tree.filter(e => typeof e.props.onPress === 'function');
    expect(buttons).toHaveLength(2);
    await (buttons[0].props.onPress as () => Promise<void>)();
    expect(state.accept).toHaveBeenCalledWith({ eventId, transferId: 'offer' });
    await (buttons[1].props.onPress as () => Promise<void>)();
    expect(state.decline).toHaveBeenCalledWith({
      eventId,
      transferId: 'offer',
    });
  });
});
