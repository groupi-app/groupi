import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
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
    <ScrollView
      keyboardShouldPersistTaps='handled'
      contentContainerClassName='gap-4 p-4'
    >
      <View className='gap-1'>
        <Text
          accessibilityRole='header'
          className='text-2xl font-bold text-foreground'
        >
          Your Groups
        </Text>
        <Text className='text-sm text-muted-foreground'>
          Communities where you plan Events together.
        </Text>
      </View>
      <Button
        variant='outline'
        accessibilityLabel='View your Group invitations'
        onPress={() => router.push('/friends/group-invites')}
      >
        Group invitations
      </Button>
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
        <ActivityIndicator accessibilityLabel='Loading Groups' />
      ) : groups.page.length === 0 ? (
        <View className='gap-2 rounded-card border border-border bg-card p-6'>
          <Text className='text-lg font-semibold text-foreground'>
            {cursor ? 'No Groups on this page' : 'Your community starts here'}
          </Text>
          <Text className='text-muted-foreground'>
            {cursor
              ? 'Return to the first page to view your Groups.'
              : 'Create a Group, or accept a Group invitation to join a community.'}
          </Text>
        </View>
      ) : (
        groups.page.map(group => (
          <View
            key={group._id}
            className='gap-2 rounded-card border border-border bg-card p-4'
          >
            <Text
              accessibilityRole='header'
              className='text-lg font-semibold text-foreground'
            >
              {group.name}
            </Text>
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
