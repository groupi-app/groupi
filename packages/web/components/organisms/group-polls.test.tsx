import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConvexProviderWithAuth, ConvexReactClient } from 'convex/react';
import { getFunctionName } from 'convex/server';
import { afterAll, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import { EventToolScope } from '@/features/content/tool-scope';
import {
  GroupPollEditor,
  GroupPollInteraction,
  GroupPollHistory,
  GroupPolls,
  GroupPollFeed,
} from './group-polls';
vi.unmock('convex/react');
vi.unmock('@/convex/_generated/api');
const push = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useParams: () => ({ groupId: 'group-one', toolId: 'tool-one' }),
}));
const restore = await vi.hoisted(async () => {
  const { default: Module } = await import('node:module');
  const { resolve } = await import('node:path');
  const resolver = Module as typeof Module & {
    _resolveFilename: (request: string, ...args: unknown[]) => string;
  };
  const original = resolver._resolveFilename;
  const path = resolve(process.cwd(), '../../convex/_generated/api.js');
  resolver._resolveFilename = function (request, ...args) {
    return original.call(
      this,
      request === '@/convex/_generated/api' ? path : request,
      ...args
    );
  };
  return () => {
    resolver._resolveFilename = original;
  };
});
afterAll(restore);
const groupId = 'group-one' as Id<'groups'>;
const toolId = 'tool-one' as Id<'groupTools'>;
const authToken = async () => 'fixture-token';
function useFixtureAuth() {
  return {
    isLoading: false,
    isAuthenticated: true,
    fetchAccessToken: authToken,
  };
}
const poll = {
  _id: toolId,
  groupId,
  kind: 'POLL',
  title: 'Reading choice',
  description: 'Choose a topic',
  resultsVisibility: 'MANAGERS',
  version: 3,
  semanticVersion: 1,
  mode: 'SINGLE',
  options: [
    { id: 'books', label: 'Books' },
    { id: 'films', label: 'Films' },
  ],
  selections: [],
  savedOptions: [],
  savedVersion: null,
  voteRevision: 0,
  canManage: false,
  canReview: false,
  enabled: true,
};
const emptyPage = { page: [], isDone: true, continueCursor: '' };
function fixture(overrides: Record<string, unknown> = {}) {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  const data: Record<string, unknown> = {
    'groupPolls/queries:getPoll': poll,
    'groupPolls/queries:getPollForManagement': { ...poll, canManage: true },
    'groupPolls/queries:getOwnHistory': emptyPage,
    'groupPolls/queries:listResults': emptyPage,
    'groupPolls/queries:listPolls': { ...emptyPage, page: [poll] },
    'groupTools/queries:getPollPolicy': {
      groupId,
      kind: 'POLL',
      enabled: true,
      creation: 'MANAGERS',
      canConfigure: true,
    },
    'groups/queries:getGroup': {
      _id: groupId,
      viewerRole: 'OWNER',
      joiningQuestionnaire: { canAccessMemberContent: true },
    },
    ...overrides,
  };
  vi.spyOn(client, 'setAuth').mockImplementation((_fetch, onChange) =>
    onChange?.(true)
  );
  vi.spyOn(client, 'clearAuth').mockImplementation(() => {});
  const listeners = new Set<() => void>();
  const watch = vi
    .spyOn(client, 'watchQuery')
    .mockImplementation((...[query]) => ({
      onUpdate: listener => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      localQueryResult: () => {
        const name = getFunctionName(query);
        if (!(name in data)) throw new Error(`Unexpected query ${name}`);
        return data[name];
      },
      journal: () => undefined,
    }));
  const mutation = vi
    .spyOn(client, 'mutation')
    .mockResolvedValue({ revision: 1 });
  function Provider({ children }: { children: ReactNode }) {
    return (
      <ConvexProviderWithAuth client={client} useAuth={useFixtureAuth}>
        {children}
      </ConvexProviderWithAuth>
    );
  }
  return {
    client,
    mutation,
    watch,
    Provider,
    data,
    refresh: () => listeners.forEach(listener => listener()),
  };
}

