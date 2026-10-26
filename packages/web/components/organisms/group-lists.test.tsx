import { EventToolScope } from '@/features/content';
import GroupListSettingsPage from '@/app/(groups)/groups/[groupId]/lists/[toolId]/settings/page';
import { createRequire } from 'node:module';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
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
  GroupLists,
  GroupListEditor,
  GroupListInteraction,
  GroupListOwnEntries,
} from './group-lists';
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
const list = {
  _id: toolId,
  _creationTime: 1,
  groupId,
  kind: 'LIST',
  title: 'Reading ideas',
  description: 'Persistent',
  resultsVisibility: 'MANAGERS',
  createdAt: 1,
  updatedAt: 1,
  version: 1,
  canManage: false,
};
const emptyPage = { page: [], isDone: true, continueCursor: '' };
function fixture(overrides: Record<string, unknown> = {}) {
  const client = new ConvexReactClient('https://fixture.convex.cloud', {
    unsavedChangesWarning: false,
  });
  const data: Record<string, unknown> = {
    'groupLists/queries:getList': list,
    'groupLists/queries:getListForManagement': { ...list, canManage: true },
    'groupLists/queries:getOwnEntries': emptyPage,
    'groupLists/queries:listEntries': emptyPage,
    'groupLists/queries:listLists': { ...emptyPage, page: [list] },
    'groupTools/queries:getListPolicy': {
      groupId,
      kind: 'LIST',
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
  const subscribers = new Set<() => void>();
  const watch = vi
    .spyOn(client, 'watchQuery')
    .mockImplementation((...[query]) => ({
      onUpdate: callback => {
        subscribers.add(callback);
        return () => subscribers.delete(callback);
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
    notify: () => subscribers.forEach(callback => callback()),
  };
}
it('creates a list through consuming SDK and real accessible controls', async () => {
  const sharedSdk = createRequire(import.meta.url)(
    '../../../shared/node_modules/convex/react'
  );
  expect(sharedSdk.useMutation).not.toBe(useMutation);
  const { client, mutation, Provider } = fixture();
  mutation.mockResolvedValue(toolId);
  const mounted = render(
    <Provider>
      <GroupListEditor groupId={groupId} />
    </Provider>
  );
  const user = userEvent.setup();
  await user.clear(screen.getByLabelText('List title'));
  await user.type(screen.getByLabelText('List title'), 'Ideas');
  await user.click(screen.getByRole('button', { name: 'List settings' }));
  await user.selectOptions(
    screen.getByLabelText('Entry visibility (fixed)'),
    'MEMBERS'
  );
  await user.click(screen.getByRole('button', { name: 'Done' }));
  await user.click(screen.getByRole('button', { name: 'Create list' }));
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(1));
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupLists/mutations:createList'
  );
  expect(mutation.mock.calls[0][1]).toMatchObject({
    groupId,
    title: 'Ideas',
    resultsVisibility: 'MEMBERS',
  });
  mounted.unmount();
  await client.close();
});
it('omits redundant participant chrome and retries the original request after uncertain add', async () => {
  const { client, mutation, Provider } = fixture();
  mutation
    .mockRejectedValueOnce(Error('Uncertain'))
    .mockResolvedValue({ entryId: 'entry-one', state: 'PRESENT' });
  const mounted = render(
    <Provider>
      <GroupListInteraction groupId={groupId} toolId={toolId} />
    </Provider>
  );
  const user = userEvent.setup();
  expect(screen.queryByText(/Account deletion purges/)).not.toBeInTheDocument();
  expect(
    screen.queryByRole('link', { name: 'My saved list entries' })
  ).not.toBeInTheDocument();
  await user.type(screen.getByLabelText('New entry'), 'Kindred');
  await user.click(screen.getByRole('button', { name: 'Add entry' }));
  await screen.findByRole('button', { name: 'Retry original entry' });
  expect(screen.getByLabelText('New entry')).toBeDisabled();
  await user.click(
    screen.getByRole('button', { name: 'Retry original entry' })
  );
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(2));
  expect(mutation.mock.calls[1][1]).toEqual(mutation.mock.calls[0][1]);
  mounted.unmount();
  await client.close();
});
it('mounts disabled moderator settings without interaction and rejects incomplete managers', async () => {
  const overrides = {
    'groups/queries:getGroup': {
      _id: groupId,
      viewerRole: 'MODERATOR',
      joiningQuestionnaire: { canAccessMemberContent: true },
    },
    'groupTools/queries:getListPolicy': {
      groupId,
      kind: 'LIST',
      enabled: false,
      creation: 'MANAGERS',
      canConfigure: false,
    },
  };
  const { client, mutation, watch, Provider } = fixture(overrides);
  const mounted = render(
    <Provider>
      <GroupListSettingsPage />
    </Provider>
  );
  const user = userEvent.setup();
  await user.clear(screen.getByLabelText('List title'));
  await user.type(screen.getByLabelText('List title'), 'Updated');
  await user.click(screen.getByRole('button', { name: 'Save list settings' }));
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(1));
  expect(getFunctionName(mutation.mock.calls[0][0])).toBe(
    'groupLists/mutations:configureList'
  );
  expect(watch.mock.calls.map(c => getFunctionName(c[0]))).not.toContain(
    'groupLists/queries:getList'
  );
  mounted.unmount();
  await client.close();
  const denied = fixture({
    ...overrides,
    'groups/queries:getGroup': {
      _id: groupId,
      viewerRole: 'MODERATOR',
      joiningQuestionnaire: { canAccessMemberContent: false },
    },
  });
  const stop = render(
    <denied.Provider>
      <GroupListEditor groupId={groupId} toolId={toolId} />
    </denied.Provider>
  );
  expect(screen.queryByLabelText('List title')).not.toBeInTheDocument();
  expect(denied.mutation).not.toHaveBeenCalled();
  stop.unmount();
  await denied.client.close();
});
it('edits completion and confirms revision-bound removal using production controls', async () => {
  const entry = {
    _id: 'entry-one',
    _creationTime: 1,
    toolId,
    groupId,
    personId: 'person-one',
    listTitle: 'Original',
    text: 'Saved',
    completed: false,
    revision: 3,
    createdAt: 1,
    updatedAt: 1,
    canEdit: true,
    canRemove: true,
  };
  const { client, mutation, Provider } = fixture({
    'groupLists/queries:listEntries': { ...emptyPage, page: [entry] },
  });
  mutation
    .mockResolvedValueOnce({ revision: 4 })
    .mockResolvedValueOnce({ revision: 5 });
  const mounted = render(
    <Provider>
      <GroupListInteraction groupId={groupId} toolId={toolId} />
    </Provider>
  );
  const user = userEvent.setup();
  expect(screen.queryByLabelText('Entry text')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Save entry' })
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Edit entry: Saved' }));
  await user.clear(screen.getByLabelText('Entry text'));
  await user.type(screen.getByLabelText('Entry text'), 'Edited{Enter}');
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(1));
  expect(mutation.mock.calls[0][1]).toMatchObject({
    entryId: 'entry-one',
    version: 1,
    expectedRevision: 3,
    text: 'Edited',
    completed: false,
  });
  await user.click(screen.getByLabelText('Completed: Edited'));
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(2));
  expect(mutation.mock.calls[1][1]).toMatchObject({
    entryId: 'entry-one',
    version: 1,
    expectedRevision: 4,
    completed: true,
  });
  await user.click(screen.getByLabelText('Entry actions: Edited'));
  await user.click(screen.getByRole('button', { name: 'Remove entry' }));
  expect(mutation).toHaveBeenCalledTimes(2);
  await user.click(
    screen.getByRole('button', { name: 'Confirm removing this entry' })
  );
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(3));
  expect(mutation.mock.calls[2][1]).toEqual({
    entryId: 'entry-one',
    expectedRevision: 5,
  });
  mounted.unmount();
  await client.close();
});
it('own recovery reads original snapshots without current private configuration', async () => {
  const entry = {
    _id: 'entry-one',
    _creationTime: 1,
    toolId,
    groupId,
    listTitle: 'Original title',
    text: 'Retained',
    completed: true,
    revision: 2,
    createdAt: 1,
    updatedAt: 1,
    canEdit: false,
    canRemove: true,
  };
  const { client, watch, Provider } = fixture({
    'groupLists/queries:getOwnEntries': { ...emptyPage, page: [entry] },
  });
  const mounted = render(
    <Provider>
      <GroupListOwnEntries toolId={toolId} />
    </Provider>
  );
  expect(
    screen.getByRole('heading', { name: 'Original title' })
  ).toBeInTheDocument();
  expect([
    ...new Set(watch.mock.calls.map(c => getFunctionName(c[0]))),
  ]).toEqual(['groupLists/queries:getOwnEntries']);
  mounted.unmount();
  await client.close();
});

