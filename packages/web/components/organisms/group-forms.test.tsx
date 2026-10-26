import { EventToolScope } from '@/features/content';
import GroupFormSettingsPage from '@/app/(groups)/groups/[groupId]/forms/[toolId]/settings/page';
import { createRequire } from 'node:module';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ConvexProviderWithAuth,
  ConvexReactClient,
  useMutation,
} from 'convex/react';
import { getFunctionName } from 'convex/server';
import { afterAll, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import type { Id } from '@/convex/_generated/dataModel';
import {
  GroupFormEditor,
  GroupFormInteraction,
  GroupFormHistory,
  GroupForms,
} from './group-forms';
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
const form = {
  _id: toolId,
  _creationTime: 1,
  groupId,
  kind: 'FORM',
  title: 'Book feedback',
  description: 'Ongoing form',
  resultsVisibility: 'MANAGERS',
  createdAt: 1,
  updatedAt: 1,
  version: 1,
  questions: [
    {
      id: 'book',
      label: 'Favorite book',
      type: 'SHORT_ANSWER',
      required: true,
    },
  ],
  answers: {},
  savedQuestions: [],
  savedVersion: null,
  responseRevision: 0,
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
    'groupForms/queries:getForm': form,
    'groupForms/queries:getFormForManagement': { ...form, canManage: true },
    'groupForms/queries:getOwnHistory': emptyPage,
    'groupForms/queries:listResults': emptyPage,
    'groupForms/queries:listForms': { ...emptyPage, page: [form] },
    'groupTools/queries:getFormPolicy': {
      groupId,
      kind: 'FORM',
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
it('creates directly with authored questions via real shared/app hooks and accessible editor controls', async () => {
  const sharedSdk = createRequire(import.meta.url)(
    '../../../shared/node_modules/convex/react'
  );
  expect(sharedSdk.useMutation).not.toBe(useMutation);
  const { client, mutation, Provider } = fixture();
  mutation.mockResolvedValue(toolId);
  const mounted = render(
    <Provider>
      <GroupFormEditor groupId={groupId} />
    </Provider>
  );
  const user = userEvent.setup();
  expect(
    screen.queryByRole('button', { name: /template/i })
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Add question' }));
  await user.type(
    screen.getByLabelText('Question text'),
    'What did you think?'
  );
  await user.selectOptions(
    screen.getByLabelText('Question type'),
    'LONG_ANSWER'
  );
  await user.click(screen.getByLabelText('Answer required'));
  expect(
    screen.getByRole('group', { name: 'Form questions' })
  ).toBeInTheDocument();
  await user.clear(screen.getByLabelText('Form title'));
  await user.type(screen.getByLabelText('Form title'), 'Reading feedback');
  await user.type(
    screen.getByLabelText('Description'),
    'Share feedback with everyone.'
  );
  await user.click(screen.getByText('Visibility · Personal'));
  await user.selectOptions(
    screen.getByLabelText('Response visibility (fixed for this form)'),
    'MEMBERS'
  );
  await user.click(screen.getByRole('button', { name: 'Create form' }));
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(1));
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupForms/mutations:createForm'
  );
  expect(mutation.mock.calls[0][1]).toMatchObject({
    groupId,
    title: 'Reading feedback',
    description: 'Share feedback with everyone.',
    resultsVisibility: 'MEMBERS',
    questions: [
      {
        id: expect.any(String),
        label: 'What did you think?',
        type: 'LONG_ANSWER',
        required: true,
      },
    ],
  });
  expect(push).toHaveBeenCalledWith('/groups/group-one/forms/tool-one');
  mounted.unmount();
  await client.close();
});
it('explains personal visibility before submitting and confirms own removal', async () => {
  const { client, mutation, Provider } = fixture({
    'groupForms/queries:getForm': {
      ...form,
      savedVersion: 1,
      responseRevision: 2,
      answers: { book: 'Dune' },
      savedQuestions: form.questions,
    },
  });
  const mounted = render(
    <Provider>
      <GroupFormInteraction groupId={groupId} toolId={toolId} />
    </Provider>
  );
  const user = userEvent.setup();
  expect(
    screen.getByText('Only you and managers can see your response')
  ).toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: /history/i })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Save response' })
  ).not.toBeInTheDocument();
  expect(screen.getByLabelText('Favorite book')).toHaveValue('Dune');
  await user.clear(screen.getByLabelText('Favorite book'));
  await user.type(screen.getByLabelText('Favorite book'), 'Kindred');
  await user.click(
    screen.getByRole('button', { name: /^(Submit|Update) response$/ })
  );
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(1));
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupForms/mutations:submitResponse'
  );
  expect(mutation.mock.calls[0][1]).toEqual({
    toolId,
    version: 1,
    expectedRevision: 2,
    answers: { book: 'Kindred' },
  });
  await user.click(screen.getByText('Actions'));
  await user.click(screen.getByRole('button', { name: 'Remove my response' }));
  expect(mutation).toHaveBeenCalledTimes(1);
  await user.click(
    screen.getByRole('button', {
      name: 'Confirm removing my response and its history',
    })
  );
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(2));
  expect(getFunctionName(mutation.mock.calls[1][0])).toBe(
    'groupForms/mutations:removeResponse'
  );
  mounted.unmount();
  await client.close();
});
it('manages current form configuration without a mutable visibility control', async () => {
  const { client, mutation, Provider } = fixture({
    'groupForms/queries:getFormForManagement': {
      ...form,
      canManage: true,
      version: 3,
    },
  });
  const mounted = render(
    <Provider>
      <GroupFormEditor groupId={groupId} toolId={toolId} />
    </Provider>
  );
  const user = userEvent.setup();
  expect(
    screen.queryByLabelText('Response visibility (fixed for this form)')
  ).not.toBeInTheDocument();
  await user.clear(screen.getByLabelText('Question text'));
  await user.type(screen.getByLabelText('Question text'), 'New wording');
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(1));
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupForms/mutations:configureForm'
  );
  expect(mutation.mock.calls[0][1]).toMatchObject({
    toolId,
    version: 3,
    questions: [{ label: 'New wording' }],
  });
  mounted.unmount();
  await client.close();
});
it('keeps owner policy recovery accessible without mounting ordinary content under required onboarding', async () => {
  const { client, mutation, watch, Provider } = fixture({
    'groups/queries:getGroup': {
      _id: groupId,
      viewerRole: 'OWNER',
      joiningQuestionnaire: { canAccessMemberContent: false },
    },
  });
  const mounted = render(
    <Provider>
      <GroupForms groupId={groupId} />
    </Provider>
  );
  expect(screen.getByText(/Complete required onboarding/)).toBeInTheDocument();
  expect(watch.mock.calls.map(([ref]) => getFunctionName(ref))).not.toContain(
    'groupForms/queries:listForms'
  );
  await userEvent.click(screen.getByText('Settings'));
  await userEvent.click(screen.getByRole('button', { name: 'Disable forms' }));
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(1));
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupTools/mutations:configureFormPolicy'
  );
  mounted.unmount();
  await client.close();
});
it('shows original own records without requesting private current definitions', async () => {
  const { client, watch, Provider } = fixture({
    'groupForms/queries:getOwnHistory': {
      ...emptyPage,
      page: [
        {
          _id: 'revision-one',
          revision: 1,
          version: 1,
          questions: [
            {
              id: 'old',
              label: 'Original wording',
              type: 'SHORT_ANSWER',
              required: true,
            },
          ],
          answers: { old: 'My saved answer' },
        },
      ],
    },
  });
  const mounted = render(
    <Provider>
      <GroupFormHistory toolId={toolId} />
    </Provider>
  );
  expect(screen.getByText('Original wording')).toBeInTheDocument();
  expect(screen.getByText('My saved answer')).toBeInTheDocument();
  expect([
    ...new Set(watch.mock.calls.map(([ref]) => getFunctionName(ref))),
  ]).toEqual(['groupForms/queries:getOwnHistory']);
  mounted.unmount();
  await client.close();
});

