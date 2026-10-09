'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  useInviteList,
  useInviteListPeople,
  useInviteListFriends,
  useInviteListDraftPeople,
} from '@/hooks/convex/use-invite-lists';

type Person = NonNullable<ReturnType<typeof useInviteList>>['people'][number];

export function InviteListPersonRow({
  person,
  action,
}: {
  person: Person;
  action?: React.ReactNode;
}) {
  const name = person.available
    ? (person.name ?? person.username)
    : 'Unavailable person';
  return (
    <div className='flex items-center gap-3 rounded-card border border-border bg-card p-3'>
      <Avatar className='size-9'>
        <AvatarImage
          src={person.available ? (person.image ?? undefined) : undefined}
          alt=''
        />
        <AvatarFallback>
          {(name ?? 'U').slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className='min-w-0 flex-1'>
        <p className='font-medium'>{name}</p>
        {person.available && person.username && (
          <p className='text-sm text-muted-foreground'>@{person.username}</p>
        )}
      </div>
      {action}
    </div>
  );
}

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
  if (!selected.length) return null;
  if (!current) return <p role='status'>Checking selected people…</p>;
  return (
    <div className='space-y-2'>
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
      className='space-y-2'
    >
      <h3 className='font-medium'>
        {search ? 'Search results' : 'Your friends'}
      </h3>
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
