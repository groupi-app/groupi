import { View, FlatList } from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { useDiscoverableEvents } from '@/hooks/use-event-admission';
import { router } from 'expo-router';
import { useCSSVariable } from 'uniwind';

import { ListScreenTemplate } from '@/components/templates';
import { LoadingState } from '@/components/molecules';
import { EmptyState } from '@/components/ui/empty-state';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
  const events = useDiscoverableEvents();
  const mutedColor = String(
    useCSSVariable('--color-muted-foreground') ?? 'transparent'
  );

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
      subtitle='Upcoming and undated Events shared through Friends and Groups'
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
          return (
            <Card className='mb-3'>
              <Text className='text-lg font-bold text-foreground'>
                {item.title}
              </Text>

              {item.organizer?.name ? (
                <View className='mt-1 flex-row items-center gap-2'>
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

              <View
                className='mt-3 flex-row flex-wrap gap-2'
                accessibilityLabel='Your access reasons'
              >
                {item.accessReasons?.friends === true ? (
                  <Text className='rounded-badge bg-info px-2 py-1 text-sm text-info-foreground'>
                    Shared by a friend
                  </Text>
                ) : null}
                {(item.accessReasons?.groups ?? []).map(group => (
                  <Text
                    key={group.groupId}
                    className='rounded-badge bg-secondary px-2 py-1 text-sm text-secondary-foreground'
                  >{`Shared with ${group.name}`}</Text>
                ))}
              </View>
              <Text className='mt-2 text-sm text-muted-foreground'>
                {item.entryAction === 'JOIN'
                  ? 'Direct joining is available from the Event preview. Joining leaves your RSVP Pending.'
                  : item.entryAction === 'APPLY'
                    ? 'View the Event preview to apply for approval.'
                    : item.entryAction === 'INVITATION_ONLY'
                      ? 'An invitation is required to join. Sharing gives you access to Event logistics.'
                      : 'Read Event logistics. Joining is currently unavailable.'}
              </Text>
              {item.chosenDateTime === null ? (
                <Text className='mt-2 text-sm text-muted-foreground'>
                  Date not yet chosen
                </Text>
              ) : null}
              <View className='mt-3'>
                <Button
                  size='sm'
                  onPress={() => router.push(`/event/${item.eventId}/preview`)}
                  accessibilityLabel={`View ${item.title}`}
                  accessibilityHint='Read event details and available entry options'
                >
                  View Event
                </Button>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon='compass-outline'
            title='No events to discover'
            description='Upcoming and undated Events shared through eligible Groups or Friends will appear here. Your current access and completed required Group onboarding determine what you can discover.'
          />
        }
      />
    </ListScreenTemplate>
  );
}
