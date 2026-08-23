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
import type { EventPermissions } from '@/context/create-event-context';

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

function getPermissionPresetName(permissions?: EventPermissions): string {
  if (!permissions) return 'Standard';

  const { createPosts, inviteMembers, viewAttendeeList } = permissions;
  if (
    createPosts === 'EVERYONE' &&
    inviteMembers === 'EVERYONE' &&
    viewAttendeeList === 'EVERYONE'
  ) {
    return 'Loose';
  }
  if (
    createPosts === 'EVERYONE' &&
    inviteMembers === 'MODERATOR' &&
    viewAttendeeList === 'EVERYONE'
  ) {
    return 'Standard';
  }
  if (
    createPosts === 'MODERATOR' &&
    inviteMembers === 'ORGANIZER' &&
    viewAttendeeList === 'MODERATOR'
  ) {
    return 'Strict';
  }

  return 'Custom';
}

const ADDON_NAMES: Record<string, string> = {
  reminders: 'Reminders',
  'bring-list': 'Bring List',
  questionnaire: 'Questionnaire',
  discord: 'Discord',
};

const REMINDER_OFFSET_MS: Record<string, number> = {
  '30_MINUTES': 30 * 60 * 1000,
  '1_HOUR': 60 * 60 * 1000,
  '2_HOURS': 2 * 60 * 60 * 1000,
  '4_HOURS': 4 * 60 * 60 * 1000,
  '1_DAY': 24 * 60 * 60 * 1000,
  '2_DAYS': 2 * 24 * 60 * 60 * 1000,
  '3_DAYS': 3 * 24 * 60 * 60 * 1000,
  '1_WEEK': 7 * 24 * 60 * 60 * 1000,
  '2_WEEKS': 14 * 24 * 60 * 60 * 1000,
  '4_WEEKS': 28 * 24 * 60 * 60 * 1000,
};

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
    addonConfigs,
    permissions,
  } = formState;
  const createEvent = useCreateEvent();
  const { uploadFile, isUploading } = useFileUpload();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const primaryColor = String(useCSSVariable('--color-primary') ?? '');
  const successColor = String(useCSSVariable('--color-success') ?? '');

  async function handleSubmit() {
    if (!title.trim()) return;

    const reminderOffset = addonConfigs.reminders?.reminderOffset;
    const reminderDuration =
      typeof reminderOffset === 'string'
        ? REMINDER_OFFSET_MS[reminderOffset]
        : undefined;
    const eventStart =
      dateType === 'single'
        ? singleDate.getTime()
        : dateOptions.reduce(
            (earliest, option) => Math.min(earliest, option.date.getTime()),
            Number.POSITIVE_INFINITY
          );
    if (
      reminderDuration &&
      Number.isFinite(eventStart) &&
      eventStart - reminderDuration <= Date.now()
    ) {
      toast.error(
        'That reminder would be sent in the past. Choose a shorter reminder or update the event date.'
      );
      return;
    }

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
        permissions,
        addons: Object.entries(addonConfigs).map(([addonType, config]) => ({
          addonType,
          config,
        })),
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

          <View className='flex-row items-center gap-2'>
            <Ionicons
              name='shield-checkmark-outline'
              size={16}
              color={primaryColor}
            />
            <Text className='text-sm text-foreground'>
              {getPermissionPresetName(permissions)} permissions
            </Text>
          </View>

          {Object.keys(addonConfigs).length > 0 ? (
            <View className='flex-row items-start gap-2'>
              <Ionicons
                name='extension-puzzle-outline'
                size={16}
                color={primaryColor}
              />
              <Text className='flex-1 text-sm text-foreground'>
                {Object.keys(addonConfigs)
                  .map(addonType => ADDON_NAMES[addonType] ?? addonType)
                  .join(', ')}
              </Text>
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
          <ReviewCheckItem label='Permissions' checked color={successColor} />
          <ReviewCheckItem
            label='Add-ons'
            checked={Object.keys(addonConfigs).length > 0}
            optional
            color={successColor}
          />
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
