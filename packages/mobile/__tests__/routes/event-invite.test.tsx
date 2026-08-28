import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  sentInvites: [
    { inviteId: 'sent-1', status: 'PENDING' },
    { inviteId: 'sent-2', status: 'ACCEPTED' },
  ],
  friends: [{ personId: 'person-1' }],
  members: { event: { memberships: [] } },
}));

vi.mock('react', async importOriginal => {
  const actual = (await importOriginal()) as typeof import('react');
  return { ...actual, useState: <T,>(initial: T) => [initial, vi.fn()] };
});
vi.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ eventId: 'event-123' }),
}));
vi.mock('convex/react', () => ({ useQuery: mocks.useQuery }));
vi.mock('convex/_generated/api', () => ({
  api: {
    invites: { queries: { getEventInvites: 'getEventInvites' } },
    events: { queries: { getEventHeader: 'getEventHeader' } },
  },
}));
vi.mock('uniwind', () => ({ useCSSVariable: () => '#8000aa' }));
vi.mock('../../src/hooks/use-event-invites', () => ({
  useSentEventInvites: () => mocks.sentInvites,
}));
vi.mock('../../src/hooks/use-friends', () => ({
  useFriendsList: () => mocks.friends,
}));
vi.mock('../../src/hooks/use-events', () => ({
  useEventMembers: () => mocks.members,
}));
vi.mock('../../src/components/invites/email-invite-panel', () => ({
  EmailInvitePanel: 'EmailInvitePanel',
}));
vi.mock('../../src/components/invites/link-invite-panel', () => ({
  LinkInvitePanel: 'LinkInvitePanel',
}));
vi.mock('../../src/components/invites/people-invite-panel', () => ({
  PeopleInvitePanel: 'PeopleInvitePanel',
}));
vi.mock('../../src/components/invites/invite-skeleton', () => ({
  InviteSkeleton: 'InviteSkeleton',
}));
vi.mock('../../src/components/molecules/tab-bar-filter', () => ({
  TabBarFilter: 'TabBarFilter',
}));
vi.mock('../../src/components/ui/back-button', () => ({
  BackButton: 'BackButton',
}));
vi.mock('../../src/components/ui/safe-area-view', () => ({
  SafeAreaView: 'SafeAreaView',
}));

import InviteScreen from '../../app/event/[eventId]/invite';

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (
    node === null ||
    node === undefined ||
    typeof node === 'string' ||
    typeof node === 'number' ||
    typeof node === 'boolean'
  ) {
    return [];
  }
  if (!isValidElement<Record<string, unknown>>(node)) {
    return Children.toArray(node).flatMap(elements);
  }
  return [node, ...elements(node.props.children as ReactNode)];
}

describe('event invite screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useQuery.mockImplementation((query: string) => {
      if (query === 'getEventHeader') {
        return {
          event: { title: 'Launch Party' },
          userMembership: { role: 'ORGANIZER' },
        };
      }
      return {
        invites: [
          { _id: 'link-1', hasEmail: false },
          { _id: 'email-1', hasEmail: true },
        ],
        pendingEmailCount: 1,
      };
    });
  });

  it('presents the three mobile invite methods with live counts', () => {
    const tree = elements(InviteScreen());
    const tabs = tree.find(element => element.type === 'TabBarFilter');

    expect(tabs?.props.tabs).toEqual([
      { key: 'link', label: 'Link', badge: 1 },
      { key: 'people', label: 'People', badge: 1 },
      { key: 'email', label: 'Email', badge: 1 },
    ]);
    expect(tree.some(element => element.type === 'LinkInvitePanel')).toBe(true);
  });

  it('shows a purpose-built skeleton while invite data loads', () => {
    mocks.useQuery.mockReturnValue(undefined);

    const tree = elements(InviteScreen());

    expect(tree.some(element => element.type === 'InviteSkeleton')).toBe(true);
    expect(tree.some(element => element.type === 'TabBarFilter')).toBe(false);
  });
});
