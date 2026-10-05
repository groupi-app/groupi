import { ActivityIndicator } from 'react-native';
import type { ReactNode } from 'react';
import type { Id } from 'convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import { useInviteListDraftPeople } from '@/hooks/use-invite-lists';

type CurrentPerson = NonNullable<
  ReturnType<typeof useInviteListDraftPeople>
>['items'][number];

/** Keep copied identities and order, while displaying only current profiles. */
export function InviteListSelectedPeople({
  personIds,
  locked,
  onRemove,
}: {
  personIds: Id<'persons'>[];
  locked: boolean;
  onRemove: (personId: Id<'persons'>) => void;
}) {
  const current = useInviteListDraftPeople(personIds);
  return (
    <>
      {current === undefined && personIds.length ? (
        <ActivityIndicator accessibilityLabel='Loading selected people' />
      ) : null}
      {personIds.map(personId => {
        const person = current?.items.find(item => item.personId === personId);
        const name = person?.available
          ? (person.name ?? person.username ?? 'Groupi person')
          : 'Unavailable person';
        return (
          <Button
            key={personId}
            accessibilityLabel={`Remove ${name}`}
            variant='outline'
            disabled={locked}
            onPress={() => onRemove(personId)}
          >
            Remove {name}
          </Button>
        );
      })}
    </>
  );
}

export function CurrentInvitePerson({
  personId,
  children,
}: {
  personId: Id<'persons'>;
  children: (person: CurrentPerson | undefined) => ReactNode;
}) {
  const current = useInviteListDraftPeople([personId]);
  const person = current?.items.find(item => item.personId === personId);
  return children(person?.available ? person : undefined);
}
