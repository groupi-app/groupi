import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  loadMore: vi.fn(),
  posts: [{ _id: 'post-1', title: 'First post' }],
}));

vi.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ eventId: 'event-123' }),
}));
vi.mock('convex/react', () => ({ useQuery: mocks.useQuery }));
vi.mock('convex/_generated/api', () => ({
  api: {
    events: {
      queries: {
        getEventHeader: 'getEventHeader',
        getEventAttendeesData: 'getEventAttendeesData',
      },
    },
  },
}));
vi.mock('../../src/hooks/use-paginated-event-posts', () => ({
  usePaginatedEventPosts: () => ({
    results: mocks.posts,
    status: 'CanLoadMore',
    loadMore: mocks.loadMore,
  }),
}));
vi.mock('../../src/hooks/use-addons', () => ({
  useEventAddons: () => [],
}));
vi.mock('../../src/lib/event-access-policy', () => ({
  canRoleViewAttendeeList: () => true,
}));
vi.mock('../../src/components/events/event-header', () => ({
  EventHeader: 'EventHeader',
}));
vi.mock('../../src/components/events/member-list', () => ({
  MemberList: 'MemberList',
}));
vi.mock('../../src/components/posts/post-feed', () => ({
  PostFeed: 'PostFeed',
}));
vi.mock('../../src/components/events/event-detail-skeleton', () => ({
  EventDetailSkeleton: 'EventDetailSkeleton',
}));
vi.mock('../../src/components/addons/event-addons-section', () => ({
  EventAddonsSection: 'EventAddonsSection',
}));
vi.mock('../../src/components/ui/back-button', () => ({
  BackButton: 'BackButton',
}));
vi.mock('../../src/components/ui/empty-state', () => ({
  EmptyState: 'EmptyState',
}));
vi.mock('../../src/components/ui/safe-area-view', () => ({
  SafeAreaView: 'SafeAreaView',
}));

import EventDetailScreen from '../../app/event/[eventId]/index';

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  if (!isValidElement<Record<string, unknown>>(node)) {
    return Children.toArray(node).flatMap(elements);
  }
  return [node, ...elements(node.props.children as ReactNode)];
}

describe('event detail post feed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useQuery.mockImplementation((query: string) => {
      if (query === 'getEventHeader') {
        return {
          event: { _id: 'event-123', title: 'Launch Party' },
          userMembership: {
            role: 'ORGANIZER',
            person: { _id: 'person-current' },
          },
          permissions: {
            createPosts: 'EVERYONE',
            inviteMembers: 'MODERATOR',
            viewAttendeeList: 'EVERYONE',
          },
        };
      }
      return { event: { memberships: [] } };
    });
  });

  it('uses one continuous virtualized feed and forwards cursor state', () => {
    const screen = EventDetailScreen();
    const tree = elements(screen);
    const feed = tree.find(element => element.type === 'PostFeed');

    expect(feed).toBeDefined();
    expect(feed?.props.posts).toBe(mocks.posts);
    expect(feed?.props.status).toBe('CanLoadMore');
    expect(feed?.props.loadMore).toBe(mocks.loadMore);
    expect(feed?.props.currentPersonId).toBe('person-current');
    expect(feed?.props.userRole).toBe('ORGANIZER');
    expect(feed?.props.eventPermissions).toEqual({
      createPosts: 'EVERYONE',
      inviteMembers: 'MODERATOR',
      viewAttendeeList: 'EVERYONE',
    });
    expect(tree.some(element => element.type === 'ScrollView')).toBe(false);
  });
});