it('recovers a stale or expired add with a confirmed fresh request after inspection', async () => {
  const { client, mutation, Provider, data, notify } = fixture();
  mutation
    .mockRejectedValueOnce(Error('List configuration changed'))
    .mockRejectedValueOnce(Error('Request expired'))
    .mockResolvedValue({ entryId: 'entry-one', state: 'PRESENT' });
  const mounted = render(
    <Provider>
      <GroupListInteraction groupId={groupId} toolId={toolId} />
    </Provider>
  );
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('New entry'), 'Keep this draft');
  await user.click(screen.getByRole('button', { name: 'Add entry' }));
  await screen.findByRole('button', { name: 'Retry original entry' });
  const first = mutation.mock.calls[0][1];
  data['groupLists/queries:getList'] = { ...list, version: 2 };
  act(notify);
  expect(
    screen.getByText(/List settings changed since the original attempt/)
  ).toBeInTheDocument();
  mounted.rerender(
    <Provider>
      <GroupListInteraction groupId={groupId} toolId={toolId} />
    </Provider>
  );
  await user.click(
    screen.getByRole('button', { name: 'Retry original entry' })
  );
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(2));
  expect(mutation.mock.calls[1][1]).toEqual(first);
  await user.click(
    screen.getByRole('button', { name: 'Start new request after inspection' })
  );
  expect(mutation).toHaveBeenCalledTimes(2);
  expect(
    screen.getByText(/A previous request may have succeeded/)
  ).toBeInTheDocument();
  await user.click(
    screen.getByRole('button', { name: 'Confirm starting a new entry request' })
  );
  expect(screen.getByLabelText('New entry')).toHaveValue('Keep this draft');
  expect(screen.getByLabelText('New entry')).not.toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Add entry' }));
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(3));
  expect(mutation.mock.calls[2][1]).toMatchObject({
    version: 2,
    text: 'Keep this draft',
  });
  expect(mutation.mock.calls[2][1].requestId).not.toBe(first.requestId);
  mounted.unmount();
  await client.close();
});

