import { Suspense } from 'react';
import {
  act,
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventDeleteCard } from '@/app/(event)/event/[eventId]/settings/components/event-delete-card';
import EventSettingsLayout from '@/app/(event)/event/[eventId]/settings/layout';
import EventOwnershipSettingsPage from '@/app/(event)/event/[eventId]/settings/ownership/page';

const fixture = vi.hoisted(() => ({
  role: 'ORGANIZER',
  pathname: '/event/event/settings/ownership',
  remove: vi.fn().mockResolvedValue(undefined),
  push: vi.fn(),
  ownership: vi.fn(),
}));
vi.mock('@/app/(event)/event/[eventId]/context', () => ({
  useEventData: () => ({
    headerData: {
      event: { _id: 'event' },
      userMembership: { role: fixture.role, person: { _id: 'person' } },
    },
    membersData: null,
  }),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: fixture.push }),
  usePathname: () => fixture.pathname,
}));
vi.mock('@/components/auth/auth-wrappers', () => ({
  EventMemberOnly: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  EventOrganizerOnly: ({
    children,
    fallback,
  }: {
    children: React.ReactNode;
    fallback: React.ReactNode;
  }) => (fixture.role === 'ATTENDEE' ? <>{fallback}</> : <>{children}</>),
}));
vi.mock(
  '@/app/(event)/event/[eventId]/settings/components/event-settings-nav',
  () => ({ EventSettingsNav: () => <nav>Management navigation</nav> })
);
vi.mock('@/hooks/mutations/use-delete-event', () => ({
  useDeleteEvent: () => fixture.remove,
}));
vi.mock('@/components/templates', () => ({
  SettingsPageTemplate: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));
vi.mock('@/components/organisms/event-ownership-transfer', () => ({
  EventOwnershipTransfer: (props: unknown) => {
    fixture.ownership(props);
    return <div>Ownership controls</div>;
  },
}));
afterEach(cleanup);
beforeEach(() => {
  fixture.role = 'ORGANIZER';
  vi.clearAllMocks();
});

describe('event settings management', () => {
  it.each([
    ['/event/event/settings/ownership', true],
    ['/event/event/settings/details', false],
    ['/event/event/settings/permissions', false],
    ['/event/event/settings/ownership/other', false],
  ])(
    'limits attendee settings access to the exact ownership route %s',
    async (pathname, allowed) => {
      fixture.role = 'ATTENDEE';
      fixture.pathname = pathname;
      const params = Promise.resolve({ eventId: 'event' });
      await act(async () => {
        render(
          <Suspense>
            <EventSettingsLayout params={params}>
              <p>Settings content</p>
            </EventSettingsLayout>
          </Suspense>
        );
      });
      expect(Boolean(screen.queryByText('Settings content'))).toBe(allowed);
      expect(
        screen.queryByText('Management navigation')
      ).not.toBeInTheDocument();
    }
  );

  it.each(['MODERATOR', 'ATTENDEE'])('does not expose deletion to %s', role => {
    fixture.role = role;
    render(<EventDeleteCard />);
    expect(
      screen.queryByRole('button', { name: 'Delete Event' })
    ).not.toBeInTheDocument();
  });

  it('requires confirmation and permits cancellation without deleting', () => {
    render(<EventDeleteCard />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Event' }));
    expect(
      screen.getByRole('dialog', { name: 'Delete Event?' })
    ).toBeInTheDocument();
    expect(fixture.remove).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(fixture.remove).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('deletes the current event only after confirming', async () => {
    render(<EventDeleteCard />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Event' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() =>
      expect(fixture.remove).toHaveBeenCalledExactlyOnceWith('event')
    );
    expect(fixture.push).toHaveBeenCalledWith('/events');
  });

  it('keeps ownership responses available to members whose roster is restricted', () => {
    fixture.role = 'ATTENDEE';
    render(<EventOwnershipSettingsPage />);
    expect(screen.getByText('Ownership controls')).toBeInTheDocument();
    expect(fixture.ownership).toHaveBeenCalledWith({
      eventId: 'event',
      personId: 'person',
      members: [],
    });
  });
});
