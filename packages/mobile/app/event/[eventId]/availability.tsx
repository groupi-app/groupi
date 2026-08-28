import { useEffect, useState } from 'react';
import { View, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';
import type { Id } from 'convex/_generated/dataModel';
import { rankAvailabilityOptions } from '@groupi/shared/utils';

import { Button } from '@/components/ui/button';
import { DetailScreenTemplate } from '@/components/templates';
import { StatusPicker } from '@/components/molecules';
import { LoadingState } from '@/components/molecules';
import { DateVoteBreakdown } from '@/components/events/date-vote-breakdown';
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
  const [expandedDateId, setExpandedDateId] =
    useState<Id<'potentialDateTimes'> | null>(null);

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
            potentialDateTimeId: dateId,
            selectionSource: 'POLL',
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
  const displayedDates = isOrganizer
    ? rankAvailabilityOptions(potentialDates)
    : potentialDates.map(date => ({ ...date, rank: undefined }));

  return (
    <DetailScreenTemplate
      title={isOrganizer ? 'Choose Date/Time' : 'Set Availability'}
    >
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
            <Text className='text-xs font-medium text-text-success'>
              All Yes
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleBatchSelect('MAYBE')}
            accessibilityRole='button'
            accessibilityLabel='Mark every date maybe'
            className='flex-1 items-center rounded-button border border-border py-2'
          >
            <Text className='text-xs font-medium text-text-warning'>
              All Maybe
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleBatchSelect('NO')}
            accessibilityRole='button'
            accessibilityLabel='Mark every date no'
            className='flex-1 items-center rounded-button border border-border py-2'
          >
            <Text className='text-xs font-medium text-text-error'>All No</Text>
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

      {potentialDates.length === 0 ? (
        <View className='items-center py-12'>
          <Ionicons name='calendar-outline' size={48} color={mutedColor} />
          <Text className='mt-4 text-base text-muted-foreground'>
            No dates have been proposed yet
          </Text>
        </View>
      ) : (
        <View className='gap-3'>
          {displayedDates.map(dt => {
            const currentVote = votes[dt._id] ?? null;

            return (
              <View
                key={dt._id}
                className='rounded-card border border-border bg-card p-4'
              >
                <View className='flex-row items-center gap-3'>
                  {dt.rank ? (
                    <View className='h-11 w-11 shrink-0 items-center justify-center rounded-button bg-muted'>
                      <Text className='text-base font-bold text-foreground'>
                        #{dt.rank}
                      </Text>
                    </View>
                  ) : null}
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
                      className='min-h-10 shrink-0 items-center justify-center rounded-button bg-primary/10 px-4'
                    >
                      <Text className='text-xs font-semibold text-primary'>
                        {choosingDateId === dt._id ? 'Choosing…' : 'Choose'}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                <DateVoteBreakdown
                  date={dt}
                  viewerRole={availabilityData.userRole}
                  expanded={expandedDateId === dt._id}
                  onToggle={() =>
                    setExpandedDateId(current =>
                      current === dt._id ? null : dt._id
                    )
                  }
                />

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
