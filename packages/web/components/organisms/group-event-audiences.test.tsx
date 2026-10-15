import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { getFunctionName } from 'convex/server';
import { expect, it, vi } from 'vitest';
import type { Id } from '@/convex/_generated/dataModel';
import { EventAudienceSettings } from './event-audience-settings';
vi.unmock('convex/react');
vi.unmock('@/convex/_generated/api');
const eventId = 'event-one' as Id<'events'>;
const groupId = 'group-one' as Id<'groups'>;
const audiences = {
  eventId,
  friendsShared: false,
  canManageEvent: true,
  groups: [],
};
function fixture(data: Record<string, unknown>) {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation((...args) => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => {
      const name = getFunctionName(args[0]);
      if (!(name in data)) throw new Error(`Unexpected query ${name}`);
      return data[name];
    },
  }));
  const mutation = vi
    .spyOn(client, 'mutation')
    .mockResolvedValue({ eventId, groupId, shared: true });
  return { client, mutation };
}
it('shares only with a currently permitted whole Group and optional Friends without participation writes', async () => {
  const { client, mutation } = fixture({
    'groupEventAudiences/queries:getEventAudiences': audiences,
    'groups/queries:listGroups': {
      page: [
        { _id: groupId, name: 'Neighbors', canShareEvents: true },
        { _id: 'blocked-group', name: 'Restricted', canShareEvents: false },
      ],
      isDone: true,
      continueCursor: '',
    },
  });
  const mounted = render(
    <ConvexProvider client={client}>
      <EventAudienceSettings eventId={eventId} visibility='PRIVATE' />
    </ConvexProvider>
  );
  const user = userEvent.setup();
  expect(
    screen.queryByRole('option', { name: 'Restricted' })
  ).not.toBeInTheDocument();
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Whole Group' }),
    groupId
  );
  await user.click(screen.getByRole('button', { name: 'Share with Group' }));
  await waitFor(() => expect(mutation).toHaveBeenCalled());
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupEventAudiences/mutations:shareEventWithGroup'
  );
  expect(mutation.mock.calls[0][1]).toEqual({ eventId, groupId });
  await user.click(screen.getByRole('button', { name: 'Share with Friends' }));
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(2));
  expect(getFunctionName(mutation.mock.calls[1][0])).toBe(
    'groupEventAudiences/mutations:setEventFriendsAudience'
  );
  expect(mutation.mock.calls[1][1]).toEqual({ eventId, enabled: true });
  mounted.unmount();
  await client.close();
});