it('creates directly from editable poll choices with immutable disclosed visibility', async () => {
  const f = fixture();
  f.mutation.mockResolvedValue(toolId);
  const m = render(
    <f.Provider>
      <GroupPollEditor groupId={groupId} />
    </f.Provider>
  );
  const u = userEvent.setup();
  expect(
    screen.queryByRole('button', { name: /template/i })
  ).not.toBeInTheDocument();
  await u.clear(screen.getByLabelText('Poll title'));
  await u.type(screen.getByLabelText('Poll title'), 'Next meetup');
  await u.selectOptions(screen.getByLabelText('Voting rule'), 'MULTIPLE');
  await u.clear(screen.getByLabelText('Option 1 label'));
  await u.type(screen.getByLabelText('Option 1 label'), 'Discussion');
  await u.clear(screen.getByLabelText('Option 2 label'));
  await u.type(screen.getByLabelText('Option 2 label'), 'Workshop');
  await u.click(screen.getByRole('button', { name: 'Add poll option' }));
  await u.type(screen.getByLabelText('Option 3 label'), 'Social');
  await u.click(screen.getByText('Settings & details'));
  await u.selectOptions(
    screen.getByLabelText('Vote visibility (fixed for this poll)'),
    'MEMBERS'
  );
  await u.click(screen.getByRole('button', { name: 'Create poll' }));
  await waitFor(() => expect(f.mutation).toHaveBeenCalled());
  expect(getFunctionName(f.mutation.mock.calls[0][0])).toBe(
    'groupPolls/mutations:createPoll'
  );
  expect(f.mutation.mock.calls[0][1]).toMatchObject({
    mode: 'MULTIPLE',
    resultsVisibility: 'MEMBERS',
    options: [
      { id: 'yes', label: 'Discussion' },
      { id: 'no', label: 'Workshop' },
      { id: expect.any(String), label: 'Social' },
    ],
  });
  m.unmount();
  await f.client.close();
});
it('votes through actual consuming SDK with single choice and latest revision', async () => {
  const f = fixture();
  const m = render(
    <f.Provider>
      <GroupPollInteraction groupId={groupId} toolId={toolId} />
    </f.Provider>
  );
  const u = userEvent.setup();
  await u.click(screen.getByLabelText('Books'));
  await u.click(screen.getByLabelText('Films'));
  await u.click(screen.getByRole('button', { name: 'Save vote' }));
  expect(getFunctionName(f.mutation.mock.calls[0][0])).toBe(
    'groupPolls/mutations:submitVote'
  );
  expect(f.mutation.mock.calls[0][1]).toEqual({
    toolId,
    version: 3,
    expectedRevision: 0,
    selections: ['films'],
  });
  expect(
    f.watch.mock.calls.every(([q]) =>
      getFunctionName(q).startsWith('groupPolls/')
    )
  ).toBe(true);
  m.unmount();
  await f.client.close();
});
it('supports multiple choices without creating duplicate selections', async () => {
  const f = fixture({
    'groupPolls/queries:getPoll': { ...poll, mode: 'MULTIPLE' },
  });
  const m = render(
    <f.Provider>
      <GroupPollInteraction groupId={groupId} toolId={toolId} />
    </f.Provider>
  );
  const u = userEvent.setup();
  await u.click(screen.getByLabelText('Books'));
  await u.click(screen.getByLabelText('Films'));
  await u.click(screen.getByLabelText('Books'));
  await u.click(screen.getByRole('button', { name: 'Save vote' }));
  expect(f.mutation.mock.calls[0][1]).toMatchObject({ selections: ['films'] });
  m.unmount();
  await f.client.close();
});
it('shows stale failure and recovers after current revision update', async () => {
  const f = fixture();
  f.mutation.mockRejectedValueOnce(
    new Error('Vote changed; inspect current state')
  );
  const m = render(
    <f.Provider>
      <GroupPollInteraction groupId={groupId} toolId={toolId} />
    </f.Provider>
  );
  const u = userEvent.setup();
  await u.click(screen.getByLabelText('Books'));
  await u.click(screen.getByRole('button', { name: 'Save vote' }));
  expect(
    screen.getByText('Vote changed; inspect current state')
  ).toBeInTheDocument();
  await act(async () => {
    f.data['groupPolls/queries:getPoll'] = {
      ...poll,
      voteRevision: 2,
      selections: ['films'],
    };
    f.refresh();
  });
  expect(screen.getByLabelText('Films')).toBeChecked();
  await u.click(screen.getByRole('button', { name: 'Save vote' }));
  expect(f.mutation.mock.calls[1][1]).toMatchObject({
    expectedRevision: 2,
    selections: ['films'],
  });
  m.unmount();
  await f.client.close();
});
it('blocks manager onboarding before protected settings subscription', async () => {
  const f = fixture({
    'groups/queries:getGroup': {
      viewerRole: 'OWNER',
      joiningQuestionnaire: { canAccessMemberContent: false },
    },
  });
  const m = render(
    <f.Provider>
      <GroupPollEditor groupId={groupId} toolId={toolId} />
    </f.Provider>
  );
  expect(screen.getByText(/Current eligible managers/)).toBeInTheDocument();
  expect(f.watch.mock.calls.map(([q]) => getFunctionName(q))).not.toContain(
    'groupPolls/queries:getPollForManagement'
  );
  m.unmount();
  await f.client.close();
});
it('manages preserved configuration while disabled without exposing visibility editing', async () => {
  const f = fixture({
    'groupTools/queries:getPollPolicy': {
      enabled: false,
      creation: 'MANAGERS',
      canConfigure: true,
    },
  });
  const m = render(
    <f.Provider>
      <GroupPollEditor groupId={groupId} toolId={toolId} />
    </f.Provider>
  );
  expect(
    screen.getByRole('button', { name: 'Save poll settings' })
  ).toBeInTheDocument();
  expect(
    screen.queryByLabelText('Vote visibility (fixed for this poll)')
  ).toBeNull();
  m.unmount();
  await f.client.close();
});
it('disabled hub exposes preserved management and hides creation', async () => {
  const f = fixture({
    'groupTools/queries:getPollPolicy': {
      enabled: false,
      creation: 'MANAGERS',
      canConfigure: true,
    },
  });
  const m = render(
    <f.Provider>
      <GroupPolls groupId={groupId} />
    </f.Provider>
  );
  expect(
    screen.getByRole('link', { name: 'Manage Reading choice' })
  ).toHaveAttribute('href', `/groups/${groupId}/polls/${toolId}/settings`);
  expect(screen.queryByRole('link', { name: 'Create poll' })).toBeNull();
  m.unmount();
  await f.client.close();
});
it('history reads only retained snapshots after current access loss', async () => {
  const f = fixture({
    'groupPolls/queries:getOwnHistory': {
      page: [
        {
          _id: 'r1',
          revision: 1,
          version: 1,
          options: [{ id: 'old', label: 'Original option' }],
          selections: ['old'],
        },
      ],
      isDone: true,
      continueCursor: '',
      voteRevision: 4,
    },
  });
  const m = render(
    <f.Provider>
      <GroupPollHistory toolId={toolId} />
    </f.Provider>
  );
  expect(screen.getByText('Original option')).toBeInTheDocument();
  expect(
    f.watch.mock.calls.every(
      ([q]) => getFunctionName(q) === 'groupPolls/queries:getOwnHistory'
    )
  ).toBe(true);
  m.unmount();
  await f.client.close();
});
it('removes former-member private history with authoritative current revision and confirmation', async () => {
  const f = fixture({
    'groupPolls/queries:getOwnHistory': {
      page: [],
      isDone: true,
      continueCursor: '',
      voteRevision: 7,
    },
  });
  const m = render(
    <f.Provider>
      <GroupPollHistory toolId={toolId} />
    </f.Provider>
  );
  const u = userEvent.setup();
  await u.click(
    screen.getByRole('button', { name: 'Remove my vote and history' })
  );
  await u.click(
    screen.getByRole('button', { name: 'Confirm removing my vote and history' })
  );
  expect(getFunctionName(f.mutation.mock.calls[0][0])).toBe(
    'groupPolls/mutations:removeVote'
  );
  expect(f.mutation.mock.calls[0][1]).toEqual({ toolId, expectedRevision: 7 });
  m.unmount();
  await f.client.close();
});
it('results show only current or historical snapshots and moderate with current revision', async () => {
  const { GroupPollResults } = await import('./group-polls');
  const f = fixture({
    'groupPolls/queries:getPoll': { ...poll, canManage: true, canReview: true },
    'groupPolls/queries:listResults': {
      page: [
        {
          _id: 'vote-one',
          personId: null,
          options: [{ id: 'old', label: 'Original option' }],
          selections: ['old'],
          revision: 7,
          version: 1,
          isCurrent: false,
          removed: false,
        },
      ],
      isDone: true,
      continueCursor: '',
    },
  });
  const m = render(
    <f.Provider>
      <GroupPollResults groupId={groupId} toolId={toolId} />
    </f.Provider>
  );
  expect(
    screen.getByText('Historical vote: no longer counts under the current rule')
  ).toBeInTheDocument();
  expect(screen.getByText(/not an overall total/)).toBeInTheDocument();
  const u = userEvent.setup();
  await u.click(screen.getByRole('button', { name: 'Remove vote' }));
  await u.click(
    screen.getByRole('button', { name: 'Confirm removing this vote' })
  );
  expect(f.mutation.mock.calls[0][1]).toEqual({
    voteId: 'vote-one',
    expectedRevision: 7,
  });
  m.unmount();
  await f.client.close();
});
it('cosmetic or semantic config updates re-read authoritative choices before another vote', async () => {
  const f = fixture();
  const m = render(
    <f.Provider>
      <GroupPollInteraction groupId={groupId} toolId={toolId} />
    </f.Provider>
  );
  await userEvent.setup().click(screen.getByLabelText('Books'));
  await act(async () => {
    f.data['groupPolls/queries:getPoll'] = {
      ...poll,
      version: 4,
      semanticVersion: 2,
      options: [
        { id: 'new', label: 'New choice' },
        { id: 'other', label: 'Other choice' },
      ],
      selections: [],
      savedVersion: 3,
    };
    f.refresh();
  });
  expect(screen.queryByLabelText('Books')).toBeNull();
  expect(screen.getByLabelText('New choice')).not.toBeChecked();
  await userEvent.setup().click(screen.getByLabelText('New choice'));
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Save vote' }));
  expect(f.mutation.mock.calls[0][1]).toMatchObject({
    version: 4,
    selections: ['new'],
  });
  m.unmount();
  await f.client.close();
});
it('private results do not subscribe when current review permission is absent', async () => {
  const { GroupPollResults } = await import('./group-polls');
  const f = fixture();
  const m = render(
    <f.Provider>
      <GroupPollResults groupId={groupId} toolId={toolId} />
    </f.Provider>
  );
  expect(screen.getByRole('alert')).toHaveTextContent(
    'unavailable under current access'
  );
  expect(f.watch.mock.calls.map(([q]) => getFunctionName(q))).not.toContain(
    'groupPolls/queries:listResults'
  );
  m.unmount();
  await f.client.close();
});
it('failed removal keeps confirmation for deliberate retry and updates revision from recovery history', async () => {
  const f = fixture({
    'groupPolls/queries:getOwnHistory': {
      page: [],
      isDone: true,
      continueCursor: '',
      voteRevision: 7,
    },
  });
  f.mutation.mockRejectedValueOnce(new Error('Revision changed'));
  const m = render(
    <f.Provider>
      <GroupPollHistory toolId={toolId} />
    </f.Provider>
  );
  const u = userEvent.setup();
  await u.click(
    screen.getByRole('button', { name: 'Remove my vote and history' })
  );
  await u.click(
    screen.getByRole('button', { name: 'Confirm removing my vote and history' })
  );
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(f.mutation).toHaveBeenCalledTimes(1);
  await act(async () => {
    f.data['groupPolls/queries:getOwnHistory'] = {
      page: [],
      isDone: true,
      continueCursor: '',
      voteRevision: 8,
    };
    f.refresh();
  });
  await u.click(
    screen.getByRole('button', { name: 'Remove my vote and history' })
  );
  await u.click(
    screen.getByRole('button', { name: 'Confirm removing my vote and history' })
  );
  expect(f.mutation.mock.calls[1][1]).toEqual({ toolId, expectedRevision: 8 });
  m.unmount();
  await f.client.close();
});

