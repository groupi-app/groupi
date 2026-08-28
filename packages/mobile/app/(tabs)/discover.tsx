import { useState } from 'react';
import { View, FlatList } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { router } from 'expo-router';
import { useCSSVariable } from 'uniwind';
import { api } from 'convex/_generated/api';
import type { Id } from 'convex/_generated/dataModel';

import { ListScreenTemplate } from '@/components/templates';
import { LoadingState } from '@/components/molecules';
import { EmptyState } from '@/components/ui/empty-state';
import { MemberAvatar } from '@/components/members/member-avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@groupi/shared/platform';

function formatEventDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function DiscoverScreen() {
  const events = useQuery(api.events.queries.getDiscoverableEvents, {});
  const joinEvent = useMutation(api.events.mutations.joinDiscoverableEvent);
  const [joiningId, setJoiningId] = useState<Id<'events'> | null>(null);
  const mutedColor = String(
    useCSSVariable('--color-muted-foreground') ?? 'transparent'
  );

  async function handleJoin(eventId: Id<'events'>) {
    setJoiningId(eventId);
    try {
      await joinEvent({ eventId });
      toast.success('Joined event!');
      router.push(`/event/${eventId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to join event';
      toast.error(message);
    } finally {
      setJoiningId(null);
    }
  }

  if (events === undefined) {
    return (
      <ListScreenTemplate title='Discover'>
        <LoadingState />
      </ListScreenTemplate>
    );
  }

  return (
    <ListScreenTemplate
      title='Discover'
      subtitle='Upcoming events shared by your friends'
    >
      <FlatList
        data={events}
        keyExtractor={item => item.eventId}
        className='px-4'
        contentContainerClassName='pb-6'
        contentContainerStyle={
          (events?.length ?? 0) === 0 ? { flex: 1 } : undefined
        }
        renderItem={({ item }) => {
          const isJoining = joiningId === item.eventId;

          return (
            <Card className='mb-3'>
              <Text className='text-lg font-bold text-foreground'>
                {item.title}
              </Text>

              {item.organizer?.name ? (
                <View className='mt-1 flex-row items-center gap-2'>
                  <MemberAvatar
                    personId={item.organizer.personId}
                    src={item.organizer?.image}
                    name={item.organizer?.name}
                    size='xs'
                  />
                  <Text className='text-sm text-muted-foreground'>
                    by {item.organizer.name}
                  </Text>
                </View>
              ) : null}

              {item.description ? (
                <Text
                  className='mt-2 text-sm text-foreground/80'
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
              ) : null}

              <View className='mt-3 flex-row flex-wrap gap-3'>
                {item.location ? (
                  <View className='flex-row items-center gap-1'>
                    <Ionicons
                      name='location-outline'
                      size={14}
                      color={mutedColor}
                    />
                    <Text className='text-sm text-muted-foreground'>
                      {item.location}
                    </Text>
                  </View>
                ) : null}
                {item.memberCount > 0 ? (
                  <View className='flex-row items-center gap-1'>
                    <Ionicons
                      name='people-outline'
                      size={14}
                      color={mutedColor}
                    />
                    <Text className='text-sm text-muted-foreground'>
                      {item.memberCount}{' '}
                      {item.memberCount === 1 ? 'member' : 'members'}
                    </Text>
                  </View>
                ) : null}
                {item.chosenDateTime ? (
                  <View className='flex-row items-center gap-1'>
                    <Ionicons
                      name='calendar-outline'
                      size={14}
                      color={mutedColor}
                    />
                    <Text className='text-sm text-muted-foreground'>
                      {formatEventDate(item.chosenDateTime)}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View className='mt-3'>
                <Button
                  size='sm'
                  onPress={() => handleJoin(item.eventId)}
                  isLoading={isJoining}
                  loadingText='Joining...'
                  accessibilityLabel={`Join ${item.title}`}
                >
                  Join Event
                </Button>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon='compass-outline'
            title='No events to discover'
            description='Friends-only events you can join will appear here'
          />
        }
      />
    </ListScreenTemplate>
  );
}