import { GroupSharedEvents } from './group-shared-events';
import { GroupEventSharingPolicy } from './group-event-sharing-policy';
it('lets the Group owner change sharing policy independently', async () => {
  const { client, mutation } = fixture({});
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupEventSharingPolicy groupId={groupId} initialPolicy='MANAGERS' />
    </ConvexProvider>
  );
  const user = userEvent.setup();
  await user.selectOptions(
    screen.getByRole('combobox', {
      name: 'Who may share Events with this Group?',
    }),
    'MEMBERS'
  );
  await user.click(
    screen.getByRole('button', { name: 'Save Event sharing policy' })
  );
  await waitFor(() => expect(mutation).toHaveBeenCalled());
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupEventAudiences/mutations:configureGroupEventSharing'
  );
  expect(mutation.mock.calls[0][1]).toEqual({ groupId, policy: 'MEMBERS' });
  mounted.unmount();
  await client.close();
});
it('offers a logistics preview and only permitted Group withdrawal with no Event management controls', async () => {
  const { client, mutation } = fixture({
    'groupEventAudiences/queries:listGroupSharedEvents': {
      page: [
        {
          event: {
            _id: eventId,
            title: 'Garden picnic',
            description: 'Bring lunch',
            location: 'Park',
            timezone: 'UTC',
            chosenDateTime: null,
          },
          canWithdraw: true,
        },
      ],
      isDone: true,
      continueCursor: '',
    },
  });
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupSharedEvents groupId={groupId} />
    </ConvexProvider>
  );
  expect(
    screen.getByRole('link', { name: 'View Garden picnic logistics' })
  ).toHaveAttribute('href', '/event/event-one/preview');
  expect(
    screen.queryByRole('button', { name: /Join|Apply|Edit Event|Delete Event/ })
  ).not.toBeInTheDocument();
  await userEvent
    .setup()
    .click(
      screen.getByRole('button', { name: 'Withdraw Garden picnic from Group' })
    );
  await waitFor(() => expect(mutation).toHaveBeenCalled());
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupEventAudiences/mutations:withdrawGroupEventAudience'
  );
  expect(mutation.mock.calls[0][1]).toEqual({ eventId, groupId });
  mounted.unmount();
  await client.close();
});
it('restricts a Group manager to visible grant withdrawal without Friends or other Group selection', async () => {
  const { client, mutation } = fixture({
    'groupEventAudiences/queries:getEventAudiences': {
      ...audiences,
      canManageEvent: false,
      friendsShared: null,
      groups: [{ groupId, name: 'Neighbors', canWithdraw: true }],
    },
  });
  const mounted = render(
    <ConvexProvider client={client}>
      <EventAudienceSettings eventId={eventId} visibility='PRIVATE' />
    </ConvexProvider>
  );
  expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Share with Friends' })
  ).not.toBeInTheDocument();
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Withdraw Neighbors audience' }));
  await waitFor(() => expect(mutation).toHaveBeenCalled());
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupEventAudiences/mutations:withdrawGroupEventAudience'
  );
  expect(
    vi
      .mocked(client.watchQuery)
      .mock.calls.every(
        ([ref]) =>
          getFunctionName(ref) ===
          'groupEventAudiences/queries:getEventAudiences'
      )
  ).toBe(true);
  mounted.unmount();
  await client.close();
});
it('pages shared logistics without participant queries or unsupported admission actions', async () => {
  const { client } = fixture({});
  vi.mocked(client.watchQuery).mockImplementation((...args) => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => {
      expect(getFunctionName(args[0])).toBe(
        'groupEventAudiences/queries:listGroupSharedEvents'
      );
      const next = args[1]?.paginationOpts.cursor === 'next';
      return {
        page: next
          ? [
              {
                event: {
                  _id: eventId,
                  title: 'Undated meetup',
                  location: null,
                  description: null,
                  chosenDateTime: null,
                  timezone: 'UTC',
                },
                canWithdraw: false,
              },
            ]
          : [],
        isDone: next,
        continueCursor: 'next',
      };
    },
  }));
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupSharedEvents groupId={groupId} />
    </ConvexProvider>
  );
  expect(
    screen.getByText('No upcoming or undated Events on this page.')
  ).toBeInTheDocument();
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Next shared Events' }));
  expect(
    await screen.findByRole('link', { name: 'View Undated meetup logistics' })
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /Withdraw|Join|Apply/ })
  ).not.toBeInTheDocument();
  mounted.unmount();
  await client.close();
});
it('reports action-time policy conflicts without pretending to share', async () => {
  const { client, mutation } = fixture({
    'groupEventAudiences/queries:getEventAudiences': audiences,
    'groups/queries:listGroups': {
      page: [{ _id: groupId, name: 'Neighbors', canShareEvents: true }],
      isDone: true,
      continueCursor: '',
    },
  });
  mutation.mockRejectedValueOnce(
    new Error('Current Group sharing permission is required.')
  );
  const mounted = render(
    <ConvexProvider client={client}>
      <EventAudienceSettings eventId={eventId} visibility='PUBLIC' />
    </ConvexProvider>
  );
  const user = userEvent.setup();
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Whole Group' }),
    groupId
  );
  await user.click(screen.getByRole('button', { name: 'Share with Group' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Current Group sharing permission'
  );
  expect(
    screen.queryByText('Event logistics shared with Group.')
  ).not.toBeInTheDocument();
  expect(
    screen.getByText('Public basic Event details remain public.')
  ).toBeInTheDocument();
  mounted.unmount();
  await client.close();
});
it('recovers a revoked query through the accessible retry action', async () => {
  const { client } = fixture({});
  let unavailable = true;
  vi.mocked(client.watchQuery).mockImplementation(() => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => {
      if (unavailable) throw new Error('Forbidden');
      return { page: [], isDone: true, continueCursor: '' };
    },
  }));
  const report = vi.spyOn(console, 'error').mockImplementation(() => {});
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupSharedEvents groupId={groupId} />
    </ConvexProvider>
  );
  expect(screen.getByRole('alert')).toHaveTextContent(
    'current access or Group policy'
  );
  unavailable = false;
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Retry Event sharing' }));
  expect(
    await screen.findByText('No upcoming or undated Events on this page.')
  ).toBeInTheDocument();
  mounted.unmount();
  await client.close();
  report.mockRestore();
});

