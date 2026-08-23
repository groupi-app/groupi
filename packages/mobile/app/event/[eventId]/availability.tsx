import { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';
import type { Id } from 'convex/_generated/dataModel';

import { Button } from '@/components/ui/button';
import { DetailScreenTemplate } from '@/components/templates';
import { StatusPicker } from '@/components/molecules';
import { LoadingState } from '@/components/molecules';
import {
  useEventAvailabilityData,
  useSubmitAvailability,
} from '@/hooks/use-availability';
import { useChooseEventDate } from '@/hooks/use-members';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
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
  const typedEventId = eventId as Id<'events'>;
  const mutedColor = String(
    useCSSVariable('--color-muted-foreground') ?? 'transparent'
  );
  const successColor = String(
    useCSSVariable('--color-success') ?? 'transparent'
  );
  const warningColor = String(
    useCSSVariable('--color-warning') ?? 'transparent'
  );
  const errorColor = String(useCSSVariable('--color-error') ?? 'transparent');

  const availabilityData = useEventAvailabilityData(typedEventId);
  const submitAvailability = useSubmitAvailability();
  const chooseDate = useChooseEventDate();

  const [votes, setVotes] = useState<Record<string, VoteStatus | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initializedEventId, setInitializedEventId] = useState<string | null>(
    null
  );
  const [choosingDateId, setChoosingDateId] =
    useState<Id<'potentialDateTimes'> | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    if (!availabilityData || initializedEventId === typedEventId) return;

    const initialVotes: Record<string, VoteStatus | null> = {};
    for (const date of availabilityData.potentialDateTimes) {
      const existing = date.availabilities.find(
        response => response.member.personId === availabilityData.userId
      );
      if (existing && existing.status !== 'PENDING') {
        initialVotes[date._id] = existing.status;
      }
    }
    setVotes(initialVotes);
    setInitializedEventId(typedEventId);
  }, [availabilityData, initializedEventId, typedEventId]);

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
      .filter((entry): entry is [string, VoteStatus] => entry[1] !== null)
      .map(([potentialDateTimeId, status]) => ({
        potentialDateTimeId: potentialDateTimeId as Id<'potentialDateTimes'>,
        status,
      }));

    if (responses.length !== potentialDates.length) {
      toast.info('Answer every proposed date before saving');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitAvailability({ eventId: typedEventId, responses });
    } catch {
      // The hook presents the failure toast.
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChooseDate(
    dateId: Id<'potentialDateTimes'>,
    dateTime: number,
    endDateTime?: number
  ) {
    showConfirmDialog({
      title: 'Choose event date?',
      message: `${formatDate(dateTime)} will become the confirmed event date.`,
      confirmLabel: 'Choose Date',
      onConfirm: async () => {
        setChoosingDateId(dateId);
        try {
          await chooseDate({
            eventId: typedEventId,
            chosenDateTime: dateTime,
            chosenEndDateTime: endDateTime,
          });
        } finally {
          setChoosingDateId(null);
        }
      },
    });
  }

  if (availabilityData === undefined) {
    return (
      <DetailScreenTemplate title='Availability'>
        <LoadingState />
      </DetailScreenTemplate>
    );
  }

  const potentialDates = availabilityData.potentialDateTimes;
  const isOrganizer = availabilityData.userRole === 'ORGANIZER';

  return (
    <DetailScreenTemplate title='Set Availability'>
      <Text className='mb-4 text-base text-muted-foreground'>
        {isOrganizer
          ? 'Review responses and choose the date that works best.'
          : "Let the organizer know when you're available."}
      </Text>

      {/* Batch quick-select */}
      {!isOrganizer && potentialDates.length > 1 ? (
        <View className='mb-4 flex-row gap-2'>
          <Pressable
            onPress={() => handleBatchSelect('YES')}
            accessibilityRole='button'
            accessibilityLabel='Mark every date yes'
            className='flex-1 items-center rounded-button border border-border py-2'
          >
            <Text className='text-xs font-medium text-success'>All Yes</Text>
          </Pressable>
          <Pressable
            onPress={() => handleBatchSelect('MAYBE')}
            accessibilityRole='button'
            accessibilityLabel='Mark every date maybe'
            className='flex-1 items-center rounded-button border border-border py-2'
          >
            <Text className='text-xs font-medium text-warning'>All Maybe</Text>
          </Pressable>
          <Pressable
            onPress={() => handleBatchSelect('NO')}
            accessibilityRole='button'
            accessibilityLabel='Mark every date no'
            className='flex-1 items-center rounded-button border border-border py-2'
          >
            <Text className='text-xs font-medium text-error'>All No</Text>
          </Pressable>
          <Pressable
            onPress={() => handleBatchSelect(null)}
            accessibilityRole='button'
            accessibilityLabel='Clear all availability responses'
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
          accessibilityRole='button'
          accessibilityState={{ expanded: showSummary }}
          className='mb-4 flex-row items-center justify-between rounded-card border border-border bg-card p-3'
        >
          <Text className='text-sm font-medium text-foreground'>
            {showSummary ? 'Hide response summary' : 'Show response summary'}
          </Text>
          <Ionicons
            name={showSummary ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={mutedColor}
          />
        </Pressable>
      ) : null}

      {potentialDates.length === 0 ? (
        <View className='items-center py-12'>
          <Ionicons name='calendar-outline' size={48} color={mutedColor} />
          <Text className='mt-4 text-base text-muted-foreground'>
            No dates have been proposed yet
          </Text>
        </View>
      ) : (
        <View className='gap-3'>
          {potentialDates.map(dt => {
            const currentVote = votes[dt._id] ?? null;
            const allAvailabilities = dt.availabilities;
            const yesCount = allAvailabilities.filter(
              response => response.status === 'YES'
            ).length;
            const maybeCount = allAvailabilities.filter(
              response => response.status === 'MAYBE'
            ).length;
            const noCount = allAvailabilities.filter(
              response => response.status === 'NO'
            ).length;

            return (
              <View
                key={dt._id}
                className='rounded-card border border-border bg-card p-4'
              >
                <View className='flex-row items-start justify-between'>
                  <View className='flex-1'>
                    <Text className='text-base font-medium text-foreground'>
                      {formatDate(dt.dateTime)}
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
                        handleChooseDate(dt._id, dt.dateTime, dt.endDateTime)
                      }
                      disabled={choosingDateId !== null}
                      accessibilityRole='button'
                      accessibilityLabel={`Choose ${formatDate(dt.dateTime)} as the event date`}
                      className='rounded-button bg-primary/10 px-3 py-1'
                    >
                      <Text className='text-xs font-semibold text-primary'>
                        {choosingDateId === dt._id ? 'Choosing…' : 'Choose'}
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
                        color={successColor}
                      />
                      <Text className='text-xs text-muted-foreground'>
                        {yesCount}
                      </Text>
                    </View>
                    <View className='flex-row items-center gap-1'>
                      <Ionicons
                        name='help-circle'
                        size={14}
                        color={warningColor}
                      />
                      <Text className='text-xs text-muted-foreground'>
                        {maybeCount}
                      </Text>
                    </View>
                    <View className='flex-row items-center gap-1'>
                      <Ionicons
                        name='close-circle'
                        size={14}
                        color={errorColor}
                      />
                      <Text className='text-xs text-muted-foreground'>
                        {noCount}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {!isOrganizer ? (
                  <StatusPicker
                    value={currentVote}
                    onChange={status => toggleVote(dt._id, status)}
                    className='mt-3'
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      {!isOrganizer && potentialDates.length > 0 ? (
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