it('uses all seven accessible form answer primitives with typed values', async () => {
  const questions = [
    { id: 'short', label: 'Name', type: 'SHORT_ANSWER', required: true },
    { id: 'long', label: 'Background', type: 'LONG_ANSWER', required: false },
    {
      id: 'choice',
      label: 'Favorite',
      type: 'MULTIPLE_CHOICE',
      options: ['Blue', 'Red'],
      required: false,
    },
    {
      id: 'checks',
      label: 'Interests',
      type: 'CHECKBOXES',
      options: ['Music', 'Art'],
      required: true,
    },
    { id: 'number', label: 'Years', type: 'NUMBER', required: false },
    {
      id: 'dropdown',
      label: 'Area',
      type: 'DROPDOWN',
      options: ['North', 'South'],
      required: false,
    },
    { id: 'yes', label: 'Available', type: 'YES_NO', required: false },
  ];
  const { client, mutation, Provider } = fixture({
    'groupForms/queries:getForm': { ...form, questions },
  });
  const mounted = render(
    <Provider>
      <GroupFormInteraction groupId={groupId} toolId={toolId} />
    </Provider>
  );
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Name'), 'Alex');
  await user.type(screen.getByLabelText('Background'), 'Hello');
  await user.selectOptions(screen.getByLabelText('Favorite'), 'Blue');
  await user.click(screen.getByLabelText('Music'));
  await user.type(screen.getByLabelText('Years'), '3');
  await user.selectOptions(screen.getByLabelText('Area'), 'North');
  await user.selectOptions(screen.getByLabelText('Available'), 'false');
  await user.click(
    screen.getByRole('button', { name: /^(Submit|Update) response$/ })
  );
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(1));
  expect(mutation.mock.calls[0][1]).toMatchObject({
    answers: {
      short: 'Alex',
      long: 'Hello',
      choice: 'Blue',
      checks: ['Music'],
      number: 3,
      dropdown: 'North',
      yes: false,
    },
  });
  mounted.unmount();
  await client.close();
});
it('opens shared results on demand and moderates by persistent result identity', async () => {
  const { client, mutation, Provider } = fixture({
    'groupForms/queries:getForm': {
      ...form,
      resultsVisibility: 'MEMBERS',
      canManage: true,
      canReview: true,
    },
    'groupForms/queries:listResults': {
      ...emptyPage,
      page: [
        {
          _id: 'response-one',
          version: 1,
          questions: form.questions,
          answers: { book: 'Shared Dune' },
        },
      ],
    },
  });
  const mounted = render(
    <Provider>
      <GroupFormInteraction groupId={groupId} toolId={toolId} />
    </Provider>
  );
  expect(screen.getByText('Shared responses')).toBeInTheDocument();
  expect(screen.queryByText(/Anonymous contribution/)).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Responses' }));
  expect(screen.getByText(/Anonymous contribution/)).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole('button', { name: 'Remove response' })
  );
  expect(mutation).not.toHaveBeenCalled();
  await userEvent.click(
    screen.getByRole('button', { name: 'Confirm removing this response' })
  );
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(1));
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupForms/mutations:removeResult'
  );
  expect(mutation.mock.calls[0][1]).toEqual({ responseId: 'response-one' });
  mounted.unmount();
  await client.close();
});
it('keeps a stale response draft visible and reports revision conflicts without retry', async () => {
  const { client, mutation, Provider } = fixture();
  mutation.mockRejectedValue(
    new Error('Your response changed. Reload before editing.')
  );
  const mounted = render(
    <Provider>
      <GroupFormInteraction groupId={groupId} toolId={toolId} />
    </Provider>
  );
  await userEvent.type(screen.getByLabelText('Favorite book'), 'My draft');
  await userEvent.click(
    screen.getByRole('button', { name: /^(Submit|Update) response$/ })
  );
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Your response changed'
  );
  expect(screen.getByLabelText('Favorite book')).toHaveValue('My draft');
  expect(mutation).toHaveBeenCalledTimes(1);
  mounted.unmount();
  await client.close();
});