it('retains saved feedback through a reactive vote revision while reseeding selections and isolating tools', async () => {
  const f = fixture();
  const m = render(
    <f.Provider>
      <GroupPollInteraction groupId={groupId} toolId={toolId} />
    </f.Provider>
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('radio', { name: 'Books' }));
  await user.click(screen.getByRole('button', { name: 'Save vote' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Vote saved.');
  await act(async () => {
    f.data['groupPolls/queries:getPoll'] = {
      ...poll,
      voteRevision: 1,
      savedVersion: 3,
      selections: ['books'],
    };
    f.refresh();
  });
  expect(screen.getByRole('status')).toHaveTextContent('Vote saved.');
  expect(screen.getByRole('radio', { name: 'Books' })).toBeChecked();
  await user.click(screen.getByRole('radio', { name: 'Films' }));
  const otherId = 'tool-two' as Id<'groupTools'>;
  f.data['groupPolls/queries:getPoll'] = {
    ...poll,
    _id: otherId,
    title: 'Another poll',
    voteRevision: 1,
    selections: ['books'],
  };
  m.rerender(
    <f.Provider>
      <GroupPollInteraction groupId={groupId} toolId={otherId} />
    </f.Provider>
  );
  expect(screen.getByRole('radio', { name: 'Books' })).toBeChecked();
  expect(screen.queryByText('Vote saved.')).not.toBeInTheDocument();
  m.unmount();
  await f.client.close();
});

it('votes and opens permitted results inside the feed without routing to a poll page', async () => {
  push.mockClear();
  const f = fixture({
    'groupPolls/queries:getPoll': { ...poll, canReview: true },
  });
  const m = render(
    <f.Provider>
      <GroupPollFeed groupId={groupId} />
    </f.Provider>
  );
  const u = userEvent.setup();
  const card = screen.getByRole('article');
  expect(
    within(card).getByRole('heading', { name: 'Reading choice' })
  ).toHaveProperty('tagName', 'H2');
  expect(f.watch.mock.calls.map(([ref]) => getFunctionName(ref))).not.toContain(
    'groupPolls/queries:listResults'
  );
  const radio = within(card).getByRole('radio', { name: 'Books' });
  radio.focus();
  await u.keyboard('[Space]');
  expect(radio).toBeChecked();
  await u.click(within(card).getByRole('button', { name: 'Save vote' }));
  expect(f.mutation.mock.calls[0][1]).toMatchObject({
    toolId,
    selections: ['books'],
    expectedRevision: 0,
  });
  await u.click(
    within(card).getByRole('button', { name: 'View poll results' })
  );
  expect(
    within(card).getByRole('heading', { name: 'Latest votes' })
  ).toBeInTheDocument();
  expect(within(card).getByText('No votes on this page.')).toBeInTheDocument();
  expect(f.watch.mock.calls.map(([ref]) => getFunctionName(ref))).toContain(
    'groupPolls/queries:listResults'
  );
  expect(push).not.toHaveBeenCalled();
  m.unmount();
  await f.client.close();
});

it('keeps radio selections independent across two inline poll cards', async () => {
  const otherId = 'tool-two' as Id<'groupTools'>;
  const first = fixture();
  const second = fixture({
    'groupPolls/queries:getPoll': {
      ...poll,
      _id: otherId,
      title: 'Second poll',
    },
  });
  const m = render(
    <>
      <first.Provider>
        <GroupPollInteraction groupId={groupId} toolId={toolId} embedded />
      </first.Provider>
      <second.Provider>
        <GroupPollInteraction groupId={groupId} toolId={otherId} embedded />
      </second.Provider>
    </>
  );
  const u = userEvent.setup();
  const [one, two] = screen.getAllByRole('article');
  const firstOption = within(one).getByRole('radio', { name: 'Books' });
  const secondOption = within(two).getByRole('radio', { name: 'Films' });
  expect(firstOption.getAttribute('name')).not.toBe(
    secondOption.getAttribute('name')
  );
  await u.click(firstOption);
  await u.click(secondOption);
  expect(firstOption).toBeChecked();
  expect(secondOption).toBeChecked();
  m.unmount();
  await Promise.all([first.client.close(), second.client.close()]);
});

it('renders Event feed polls through the shared card while preserving Event discovery and vote contracts', async () => {
  const eventId = 'event-one' as Id<'events'>;
  const f = fixture({
    'eventContent/queries:getContext': { canCreate: true, canManage: false },
    'eventContent/queries:listPolls': {
      ...emptyPage,
      page: [{ ...poll, groupId: undefined, eventId }],
    },
    'groupPolls/queries:getPoll': { ...poll, groupId: undefined, eventId },
  });
  const m = render(
    <f.Provider>
      <EventToolScope eventId={eventId}>
        <GroupPollFeed groupId={eventId} />
      </EventToolScope>
    </f.Provider>
  );
  const u = userEvent.setup();
  await u.click(screen.getByRole('radio', { name: 'Films' }));
  await u.click(screen.getByRole('button', { name: 'Save vote' }));
  expect(f.mutation.mock.calls[0][1]).toMatchObject({
    toolId,
    version: 3,
    expectedRevision: 0,
    selections: ['films'],
  });
  const queries = f.watch.mock.calls.map(([ref]) => getFunctionName(ref));
  expect(queries).toContain('eventContent/queries:listPolls');
  expect(queries).not.toContain('groupTools/queries:getPollPolicy');
  expect(queries).not.toContain('groups/queries:getGroup');
  m.unmount();
  await f.client.close();
});