it('discovers Event lists without duplicating the separately mounted legacy Bring List card', async () => {
  const eventId = 'event-one' as Id<'events'>;
  const { client, Provider } = fixture({
    'eventContent/queries:getContext': {
      title: 'Picnic',
      canCreate: true,
      canManage: true,
    },
    'eventContent/queries:listLists': {
      ...emptyPage,
      page: [{ ...list, groupId: undefined, eventId }],
    },
  });
  const mounted = render(
    <Provider>
      <EventToolScope eventId={eventId}>
        <GroupLists groupId={eventId} />
      </EventToolScope>
    </Provider>
  );
  expect(
    screen.queryByRole('link', {
      name: 'Open existing Bring List and item claims',
    })
  ).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Reading ideas' })).toHaveAttribute(
    'href',
    '/event/event-one/lists/tool-one'
  );
  mounted.unmount();
  await client.close();
});

it('locks rapid completion changes until the server acknowledges the update and keeps failures truthful', async () => {
  const entry = {
    _id: 'entry-one',
    _creationTime: 1,
    toolId,
    groupId,
    personId: 'person-one',
    listTitle: 'Original',
    text: 'Saved',
    completed: false,
    revision: 3,
    createdAt: 1,
    updatedAt: 1,
    canEdit: true,
    canRemove: false,
  };
  const f = fixture({
    'groupLists/queries:listEntries': { ...emptyPage, page: [entry] },
  });
  let resolve!: (value: { revision: number }) => void;
  f.mutation
    .mockImplementationOnce(
      () =>
        new Promise(done => {
          resolve = done;
        })
    )
    .mockRejectedValueOnce(Error('Revision changed'));
  const mounted = render(
    <f.Provider>
      <GroupListInteraction groupId={groupId} toolId={toolId} />
    </f.Provider>
  );
  const user = userEvent.setup();
  const checkbox = screen.getByLabelText('Completed: Saved');
  await user.dblClick(checkbox);
  expect(f.mutation).toHaveBeenCalledTimes(1);
  expect(checkbox).not.toBeChecked();
  expect(checkbox).toBeDisabled();
  await act(async () => resolve({ revision: 4 }));
  expect(checkbox).toBeChecked();
  expect(checkbox).not.toBeDisabled();
  await user.click(checkbox);
  await screen.findByRole('alert');
  expect(checkbox).toBeChecked();
  expect(f.mutation.mock.calls[1][1]).toMatchObject({
    expectedRevision: 4,
    completed: false,
  });
  mounted.unmount();
  await f.client.close();
});
it('keeps failed text edits and allows Escape to cancel without another write', async () => {
  const entry = {
    _id: 'entry-one',
    _creationTime: 1,
    toolId,
    groupId,
    text: 'Saved',
    completed: false,
    revision: 3,
    createdAt: 1,
    updatedAt: 1,
    canEdit: true,
    canRemove: false,
  };
  const f = fixture({
    'groupLists/queries:listEntries': { ...emptyPage, page: [entry] },
  });
  f.mutation.mockRejectedValueOnce(Error('Unable to update'));
  const mounted = render(
    <f.Provider>
      <GroupListInteraction groupId={groupId} toolId={toolId} />
    </f.Provider>
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Edit entry: Saved' }));
  await user.clear(screen.getByLabelText('Entry text'));
  await user.type(screen.getByLabelText('Entry text'), 'Keep draft{Enter}');
  await screen.findByRole('alert');
  expect(screen.getByLabelText('Entry text')).toHaveValue('Keep draft');
  await user.click(screen.getByLabelText('Entry text'));
  await user.keyboard('{Escape}');
  expect(screen.queryByLabelText('Entry text')).not.toBeInTheDocument();
  expect(screen.getByText('Saved')).toBeInTheDocument();
  expect(f.mutation).toHaveBeenCalledTimes(1);
  mounted.unmount();
  await f.client.close();
});

it('keeps IME confirmation Enter in the text editor until an ordinary Enter commits it', async () => {
  const entry = {
    _id: 'entry-one',
    _creationTime: 1,
    toolId,
    groupId,
    text: 'Saved',
    completed: false,
    revision: 3,
    createdAt: 1,
    updatedAt: 1,
    canEdit: true,
    canRemove: false,
  };
  const f = fixture({
    'groupLists/queries:listEntries': { ...emptyPage, page: [entry] },
  });
  f.mutation.mockResolvedValue({ revision: 4 });
  const mounted = render(
    <f.Provider>
      <GroupListInteraction groupId={groupId} toolId={toolId} />
    </f.Provider>
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Edit entry: Saved' }));
  const input = screen.getByLabelText('Entry text');
  fireEvent.change(input, { target: { value: '東京' } });
  fireEvent.compositionStart(input);
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', isComposing: true });
  expect(f.mutation).not.toHaveBeenCalled();
  expect(input).toHaveValue('東京');
  expect(input).toHaveFocus();
  fireEvent.compositionEnd(input);
  await user.keyboard('{Enter}');
  await waitFor(() => expect(f.mutation).toHaveBeenCalledTimes(1));
  expect(f.mutation.mock.calls[0][1]).toMatchObject({
    text: '東京',
    expectedRevision: 3,
    completed: false,
  });
  mounted.unmount();
  await f.client.close();
});

it('keeps type-specific list settings in one modal and preserves hidden policies', async () => {
  const f = fixture();
  f.mutation.mockResolvedValue(toolId);
  const mounted = render(
    <f.Provider>
      <GroupListEditor groupId={groupId} />
    </f.Provider>
  );
  const user = userEvent.setup();
  expect(screen.queryByLabelText('Type')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'List settings' }));
  expect(
    screen.getByRole('dialog', { name: 'List settings' })
  ).toBeInTheDocument();
  expect(screen.getByLabelText('Type')).toHaveValue('CHECKLIST');
  await user.selectOptions(
    screen.getByLabelText('Who can check off items?'),
    'AUTHORS'
  );
  await user.selectOptions(screen.getByLabelText('Type'), 'SIMPLE');
  expect(
    screen.queryByLabelText('Who can check off items?')
  ).not.toBeInTheDocument();
  await user.selectOptions(
    screen.getByLabelText('Who can add items?'),
    'CREATOR_MANAGERS'
  );
  await user.click(screen.getByRole('button', { name: 'Done' }));
  await user.click(screen.getByRole('button', { name: 'Create list' }));
  await waitFor(() => expect(f.mutation).toHaveBeenCalledTimes(1));
  expect(f.mutation.mock.calls[0][1]).toMatchObject({
    listType: 'SIMPLE',
    addPolicy: 'CREATOR_MANAGERS',
    completionPolicy: 'AUTHORS',
  });
  mounted.unmount();
  await f.client.close();
});

