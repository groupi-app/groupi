import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/button';
import { DetailScreenTemplate } from '@/components/templates';
import { StatusPicker } from '@/components/molecules';
import { LoadingState } from '@/components/molecules';
import { useGlobalUser } from '@/context/global-user-context';
import { useCanManageEvent } from '@/hooks/use-events';
import {
  useEventAvailabilityData,
  useSubmitAvailability,
} from '@/hooks/use-availability';
import { useChooseEventDate } from '@/hooks/use-members';
import { toast } from '@groupi/shared/platform';

import type { VoteStatus } from '@/components/molecules';

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
  const permissions = useCanManageEvent(eventId as never);

  const availabilityData = useEventAvailabilityData(eventId);
  const submitAvailability = useSubmitAvailability();
  const chooseDate = useChooseEventDate();

  const [votes, setVotes] = useState<Record<string, VoteStatus | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  if (availabilityData && !initialized && person) {
    const initialVotes: Record<string, VoteStatus | null> = {};
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

  function handleBatchSelect(status: VoteStatus | null) {
    const potentialDates = availabilityData?.potentialDateTimes ?? [];
    const newVotes: Record<string, VoteStatus | null> = {};
    for (const dt of potentialDates) {
      newVotes[dt._id] = status;
    }
    setVotes(newVotes);
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
    } finally {
      setIsSubmitting(false);
    }
  }

  if (availabilityData === undefined) {
    return (
      <DetailScreenTemplate title='Availability'>
        <LoadingState />
      </DetailScreenTemplate>
    );
  }

  const potentialDates = availabilityData?.potentialDateTimes ?? [];
  const isOrganizer = permissions?.role === 'ORGANIZER';

  return (
    <DetailScreenTemplate title='Set Availability'>
      <Text className='mb-4 text-base text-muted-foreground'>
        Let the organizer know when you&apos;re available
      </Text>

      {/* Batch quick-select */}
      {potentialDates.length > 1 ? (
        <View className='mb-4 flex-row gap-2'>
          <Pressable
            onPress={() => handleBatchSelect('YES')}
            className='flex-1 items-center rounded-button border border-border py-2'
          >
            <Text className='text-xs font-medium text-success'>All Yes</Text>
          </Pressable>
          <Pressable
            onPress={() => handleBatchSelect('MAYBE')}
            className='flex-1 items-center rounded-button border border-border py-2'
          >
            <Text className='text-xs font-medium text-warning'>All Maybe</Text>
          </Pressable>
          <Pressable
            onPress={() => handleBatchSelect('NO')}
            className='flex-1 items-center rounded-button border border-border py-2'
          >
            <Text className='text-xs font-medium text-error'>All No</Text>
          </Pressable>
          <Pressable
            onPress={() => handleBatchSelect(null)}
            className='flex-1 items-center rounded-button border border-border py-2'
          >
            <Text className='text-xs font-medium text-muted-foreground'>
              Clear
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* Summary toggle */}
      {potentialDates.length > 0 ? (
        <Pressable
          onPress={() => setShowSummary(!showSummary)}
          className='mb-4 flex-row items-center justify-between rounded-card border border-border bg-card p-3'
        >
          <Text className='text-sm font-medium text-foreground'>
            {showSummary ? 'Hide response summary' : 'Show response summary'}
          </Text>
          <Ionicons
            name={showSummary ? 'chevron-up' : 'chevron-down'}
            size={16}
            color='#6b7280'
          />
        </Pressable>
      ) : null}

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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              availabilities?: any[];
            }) => {
              const currentVote = votes[dt._id] ?? null;
              const allAvailabilities = dt.availabilities ?? [];
              const yesCount = allAvailabilities.filter(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (a: any) => a.status === 'YES'
              ).length;
              const maybeCount = allAvailabilities.filter(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (a: any) => a.status === 'MAYBE'
              ).length;
              const noCount = allAvailabilities.filter(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (a: any) => a.status === 'NO'
              ).length;

              return (
                <View
                  key={dt._id}
                  className='rounded-card border border-border bg-card p-4'
                >
                  <View className='flex-row items-start justify-between'>
                    <View className='flex-1'>
                      <Text className='text-base font-medium text-foreground'>
                        {formatDate(dt.startDateTime)}
                      </Text>
                      {dt.note ? (
                        <Text className='mt-1 text-sm text-muted-foreground'>
                          {dt.note}
                        </Text>
                      ) : null}
                    </View>
                    {isOrganizer ? (
                      <Pressable
                        onPress={() =>
                          chooseDate({
                            eventId,
                            chosenDateTime: dt.startDateTime,
                            chosenEndDateTime: dt.endDateTime,
                          })
                        }
                        className='rounded-button bg-primary/10 px-3 py-1'
                      >
                        <Text className='text-xs font-semibold text-primary'>
                          Choose
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>

                  {/* Response summary */}
                  {showSummary ? (
                    <View className='mt-2 flex-row gap-3'>
                      <View className='flex-row items-center gap-1'>
                        <Ionicons
                          name='checkmark-circle'
                          size={14}
                          color='#22c55e'
                        />
                        <Text className='text-xs text-muted-foreground'>
                          {yesCount}
                        </Text>
                      </View>
                      <View className='flex-row items-center gap-1'>
                        <Ionicons
                          name='help-circle'
                          size={14}
                          color='#f59e0b'
                        />
                        <Text className='text-xs text-muted-foreground'>
                          {maybeCount}
                        </Text>
                      </View>
                      <View className='flex-row items-center gap-1'>
                        <Ionicons
                          name='close-circle'
                          size={14}
                          color='#ef4444'
                        />
                        <Text className='text-xs text-muted-foreground'>
                          {noCount}
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  <StatusPicker
                    value={currentVote}
                    onChange={status => toggleVote(dt._id, status)}
                    className='mt-3'
                  />
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
    </DetailScreenTemplate>
  );
}
