import { useState } from 'react';
import { View, Pressable, Image } from 'react-native';
import { Text } from '@/components/ui/text';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { BackButton } from '@/components/ui/back-button';
import { Badge } from '@/components/ui/badge';
import { ImageLightbox } from '@/components/ui/image-lightbox';
import {
  useActionMenu,
  type ActionMenuOption,
} from '@/components/ui/action-menu';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { useDeleteEvent, useLeaveEvent } from '@/hooks/use-events';
import { useIsEventMuted, useToggleEventMute } from '@/hooks/use-muting';
import { useCreateReport } from '@/hooks/use-reports';
import { EventRsvp } from './event-rsvp';
import { toast } from '@groupi/shared/platform';
import { useCSSVariable } from 'uniwind';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HeaderData = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Permissions = any;

interface EventHeaderProps {
  headerData: HeaderData;
  permissions: Permissions;
  eventId: string;
}

function formatEventDate(
  chosenDateTime?: number,
  chosenEndDateTime?: number
): string | null {
  if (!chosenDateTime) return null;
  try {
    const start = new Date(chosenDateTime);
    const formatted = start.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    if (chosenEndDateTime) {
      const end = new Date(chosenEndDateTime);
      const endFormatted = end.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      });
      return `${formatted} - ${endFormatted}`;
    }

    return formatted;
  } catch {
    return null;
  }
}