it('allows an active ordinary creator to edit settings without granting list deletion', async () => {
  const f = fixture({
    'groups/queries:getGroup': {
      _id: groupId,
      viewerRole: 'MEMBER',
      joiningQuestionnaire: { canAccessMemberContent: true },
    },
    'groupLists/queries:getListForManagement': {
      ...list,
      canManage: false,
      canConfigure: true,
      canDelete: false,
      listType: 'CHECKLIST',
      hasEntries: false,
    },
  });
  const mounted = render(
    <f.Provider>
      <GroupListEditor groupId={groupId} toolId={toolId} />
    </f.Provider>
  );
  const user = userEvent.setup();
  expect(screen.getByLabelText('List title')).toHaveValue('Reading ideas');
  expect(screen.queryByText('More')).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'List settings' }));
  await user.selectOptions(screen.getByLabelText('Type'), 'SIMPLE');
  await user.click(screen.getByRole('button', { name: 'Done' }));
  await user.click(screen.getByRole('button', { name: 'Save list settings' }));
  await waitFor(() => expect(f.mutation).toHaveBeenCalledTimes(1));
  expect(f.mutation.mock.calls[0][1]).toMatchObject({
    toolId,
    version: 1,
    listType: 'SIMPLE',
  });
  mounted.unmount();
  await f.client.close();
  const denied = fixture({
    'groupLists/queries:getListForManagement': {
      ...list,
      canManage: false,
      canConfigure: false,
      canDelete: false,
    },
  });
  const stop = render(
    <denied.Provider>
      <GroupListEditor groupId={groupId} toolId={toolId} />
    </denied.Provider>
  );
  expect(screen.getByRole('alert')).toHaveTextContent(
    'Only the creator and current managers'
  );
  expect(screen.queryByLabelText('List title')).not.toBeInTheDocument();
  stop.unmount();
  await denied.client.close();
});

