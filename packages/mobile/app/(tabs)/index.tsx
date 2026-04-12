import { useState, useCallback } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area-view';

import { useGlobalUser } from '@/context/global-user-context';
import { useUserEvents } from '@/hooks/use-events';
import { EventCard } from '@/components/events/event-card';
import { EventListSkeleton } from '@/components/events/event-list-skeleton';
import { EventsWelcomeHeader } from '@/components/events/events-welcome-header';
import { EmptyEvents } from '@/components/events/empty-events';
import { CreateEventFab } from '@/components/events/create-event-fab';

export default function HomeScreen() {
  const { user } = useGlobalUser();
  const eventsData = useUserEvents();
  const [refreshing, setRefreshing] = useState(false);

  const events = eventsData?.events ?? [];
  const isLoading = eventsData === undefined;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Convex auto-syncs, so just show the indicator briefly
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <EventsWelcomeHeader userName={user?.name ?? null} eventCount={0} />
        <EventListSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='flex-1'>
        <FlatList
          data={events}
          keyExtractor={item => item.event._id}
          renderItem={({ item }) => (
            <EventCard
              event={item.event}
              membership={item.membership}
              organizer={item.organizer}
            />
          )}
          ListHeaderComponent={
            <EventsWelcomeHeader
              userName={user?.name ?? null}
              eventCount={events.length}
            />
          }
          ListEmptyComponent={<EmptyEvents />}
          contentContainerClassName='pb-6'
          contentContainerStyle={events.length === 0 ? { flex: 1 } : undefined}
          className='px-4'
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
        <CreateEventFab />
      </View>
    </SafeAreaView>
  );
}
