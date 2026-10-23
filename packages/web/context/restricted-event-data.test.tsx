import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useQuery } from 'convex/react';
import {
  EventDataProvider,
  useEventData,
} from '@/app/(event)/event/[eventId]/context/event-data-context';
import { useEventAttendeesData } from '@/hooks/convex/use-events';
import EventPage from '@/app/(event)/event/[eventId]/page';

vi.mock('next/navigation', () => ({ useParams: () => ({}) }));
vi.mock('@/convex/_generated/api', () => ({
  api: {
    events: {
      queries: { getEventHeader: 'header', getEventAttendeesData: 'attendees' },
    },
  },
}));
vi.mock('@/hooks/convex', async () => import('@/hooks/convex/use-events'));
vi.mock('@/hooks/convex/use-availability', () => ({
  useEventAvailabilityDataWithSkip: () => ({}),
}));
vi.mock('@/hooks/convex/use-posts', () => ({
  usePostDetailWithSkip: () => undefined,
  useEventPostFeedWithSkip: () => ({}),
}));
vi.mock('@/hooks/convex/use-replies', () => ({
  useRepliesByPostWithSkip: () => undefined,
}));
vi.mock('@/context/global-user-context', () => ({
  useGlobalUser: () => ({ isLoading: false }),
}));
vi.mock('@/app/(event)/event/[eventId]/components/event-header', () => ({
  EventHeader: () => <div>Event content</div>,
}));
vi.mock('@/app/(event)/event/[eventId]/components/member-list', () => ({
  MemberList: () => <div>Roster</div>,
}));
vi.mock('@/app/(event)/event/[eventId]/components/post-feed', () => ({
  PostFeed: () => <div>Discussion</div>,
}));
vi.mock('@/components/organisms/event-ownership-transfer', () => ({
  EventOwnershipTransfer: () => null,
}));
vi.mock('@/features/addons/runtime', () => ({
  EventAddons: () => <div>Add-ons</div>,
}));
vi.mock('@/components/new-post-button', () => ({ NewPostButton: () => null }));
vi.mock('@/components/skeletons', () => ({
  EventPageSkeleton: () => <div>Loading event</div>,
}));

let role = 'ATTENDEE';
let headerLoading = false;
function State() {
  const { isMembersLoading, membersData } = useEventData();
  return (
    <div>
      {isMembersLoading
        ? 'Loading roster'
        : membersData === null
          ? 'Restricted roster'
          : 'Roster ready'}
    </div>
  );
}
beforeEach(() => {
  role = 'ATTENDEE';
  headerLoading = false;
  vi.mocked(useQuery).mockImplementation((query, args = undefined) => {
    if (args === 'skip') return undefined;
    if (String(query) === 'header')
      return headerLoading
        ? undefined
        : {
            event: { _id: 'event-1' },
            userMembership: { role, person: { _id: 'person-1' } },
            permissions: {
              viewAttendeeList: 'ORGANIZER',
              createPosts: 'EVERYONE',
              inviteMembers: 'MODERATOR',
            },
          };
    if (String(query) === 'attendees') {
      if (headerLoading || role !== 'ORGANIZER')
        throw new Error('You do not have permission to view the attendee list');
      return { event: { memberships: [] } };
    }
  });
});
afterEach(cleanup);
it('renders the joined event and add-ons without querying a restricted roster or loading forever', () => {
  render(
    <EventDataProvider eventId='event-1'>
      <EventPage />
      <State />
    </EventDataProvider>
  );
  expect(screen.getByText('Event content')).toBeInTheDocument();
  expect(screen.getByText('Discussion')).toBeInTheDocument();
  expect(screen.getByText('Add-ons')).toBeInTheDocument();
  expect(screen.getByText('Restricted roster')).toBeInTheDocument();
  expect(screen.queryByText('Roster')).not.toBeInTheDocument();
  expect(screen.queryByText('Loading event')).not.toBeInTheDocument();
});
it('waits for permissions and drops roster data when permission is revoked', () => {
  headerLoading = true;
  const view = render(
    <EventDataProvider eventId='event-1'>
      <State />
    </EventDataProvider>
  );
  expect(screen.getByText('Loading roster')).toBeInTheDocument();
  headerLoading = false;
  role = 'ORGANIZER';
  view.rerender(
    <EventDataProvider eventId='event-1'>
      <State />
    </EventDataProvider>
  );
  expect(screen.getByText('Roster ready')).toBeInTheDocument();
  role = 'ATTENDEE';
  view.rerender(
    <EventDataProvider eventId='event-1'>
      <State />
    </EventDataProvider>
  );
  expect(screen.getByText('Restricted roster')).toBeInTheDocument();
});

it('protects direct roster consumers such as add-on pages', () => {
  function DirectConsumer() {
    const data = useEventAttendeesData(
      'event-1' as import('@/convex/_generated/dataModel').Id<'events'>
    );
    return (
      <div>{data === null ? 'Restricted add-on roster' : 'Roster data'}</div>
    );
  }
  render(<DirectConsumer />);
  expect(screen.getByText('Restricted add-on roster')).toBeInTheDocument();
});
