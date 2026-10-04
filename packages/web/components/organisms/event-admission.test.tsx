import { createRequire } from 'node:module';
import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { getFunctionName } from 'convex/server';
import { ConvexProvider, ConvexReactClient, useMutation } from 'convex/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EventPreviewPage from '@/app/(eventPreview)/event/[eventId]/preview/page';
import { DiscoverTab } from '@/app/(myEvents)/events/components/discover-tab';
import { EventLogisticsPreview } from './event-logistics-preview';
import type { Id } from '@/convex/_generated/dataModel';

vi.unmock('convex/react');
vi.unmock('@/convex/_generated/api');
const navigation = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => navigation,
  useParams: () => ({ eventId: 'event-one' }),
}));
const eventId = 'event-one' as Id<'events'>;
const fixture = {
  event: {
    _id: eventId,
    _creationTime: 0,
    creatorId: 'organizer-one',
    title: 'Block picnic',
    description: 'Bring lunch',
    location: 'Garden',
    timezone: 'UTC',
    visibility: 'PUBLIC',
    admissionPolicy: 'INVITATION_ONLY',
    chosenDateTime: 1735732800000,
    chosenEndDateTime: 1735736400000,
    imageUrl: null,
    createdAt: 0,
    updatedAt: 0,
    potentialDateTimeOptions: [],
  },
  organizer: {
    personId: 'organizer-one',
    name: 'Sam',
    username: 'sam',
    image: null,
  },
  entryAction: 'INVITATION_ONLY',
};
function clientFor(data: unknown = fixture) {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation(() => ({
    onUpdate: () => () => {},
    localQueryResult: () => data,
    journal: () => undefined,
  }));
  const mutation = vi
    .spyOn(client, 'mutation')
    .mockResolvedValue({ success: true, rsvpStatus: 'PENDING' });
  return { client, mutation };
}
describe('event logistics preview using the actual app SDK', () => {
  beforeEach(() => navigation.push.mockReset());
  it('binds the production preview to the app provider with a distinct shared SDK instance', async () => {
    const sharedSdk = createRequire(import.meta.url)(
      '../../../shared/node_modules/convex/react'
    );
    expect(sharedSdk.useMutation).not.toBe(useMutation);
    const { client, mutation } = clientFor();
    const mounted = render(
      <ConvexProvider client={client}>
        <EventPreviewPage />
      </ConvexProvider>
    );
    expect(
      screen.getByRole('heading', { name: 'Block picnic', level: 1 })
    ).toBeInTheDocument();
    expect(mutation).not.toHaveBeenCalled();
    expect(
      vi
        .mocked(client.watchQuery)
        .mock.calls.every(
          ([query]) =>
            getFunctionName(query) === 'events/queries:getEventLogistics'
        )
    ).toBe(true);
    mounted.unmount();
    await client.close();
  });
  it('opens Discover logistics before any join and mounts only the viewer query', async () => {
    const { client, mutation } = clientFor();
    function Routes() {
      const [path, setPath] = useState('/events');
      return (
        <div
          onClickCapture={event => {
            const target = event.target as HTMLElement;
            const anchor = target.closest('a');
            if (anchor) {
              event.preventDefault();
              setPath(anchor.getAttribute('href')!);
            }
          }}
        >
          {path === '/events' ? (
            <DiscoverTab
              events={[
                {
                  ...fixture.event,
                  eventId,
                  memberCount: 3,
                  organizer: {
                    ...fixture.organizer,
                    personId: 'organizer-one' as Id<'persons'>,
                  },
                },
              ]}
            />
          ) : path === '/event/event-one/preview' ? (
            <EventPreviewPage />
          ) : (
            <p role='alert'>Unknown route: {path}</p>
          )}
        </div>
      );
    }
    const mounted = render(
      <ConvexProvider client={client}>
        <Routes />
      </ConvexProvider>
    );
    await userEvent
      .setup()
      .click(screen.getByRole('link', { name: 'View Event' }));
    expect(
      screen.getByRole('heading', { name: 'Block picnic', level: 1 })
    ).toBeInTheDocument();
    expect(mutation).not.toHaveBeenCalled();
    expect(
      vi
        .mocked(client.watchQuery)
        .mock.calls.every(
          ([query]) =>
            getFunctionName(query) === 'events/queries:getEventLogistics'
        )
    ).toBe(true);
    mounted.unmount();
    await client.close();
  });
  it('shows potential dates and notes without participant availability', async () => {
    const { client } = clientFor({
      ...fixture,
      event: {
        ...fixture.event,
        chosenDateTime: null,
        chosenEndDateTime: null,
        potentialDateTimeOptions: [
          {
            id: 'date-one',
            start: 1735732800000,
            end: null,
            note: 'Rain date',
          },
        ],
      },
    });
    const mounted = render(
      <ConvexProvider client={client}>
        <EventPreviewPage />
      </ConvexProvider>
    );
    expect(
      screen.getByText('Potential dates — not yet confirmed')
    ).toBeInTheDocument();
    expect(screen.getByText('Rain date')).toBeInTheDocument();
    expect(screen.getByText('Jan 1, 2025, 12:00 PM')).toBeInTheDocument();
    mounted.unmount();
    await client.close();
  });
  it('lets a public viewer read logistics without offering invitation-only self-join or writing membership', async () => {
    const { client, mutation } = clientFor();
    const mounted = render(
      <ConvexProvider client={client}>
        <EventLogisticsPreview eventId={eventId} />
      </ConvexProvider>
    );
    expect(
      screen.getByRole('heading', { name: 'Block picnic' })
    ).toBeInTheDocument();
    expect(screen.getByText('Bring lunch')).toBeInTheDocument();
    expect(screen.getByText('Garden')).toBeInTheDocument();
    expect(screen.getByText('Sam')).toBeInTheDocument();
    expect(screen.getByText('Invitation only')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Join Event' })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Apply/)).not.toBeInTheDocument();
    expect(mutation).not.toHaveBeenCalled();
    mounted.unmount();
    await client.close();
  });
  it('joins only after an explicit action and keeps RSVP Pending', async () => {
    const { client, mutation } = clientFor({ ...fixture, entryAction: 'JOIN' });
    const mounted = render(
      <ConvexProvider client={client}>
        <EventLogisticsPreview eventId={eventId} />
      </ConvexProvider>
    );
    expect(mutation).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Joining leaves your RSVP Pending/)
    ).toBeInTheDocument();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Join Event' }));
    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith('/event/event-one')
    );
    expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
      'events/mutations:joinDiscoverableEvent'
    );
    expect(mutation.mock.calls[0][1]).toEqual({ eventId });
    mounted.unmount();
    await client.close();
  });
  it.each(['UNAVAILABLE', 'MEMBER', 'SIGN_IN'])(
    'offers a truthful %s entry action without a join mutation',
    async entryAction => {
      const { client, mutation } = clientFor({ ...fixture, entryAction });
      const mounted = render(
        <ConvexProvider client={client}>
          <EventLogisticsPreview eventId={eventId} />
        </ConvexProvider>
      );
      expect(
        screen.queryByRole('button', { name: 'Join Event' })
      ).not.toBeInTheDocument();
      if (entryAction === 'MEMBER')
        expect(
          screen.getByRole('link', { name: 'Open Event' })
        ).toHaveAttribute('href', '/event/event-one');
      if (entryAction === 'SIGN_IN')
        expect(
          screen.getByRole('link', { name: 'Sign in or sign up' })
        ).toHaveAttribute(
          'href',
          '/sign-in?redirect=%2Fevent%2Fevent-one%2Fpreview'
        );
      if (entryAction === 'UNAVAILABLE')
        expect(screen.getByText('Joining unavailable')).toBeInTheDocument();
      expect(mutation).not.toHaveBeenCalled();
      mounted.unmount();
      await client.close();
    }
  );
  it('does not navigate or pretend to join when policy changes at action time', async () => {
    const { client, mutation } = clientFor({ ...fixture, entryAction: 'JOIN' });
    mutation.mockRejectedValueOnce(new Error('This event is invitation only'));
    const mounted = render(
      <ConvexProvider client={client}>
        <EventLogisticsPreview eventId={eventId} />
      </ConvexProvider>
    );
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Join Event' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This event is invitation only'
    );
    expect(navigation.push).not.toHaveBeenCalled();
    mounted.unmount();
    await client.close();
  });
});