const attributedEntry = {
  _id: 'entry-one',
  _creationTime: 1,
  toolId,
  groupId,
  personId: 'person-one',
  listTitle: 'Reading ideas',
  text: 'A very long shared contribution',
  completed: false,
  revision: 3,
  createdAt: 1,
  updatedAt: 1,
  canEdit: false,
  canRemove: false,
  canComplete: true,
  addedByName: 'Alexandra Longname',
};

it('lets eligible non-authors complete through the dedicated capability and shows acknowledged attribution', async () => {
  const f = fixture({
    'groupLists/queries:getList': {
      ...list,
      resultsVisibility: 'MEMBERS',
      listType: 'CHECKLIST',
      canAdd: false,
    },
    'groupLists/queries:listEntries': { ...emptyPage, page: [attributedEntry] },
  });
  const mounted = render(
    <f.Provider>
      <GroupListInteraction groupId={groupId} toolId={toolId} />
    </f.Provider>
  );
  const user = userEvent.setup();
  expect(screen.getByText('Added by Alexandra Longname')).toBeInTheDocument();
  expect(screen.queryByLabelText('New entry')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /Edit entry/ })
  ).not.toBeInTheDocument();
  f.mutation.mockResolvedValueOnce({ revision: 4 });
  await user.click(screen.getByLabelText(`Completed: ${attributedEntry.text}`));
  await waitFor(() => expect(f.mutation).toHaveBeenCalledTimes(1));
  expect(getFunctionName(f.mutation.mock.calls[0][0])).toBe(
    'groupLists/mutations:setEntryCompleted'
  );
  expect(f.mutation.mock.calls[0][1]).toEqual({
    entryId: 'entry-one',
    version: 1,
    expectedRevision: 3,
    completed: true,
  });
  expect(screen.queryByText(/Completed by/)).not.toBeInTheDocument();
  act(() => {
    f.data['groupLists/queries:listEntries'] = {
      ...emptyPage,
      page: [
        {
          ...attributedEntry,
          completed: true,
          revision: 4,
          completedByName: 'Bianca Longname',
        },
      ],
    };
    f.notify();
  });
  await screen.findByText(
    'Added by Alexandra Longname · Completed by Bianca Longname'
  );
  f.mutation.mockResolvedValueOnce({ revision: 5 });
  await user.click(screen.getByLabelText(`Completed: ${attributedEntry.text}`));
  await waitFor(() => expect(f.mutation).toHaveBeenCalledTimes(2));
  expect(screen.queryByText(/Completed by/)).not.toBeInTheDocument();
  mounted.unmount();
  await f.client.close();
});

it('plain lists omit completion controls and attribution without changing stored completion', async () => {
  const f = fixture({
    'groupLists/queries:getList': {
      ...list,
      listType: 'SIMPLE',
      canAdd: false,
    },
    'groupLists/queries:listEntries': {
      ...emptyPage,
      page: [
        { ...attributedEntry, completed: true, completedByName: 'Bianca' },
      ],
    },
  });
  const mounted = render(
    <f.Provider>
      <GroupListInteraction groupId={groupId} toolId={toolId} />
    </f.Provider>
  );
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  expect(screen.getByText(attributedEntry.text)).not.toHaveClass(
    'line-through'
  );
  expect(screen.getByText('Added by Alexandra Longname')).toBeInTheDocument();
  expect(screen.queryByText(/Completed by/)).not.toBeInTheDocument();
  expect(f.mutation).not.toHaveBeenCalled();
  mounted.unmount();
  await f.client.close();
});

