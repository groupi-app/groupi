import { ActivityIndicator, Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import {
  useInviteListFriends,
  useInviteListPeople,
} from '@/hooks/use-invite-lists';
export type Person = NonNullable<
  ReturnType<typeof useInviteListFriends>
>['items'][number];

interface PeopleProps {
  search: string;
  selected: Pick<Person, 'personId'>[];
  saving: boolean;
  onToggle: (person: Person) => void;
}

export function InviteListPeople(props: PeopleProps) {
  return props.search.trim().length >= 2 ? (
    <SearchChoices {...props} />
  ) : (
    <FriendChoices {...props} />
  );
}

function SearchChoices(props: PeopleProps) {
  const choices = useInviteListPeople(props.search);
  return <PeopleChoices {...props} choices={choices} />;
}

function FriendChoices(props: PeopleProps) {
  const choices = useInviteListFriends();
  return <PeopleChoices {...props} choices={choices} />;
}

function PeopleChoices({
  search,
  selected,
  saving,
  onToggle,
  choices,
}: PeopleProps & {
  choices: ReturnType<typeof useInviteListFriends>;
}) {
  const searching = search.trim().length >= 2;
  return (
    <>
      <Text
        accessibilityRole='header'
        className='font-semibold text-foreground'
      >
        {searching ? 'Search results' : 'Accepted friends'}
      </Text>
      <Text className='text-sm text-muted-foreground'>
        Search with at least 2 username characters. You can include people who
        are not friends.
      </Text>
      {choices === undefined ? (
        <ActivityIndicator accessibilityLabel='Loading people' />
      ) : choices.items.length === 0 ? (
        <Text>
          {searching
            ? 'No people found'
            : 'No accepted friends yet. Search by username to find people.'}
        </Text>
      ) : (
        choices.items.map(person => {
          const checked = selected.some(
            item => item.personId === person.personId
          );
          const disabled = saving || (selected.length >= 100 && !checked);
          const name = person.name ?? person.username ?? 'Groupi person';
          return (
            <Pressable
              key={person.personId}
              accessibilityRole='checkbox'
              accessibilityLabel={`Select ${name}`}
              accessibilityState={{ checked, disabled }}
              disabled={disabled}
              onPress={() => onToggle(person)}
              className={cn(
                'min-h-[44px] flex-row items-center gap-3 rounded-card border p-4',
                checked
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card',
                disabled && 'opacity-50'
              )}
            >
              <View className='min-w-0 flex-1 gap-1'>
                <Text className='text-foreground'>{name}</Text>
                {person.username ? (
                  <Text className='text-sm text-muted-foreground'>
                    @{person.username}
                  </Text>
                ) : null}
              </View>
              <Text
                accessible={false}
                className={cn(
                  'text-sm font-semibold',
                  checked ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {checked ? '✓ Selected' : 'Select'}
              </Text>
            </Pressable>
          );
        })
      )}
    </>
  );
}
