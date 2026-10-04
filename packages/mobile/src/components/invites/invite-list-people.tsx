import { ActivityIndicator, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
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
      <Text className='font-semibold'>
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
        choices.items.map(person => (
          <Pressable
            key={person.personId}
            accessibilityRole='checkbox'
            accessibilityLabel={`Select ${person.name ?? person.username ?? 'person'}`}
            accessibilityState={{
              checked: selected.some(item => item.personId === person.personId),
              disabled:
                saving ||
                (selected.length >= 100 &&
                  !selected.some(item => item.personId === person.personId)),
            }}
            disabled={
              saving ||
              (selected.length >= 100 &&
                !selected.some(item => item.personId === person.personId))
            }
            onPress={() => onToggle(person)}
            className='min-h-[44px] gap-1 rounded-card border border-border bg-card p-4'
          >
            <Text>{person.name ?? person.username}</Text>
            {person.username ? (
              <Text className='text-sm text-muted-foreground'>
                @{person.username}
              </Text>
            ) : null}
          </Pressable>
        ))
      )}
    </>
  );
}
