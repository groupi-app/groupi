import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { showActionSheet } from '@/components/ui/action-sheet';
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
  const isOrganizer = membership.role === 'ORGANIZER';

  function handleLongPress() {
    const options: {
      label: string;
      onPress: () => void;
      destructive?: boolean;
    }[] = [];

    options.push({
      label: isMuted ? 'Unmute Event' : 'Mute Event',
      onPress: () => toggleMute(event._id),
    });

    if (isOrganizer) {
      options.push({
        label: 'Edit Event',
        onPress: () => router.push(`/event/${event._id}/edit`),
      });
      options.push({
        label: 'Delete Event',
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

    showActionSheet({
      title: event.title,
      options,
    });
  }

  return (
    <Pressable
      onPress={() => router.push(`/event/${event._id}`)}
      onLongPress={handleLongPress}
    >
      <Card className='mb-3'>
        <View className='flex-row items-start justify-between'>
          <View className='flex-1 pr-3'>
            <View className='flex-row items-center gap-2'>
              <Text className='text-lg font-bold' numberOfLines={2}>
                {event.title}
              </Text>
              {isMuted ? (
                <Ionicons name='notifications-off' size={14} color='#9ca3af' />
              ) : null}
            </View>

            {organizer?.user?.name ? (
              <Text variant='muted' className='mt-1'>
                by {organizer.user.name}
              </Text>
            ) : null}
          </View>

          <View
            className={`h-3 w-3 rounded-full border-[1.5px] border-white shadow-raised ${getRsvpColor(membership.rsvpStatus)}`}
          />
        </View>

        <View className='mt-3 flex-row flex-wrap gap-3'>
          {formattedDate ? (
            <View className='flex-row items-center gap-1'>
              <Ionicons name='calendar-outline' size={14} color='#9ca3af' />
              <Text variant='muted' className='text-sm'>
                {formattedDate}
              </Text>
            </View>
          ) : null}

          {event.location ? (
            <View className='flex-row items-center gap-1'>
              <Ionicons name='location-outline' size={14} color='#9ca3af' />
              <Text variant='muted' className='text-sm' numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          ) : null}

          <View className='flex-row items-center gap-1'>
            <Ionicons name='people-outline' size={14} color='#9ca3af' />
            <Text variant='muted' className='text-sm'>
              {event.memberCount}
            </Text>
          </View>
        </View>

        {isOrganizer ? (
          <View className='mt-2 self-start flex-row items-center gap-1 rounded-badge border-2 border-white bg-warning px-2 py-0.5 shadow-raised'>
            <Ionicons name='star' size={10} color='#ffffff' />
            <Text className='text-xs font-semibold text-white'>Organizer</Text>
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}