it('explains non-destructive Bring conversion boundaries and never makes personal data shared', async () => {
  const f = fixture({
    'groupLists/queries:getListForManagement': {
      ...list,
      resultsVisibility: 'MEMBERS',
      canConfigure: true,
      canDelete: false,
      hasEntries: true,
      listType: 'CHECKLIST',
    },
  });
  const mounted = render(
    <f.Provider>
      <GroupListEditor groupId={groupId} toolId={toolId} />
    </f.Provider>
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'List settings' }));
  await user.selectOptions(screen.getByLabelText('Type'), 'BRING');
  expect(screen.getByRole('button', { name: 'Done' })).toBeDisabled();
  expect(
    screen.getByRole('link', { name: 'Create separate Bring list' })
  ).toHaveAttribute('href', '/groups/group-one/lists/new?type=BRING');
  expect(f.mutation).not.toHaveBeenCalled();
  mounted.unmount();
  await f.client.close();
  const personal = fixture({
    'groupLists/queries:getListForManagement': {
      ...list,
      canConfigure: true,
      hasEntries: false,
    },
  });
  const stop = render(
    <personal.Provider>
      <GroupListEditor groupId={groupId} toolId={toolId} />
    </personal.Provider>
  );
  await user.click(screen.getByRole('button', { name: 'List settings' }));
  expect(screen.getByRole('option', { name: 'Bring list' })).toBeDisabled();
  expect(
    screen.getByText('Bring lists require shared visibility.')
  ).toBeInTheDocument();
  stop.unmount();
  await personal.client.close();
});

it('Bring lists use quantity claims instead of checklist completion and preserve claim revisions', async () => {
  const entry = { ...attributedEntry, quantity: 3, claimedQuantity: 0 };
  const f = fixture({
    'groupLists/queries:getList': {
      ...list,
      listType: 'BRING',
      resultsVisibility: 'MEMBERS',
      canAdd: true,
    },
    'groupLists/queries:listEntries': { ...emptyPage, page: [entry] },
    'groupLists/queries:listBringClaims': [
      {
        entryId: 'entry-one',
        totalClaimed: 0,
        myQuantity: 0,
        myRevision: 0,
        claimants: [],
      },
    ],
  });
  const mounted = render(
    <f.Provider>
      <GroupListInteraction groupId={groupId} toolId={toolId} />
    </f.Provider>
  );
  const user = userEvent.setup();
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  expect(screen.getByText('0 / 3 claimed')).toBeInTheDocument();
  f.mutation.mockResolvedValueOnce({
    revision: 1,
    quantity: 1,
    totalClaimed: 1,
  });
  await user.click(
    screen.getByRole('button', { name: `Claim more ${entry.text}` })
  );
  await screen.findByText('1 / 3 claimed');
  expect(getFunctionName(f.mutation.mock.calls[0][0])).toBe(
    'groupLists/mutations:setBringClaim'
  );
  expect(f.mutation.mock.calls[0][1]).toMatchObject({
    toolId,
    entryId: 'entry-one',
    version: 1,
    expectedClaimRevision: 0,
    quantity: 1,
  });
  f.mutation.mockResolvedValueOnce({
    revision: 2,
    quantity: 2,
    totalClaimed: 2,
  });
  await user.click(
    screen.getByRole('button', { name: `Claim more ${entry.text}` })
  );
  await screen.findByText('2 / 3 claimed');
  expect(f.mutation.mock.calls[1][1]).toMatchObject({
    expectedClaimRevision: 1,
    quantity: 2,
  });
  f.mutation.mockResolvedValueOnce({ entryId: 'entry-new', state: 'PRESENT' });
  await user.type(screen.getByLabelText('New entry'), 'Paper cups');
  await user.clear(screen.getByLabelText('Quantity needed'));
  await user.type(screen.getByLabelText('Quantity needed'), '5');
  await user.click(screen.getByRole('button', { name: 'Add entry' }));
  await waitFor(() => expect(f.mutation).toHaveBeenCalledTimes(3));
  expect(f.mutation.mock.calls[2][1]).toMatchObject({
    text: 'Paper cups',
    quantity: 5,
  });
  mounted.unmount();
  await f.client.close();
});

