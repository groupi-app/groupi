import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Badge } from '@/components/ui/badge';

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

export function EventCard({ event, membership, organizer }: EventCardProps) {
  const formattedDate = formatDate(event.chosenDateTime);

  return (
    <Pressable onPress={() => router.push(`/event/${event._id}`)}>
      <Card className='mb-3'>
        <View className='flex-row items-start justify-between'>
          <View className='flex-1 pr-3'>
            <Text className='text-lg font-bold' numberOfLines={2}>
              {event.title}
            </Text>

            {organizer?.user?.name ? (
              <Text variant='muted' className='mt-1'>
                by {organizer.user.name}
              </Text>
            ) : null}
          </View>

          <View
            className={`h-3 w-3 rounded-full ${getRsvpColor(membership.rsvpStatus)}`}
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

        {membership.role === 'ORGANIZER' ? (
          <Badge variant='outline' className='mt-2 self-start border-primary/20 bg-primary/10'>
            <Text className='text-xs font-medium text-primary'>Organizer</Text>
          </Badge>
        ) : null}
      </Card>
    </Pressable>
  );
}
