import { View, ScrollView, Image } from 'react-native';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';
import { router } from 'expo-router';
import { useState } from 'react';

import { useCreateEventForm } from '@/context/create-event-context';
import { useCreateEvent } from '@/hooks/use-events';
import { useFileUpload } from '@/hooks/use-file-upload';
import { toast } from '@groupi/shared/platform';

interface ReviewStepProps {
  onBack: () => void;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function ReviewStep({ onBack }: ReviewStepProps) {
  const { formState } = useCreateEventForm();
  const {
    title,
    description,
    location,
    dateType,
    singleDate,
    singleEndDate,
    hasEndTime,
    dateOptions,
    imageUri,
    imageFile,
  } = formState;
  const createEvent = useCreateEvent();
  const { uploadFile, isUploading } = useFileUpload();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const primaryColor = String(useCSSVariable('--color-primary') ?? '');
  const successColor = String(useCSSVariable('--color-success') ?? '');

  async function handleSubmit() {
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      let imageStorageId: string | undefined;

      if (imageFile) {
        const result = await uploadFile(
          imageFile.uri,
          imageFile.filename,
          imageFile.mimeType
        );
        if (result) {
          imageStorageId = result.storageId;
        }
      }

      const dateArgs: Record<string, unknown> = {};
      if (dateType === 'single') {
        dateArgs.chosenDateTime = singleDate.toISOString();
        if (hasEndTime && singleEndDate) {
          dateArgs.chosenEndDateTime = singleEndDate.toISOString();
        }
      } else if (dateType === 'multi' && dateOptions.length > 0) {
        dateArgs.potentialDateTimeOptions = dateOptions.map(opt => ({
          start: opt.date.toISOString(),
          end: opt.endDate ? opt.endDate.toISOString() : undefined,
        }));
      }

      const result = await createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        visibility: formState.visibility,
        imageStorageId,
        ...dateArgs,
      });

      toast.success('Event created!');
      const newEventId = result?.eventId;
      if (newEventId) {
        router.replace(`/event/${newEventId}`);
      } else {
        router.replace('/(tabs)');
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to create event'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScrollView className='flex-1 px-4' contentContainerClassName='pb-8'>
      <View className='gap-5'>
        <Text className='mt-2 text-2xl font-bold text-foreground'>Review</Text>
        <Text className='text-sm text-muted-foreground'>
          Make sure everything looks good before creating your event.
        </Text>

        {/* Summary card */}
        <View className='gap-4 rounded-card border border-border bg-card p-4'>
          {/* Cover image preview */}
          {imageUri ? (
            <View className='overflow-hidden rounded-input'>
              <Image
                source={{ uri: imageUri }}
                className='h-36 w-full'
                resizeMode='cover'
              />
            </View>
          ) : null}

          {/* Title */}
          <View className='gap-1'>
            <Text className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
              Event Name
            </Text>
            <Text className='text-lg font-semibold text-foreground'>
              {title}
            </Text>
          </View>

          {/* Description */}
          {description.trim() ? (
            <View className='gap-1'>
              <Text className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
                Description
              </Text>
              <Text className='text-sm text-foreground'>{description}</Text>
            </View>
          ) : null}

          {/* Location */}
          {location.trim() ? (
            <View className='flex-row items-center gap-2'>
              <Ionicons
                name='location-outline'
                size={16}
                color={primaryColor}
              />
              <Text className='text-sm text-foreground'>{location}</Text>
            </View>
          ) : null}

          {/* Visibility */}
          <View className='flex-row items-center gap-2'>
            <Ionicons
              name={
                formState.visibility === 'PUBLIC'
                  ? 'globe-outline'
                  : formState.visibility === 'FRIENDS'
                    ? 'people-outline'
                    : 'lock-closed-outline'
              }
              size={16}
              color={primaryColor}
            />
            <Text className='text-sm text-foreground'>
              {formState.visibility === 'PUBLIC'
                ? 'Public'
                : formState.visibility === 'FRIENDS'
                  ? 'Friends can discover'
                  : 'Private'}
            </Text>
          </View>

          {/* Date info */}
          <View className='gap-1'>
            <View className='flex-row items-center gap-2'>
              <Ionicons
                name='calendar-outline'
                size={16}
                color={primaryColor}
              />
              {dateType === 'single' ? (
                <View className='flex-1'>
                  <Text className='text-sm text-foreground'>
                    {formatDate(singleDate)}
                  </Text>
                  {hasEndTime && singleEndDate ? (
                    <Text className='text-xs text-muted-foreground'>
                      until {formatTime(singleEndDate)}
                    </Text>
                  ) : null}
                </View>
              ) : (
                <Text className='text-sm text-foreground'>
                  {dateOptions.length} date options for voting
                </Text>
              )}
            </View>
          </View>

          {/* Multi-date list */}
          {dateType === 'multi' && dateOptions.length > 0 ? (
            <View className='ml-6 gap-1'>
              {dateOptions.map((opt, index) => (
                <View key={opt.id} className='gap-0.5'>
                  <Text className='text-sm text-foreground'>
                    {index + 1}. {formatDate(opt.date)}
                  </Text>
                  {opt.endDate ? (
                    <Text className='ml-4 text-xs text-muted-foreground'>
                      until {formatTime(opt.endDate)}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Checklist */}
        <View className='gap-2'>
          <ReviewCheckItem
            label='Event title'
            checked={title.trim().length > 0}
            color={successColor}
          />
          <ReviewCheckItem
            label='Description'
            checked={description.trim().length > 0}
            optional
            color={successColor}
          />
          <ReviewCheckItem
            label='Location'
            checked={location.trim().length > 0}
            optional
            color={successColor}
          />
          <ReviewCheckItem
            label='Cover image'
            checked={imageUri !== null}
            optional
            color={successColor}
          />
          <ReviewCheckItem label='Date & time' checked color={successColor} />
        </View>

        <View className='mt-2 flex-row gap-3'>
          <Button variant='outline' onPress={onBack} className='flex-1'>
            Back
          </Button>
          <Button
            onPress={handleSubmit}
            isLoading={isSubmitting || isUploading}
            loadingText={isUploading ? 'Uploading...' : 'Creating...'}
            className='flex-1'
          >
            Create Event
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

function ReviewCheckItem({
  label,
  checked,
  optional,
  color,
}: {
  label: string;
  checked: boolean;
  optional?: boolean;
  color: string;
}) {
  return (
    <View className='flex-row items-center gap-2'>
      <Ionicons
        name={checked ? 'checkmark-circle' : 'ellipse-outline'}
        size={18}
        color={checked ? color : '#9ca3af'}
      />
      <Text
        className={`text-sm ${checked ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        {label}
        {optional && !checked ? ' (optional)' : ''}
      </Text>
    </View>
  );
}