it('returns keyboard focus to settings and keeps private completion policy unambiguous', async () => {
  const f = fixture({
    'groupLists/queries:getListForManagement': {
      ...list,
      canConfigure: true,
      listType: 'CHECKLIST',
      hasEntries: false,
    },
  });
  const mounted = render(
    <f.Provider>
      <GroupListEditor groupId={groupId} toolId={toolId} />
    </f.Provider>
  );
  const user = userEvent.setup();
  const trigger = screen.getByRole('button', { name: 'List settings' });
  await user.click(trigger);
  expect(
    screen.queryByLabelText('Who can check off items?')
  ).not.toBeInTheDocument();
  expect(
    screen.getByText(
      'Only item authors and managers can check off personal entries.'
    )
  ).toBeInTheDocument();
  await user.keyboard('{Escape}');
  await waitFor(() => expect(trigger).toHaveFocus());
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  mounted.unmount();
  await f.client.close();
});

it('locks pending Bring claims and reacts to other participants filling remaining capacity', async () => {
  const entry = { ...attributedEntry, quantity: 3, claimedQuantity: 0 };
  const f = fixture({
    'groupLists/queries:getList': {
      ...list,
      listType: 'BRING',
      resultsVisibility: 'MEMBERS',
      canAdd: false,
    },
    'groupLists/queries:listEntries': { ...emptyPage, page: [entry] },
    'groupLists/queries:listBringClaims': [
      {
        entryId: 'entry-one',
        totalClaimed: 0,
        myQuantity: 0,
        myRevision: 0,
        claimants: [],
        hasMoreClaimants: false,
      },
    ],
  });
  let finish!: (value: unknown) => void;
  f.mutation.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      })
  );
  const mounted = render(
    <f.Provider>
      <GroupListInteraction groupId={groupId} toolId={toolId} />
    </f.Provider>
  );
  const user = userEvent.setup();
  const plus = screen.getByRole('button', { name: `Claim more ${entry.text}` });
  await user.click(plus);
  expect(plus).toBeDisabled();
  expect(screen.getByText('0 / 3 claimed')).toBeInTheDocument();
  await user.click(plus);
  expect(f.mutation).toHaveBeenCalledTimes(1);
  await act(async () => finish({ revision: 1, quantity: 1, totalClaimed: 1 }));
  await screen.findByText('1 / 3 claimed');
  act(() => {
    f.data['groupLists/queries:listBringClaims'] = [
      {
        entryId: 'entry-one',
        totalClaimed: 3,
        myQuantity: 1,
        myRevision: 1,
        claimants: [
          { personId: 'person-one', name: 'Alexandra', quantity: 1 },
          { personId: 'person-two', name: 'Bianca', quantity: 2 },
        ],
        hasMoreClaimants: false,
      },
    ];
    f.notify();
  });
  await screen.findByText('3 / 3 claimed');
  expect(
    screen.getByRole('button', { name: `Claim more ${entry.text}` })
  ).toBeDisabled();
  expect(screen.getByText('Alexandra (1), Bianca (2)')).toBeInTheDocument();
  mounted.unmount();
  await f.client.close();
});

it('edits Bring quantities explicitly and keeps quantity and text in one version-bound update', async () => {
  const entry = {
    ...attributedEntry,
    canEdit: true,
    quantity: 5,
    claimedQuantity: 2,
  };
  const f = fixture({
    'groupLists/queries:getList': {
      ...list,
      listType: 'BRING',
      resultsVisibility: 'MEMBERS',
      canAdd: false,
    },
    'groupLists/queries:listEntries': { ...emptyPage, page: [entry] },
    'groupLists/queries:listBringClaims': [
      {
        entryId: 'entry-one',
        totalClaimed: 2,
        myQuantity: 0,
        myRevision: 0,
        claimants: [],
        hasMoreClaimants: false,
      },
    ],
  });
  f.mutation.mockResolvedValueOnce({ revision: 4 });
  const mounted = render(
    <f.Provider>
      <GroupListInteraction groupId={groupId} toolId={toolId} />
    </f.Provider>
  );
  const user = userEvent.setup();
  await user.click(
    screen.getByRole('button', { name: `Edit entry: ${entry.text}` })
  );
  const quantity = screen.getByLabelText('Quantity needed');
  expect(quantity).toHaveAttribute('min', '2');
  await user.clear(quantity);
  await user.type(quantity, '6{Enter}');
  await waitFor(() => expect(f.mutation).toHaveBeenCalledTimes(1));
  expect(getFunctionName(f.mutation.mock.calls[0][0])).toBe(
    'groupLists/mutations:editEntry'
  );
  expect(f.mutation.mock.calls[0][1]).toMatchObject({
    entryId: 'entry-one',
    version: 1,
    expectedRevision: 3,
    text: entry.text,
    quantity: 6,
    completed: false,
  });
  mounted.unmount();
  await f.client.close();
});

