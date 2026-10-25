import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConvexReactClient } from 'convex/react';
import { getFunctionName } from 'convex/server';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { useState, createElement } from 'react';
vi.unmock('convex/react');
vi.unmock('@/convex/_generated/api');
vi.unmock('@groupi/shared/hooks');
vi.unmock('@convex-dev/better-auth/react');
const transport = vi.hoisted(() => ({
  push: vi.fn(),
  mutation: vi.fn(),
  watches: vi.fn(),
  events: [] as Record<string, unknown>[] | undefined,
  entryAction: 'JOIN',
  admissionPolicy: 'DIRECT',
  error: false,
  observers: new Set<() => void>(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: transport.push }),
  useParams: () => ({ eventId: 'event-123' }),
}));
vi.mock('@/lib/convex', () => ({ isDevelopment: false }));
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: () => ({
      data: { user: { id: 'reader' }, session: { id: 'session' } },
      isPending: false,
    }),
    convex: { token: async () => ({ data: { token: 'test-token' } }) },
  },
}));
import { ConvexClientProvider } from '@/providers/convex-provider';
import { useDiscoverableEvents } from '@/hooks/convex/use-event-admission';
import { DiscoverTab } from '@/app/(myEvents)/events/components/discover-tab';
import EventPreviewPage from '@/app/(eventPreview)/event/[eventId]/preview/page';
const summary = {
  eventId: 'event-123',
  title: 'Book club picnic',
  description: 'Bring lunch',
  location: 'Garden',
  chosenDateTime: null,
  chosenEndDateTime: null,
  imageUrl: null,
  memberCount: 3,
  createdAt: 1,
  organizer: null,
  admissionPolicy: 'DIRECT',
  accessReasons: {
    friends: false,
    groups: [{ groupId: 'group-123', name: 'Book club' }],
  },
  entryAction: 'JOIN',
};
const logistics = () => ({
  event: {
    _id: 'event-123',
    title: 'Book club picnic',
    description: 'Bring lunch',
    location: 'Garden',
    timezone: 'UTC',
    visibility: 'PRIVATE',
    admissionPolicy: transport.admissionPolicy,
    chosenDateTime: null,
    chosenEndDateTime: null,
    imageUrl: null,
    potentialDateTimeOptions: [],
  },
  organizer: null,
  entryAction: transport.entryAction,
});
function Discovery() {
  const events = useDiscoverableEvents();
  return <DiscoverTab events={events} />;
}
function Routes() {
  const [path, setPath] = useState('/events');
  return (
    <div
      onClickCapture={event => {
        const anchor = (event.target as HTMLElement).closest('a');
        if (anchor) {
          event.preventDefault();
          setPath(anchor.getAttribute('href')!);
        }
      }}
    >
      {path.startsWith('/events') ? <Discovery /> : <EventPreviewPage />}
    </div>
  );
}
function mount(component: () => React.ReactNode = Discovery) {
  return render(
    <ConvexClientProvider>{createElement(component)}</ConvexClientProvider>
  );
}
beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  transport.events = [summary];
  transport.entryAction = 'JOIN';
  transport.admissionPolicy = 'DIRECT';
  transport.error = false;
  transport.observers.clear();
  transport.mutation.mockResolvedValue({
    success: true,
    rsvpStatus: 'PENDING',
  });
  vi.spyOn(ConvexReactClient.prototype, 'watchQuery').mockImplementation(
    (...call) => {
      const [ref, args] = call;
      const name = getFunctionName(ref);
      transport.watches(name, args);
      return {
        localQueryResult: () => {
          if (transport.error) throw new Error('Private eligibility reason');
          return name === 'events/queries:getDiscoverableEvents'
            ? transport.events
            : name === 'events/queries:getEventLogistics'
              ? logistics()
              : name === 'eventApplications/queries:getForm'
                ? {
                    settings: {
                      questions: [],
                      reviewerPolicy: 'ORGANIZERS_AND_MODERATORS',
                    },
                    pending: null,
                    canApply: false,
                    canReview: false,
                  }
                : undefined;
        },
        onUpdate: (listener: () => void) => {
          transport.observers.add(listener);
          return () => transport.observers.delete(listener);
        },
        journal: () => undefined,
      };
    }
  );
  vi.spyOn(ConvexReactClient.prototype, 'mutation').mockImplementation(
    (...call) => {
      const [ref, args] = call;
      return transport.mutation(getFunctionName(ref), args);
    }
  );
  vi.spyOn(ConvexReactClient.prototype, 'setAuth').mockImplementation(
    (_token, callback) => callback?.(true)
  );
  vi.spyOn(ConvexReactClient.prototype, 'clearAuth').mockImplementation(
    () => {}
  );
});
afterEach(() => cleanup());
async function notify() {
  await act(async () => {
    for (const listener of transport.observers) listener();
  });
}
it('shows a Group-only Event once without friends and explains only the private current reason', async () => {
  mount();
  expect(screen.getByText('Shared with Book club')).toBeInTheDocument();
  expect(screen.queryByText('Friends Event')).not.toBeInTheDocument();
  expect(
    screen.getAllByRole('heading', { name: 'Book club picnic' })
  ).toHaveLength(1);
  expect(screen.getByRole('link', { name: 'View Event' })).toHaveAttribute(
    'href',
    '/event/event-123/preview'
  );
  expect(
    screen.queryByRole('button', { name: /join/i })
  ).not.toBeInTheDocument();
  expect(transport.mutation).not.toHaveBeenCalled();
  expect(transport.watches).toHaveBeenCalledWith(
    'events/queries:getDiscoverableEvents',
    {}
  );
});
it('updates only current overlapping reasons and removes an Event after all sources or independent admission remove it', async () => {
  transport.events = [
    {
      ...summary,
      accessReasons: {
        friends: true,
        groups: [
          { groupId: 'group-123', name: 'Book club' },
          { groupId: 'group-456', name: 'Walking club' },
        ],
      },
    },
  ];
  mount();
  expect(
    screen.getAllByRole('heading', { name: 'Book club picnic' })
  ).toHaveLength(1);
  expect(screen.getByText('Shared by a friend')).toBeInTheDocument();
  expect(screen.getByText('Shared with Walking club')).toBeInTheDocument();
  transport.events = [
    { ...summary, accessReasons: { friends: true, groups: [] } },
  ];
  await notify();
  expect(screen.queryByText('Shared with Book club')).not.toBeInTheDocument();
  expect(
    screen.queryByText('Shared with Walking club')
  ).not.toBeInTheDocument();
  expect(screen.getByText('Shared by a friend')).toBeInTheDocument();
  transport.events = [];
  await notify();
  expect(
    screen.queryByRole('heading', { name: 'Book club picnic' })
  ).not.toBeInTheDocument();
  expect(screen.getByText(/eligible Groups or Friends/)).toBeInTheDocument();
  expect(screen.queryByText(/Add more friends/)).not.toBeInTheDocument();
});
it('keeps loading distinct from a truthful no-friends empty state', async () => {
  transport.events = undefined;
  mount();
  expect(screen.getByRole('status')).toHaveTextContent('Loading shared Events');
  expect(screen.queryByText('No events to discover')).not.toBeInTheDocument();
  transport.events = [];
  await notify();
  expect(screen.getByText('No events to discover')).toBeInTheDocument();
  expect(screen.getByText(/eligible Groups or Friends/)).toBeInTheDocument();
});
it.each(['INVITATION_ONLY', 'UNAVAILABLE', 'APPLY'] as const)(
  'uses truthful %s card copy without offering a write before preview',
  action => {
    transport.events = [{ ...summary, entryAction: action }];
    mount();
    expect(
      screen.getByRole('link', { name: 'View Event' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /join|apply/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        action === 'INVITATION_ONLY'
          ? /An invitation is required/
          : action === 'APPLY'
            ? /preview to apply for approval/
            : /Joining is currently unavailable/
      )
    ).toBeInTheDocument();
    expect(transport.mutation).not.toHaveBeenCalled();
  }
);
it('opens safe Group-only preview first and joins only on its explicit Pending action', async () => {
  mount(Routes);
  await userEvent.click(screen.getByRole('link', { name: 'View Event' }));
  expect(
    screen.getByRole('heading', { name: 'Book club picnic', level: 1 })
  ).toBeInTheDocument();
  expect(transport.mutation).not.toHaveBeenCalled();
  expect(
    screen.getByText(/Joining leaves your RSVP Pending/)
  ).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Join Event' }));
  expect(transport.mutation).toHaveBeenCalledExactlyOnceWith(
    'events/mutations:joinDiscoverableEvent',
    { eventId: 'event-123' }
  );
  expect(transport.push).toHaveBeenCalledWith('/event/event-123');
  expect(
    transport.watches.mock.calls
      .map(([name]) => name)
      .every(
        name =>
          name === 'events/queries:getDiscoverableEvents' ||
          name === 'events/queries:getEventLogistics'
      )
  ).toBe(true);
});
it('does not admit through a stale preview and offers a return to current Discover', async () => {
  transport.mutation.mockRejectedValue(
    new Error('Joining is no longer available')
  );
  mount(Routes);
  await userEvent.click(screen.getByRole('link', { name: 'View Event' }));
  await userEvent.click(screen.getByRole('button', { name: 'Join Event' }));
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Joining is no longer available'
  );
  expect(transport.push).not.toHaveBeenCalled();
  expect(
    screen.getByRole('link', { name: 'Return to Discover' })
  ).toHaveAttribute('href', '/events?tab=discover');
  transport.entryAction = 'UNAVAILABLE';
  await notify();
  expect(
    screen.queryByRole('button', { name: 'Join Event' })
  ).not.toBeInTheDocument();
});
it('honors current independent member access after Group reasons are gone', async () => {
  mount(Routes);
  await userEvent.click(screen.getByRole('link', { name: 'View Event' }));
  transport.entryAction = 'MEMBER';
  transport.events = [];
  await notify();
  expect(
    screen.queryByRole('button', { name: 'Join Event' })
  ).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Open Event' })).toHaveAttribute(
    'href',
    '/event/event-123'
  );
  expect(transport.mutation).not.toHaveBeenCalled();
});

it('does not fabricate private Group or Friends reasons for a legacy summary without metadata', () => {
  const legacy: Record<string, unknown> = { ...summary };
  delete legacy.accessReasons;
  transport.events = [legacy];
  mount();
  expect(screen.queryByText('Shared with Book club')).not.toBeInTheDocument();
  expect(screen.queryByText('Shared by a friend')).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'View Event' })).toBeInTheDocument();
});

it('routes current Group-only Apply through its safe preview without joining', async () => {
  transport.events = [
    { ...summary, admissionPolicy: 'APPLY', entryAction: 'APPLY' },
  ];
  transport.entryAction = 'APPLY';
  transport.admissionPolicy = 'APPLY';
  mount(Routes);
  await userEvent.click(screen.getByRole('link', { name: 'View Event' }));
  expect(
    screen.queryByRole('button', { name: 'Join Event' })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole('link', { name: /Apply for approval/i })
  ).toHaveAttribute('href', '/event/event-123/apply');
  expect(transport.mutation).not.toHaveBeenCalled();
});