import { EventAdmissionSettings } from './event-admission-settings';
describe('Organizer admission settings', () => {
  it('lets the Organizer change admission independently of Public visibility', async () => {
    const { client, mutation } = clientFor();
    const mounted = render(
      <ConvexProvider client={client}>
        <EventAdmissionSettings eventId={eventId} role='ORGANIZER' />
      </ConvexProvider>
    );
    const user = userEvent.setup();
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Admission policy' }),
      'DIRECT'
    );
    await user.click(
      screen.getByRole('button', { name: 'Save admission policy' })
    );
    await screen.findByRole('status');
    expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
      'events/mutations:updateAdmissionPolicy'
    );
    expect(mutation.mock.calls[0][1]).toEqual({
      eventId,
      admissionPolicy: 'DIRECT',
    });
    mounted.unmount();
    await client.close();
  });
  it.each(['MODERATOR', 'ATTENDEE'])(
    'withholds admission controls from %s',
    async role => {
      const { client, mutation } = clientFor();
      const mounted = render(
        <ConvexProvider client={client}>
          <EventAdmissionSettings eventId={eventId} role={role} />
        </ConvexProvider>
      );
      expect(
        screen.queryByRole('combobox', { name: 'Admission policy' })
      ).not.toBeInTheDocument();
      expect(mutation).not.toHaveBeenCalled();
      mounted.unmount();
      await client.close();
    }
  );
});

it('handles an unreadable event without mounting member data or joining', async () => {
  const { client, mutation } = clientFor();
  vi.mocked(client.watchQuery).mockImplementation(() => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => {
      throw new Error('Access denied to this event');
    },
  }));
  const report = vi.spyOn(console, 'error').mockImplementation(() => {});
  const mounted = render(
    <ConvexProvider client={client}>
      <EventPreviewPage />
    </ConvexProvider>
  );
  expect(
    screen.getByRole('heading', { name: 'Event unavailable' })
  ).toBeInTheDocument();
  expect(screen.getByRole('alert')).toHaveTextContent(
    'you do not have permission'
  );
  expect(mutation).not.toHaveBeenCalled();
  mounted.unmount();
  await client.close();
  report.mockRestore();
});