export function EventHeader({
  headerData,
  permissions,
  eventId,
}: EventHeaderProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const deleteEvent = useDeleteEvent();
  const leaveEvent = useLeaveEvent();
  const toggleMute = useToggleEventMute();
  const isMuted = useIsEventMuted(eventId);
  const createReport = useCreateReport();
  const { showActionMenu } = useActionMenu();
  const primaryColor = String(useCSSVariable('--color-primary') ?? '');
  const mutedColor = String(useCSSVariable('--color-muted-foreground') ?? '');

  const event = headerData?.event ?? headerData;
  const userMembership = headerData?.userMembership;

  const title = event?.title ?? 'Untitled Event';
  const description = event?.description;
  const location = event?.location;
  const chosenDateTime = event?.chosenDateTime;
  const chosenEndDateTime = event?.chosenEndDateTime;
  const visibility = event?.visibility;
  const imageUrl = event?.imageUrl;

  const formattedDate = formatEventDate(chosenDateTime, chosenEndDateTime);
  const isOrganizer = permissions?.canDelete === true;

  function handleShowMenu() {
    const options: ActionMenuOption[] = [];

    if (permissions?.canEdit) {
      options.push({
        label: 'Edit Event',
        icon: 'create-outline',
        onPress: () => router.push(`/event/${eventId}/edit`),
      });
    }

    if (permissions?.canManage) {
      options.push({
        label: 'Manage Members',
        icon: 'people-outline',
        onPress: () => router.push(`/event/${eventId}/attendees`),
      });
    }

    if (permissions?.canDelete) {
      options.push({
        label: 'Delete Event',
        icon: 'trash-outline',
        destructive: true,
        onPress: () => {
          showConfirmDialog({
            title: 'Delete Event',
            message: 'Are you sure? This cannot be undone.',
            confirmLabel: 'Delete',
            destructive: true,
            onConfirm: async () => {
              try {
                await deleteEvent({ eventId });
                toast.success('Event deleted');
                router.replace('/(tabs)');
              } catch {
                toast.error('Failed to delete event');
              }
            },
          });
        },
      });
    } else {
      options.push({
        label: 'Leave Event',
        icon: 'exit-outline',
        destructive: true,
        onPress: () => {
          showConfirmDialog({
            title: 'Leave Event',
            message: 'Are you sure you want to leave this event?',
            confirmLabel: 'Leave',
            destructive: true,
            onConfirm: async () => {
              try {
                await leaveEvent({ eventId });
                toast.success('Left event');
                router.replace('/(tabs)');
              } catch {
                toast.error('Failed to leave event');
              }
            },
          });
        },
      });
    }

    // Common options for all users
    options.push({
      label: isMuted ? 'Unmute Event' : 'Mute Event',
      icon: isMuted ? 'notifications-outline' : 'notifications-off-outline',
      onPress: () => toggleMute(eventId),
    });

    if (!isOrganizer) {
      options.push({
        label: 'Report Event',
        icon: 'flag-outline',
        onPress: () => {
          createReport({
            targetType: 'EVENT',
            targetId: eventId,
            reason: 'INAPPROPRIATE_CONTENT',
          });
        },
      });
    }

    showActionMenu({ title: 'Event Options', options });
  }

  return (
    <View>
      {/* Cover image */}
      {imageUrl ? (
        <View className='relative'>
          <Pressable
            onPress={() => setLightboxOpen(true)}
            accessibilityRole='button'
            accessibilityLabel={`View ${title} cover image`}
          >
            <Image
              source={{ uri: imageUrl }}
              className='h-52 w-full'
              resizeMode='cover'
              accessible={false}
            />
          </Pressable>
          {/* Gradient overlay for navigation buttons */}
          <View className='absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent' />
          {/* Navigation buttons overlaid on image */}
          <View className='absolute inset-x-0 top-0 flex-row items-center justify-between px-4 py-3'>
            <BackButton className='h-11 w-11 items-center justify-center rounded-badge bg-black/40' />
            <Pressable
              onPress={handleShowMenu}
              className='h-11 w-11 items-center justify-center rounded-badge bg-black/40'
              accessibilityRole='button'
              accessibilityLabel='Event actions'
            >
              <Ionicons name='ellipsis-horizontal' size={20} color='#ffffff' />
            </Pressable>
          </View>
          <ImageLightbox
            uri={imageUrl}
            visible={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
          />
        </View>
      ) : (
        /* Navigation bar without image */
        <View className='flex-row items-center justify-between px-4 py-3'>
          <BackButton />
          <Pressable
            onPress={handleShowMenu}
            className='h-11 w-11 items-center justify-center rounded-badge border-2 border-background bg-muted shadow-raised'
            accessibilityRole='button'
            accessibilityLabel='Event actions'
          >
            <Ionicons name='ellipsis-horizontal' size={20} color={mutedColor} />
          </Pressable>
        </View>
      )}

      <View className='px-4'>
        {/* Title */}
        <Text
          className={`text-2xl font-bold text-foreground ${imageUrl ? 'mt-4' : ''}`}
        >
          {title}
        </Text>

        {/* Visibility badge */}
        {visibility ? (
          <View className='mt-2'>
            <Badge variant='secondary'>
              {visibility === 'PUBLIC'
                ? 'Public'
                : visibility === 'FRIENDS'
                  ? 'Friends'
                  : 'Private'}
            </Badge>
          </View>
        ) : null}

        {/* Date */}
        {formattedDate ? (
          <View className='mt-3 flex-row items-center gap-2'>
            <Ionicons name='calendar-outline' size={16} color={mutedColor} />
            <Text className='text-base text-muted-foreground'>
              {formattedDate}
            </Text>
          </View>
        ) : !chosenDateTime ? (
          <Pressable
            onPress={() => router.push(`/event/${eventId}/availability`)}
            className='mt-3 flex-row items-center gap-2'
            accessibilityRole='button'
            accessibilityLabel={
              isOrganizer ? 'Choose event date and time' : 'Set availability'
            }
          >
            <Ionicons name='calendar-outline' size={16} color={primaryColor} />
            <Text className='text-base font-medium text-primary'>
              {isOrganizer ? 'Choose Date/Time' : 'Set Availability'}
            </Text>
          </Pressable>
        ) : null}

        {/* Location */}
        {location ? (
          <View className='mt-2 flex-row items-center gap-2'>
            <Ionicons name='location-outline' size={16} color={mutedColor} />
            <Text className='text-base text-muted-foreground'>{location}</Text>
          </View>
        ) : null}

        {/* Description */}
        {description ? (
          <Text className='mt-3 text-base leading-relaxed text-foreground'>
            {description}
          </Text>
        ) : null}

        {/* RSVP */}
        {chosenDateTime && userMembership ? (
          <EventRsvp
            eventId={eventId}
            currentStatus={userMembership.rsvpStatus}
            currentNote={userMembership.rsvpNote}
            isOrganizer={isOrganizer}
          />
        ) : null}
      </View>
    </View>
  );
}
