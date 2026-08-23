import { useMemo } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { isEventPast } from '@groupi/shared/utils';
import { useCSSVariable } from 'uniwind';

import { useGlobalUser } from '@/context/global-user-context';
import { useUserEvents } from '@/hooks/use-events';
import { usePendingInviteCount } from '@/hooks/use-event-invites';
import { useMutedEvents } from '@/hooks/use-muting';
import { useFilterSortStore } from '@/stores';
import { EventCard } from '@/components/events/event-card';
import { EventListSkeleton } from '@/components/events/event-list-skeleton';
import { EmptyEvents } from '@/components/events/empty-events';
import { CreateEventFab } from '@/components/events/create-event-fab';
import { TabBarFilter } from '@/components/molecules';
import { useActionMenu } from '@/components/ui/action-menu';

import type { EventTab, SortBy } from '@/stores';

const EVENT_TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'hosting', label: 'Hosting' },
  { key: 'attended', label: 'Attended' },
];

const SORT_LABELS: Record<SortBy, string> = {
  lastactivity: 'Latest Activity',
  eventdate: 'Event Date',
  createdat: 'Date Created',
  title: 'Title',
};

export default function HomeScreen() {
  const { user } = useGlobalUser();
  const eventsData = useUserEvents();
  const inviteCount = usePendingInviteCount();
  const mutedEventsData = useMutedEvents();
  const { activeTab, sortBy, setActiveTab, setSortBy } = useFilterSortStore();
  const { showActionMenu } = useActionMenu();
  const primaryColor = String(useCSSVariable('--color-primary') ?? '');
  const mutedColor = String(useCSSVariable('--color-muted-foreground') ?? '');

  const isLoading = eventsData === undefined;

  const mutedEventIds = useMemo(() => {
    if (!mutedEventsData) return new Set<string>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new Set(mutedEventsData.map((m: any) => m.eventId));
  }, [mutedEventsData]);

  // Filter events by tab
  const filteredEvents = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allEvents: any[] = eventsData?.events ?? [];
    return allEvents.filter(item => {
      const isPast = isEventPast(
        item.event.chosenDateTime,
        item.event.chosenEndDateTime
      );
      const isOrganizer = item.membership.role === 'ORGANIZER';

      switch (activeTab) {
        case 'upcoming':
          return !isPast;
        case 'hosting':
          return isOrganizer && !isPast;
        case 'attended':
          return isPast;
        default:
          return true;
      }
    });
  }, [eventsData, activeTab]);

  // Sort events
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return (a.event.title ?? '').localeCompare(b.event.title ?? '');
        case 'eventdate': {
          const aDate = a.event.chosenDateTime ?? Number.MAX_SAFE_INTEGER;
          const bDate = b.event.chosenDateTime ?? Number.MAX_SAFE_INTEGER;
          return aDate - bDate;
        }
        case 'createdat':
          return (b.event._creationTime ?? 0) - (a.event._creationTime ?? 0);
        case 'lastactivity':
        default:
          return (
            (b.event.lastActivityAt ?? b.event._creationTime ?? 0) -
            (a.event.lastActivityAt ?? a.event._creationTime ?? 0)
          );
      }
    });
  }, [filteredEvents, sortBy]);

  function handleSortPress() {
    const sortOptions: SortBy[] = [
      'lastactivity',
      'eventdate',
      'createdat',
      'title',
    ];

    showActionMenu({
      title: 'Sort Events',
      options: sortOptions.map(option => ({
        label: `${SORT_LABELS[option]}${sortBy === option ? ' ✓' : ''}`,
        onPress: () => setSortBy(option),
      })),
    });
  }

  const greeting = user?.name
    ? `Hey, ${user.name.split(' ')[0]}!`
    : 'Hey there!';
  const pendingInvites = (inviteCount as number) ?? 0;

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='px-4 pb-4 pt-2'>
          <Text variant='h3' className='text-left'>
            {greeting}
          </Text>
        </View>
        <EventListSkeleton />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='flex-1'>
        <FlatList
          data={sortedEvents}
          keyExtractor={item => item.event._id}
          renderItem={({ item }) => (
            <EventCard
              event={item.event}
              membership={item.membership}
              organizer={item.organizer}
              isMuted={mutedEventIds.has(item.event._id)}
            />
          )}
          ListHeaderComponent={
            <View>
              <View className='px-4 pb-2 pt-2'>
                <View className='flex-row items-center justify-between'>
                  <Text variant='h3' className='text-left'>
                    {greeting}
                  </Text>
                  <Pressable
                    onPress={handleSortPress}
                    className='h-11 w-11 items-center justify-center rounded-badge bg-muted'
                    accessibilityRole='button'
                    accessibilityLabel='Sort events'
                  >
                    <Ionicons
                      name='swap-vertical'
                      size={18}
                      color={mutedColor}
                    />
                  </Pressable>
                </View>

                {/* Pending invites banner */}
                {pendingInvites > 0 ? (
                  <Pressable
                    onPress={() => router.push('/invites')}
                    className='mt-3 flex-row items-center justify-between rounded-card bg-primary/10 px-4 py-3'
                    accessibilityRole='button'
                    accessibilityLabel={`${pendingInvites} pending ${pendingInvites === 1 ? 'invite' : 'invites'}`}
                    accessibilityHint='Opens pending invitations'
                  >
                    <View className='flex-row items-center gap-2'>
                      <Ionicons name='mail' size={18} color={primaryColor} />
                      <Text className='text-sm font-medium text-primary'>
                        {pendingInvites} pending{' '}
                        {pendingInvites === 1 ? 'invite' : 'invites'}
                      </Text>
                    </View>
                    <Ionicons
                      name='chevron-forward'
                      size={16}
                      color={primaryColor}
                    />
                  </Pressable>
                ) : null}
              </View>

              <TabBarFilter
                tabs={EVENT_TABS}
                activeTab={activeTab}
                onTabChange={key => setActiveTab(key as EventTab)}
              />
            </View>
          }
          ListEmptyComponent={<EmptyEvents />}
          contentContainerClassName='pb-6'
          contentContainerStyle={
            sortedEvents.length === 0 ? { flex: 1 } : undefined
          }
          className='px-4'
        />
        <CreateEventFab />
      </View>
    </SafeAreaView>
  );
}