import { useState } from 'react';
import EventPreviewPage from '@/app/(eventPreview)/event/[eventId]/preview/page';
vi.mock('next/navigation', () => ({
  useParams: () => ({ eventId: 'event-one' }),
  useRouter: () => ({ push: vi.fn() }),
}));
it('opens the safe viewer route from Group logistics without mounting participation or Group-only admission', async () => {
  const event = {
    _id: eventId,
    title: 'Garden picnic',
    description: 'Bring lunch',
    location: 'Park',
    timezone: 'UTC',
    chosenDateTime: null,
    chosenEndDateTime: null,
    potentialDateTimeOptions: [],
    imageUrl: null,
    visibility: 'PRIVATE',
    admissionPolicy: 'DIRECT',
  };
  const { client, mutation } = fixture({
    'groupEventAudiences/queries:listGroupSharedEvents': {
      page: [{ event, canWithdraw: false }],
      isDone: true,
      continueCursor: '',
    },
    'events/queries:getEventLogistics': {
      event,
      organizer: null,
      entryAction: 'UNAVAILABLE',
    },
  });
  function Routes() {
    const [preview, setPreview] = useState(false);
    return (
      <div
        onClickCapture={event => {
          if (
            (event.target as HTMLElement).closest('a')?.getAttribute('href') ===
            '/event/event-one/preview'
          ) {
            event.preventDefault();
            setPreview(true);
          }
        }}
      >
        {preview ? (
          <EventPreviewPage />
        ) : (
          <GroupSharedEvents groupId={groupId} />
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
    .click(screen.getByRole('link', { name: 'View Garden picnic logistics' }));
  expect(
    await screen.findByRole('heading', { name: 'Garden picnic', level: 1 })
  ).toBeInTheDocument();
  expect(screen.getByText('Bring lunch')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Join Event' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: 'Apply for approval' })
  ).not.toBeInTheDocument();
  expect(mutation).not.toHaveBeenCalled();
  expect(
    vi
      .mocked(client.watchQuery)
      .mock.calls.every(([ref]) =>
        [
          'groupEventAudiences/queries:listGroupSharedEvents',
          'events/queries:getEventLogistics',
        ].includes(getFunctionName(ref))
      )
  ).toBe(true);
  mounted.unmount();
  await client.close();
});
it('shows loading without implying a missing Event list', async () => {
  const { client } = fixture({
    'groupEventAudiences/queries:listGroupSharedEvents': undefined,
  });
  const mounted = render(
    <ConvexProvider client={client}>
      <GroupSharedEvents groupId={groupId} />
    </ConvexProvider>
  );
  expect(screen.getByRole('status')).toHaveTextContent(
    'Loading Group-shared Events'
  );
  expect(
    screen.queryByText('No upcoming or undated Events on this page.')
  ).not.toBeInTheDocument();
  mounted.unmount();
  await client.close();
});

it('pages permitted Groups and removes a stale selection when current sharing access changes', async () => {
  const { client, mutation } = fixture({});
  const listeners = new Set<() => void>();
  let permitted = true;
  vi.mocked(client.watchQuery).mockImplementation((...args) => ({
    onUpdate: listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    journal: () => undefined,
    localQueryResult: () =>
      getFunctionName(args[0]) ===
      'groupEventAudiences/queries:getEventAudiences'
        ? audiences
        : args[1]?.paginationOpts.cursor === 'next'
          ? {
              page: [
                { _id: groupId, name: 'Neighbors', canShareEvents: permitted },
              ],
              isDone: true,
              continueCursor: '',
            }
          : { page: [], isDone: false, continueCursor: 'next' },
  }));
  const mounted = render(
    <ConvexProvider client={client}>
      <EventAudienceSettings eventId={eventId} visibility='PRIVATE' />
    </ConvexProvider>
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Next sharing Groups' }));
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Whole Group' }),
    groupId
  );
  expect(
    screen.getByRole('button', { name: 'Share with Group' })
  ).toBeEnabled();
  const { act } = await import('@testing-library/react');
  await act(async () => {
    permitted = false;
    listeners.forEach(listener => listener());
  });
  expect(
    screen.getByRole('button', { name: 'Share with Group' })
  ).toBeDisabled();
  expect(
    screen.queryByRole('option', { name: 'Neighbors' })
  ).not.toBeInTheDocument();
  expect(mutation).not.toHaveBeenCalled();
  mounted.unmount();
  await client.close();
});
