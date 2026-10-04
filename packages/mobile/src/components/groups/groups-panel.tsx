import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { useCreateGroup, useGroups } from '@/hooks/use-groups';
import { GroupForm } from './group-form';

export function GroupsPanel() {
  const [creating, setCreating] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const groups = useGroups({ numItems: 20, cursor });
  const createGroup = useCreateGroup();

  return (
    <ScrollView contentContainerClassName='gap-4 p-4'>
      <Text className='text-xl font-bold text-foreground'>Your Groups</Text>
      {creating ? (
        <GroupForm
          onCancel={() => setCreating(false)}
          onSave={async identity => {
            const groupId = await createGroup({
              name: identity.name,
              description: identity.description || undefined,
              image: identity.image || undefined,
            });
            setCreating(false);
            router.push(`/groups/${groupId}`);
          }}
        />
      ) : (
        <Button onPress={() => setCreating(true)}>Create Group</Button>
      )}
      {groups === undefined ? (
        <Text className='text-muted-foreground'>Loading Groups…</Text>
      ) : groups.page.length === 0 ? (
        <Text className='text-muted-foreground'>
          No Groups here yet. Create a Group to get started.
        </Text>
      ) : (
        groups.page.map(group => (
          <View
            key={group._id}
            className='gap-2 rounded-card border border-border bg-card p-4'
          >
            <Text className='font-semibold text-foreground'>{group.name}</Text>
            <Button
              variant='outline'
              accessibilityLabel={`View Group ${group.name}`}
              onPress={() => router.push(`/groups/${group._id}`)}
            >
              View Group
            </Button>
          </View>
        ))
      )}
      {cursor ? (
        <Button variant='ghost' onPress={() => setCursor(null)}>
          First page
        </Button>
      ) : null}
      {groups && !groups.isDone ? (
        <Button
          variant='outline'
          onPress={() => setCursor(groups.continueCursor)}
        >
          Next Groups
        </Button>
      ) : null}
    </ScrollView>
  );
}
