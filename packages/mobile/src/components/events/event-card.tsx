import { Image, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

import { GroupiMark } from '@/components/atoms/groupi-mark';
import { MutedEventIndicator } from './muted-event-indicator';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import {
  useActionMenu,
  type ActionMenuOption,
} from '@/components/ui/action-menu';
import { showConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToggleEventMute } from '@/hooks/use-muting';
import { useDeleteEvent, useLeaveEvent } from '@/hooks/use-events';

interface EventCardProps {
  event: {
    _id: string;
    title: string;
    location?: string;
    chosenDateTime?: string;
    memberCount: number;
    imageUrl?: string | null;
  };
  membership: {
    role: string;
    rsvpStatus: string;
  };
  organizer: {
    user: { name: string | null };
  } | null;
  isMuted?: boolean;
}

function formatDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}

function getRsvpColor(status: string): string {
  switch (status) {
    case 'YES':
      return 'bg-success';
    case 'MAYBE':
      return 'bg-warning';
    case 'NO':
      return 'bg-error';
    default:
      return 'bg-muted';
  }
}

export function EventCard({
  event,
  membership,
  organizer,
  isMuted = false,
}: EventCardProps) {
  const formattedDate = formatDate(event.chosenDateTime);
  const toggleMute = useToggleEventMute();
  const deleteEvent = useDeleteEvent();
  const leaveEvent = useLeaveEvent();
  const { showActionMenu } = useActionMenu();
  const isOrganizer = membership.role === 'ORGANIZER';
  const primaryColor = String(useCSSVariable('--color-primary') ?? '');
  const mutedColor = String(useCSSVariable('--color-muted-foreground') ?? '');
  const onPrimaryColor = String(
    useCSSVariable('--color-primary-foreground') ?? ''
  );

  function handleLongPress() {
    const options: ActionMenuOption[] = [];

    options.push({
      label: isMuted ? 'Unmute Event' : 'Mute Event',
      icon: isMuted ? 'notifications-outline' : 'notifications-off-outline',
      showChevron: false,
      onPress: () => toggleMute(event._id),
    });

    if (isOrganizer) {
      options.push({
        label: 'Edit Event',
        icon: 'create-outline',
        showChevron: true,
        onPress: () => router.push(`/event/${event._id}/edit`),
      });
      options.push({
        label: 'Delete Event',
        icon: 'trash-outline',
        destructive: true,
        onPress: () =>
          showConfirmDialog({
            title: 'Delete Event',
            message:
              'This will permanently delete the event and all its content.',
            confirmLabel: 'Delete',
            destructive: true,
            onConfirm: () => deleteEvent(event._id as never),
          }),
      });
    } else {
      options.push({
        label: 'Leave Event',
        icon: 'exit-outline',
        destructive: true,
        onPress: () =>
          showConfirmDialog({
            title: 'Leave Event',
            message: 'Are you sure you want to leave this event?',
            confirmLabel: 'Leave',
            destructive: true,
            onConfirm: () => leaveEvent(event._id as never),
          }),
      });
    }

    showActionMenu({
      title: event.title,
      options,
    });
  }

  return (
    <Pressable
      onPress={() => router.push(`/event/${event._id}`)}
      onLongPress={handleLongPress}
      accessibilityRole='button'
      accessibilityLabel={`${event.title}, ${membership.rsvpStatus.toLowerCase()} RSVP${event.location ? `, ${event.location}` : ''}${isMuted ? ', notifications muted' : ''}`}
      accessibilityHint='Opens event. Long press for event actions.'
    >
      <Card className='mb-3 gap-0 overflow-hidden p-0'>
        <View className='aspect-video w-full items-center justify-center overflow-hidden bg-primary/10'>
          {event.imageUrl ? (
            <Image
              source={{ uri: event.imageUrl }}
              className='h-full w-full'
              resizeMode='cover'
              accessible={false}
            />
          ) : (
            <GroupiMark size={56} color={primaryColor} />
          )}
        </View>

        <View className='p-4'>
          <View className='flex-row items-start justify-between'>
            <View className='flex-1 pr-3'>
              <View className='flex-row items-center gap-2'>
                <Text className='text-lg font-bold' numberOfLines={2}>
                  {event.title}
                </Text>
                {isMuted ? <MutedEventIndicator size={14} /> : null}
              </View>

              {organizer?.user?.name ? (
                <Text variant='muted' className='mt-1'>
                  by {organizer.user.name}
                </Text>
              ) : null}
            </View>

            <View
              className={`h-3 w-3 rounded-full border-[1.5px] border-card shadow-raised ${getRsvpColor(membership.rsvpStatus)}`}
            />
          </View>

          <View className='mt-3 flex-row flex-wrap gap-3'>
            {formattedDate ? (
              <View className='flex-row items-center gap-1'>
                <Ionicons
                  name='calendar-outline'
                  size={14}
                  color={mutedColor}
                />
                <Text variant='muted' className='text-sm'>
                  {formattedDate}
                </Text>
              </View>
            ) : null}

            {event.location ? (
              <View className='flex-row items-center gap-1'>
                <Ionicons
                  name='location-outline'
                  size={14}
                  color={mutedColor}
                />
                <Text variant='muted' className='text-sm' numberOfLines={1}>
                  {event.location}
                </Text>
              </View>
            ) : null}

            <View className='flex-row items-center gap-1'>
              <Ionicons name='people-outline' size={14} color={mutedColor} />
              <Text variant='muted' className='text-sm' numberOfLines={1}>
                {event.memberCount}
              </Text>
            </View>
          </View>

          {isOrganizer ? (
            <View className='mt-2 self-start flex-row items-center gap-1 rounded-badge border-2 border-background bg-warning px-2 py-0.5 shadow-raised'>
              <Ionicons name='star' size={10} color={onPrimaryColor} />
              <Text className='text-xs font-semibold text-primary-foreground'>
                Organizer
              </Text>
            </View>
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}
