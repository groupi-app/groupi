import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { getFunctionName } from 'convex/server';
import { expect, it, vi } from 'vitest';
import type { Id } from '@/convex/_generated/dataModel';
import { EventAudienceSettings as AudienceFields } from './event-audience-settings';
import { EventSettingsDraftProvider } from '@/features/event-settings';
vi.mock('@/hooks/convex/use-file-upload', () => ({
  useFileUpload: () => ({ uploadFile: vi.fn() }),
}));
vi.unmock('convex/react');
vi.unmock('@/convex/_generated/api');
let actor = 0;
function snapshot(grants = audiences) {
  return {
    revision: 'r1',
    role: 'ORGANIZER' as const,
    details: {
      title: 'Picnic',
      description: '',
      location: '',
      visibility: 'PRIVATE' as const,
    },
    permissions: {
      createPosts: 'EVERYONE' as const,
      inviteMembers: 'EVERYONE' as const,
      viewAttendeeList: 'EVERYONE' as const,
    },
    admissionPolicy: 'INVITATION_ONLY' as const,
    applications: {
      questions: [],
      reviewerPolicy: 'ORGANIZERS_AND_MODERATORS' as const,
    },
    audiences: grants,
    date: { options: [] },
    addons: [],
  };
}
function EventAudienceSettings(props: Parameters<typeof AudienceFields>[0]) {
  return (
    <EventSettingsDraftProvider
      eventId={props.eventId}
      actorId={`audience-${actor}`}
      enabled
    >
      <AudienceFields {...props} />
    </EventSettingsDraftProvider>
  );
}
const eventId = 'event-one' as Id<'events'>;
const groupId = 'group-one' as Id<'groups'>;
const audiences = {
  eventId,
  friendsShared: false,
  canManageEvent: true,
  groups: [],
};
function fixture(data: Record<string, unknown>) {
  actor++;
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  vi.spyOn(client, 'watchQuery').mockImplementation((...args) => ({
    onUpdate: () => () => {},
    journal: () => undefined,
    localQueryResult: () => {
      const name = getFunctionName(args[0]);
      if (name === 'events/queries:getSettings')
        return snapshot(
          (data[
            'groupEventAudiences/queries:getEventAudiences'
          ] as typeof audiences) ?? audiences
        );
      if (name === 'events/queries:getSettingsAudienceOptions') {
        const page = data['groups/queries:listGroups'] as {
          page: { _id: string; name: string; canShareEvents: boolean }[];
          isDone: boolean;
          continueCursor: string;
        };
        return {
          ...page,
          page:
            page?.page
              .filter(group => group.canShareEvents)
              .map(group => ({ groupId: group._id, name: group.name })) ?? [],
        };
      }
      if (!(name in data)) throw new Error(`Unexpected query ${name}`);
      return data[name];
    },
  }));
  const mutation = vi
    .spyOn(client, 'mutation')
    .mockResolvedValue({ ...snapshot(), revision: 'r2' });
  return { client, mutation };
}
it('stages permitted Group and Friends audiences in the global save without participation writes', async () => {
  const { client, mutation } = fixture({
    'groups/queries:listGroups': {
      page: [
        { _id: groupId, name: 'Neighbors', canShareEvents: true },
        { _id: 'blocked', name: 'Restricted', canShareEvents: false },
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
  await user.click(screen.getByRole('button', { name: 'Shared with' }));
  expect(
    screen.queryByRole('checkbox', { name: 'Restricted' })
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('checkbox', { name: 'Friends' }));
  await user.click(screen.getByRole('checkbox', { name: 'Neighbors' }));
  await user.keyboard('{Escape}');
  expect(mutation).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(mutation).toHaveBeenCalledOnce());
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'events/mutations:saveSettings'
  );
  expect(mutation.mock.calls[0][1]).toEqual({
    eventId,
    expectedRevision: 'r1',
    patch: { audiences: { friendsShared: true, groupIds: [groupId] } },
  });
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
it('withholds withdrawal when current Group access does not permit it', async () => {
  const { client, mutation } = fixture({
    'groupEventAudiences/queries:listGroupSharedEvents': {
      page: [
        {
          event: {
            _id: eventId,
            title: 'Neighbors picnic',
            description: '',
            location: '',
            timezone: 'UTC',
            chosenDateTime: null,
          },
          canWithdraw: false,
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
    screen.queryByRole('button', { name: /Withdraw/ })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Shared with' })
  ).not.toBeInTheDocument();
  expect(mutation).not.toHaveBeenCalled();
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
    screen.getByText('No active Events on this page.')
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
it('retains a staged audience when authority changes and global save is denied', async () => {
  const { client, mutation } = fixture({
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
  await user.click(screen.getByRole('button', { name: 'Shared with' }));
  await user.click(screen.getByRole('checkbox', { name: 'Neighbors' }));
  await user.keyboard('{Escape}');
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Current Group sharing permission'
  );
  expect(
    screen.getByRole('button', { name: 'Remove Neighbors audience' })
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
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
    await screen.findByText('No active Events on this page.')
  ).toBeInTheDocument();
  mounted.unmount();
  await client.close();
  report.mockRestore();
});

import { useState } from 'react';
import EventPreviewPage from '@/app/(eventPreview)/event/[eventId]/preview/page';
vi.mock('next/navigation', () => ({
  usePathname: () => '/event/event-one/settings/details',
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
    screen.queryByText('No active Events on this page.')
  ).not.toBeInTheDocument();
  mounted.unmount();
  await client.close();
});

it('pages server-filtered Groups and removes revoked options without dropping the staged draft', async () => {
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
      getFunctionName(args[0]) === 'events/queries:getSettings'
        ? snapshot()
        : args[1]?.paginationOpts.cursor === 'next'
          ? {
              page: permitted ? [{ groupId, name: 'Neighbors' }] : [],
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
  await user.click(screen.getByRole('button', { name: 'Shared with' }));
  await user.click(screen.getByRole('button', { name: 'More matches' }));
  await user.click(screen.getByRole('checkbox', { name: 'Neighbors' }));
  const { act } = await import('@testing-library/react');
  await act(async () => {
    permitted = false;
    listeners.forEach(listener => listener());
  });
  expect(
    screen.queryByRole('checkbox', { name: 'Neighbors' })
  ).not.toBeInTheDocument();
  await user.keyboard('{Escape}');
  expect(
    screen.getByRole('button', { name: 'Remove Neighbors audience' })
  ).toBeInTheDocument();
  expect(mutation).not.toHaveBeenCalled();
  mounted.unmount();
  await client.close();
});
