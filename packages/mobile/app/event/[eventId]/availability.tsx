import { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { Ionicons } from '@expo/vector-icons';

import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { useGlobalUser } from '@/context/global-user-context';
import { toast } from '@groupi/shared/platform';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { api } = require('convex/_generated/api') as { api: any };

type VoteStatus = 'YES' | 'MAYBE' | 'NO' | null;

const statusConfig = {
  YES: {
    icon: 'checkmark-circle' as const,
    color: '#22c55e',
    label: 'Available',
  },
  MAYBE: { icon: 'help-circle' as const, color: '#f59e0b', label: 'Maybe' },
  NO: { icon: 'close-circle' as const, color: '#ef4444', label: 'Unavailable' },
};

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AvailabilityScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { person } = useGlobalUser();

  const availabilityData = useQuery(
    api.events.queries.getEventAvailabilityData,
    { eventId }
  );

  const submitAvailability = useMutation(
    api.availability.mutations.submitAvailability
  );
  const [votes, setVotes] = useState<Record<string, VoteStatus>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize votes from existing data
  if (availabilityData && !initialized && person) {
    const initialVotes: Record<string, VoteStatus> = {};
    const potentialDates = availabilityData.potentialDateTimes ?? [];
    for (const dt of potentialDates) {
      const existing = dt.availabilities?.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (a: any) => a.personId === person._id
      );
      if (existing) {
        initialVotes[dt._id] = existing.status as VoteStatus;
      }
    }
    setVotes(initialVotes);
    setInitialized(true);
  }

  function toggleVote(dateId: string, status: VoteStatus) {
    setVotes(prev => ({
      ...prev,
      [dateId]: prev[dateId] === status ? null : status,
    }));
  }

  async function handleSubmit() {
    const responses = Object.entries(votes)
      .filter(([, status]) => status !== null)
      .map(([potentialDateTimeId, status]) => ({
        potentialDateTimeId,
        status: status as string,
      }));

    if (responses.length === 0) {
      toast.info('Select at least one date');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitAvailability({ eventId, responses });
      toast.success('Availability saved!');
    } catch {
      toast.error('Failed to save availability');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (availabilityData === undefined) {
    return (
      <SafeAreaView className='flex-1 bg-background'>
        <View className='flex-row items-center px-4 py-3'>
          <BackButton />
          <Text className='text-lg font-semibold text-foreground'>
            Availability
          </Text>
        </View>
        <View className='flex-1 items-center justify-center'>
          <ActivityIndicator size='large' />
        </View>
      </SafeAreaView>
    );
  }

  const potentialDates = availabilityData?.potentialDateTimes ?? [];

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <View className='flex-row items-center px-4 py-3'>
        <BackButton />
        <Text className='text-lg font-semibold text-foreground'>
          Set Availability
        </Text>
      </View>

      <ScrollView className='flex-1 px-4' contentContainerClassName='pb-8'>
        <Text className='mb-4 text-base text-muted-foreground'>
          Let the organizer know when you&apos;re available
        </Text>

        {potentialDates.length === 0 ? (
          <View className='items-center py-12'>
            <Ionicons name='calendar-outline' size={48} color='#9ca3af' />
            <Text className='mt-4 text-base text-muted-foreground'>
              No dates have been proposed yet
            </Text>
          </View>
        ) : (
          <View className='gap-3'>
            {potentialDates.map(
              (dt: {
                _id: string;
                startDateTime: number;
                endDateTime?: number;
                note?: string;
              }) => {
                const currentVote = votes[dt._id];
                return (
                  <View
                    key={dt._id}
                    className='rounded-card border border-border bg-card p-4'
                  >
                    <Text className='text-base font-medium text-foreground'>
                      {formatDate(dt.startDateTime)}
                    </Text>
                    {dt.note ? (
                      <Text className='mt-1 text-sm text-muted-foreground'>
                        {dt.note}
                      </Text>
                    ) : null}

                    <View className='mt-3 flex-row gap-2'>
                      {(['YES', 'MAYBE', 'NO'] as const).map(status => {
                        const cfg = statusConfig[status];
                        const isSelected = currentVote === status;
                        return (
                          <Pressable
                            key={status}
                            onPress={() => toggleVote(dt._id, status)}
                            className={`flex-1 flex-row items-center justify-center gap-1 rounded-button py-2 ${
                              isSelected
                                ? 'bg-primary/10 border border-primary'
                                : 'border border-border'
                            }`}
                          >
                            <Ionicons
                              name={cfg.icon}
                              size={16}
                              color={isSelected ? cfg.color : '#9ca3af'}
                            />
                            <Text
                              className={`text-sm font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}
                            >
                              {cfg.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              }
            )}
          </View>
        )}

        {potentialDates.length > 0 ? (
          <View className='mt-6'>
            <Button
              onPress={handleSubmit}
              isLoading={isSubmitting}
              loadingText='Saving...'
            >
              Save Availability
            </Button>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
