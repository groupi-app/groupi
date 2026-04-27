import { useState, useCallback } from 'react';
import { View, FlatList, Pressable, RefreshControl } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { router } from 'expo-router';

import { ListScreenTemplate } from '@/components/templates';
import { LoadingState } from '@/components/molecules';
import { Timestamp } from '@/components/molecules';
import { EmptyState } from '@/components/ui/empty-state';
import { UserAvatar as Avatar } from '@/components/ui/user-avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@groupi/shared/platform';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DiscoverEvent = any;

export default function DiscoverScreen() {
  const events = useQuery(api.events.queries.getDiscoverableEvents, {});
  const joinEvent = useMutation(api.events.mutations.joinDiscoverableEvent);
  const [refreshing, setRefreshing] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  async function handleJoin(eventId: string) {
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
      subtitle='Events from friends and public events'
    >
      <FlatList
        data={events}
        keyExtractor={(item: DiscoverEvent) => item._id}
        className='px-4'
        contentContainerClassName='pb-6'
        contentContainerStyle={
          (events?.length ?? 0) === 0 ? { flex: 1 } : undefined
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }: { item: DiscoverEvent }) => {
          const isJoining = joiningId === item._id;

          return (
            <Pressable onPress={() => handleJoin(item._id)}>
              <Card className='mb-3'>
                <Text className='text-lg font-bold text-foreground'>
                  {item.title}
                </Text>

                {item.organizer?.name ? (
                  <View className='mt-1 flex-row items-center gap-2'>
                    <Avatar
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
                        color='#9ca3af'
                      />
                      <Text className='text-sm text-muted-foreground'>
                        {item.location}
                      </Text>
                    </View>
                  ) : null}
                  {item.memberCount ? (
                    <View className='flex-row items-center gap-1'>
                      <Ionicons
                        name='people-outline'
                        size={14}
                        color='#9ca3af'
                      />
                      <Text className='text-sm text-muted-foreground'>
                        {item.memberCount}{' '}
                        {item.memberCount === 1 ? 'member' : 'members'}
                      </Text>
                    </View>
                  ) : null}
                  {item._creationTime ? (
                    <Timestamp time={item._creationTime} />
                  ) : null}
                </View>

                <View className='mt-3'>
                  <Button
                    size='sm'
                    onPress={() => handleJoin(item._id)}
                    isLoading={isJoining}
                    loadingText='Joining...'
                  >
                    Join Event
                  </Button>
                </View>
              </Card>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon='compass-outline'
            title='No events to discover'
            description='Public events and events from your friends will appear here'
          />
        }
      />
    </ListScreenTemplate>
  );
}
