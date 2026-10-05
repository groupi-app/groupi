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
  return {
    ...actual,
    useState: <T,>(initial: T) => [initial, vi.fn()],
    useRef: <T,>(initial: T) => ({ current: initial }),
    useCallback: <T,>(callback: T) => callback,
  };
});
vi.mock('@react-navigation/native', () => ({ usePreventRemove: vi.fn() }));
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
  EMPTY_PEOPLE_INVITE_DRAFT: { searchTerm: '', role: 'ATTENDEE', message: '' },
}));
vi.mock('../../src/components/invites/from-list-panel', () => ({
  FromListPanel: 'FromListPanel',
  EMPTY_INVITE_RECIPIENT_DRAFT: {
    listIds: [],
    snapshots: {},
    people: [],
    error: '',
  },
}));
vi.mock('../../src/hooks/use-invite-lists', () => ({
  useSendInviteListRecipients: () => vi.fn(),
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
vi.mock('../../src/components/ui/empty-state', () => ({
  EmptyState: 'EmptyState',
}));

import InviteScreen, { InviteContent } from '../../app/event/[eventId]/invite';

describe('event invite screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useQuery.mockImplementation((query: string) => {
      if (query === 'getEventHeader') {
        return {
          event: { title: 'Launch Party' },
          userMembership: { role: 'ORGANIZER' },
          permissions: {
            createPosts: 'EVERYONE',
            inviteMembers: 'MODERATOR',
            viewAttendeeList: 'EVERYONE',
          },
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

  it('keeps permission reads below the content owner to preserve protected recovery state', () => {
    const content = InviteScreen();
    expect(content.type).toBe(InviteContent);
    expect(content.props).toMatchObject({
      eventId: 'event-123',
      loadAccess: true,
    });
    expect(mocks.useQuery).not.toHaveBeenCalled();
  });
});