it('preserves the requested separate-list type in the new creator without saving the source list', async () => {
  const f = fixture();
  f.mutation.mockResolvedValue(toolId);
  const mounted = render(
    <f.Provider>
      <GroupListEditor groupId={groupId} initialType='BRING' />
    </f.Provider>
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'List settings' }));
  expect(screen.getByLabelText('Type')).toHaveValue('BRING');
  expect(screen.getByLabelText('Who can add items?')).toHaveValue(
    'CREATOR_MANAGERS'
  );
  expect(
    screen.queryByLabelText('Who can check off items?')
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Done' }));
  expect(f.mutation).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: 'Create list' }));
  await waitFor(() => expect(f.mutation).toHaveBeenCalledTimes(1));
  expect(getFunctionName(f.mutation.mock.calls[0][0])).toBe(
    'groupLists/mutations:createList'
  );
  expect(f.mutation.mock.calls[0][1]).toMatchObject({
    listType: 'BRING',
    addPolicy: 'CREATOR_MANAGERS',
    resultsVisibility: 'MEMBERS',
  });
  mounted.unmount();
  await f.client.close();
});

it('keeps the own-claim lock across remote totals and quantity edits until its request finishes', async () => {
  const entry = { ...attributedEntry, quantity: 3, claimedQuantity: 0 };
  const f = fixture({
    'groupLists/queries:getList': {
      ...list,
      listType: 'BRING',
      resultsVisibility: 'MEMBERS',
      canAdd: false,
    },
    'groupLists/queries:listEntries': { ...emptyPage, page: [entry] },
    'groupLists/queries:listBringClaims': [
      {
        entryId: 'entry-one',
        totalClaimed: 0,
        myQuantity: 0,
        myRevision: 0,
        claimants: [],
        hasMoreClaimants: false,
      },
    ],
  });
  let finish!: (value: unknown) => void;
  f.mutation.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finish = resolve;
      })
  );
  const mounted = render(
    <f.Provider>
      <GroupListInteraction groupId={groupId} toolId={toolId} />
    </f.Provider>
  );
  const user = userEvent.setup();
  const plus = screen.getByRole('button', { name: `Claim more ${entry.text}` });
  await user.click(plus);
  expect(plus).toBeDisabled();
  act(() => {
    f.data['groupLists/queries:listEntries'] = {
      ...emptyPage,
      page: [{ ...entry, quantity: 4, claimedQuantity: 1, revision: 4 }],
    };
    f.data['groupLists/queries:listBringClaims'] = [
      {
        entryId: 'entry-one',
        totalClaimed: 1,
        myQuantity: 0,
        myRevision: 0,
        claimants: [{ personId: 'person-two', name: 'Bianca', quantity: 1 }],
        hasMoreClaimants: false,
      },
    ];
    f.notify();
  });
  await screen.findByText('1 / 4 claimed');
  expect(screen.getByRole('button', { name: `Claim more ${entry.text}` })).toBe(
    plus
  );
  expect(plus).toBeDisabled();
  await user.click(plus);
  expect(f.mutation).toHaveBeenCalledTimes(1);
  await act(async () => finish({ revision: 1, quantity: 1, totalClaimed: 2 }));
  await screen.findByText('2 / 4 claimed');
  expect(plus).toBeEnabled();
  act(() => {
    f.data['groupLists/queries:listBringClaims'] = [
      {
        entryId: 'entry-one',
        totalClaimed: 3,
        myQuantity: 1,
        myRevision: 1,
        claimants: [],
        hasMoreClaimants: false,
      },
    ];
    f.notify();
  });
  await screen.findByText('3 / 4 claimed');
  f.mutation.mockResolvedValueOnce({
    revision: 2,
    quantity: 2,
    totalClaimed: 4,
  });
  await user.click(plus);
  await screen.findByText('4 / 4 claimed');
  expect(f.mutation.mock.calls[1][1]).toMatchObject({
    expectedClaimRevision: 1,
    quantity: 2,
  });
  expect(plus).toBeDisabled();
  mounted.unmount();
  await f.client.close();
});
