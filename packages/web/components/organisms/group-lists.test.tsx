import GroupListSettingsPage from '@/app/(groups)/groups/[groupId]/lists/[toolId]/settings/page';
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
  await user.selectOptions(
    screen.getByLabelText('Entry visibility (fixed)'),
    'MEMBERS'
  );
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
it('discloses privacy and retries the original request after uncertain add', async () => {
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
  expect(screen.getByText(/Account deletion purges/)).toBeInTheDocument();
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
  const mounted = render(
    <Provider>
      <GroupListInteraction groupId={groupId} toolId={toolId} />
    </Provider>
  );
  const user = userEvent.setup();
  await user.clear(screen.getByLabelText('Entry text'));
  await user.type(screen.getByLabelText('Entry text'), 'Edited');
  await user.click(screen.getByLabelText('Completed'));
  await user.click(screen.getByRole('button', { name: 'Save entry' }));
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(1));
  expect(mutation.mock.calls[0][1]).toMatchObject({
    entryId: 'entry-one',
    version: 1,
    expectedRevision: 3,
    text: 'Edited',
    completed: true,
  });
  await user.click(screen.getByRole('button', { name: 'Remove entry' }));
  expect(mutation).toHaveBeenCalledTimes(1);
  await user.click(
    screen.getByRole('button', { name: 'Confirm removing this entry' })
  );
  await waitFor(() => expect(mutation).toHaveBeenCalledTimes(2));
  expect(mutation.mock.calls[1][1]).toEqual({
    entryId: 'entry-one',
    expectedRevision: 3,
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
