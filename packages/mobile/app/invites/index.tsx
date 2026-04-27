import { View, FlatList } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';

import { DetailScreenTemplate } from '@/components/templates';
import { LoadingState } from '@/components/molecules';
import { Timestamp } from '@/components/molecules';
import { EmptyState } from '@/components/ui/empty-state';
import { UserAvatar as Avatar } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';
import {
  usePendingEventInvites,
  useAcceptEventInvite,
  useDeclineEventInvite,
} from '@/hooks/use-event-invites';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventInvite = any;

export default function InvitesScreen() {
  const invites = usePendingEventInvites();
  const acceptInvite = useAcceptEventInvite();
  const declineInvite = useDeclineEventInvite();

  if (invites === undefined) {
    return (
      <DetailScreenTemplate title='Event Invites' scrollable={false}>
        <LoadingState />
      </DetailScreenTemplate>
    );
  }

  return (
    <DetailScreenTemplate title='Event Invites' scrollable={false}>
      <FlatList
        data={invites}
        keyExtractor={(item: EventInvite) => item._id}
        className='px-4'
        contentContainerStyle={
          (invites?.length ?? 0) === 0 ? { flex: 1 } : undefined
        }
        renderItem={({ item }: { item: EventInvite }) => (
          <View className='mb-3 rounded-card border border-border bg-card p-4'>
            <View className='flex-row items-start gap-3'>
              {item.inviter?.image ? (
                <Avatar
                  src={item.inviter.image}
                  name={item.inviter.name}
                  size='md'
                />
              ) : null}
              <View className='flex-1'>
                <Text className='text-base font-semibold text-foreground'>
                  {item.event?.title ?? 'Event'}
                </Text>
                {item.inviter?.name ? (
                  <Text className='text-sm text-muted-foreground'>
                    Invited by {item.inviter.name}
                  </Text>
                ) : null}
                {item.event?.location ? (
                  <View className='mt-1 flex-row items-center gap-1'>
                    <Ionicons
                      name='location-outline'
                      size={12}
                      color='#9ca3af'
                    />
                    <Text className='text-xs text-muted-foreground'>
                      {item.event.location}
                    </Text>
                  </View>
                ) : null}
                {item.message ? (
                  <Text className='mt-2 text-sm text-foreground/80'>
                    &ldquo;{item.message}&rdquo;
                  </Text>
                ) : null}
                <Timestamp time={item._creationTime} className='mt-1' />
              </View>
            </View>

            <View className='mt-3 flex-row gap-2'>
              <View className='flex-1'>
                <Button onPress={() => acceptInvite(item._id)} size='sm'>
                  Accept
                </Button>
              </View>
              <View className='flex-1'>
                <Button
                  variant='outline'
                  onPress={() => declineInvite(item._id)}
                  size='sm'
                >
                  Decline
                </Button>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon='mail-outline'
            title='No pending invites'
            description='Event invitations will appear here'
          />
        }
      />
    </DetailScreenTemplate>
  );
}
