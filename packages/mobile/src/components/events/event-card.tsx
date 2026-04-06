import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
    <Pressable
      className="mb-3 rounded-card bg-card p-4"
      onPress={() => router.push(`/event/${event._id}`)}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-lg font-bold text-foreground" numberOfLines={2}>
            {event.title}
          </Text>

          {organizer?.user?.name ? (
            <Text className="mt-1 text-sm text-muted-foreground">
              by {organizer.user.name}
            </Text>
          ) : null}
        </View>

        <View
          className={`h-3 w-3 rounded-full ${getRsvpColor(membership.rsvpStatus)}`}
        />
      </View>

      <View className="mt-3 flex-row flex-wrap gap-3">
        {formattedDate ? (
          <View className="flex-row items-center gap-1">
            <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
            <Text className="text-sm text-muted-foreground">
              {formattedDate}
            </Text>
          </View>
        ) : null}

        {event.location ? (
          <View className="flex-row items-center gap-1">
            <Ionicons name="location-outline" size={14} color="#9ca3af" />
            <Text
              className="text-sm text-muted-foreground"
              numberOfLines={1}
            >
              {event.location}
            </Text>
          </View>
        ) : null}

        <View className="flex-row items-center gap-1">
          <Ionicons name="people-outline" size={14} color="#9ca3af" />
          <Text className="text-sm text-muted-foreground">
            {event.memberCount}
          </Text>
        </View>
      </View>

      {membership.role === 'ORGANIZER' ? (
        <View className="mt-2 self-start rounded-badge bg-primary/10 px-2 py-0.5">
          <Text className="text-xs font-medium text-primary">Organizer</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
