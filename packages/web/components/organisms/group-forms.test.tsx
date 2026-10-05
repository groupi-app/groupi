import { createRequire } from 'node:module';
import { render, screen, waitFor } from '@testing-library/react';
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
  const watch = vi
    .spyOn(client, 'watchQuery')
    .mockImplementation((...[query]) => ({
      onUpdate: () => () => {},
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
  return { client, mutation, watch, Provider };
}
it('creates a reusable template via real shared/app hooks and accessible editor controls', async () => {
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
  await user.click(
    screen.getByRole('button', { name: 'Use feedback template' })
  );
  expect(
    screen.getByRole('group', { name: 'Form questions' })
  ).toBeInTheDocument();
  await user.clear(screen.getByLabelText('Form title'));
  await user.type(screen.getByLabelText('Form title'), 'Reading feedback');
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
    resultsVisibility: 'MEMBERS',
    questions: [{ id: 'feedback', type: 'LONG_ANSWER', required: true }],
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
  expect(screen.getByText(/Personal answers: only you/)).toHaveTextContent(
    'Account deletion purges'
  );
  expect(screen.getByLabelText('Favorite book')).toHaveValue('Dune');
  await user.clear(screen.getByLabelText('Favorite book'));
  await user.type(screen.getByLabelText('Favorite book'), 'Kindred');
  await user.click(screen.getByRole('button', { name: 'Save response' }));
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
    'groupForms/queries:getForm': { ...form, canManage: true, version: 3 },
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
  await user.click(screen.getByRole('button', { name: 'Save form settings' }));
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
  await user.click(screen.getByRole('button', { name: 'Save response' }));
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
it('explains shared retention and moderates an anonymous response by persistent result identity', async () => {
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
  expect(
    screen.getByText(/shared contribution survives anonymously/)
  ).toBeInTheDocument();
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
  await userEvent.click(screen.getByRole('button', { name: 'Save response' }));
  expect(await screen.findByRole('status')).toHaveTextContent(
    'Your response changed'
  );
  expect(screen.getByLabelText('Favorite book')).toHaveValue('My draft');
  expect(mutation).toHaveBeenCalledTimes(1);
  mounted.unmount();
  await client.close();
});
