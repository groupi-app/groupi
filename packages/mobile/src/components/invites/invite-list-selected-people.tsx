import { ActivityIndicator, View } from 'react-native';
import type { ReactNode } from 'react';
import type { Id } from 'convex/_generated/dataModel';
import { Text } from '@/components/ui/text';
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
      {!personIds.length ? (
        <Text className='text-sm text-muted-foreground'>
          No people selected yet. Choose people below to add them.
        </Text>
      ) : null}
      {personIds.map(personId => {
        const person = current?.items.find(item => item.personId === personId);
        const name =
          current === undefined
            ? 'Loading person…'
            : person?.available
              ? (person.name ?? person.username ?? 'Groupi person')
              : 'Unavailable person';
        return (
          <View
            key={personId}
            className='flex-row items-center gap-3 rounded-card border border-border bg-card p-3'
          >
            <View className='min-w-0 flex-1 gap-1'>
              <Text className='font-medium text-foreground'>{name}</Text>
              {person?.available && person.username ? (
                <Text className='text-sm text-muted-foreground'>
                  @{person.username}
                </Text>
              ) : null}
            </View>
            <Button
              accessibilityLabel={`Remove ${name}`}
              accessibilityState={{ disabled: locked }}
              variant='ghost'
              disabled={locked}
              onPress={() => onRemove(personId)}
            >
              Remove
            </Button>
          </View>
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
