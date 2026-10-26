import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { act, useEffect, type ReactNode } from 'react';
import { getFunctionName } from 'convex/server';
import { useQuery, useMutation } from 'convex/react';
import type { Id } from 'convex/_generated/dataModel';
import { router } from 'expo-router';
import { beforeEach, expect, it, vi } from 'vitest';
vi.unmock('@groupi/shared/hooks');
vi.unmock('convex/_generated/api');
import {
  EventToolScope,
  useToolCommunity,
  useToolRouter,
  belongsToOwner,
} from './event-tool-scope';
import {
  useForms,
  useCreateForm,
  useFormPolicy,
} from '../../hooks/use-group-forms';
import {
  useLists,
  useCreateList,
  useListPolicy,
} from '../../hooks/use-group-lists';
import {
  usePolls,
  useCreatePoll,
  usePollPolicy,
} from '../../hooks/use-group-polls';

const require = createRequire(import.meta.url);
const renderer = require(
  require.resolve('react-test-renderer', {
    paths: [
      dirname(require.resolve('@testing-library/react-native/package.json')),
    ],
  })
) as { create: (element: ReactNode) => { unmount: () => void } };
const eventId = 'event-123' as Id<'events'>;
const watched: { name: string; args: unknown }[] = [];
const mutate = vi.fn(
  async (_name: string, _input: Record<string, unknown>) => 'tool-created'
);
let actions: {
  form?: ReturnType<typeof useCreateForm>;
  list?: ReturnType<typeof useCreateList>;
  poll?: ReturnType<typeof useCreatePoll>;
  navigate?: ReturnType<typeof useToolRouter>;
  policy?: ReturnType<typeof useFormPolicy>;
  community?: ReturnType<typeof useToolCommunity>;
} = {};
let canCreate = true;
function Probe() {
  const args = {
    groupId: eventId,
    paginationOpts: { numItems: 20, cursor: null },
  };
  useForms(args);
  useLists(args);
  usePolls(args);
  useListPolicy(args);
  usePollPolicy(args);
  const value = {
    form: useCreateForm(),
    list: useCreateList(),
    poll: useCreatePoll(),
    navigate: useToolRouter(),
    policy: useFormPolicy(args),
    community: useToolCommunity(eventId),
  };
  useEffect(() => {
    actions = value;
  });
  return null;
}
beforeEach(() => {
  watched.length = 0;
  actions = {};
  canCreate = true;
  vi.clearAllMocks();
  vi.mocked(useQuery).mockImplementation((...parameters) => {
    const [reference, args] = parameters;
    if (args === 'skip') return undefined;
    const name = getFunctionName(reference);
    watched.push({ name, args });
    if (name === 'eventContent/queries:getContext')
      return { title: 'Party', canCreate, canManage: true };
    return { page: [], isDone: true, continueCursor: '' };
  });
  vi.mocked(useMutation).mockImplementation(reference => {
    const call = Object.assign(
      (input: Record<string, unknown> = {}) =>
        mutate(getFunctionName(reference), input),
      { withOptimisticUpdate: () => call }
    );
    return call;
  });
});
it('adapts the three shared tool lists and composers to the Event owner without Group queries', async () => {
  let mounted: ReturnType<typeof renderer.create>;
  await act(async () => {
    mounted = renderer.create(
      <EventToolScope eventId={eventId}>
        <Probe />
      </EventToolScope>
    );
  });
  expect(watched.every(row => row.name.startsWith('eventContent/'))).toBe(true);
  expect(
    watched.filter(row => row.name.includes('list')).map(row => row.name)
  ).toEqual([
    'eventContent/queries:listForms',
    'eventContent/queries:listLists',
    'eventContent/queries:listPolls',
  ]);
  expect(watched[0].args).toEqual({
    eventId,
    paginationOpts: { numItems: 20, cursor: null },
  });
  await actions.form?.({
    groupId: eventId,
    title: 'Form',
    questions: [],
    resultsVisibility: 'MEMBERS',
  });
  await actions.list?.({
    groupId: eventId,
    title: 'List',
    resultsVisibility: 'MEMBERS',
  });
  await actions.poll?.({
    groupId: eventId,
    title: 'Poll',
    mode: 'SINGLE',
    options: [
      { id: 'a', label: 'A' },
      { id: 'b', label: 'B' },
    ],
    resultsVisibility: 'MEMBERS',
  });
  expect(mutate.mock.calls.map(call => call[0])).toEqual([
    'eventContent/mutations:createForm',
    'eventContent/mutations:createList',
    'eventContent/mutations:createPoll',
  ]);
  expect(
    mutate.mock.calls.every(
      call => call[1].eventId === eventId && !('groupId' in call[1])
    )
  ).toBe(true);
  actions.navigate?.push(`/groups/${eventId}/forms/tool-created`);
  expect(router.push).toHaveBeenCalledWith(
    `/event/${eventId}/forms/tool-created`
  );
  await act(async () => mounted!.unmount());
});
it('keeps management and discovery while denying creation under Event permissions', async () => {
  canCreate = false;
  let mounted: ReturnType<typeof renderer.create>;
  await act(async () => {
    mounted = renderer.create(
      <EventToolScope eventId={eventId}>
        <Probe />
      </EventToolScope>
    );
  });
  expect(actions.policy).toMatchObject({
    enabled: true,
    canCreate: false,
    canConfigure: false,
  });
  expect(actions.community?.canManageMembers).toBe(true);
  expect(belongsToOwner({ eventId }, eventId)).toBe(true);
  expect(
    belongsToOwner({ groupId: 'group-123' as Id<'groups'> }, eventId)
  ).toBe(false);
  await act(async () => mounted!.unmount());
});
