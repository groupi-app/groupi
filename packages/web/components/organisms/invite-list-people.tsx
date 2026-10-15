'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { InviteListPersonRow } from '@/components/molecules/invite-list-person-row';
export { InviteListPersonRow } from '@/components/molecules/invite-list-person-row';
import {
  useInviteList,
  useInviteListPeople,
  useInviteListFriends,
  useInviteListDraftPeople,
} from '@/hooks/convex/use-invite-lists';

type Person = NonNullable<ReturnType<typeof useInviteList>>['people'][number];

/** Keep snapshot identity/order while displaying only current profile projections. */
export function InviteListSelectedPeople({
  selected,
  remove,
  disabled,
}: {
  selected: Person[];
  remove: (personId: Person['personId']) => void;
  disabled: boolean;
}) {
  const current = useInviteListDraftPeople(
    selected.map(person => person.personId)
  );
  if (!selected.length)
    return (
      <p className='rounded-card border border-dashed border-border p-4 text-sm text-muted-foreground'>
        No people selected yet. Add friends below or search by username.
      </p>
    );
  if (!current) return <p role='status'>Checking selected people…</p>;
  return (
    <div className='flex flex-col gap-2'>
      {selected.map(snapshot => {
        const person = current.items.find(
          person => person.personId === snapshot.personId
        ) ?? {
          ...snapshot,
          available: false,
          name: null,
          username: null,
          image: null,
        };
        const label = person.available
          ? (person.name ?? person.username)
          : 'unavailable person';
        return (
          <InviteListPersonRow
            key={person.personId}
            person={person}
            action={
              <Button
                variant='ghost'
                disabled={disabled}
                aria-label={`Remove ${label}`}
                onClick={() => remove(person.personId)}
              >
                Remove
              </Button>
            }
          />
        );
      })}
      {current.items.every(person => !person.available) && (
        <p role='status'>
          Choose at least one existing person before saving. Unavailable entries
          can be removed.
        </p>
      )}
    </div>
  );
}

export function InviteListPersonChoices({
  search,
  selected,
  add,
}: {
  search: string;
  selected: Person[];
  add: (person: Person) => void;
}) {
  const friends = useInviteListFriends();
  const results = useInviteListPeople(search);
  const people = search ? results : friends;
  if (!people) return <p role='status'>Loading people…</p>;
  return (
    <section
      aria-label={search ? 'Search results' : 'Accepted friends'}
      className='flex flex-col gap-2'
    >
      <h3 className='font-medium'>
        {search ? 'Search results' : 'Your friends'}
      </h3>
      {selected.length >= 100 && (
        <Alert variant='info' role='status'>
          <AlertDescription>
            100 people selected. Remove someone to add another person.
          </AlertDescription>
        </Alert>
      )}
      {search && (
        <p role='status' className='text-sm text-muted-foreground'>
          {people.items.length}{' '}
          {people.items.length === 1 ? 'result' : 'results'} for “{search}”
        </p>
      )}
      {!people.items.length && (
        <p className='text-muted-foreground'>
          {search
            ? 'No users found. Try another username.'
            : 'Search by username to add existing Groupi users.'}
        </p>
      )}
      {people.items.map(person => (
        <InviteListPersonRow
          key={person.personId}
          person={person}
          action={
            <Button
              variant='outline'
              disabled={
                selected.some(item => item.personId === person.personId) ||
                selected.length >= 100
              }
              onClick={() => add(person)}
              aria-label={`Add ${person.name ?? person.username}`}
            >
              {selected.some(item => item.personId === person.personId)
                ? 'Added'
                : 'Add'}
            </Button>
          }
        />
      ))}
    </section>
  );
}