it('disabled forms expose moderator settings and confirmed deletion through the actual route and provider', async () => {
  const { client, mutation, watch, Provider } = fixture({
    'groups/queries:getGroup': {
      _id: groupId,
      viewerRole: 'MODERATOR',
      joiningQuestionnaire: { canAccessMemberContent: true },
    },
    'groupTools/queries:getFormPolicy': {
      groupId,
      kind: 'FORM',
      enabled: false,
      creation: 'MANAGERS',
      canConfigure: false,
    },
    'groupForms/queries:getForm': undefined,
  });
  const hub = render(
    <Provider>
      <GroupForms groupId={groupId} />
    </Provider>
  );
  expect(
    screen.getByRole('link', { name: 'Manage Book feedback' })
  ).toHaveAttribute('href', '/groups/group-one/forms/tool-one/settings');
  expect(
    screen.queryByRole('link', { name: 'Create form' })
  ).not.toBeInTheDocument();
  hub.unmount();
  const mounted = render(
    <Provider>
      <GroupFormSettingsPage />
    </Provider>
  );
  const user = userEvent.setup();
  await user.clear(screen.getByLabelText('Form title'));
  await user.type(screen.getByLabelText('Form title'), 'Preserved settings');
  await user.click(screen.getByRole('button', { name: 'Save changes' }));
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(1));
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupForms/mutations:configureForm'
  );
  await user.click(screen.getByText('Actions'));
  await user.click(screen.getByRole('button', { name: 'Delete form' }));
  expect(mutation).toHaveBeenCalledTimes(1);
  await user.click(
    screen.getByRole('button', {
      name: 'Confirm deleting form and all responses',
    })
  );
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(2));
  expect(getFunctionName(mutation.mock.calls[1][0])).toBe(
    'groupForms/mutations:deleteForm'
  );
  const names = watch.mock.calls.map(([ref]) => getFunctionName(ref));
  expect(names).toContain('groupForms/queries:getFormForManagement');
  expect(names).not.toContain('groupForms/queries:getForm');
  expect(names).not.toContain('groupForms/queries:listResults');
  expect(
    mutation.mock.calls.map(([ref]) => getFunctionName(ref))
  ).not.toContain('groupTools/mutations:configureFormPolicy');
  mounted.unmount();
  await client.close();
});
it.each([
  { viewerRole: 'MEMBER', canAccess: true },
  { viewerRole: 'MODERATOR', canAccess: false },
])(
  'denies disabled settings mounting for $viewerRole with content eligibility $canAccess',
  async ({ viewerRole, canAccess }) => {
    const { client, watch, Provider } = fixture({
      'groups/queries:getGroup': {
        _id: groupId,
        viewerRole,
        joiningQuestionnaire: { canAccessMemberContent: canAccess },
      },
      'groupTools/queries:getFormPolicy': {
        groupId,
        kind: 'FORM',
        enabled: false,
        creation: 'MANAGERS',
        canConfigure: false,
      },
    });
    const mounted = render(
      <Provider>
        <GroupFormSettingsPage />
      </Provider>
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Current eligible managers'
    );
    expect(
      screen.queryByRole('button', { name: 'Save changes' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete form' })
    ).not.toBeInTheDocument();
    expect(watch.mock.calls.map(([ref]) => getFunctionName(ref))).not.toContain(
      'groupForms/queries:getFormForManagement'
    );
    mounted.unmount();
    await client.close();
  }
);

it('creates an Event form through the shared editor without writing Group policy', async () => {
  const eventId = 'event-one' as Id<'events'>;
  const { client, mutation, watch, Provider } = fixture({
    'eventContent/queries:getContext': {
      title: 'Picnic',
      canCreate: true,
      canManage: false,
    },
  });
  mutation.mockResolvedValue(toolId);
  const mounted = render(
    <Provider>
      <EventToolScope eventId={eventId}>
        <GroupFormEditor groupId={eventId} />
      </EventToolScope>
    </Provider>
  );
  const user = userEvent.setup();
  expect(
    screen.queryByRole('button', { name: /template/i })
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Add question' }));
  await user.type(
    screen.getByLabelText('Question text'),
    'What did you think?'
  );
  await user.selectOptions(
    screen.getByLabelText('Question type'),
    'LONG_ANSWER'
  );
  await user.click(screen.getByLabelText('Answer required'));
  await user.click(screen.getByRole('button', { name: 'Create form' }));
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(1));
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'eventContent/mutations:createForm'
  );
  expect(mutation.mock.calls[0][1]).toMatchObject({ eventId });
  expect(mutation.mock.calls[0][1]).not.toHaveProperty('groupId');
  expect(push).toHaveBeenCalledWith('/event/event-one/forms/tool-one');
  expect(watch.mock.calls.map(([ref]) => getFunctionName(ref))).not.toContain(
    'groups/queries:getGroup'
  );
  mounted.unmount();
  await client.close();
});
it('keeps Event form discovery available when creation is restricted', async () => {
  const eventId = 'event-one' as Id<'events'>;
  const { client, Provider } = fixture({
    'eventContent/queries:getContext': {
      title: 'Picnic',
      canCreate: false,
      canManage: false,
    },
    'eventContent/queries:listForms': {
      ...emptyPage,
      page: [{ ...form, groupId: undefined, eventId }],
    },
  });
  const mounted = render(
    <Provider>
      <EventToolScope eventId={eventId}>
        <GroupForms groupId={eventId} />
      </EventToolScope>
    </Provider>
  );
  expect(screen.getByRole('link', { name: 'Book feedback' })).toHaveAttribute(
    'href',
    '/event/event-one/forms/tool-one'
  );
  expect(
    screen.queryByRole('link', { name: 'Create form' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Disable forms' })
  ).not.toBeInTheDocument();
  mounted.unmount();
  await client.close();
});
it('rejects a Group-owned form reached under an Event URL', async () => {
  const eventId = 'event-one' as Id<'events'>;
  const { client, Provider } = fixture();
  const mounted = render(
    <Provider>
      <EventToolScope eventId={eventId}>
        <GroupFormInteraction groupId={eventId} toolId={toolId} />
      </EventToolScope>
    </Provider>
  );
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Form unavailable in this context.'
  );
  expect(
    screen.queryByRole('button', { name: /^(Submit|Update) response$/ })
  ).not.toBeInTheDocument();
  mounted.unmount();
  await client.close();
});

it('denies Event moderator creation when only organizers may create content', async () => {
  const eventId = 'event-one' as Id<'events'>;
  const { client, Provider } = fixture({
    'eventContent/queries:getContext': {
      title: 'Picnic',
      canCreate: false,
      canManage: true,
    },
  });
  const mounted = render(
    <Provider>
      <EventToolScope eventId={eventId}>
        <GroupFormEditor groupId={eventId} />
      </EventToolScope>
    </Provider>
  );
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Form creation is unavailable'
  );
  expect(
    screen.queryByRole('button', { name: 'Create form' })
  ).not.toBeInTheDocument();
  mounted.unmount();
  await client.close();
});

it('retains saved feedback through a reactive response revision while reseeding answers and isolating tools', async () => {
  const f = fixture();
  const m = render(
    <f.Provider>
      <GroupFormInteraction groupId={groupId} toolId={toolId} />
    </f.Provider>
  );
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Favorite book'), 'Kindred');
  await user.click(
    screen.getByRole('button', { name: /^(Submit|Update) response$/ })
  );
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Response saved.'
  );
  await act(async () => {
    f.data['groupForms/queries:getForm'] = {
      ...form,
      responseRevision: 1,
      savedVersion: 1,
      answers: { book: 'Kindred' },
    };
    f.refresh();
  });
  expect(screen.getByRole('status')).toHaveTextContent('Response saved.');
  expect(screen.getByLabelText('Favorite book')).toHaveValue('Kindred');
  await user.clear(screen.getByLabelText('Favorite book'));
  await user.type(
    screen.getByLabelText('Favorite book'),
    'Unsaved local draft'
  );
  const otherId = 'tool-two' as Id<'groupTools'>;
  f.data['groupForms/queries:getForm'] = {
    ...form,
    _id: otherId,
    title: 'Another form',
    responseRevision: 1,
    answers: { book: 'Other saved answer' },
  };
  m.rerender(
    <f.Provider>
      <GroupFormInteraction groupId={groupId} toolId={otherId} />
    </f.Provider>
  );
  expect(screen.getByLabelText('Favorite book')).toHaveValue(
    'Other saved answer'
  );
  expect(screen.queryByText('Response saved.')).not.toBeInTheDocument();
  m.unmount();
  await f.client.close();
});

it('requires an explicit complete submission and prevents duplicate pending submissions', async () => {
  const f = fixture();
  let resolveSubmit: (value: { revision: number }) => void = () => {};
  f.mutation.mockImplementation(
    () =>
      new Promise(resolve => {
        resolveSubmit = resolve;
      })
  );
  const m = render(
    <f.Provider>
      <GroupFormInteraction groupId={groupId} toolId={toolId} />
    </f.Provider>
  );
  const user = userEvent.setup();
  expect(
    screen.queryByRole('link', { name: /history/i })
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Submit response' }));
  expect(f.mutation).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText('Favorite book'), 'Kindred');
  expect(f.mutation).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Submit response' }));
  expect(f.mutation).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button', { name: 'Submitting…' })).toBeDisabled();
  expect(screen.getByLabelText('Favorite book')).toBeDisabled();
  await act(async () => resolveSubmit({ revision: 1 }));
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Response saved.'
  );
  m.unmount();
  await f.client.close();
});
