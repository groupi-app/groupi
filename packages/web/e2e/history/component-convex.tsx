/* eslint-disable @typescript-eslint/no-explicit-any */
// Deliberately synthetic boundary data; production components run unchanged.
import { useMemo, useSyncExternalStore } from 'react';
import { getFunctionName } from 'convex/server';

export const people = [
  {
    personId: 'ada',
    name: 'Ada Friend',
    username: 'ada',
    image: null,
    available: true,
  },
  {
    personId: 'lee',
    name: 'Lee Friend',
    username: 'lee',
    image: null,
    available: true,
  },
  {
    personId: 'sam',
    name: 'Sam Other',
    username: 'sam',
    image: null,
    available: true,
  },
];
const makeList = (id: string, name: string, members: typeof people) => ({
  inviteListId: id,
  name,
  people: members,
  personCount: members.length,
  availablePersonCount: members.length,
  needsAttention: false,
  createdAt: 1,
  updatedAt: 1,
});
let version = 0;
const listeners = new Set<() => void>();
export const fixture = {
  calls: [] as Array<{ name: string; args: unknown }>,
  lists: {} as Record<string, ReturnType<typeof makeList>>,
  role: 'ORGANIZER',
  sendMode: 'success' as 'success' | 'uncertain',
  reset() {
    this.calls = [];
    this.sendMode = 'success';
    this.lists = {
      first: makeList('first', 'Weekend', [people[0], people[1]]),
      second: makeList('second', 'Dinner', [people[1], people[2]]),
    };
    version++;
    listeners.forEach(listener => listener());
  },
};
fixture.reset();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
function queryResult(name: string, args: any) {
  if (name === 'inviteLists/queries:listInviteLists')
    return { items: Object.values(fixture.lists) };
  if (name === 'inviteLists/queries:getInviteList')
    return fixture.lists[args.inviteListId];
  if (name === 'inviteLists/queries:getFriendChoices')
    return { items: [people[0]] };
  if (name === 'inviteLists/queries:searchPeople')
    return { items: [people[2]] };
  if (name === 'inviteLists/queries:getPeopleByIds')
    return {
      items: args.personIds.map((id: string) =>
        people.find(person => person.personId === id)
      ),
    };
  if (name === 'inviteLists/queries:reviewInviteListRecipients') {
    const results = args.personIds.map((id: string) => ({
      ...people.find(person => person.personId === id),
      status: 'eligible',
    }));
    return {
      eventId: 'event',
      totalCount: results.length,
      eligibleCount: results.length,
      skippedCount: 0,
      results,
    };
  }
  if (
    name === 'events/queries:getEventHeader' ||
    name === 'events/queries:getEventAttendeesData'
  )
    return {
      event: { memberships: [] },
      userMembership: { role: fixture.role },
    };
  if (name === 'friends/queries:getFriends') return [people[0]];
  if (name === 'eventInvites/queries:getSentEventInvites') return [];
  if (name === 'eventInvites/queries:searchUserByExactUsernameForEventInvite')
    return null;
  if (name === 'eventInvites/queries:searchUsersForEventInvite')
    return [people[2]];
  if (name === 'invites/queries:getEventInvites')
    return { invites: [], pendingEmailCount: 0 };
  return undefined;
}
export function useQuery(query: any, args: any = {}) {
  const revision = useSyncExternalStore(
    subscribe,
    () => version,
    () => version
  );
  const name = query ? getFunctionName(query) : '';
  const key = JSON.stringify(args);
  return useMemo(() => {
    void revision;
    const parsed = JSON.parse(key);
    return parsed === 'skip' ? undefined : queryResult(name, parsed);
  }, [name, key, revision]);
}
const mutations = new Map<string, any>();
export function useMutation(mutation: any) {
  const name = getFunctionName(mutation);
  if (!mutations.has(name)) {
    const run = async (args: any) => {
      fixture.calls.push({ name, args: structuredClone(args) });
      if (name === 'inviteLists/mutations:createInviteList') {
        const list = makeList(
          `saved-${fixture.calls.length}`,
          args.name,
          args.personIds.map(
            (id: string) => people.find(person => person.personId === id)!
          )
        );
        fixture.lists[list.inviteListId] = list;
        version++;
        listeners.forEach(listener => listener());
        return list;
      }
      if (
        name === 'inviteLists/mutations:sendInviteListRecipients' &&
        fixture.sendMode === 'uncertain'
      )
        throw new Error('Synthetic lost response');
      if (name === 'inviteLists/mutations:sendInviteListRecipients')
        return {
          eventId: args.eventId,
          totalCount: args.personIds.length,
          sentCount: args.personIds.length,
          skippedCount: 0,
          results: args.personIds.map((personId: string) => ({
            personId,
            status: 'sent',
            inviteId: `invite-${personId}`,
          })),
        };
      throw new Error(`Unexpected fixture mutation: ${name}`);
    };
    Object.assign(run, { withOptimisticUpdate: () => run });
    mutations.set(name, run);
  }
  return mutations.get(name);
}
export const useConvexAuth = () => ({
  isAuthenticated: true,
  isLoading: false,
});
