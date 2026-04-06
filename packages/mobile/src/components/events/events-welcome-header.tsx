import { View, Text } from 'react-native';

interface EventsWelcomeHeaderProps {
  userName: string | null;
  eventCount: number;
}

export function EventsWelcomeHeader({
  userName,
  eventCount,
}: EventsWelcomeHeaderProps) {
  const greeting = userName ? `Hey, ${userName.split(' ')[0]}!` : 'Hey there!';

  return (
    <View className="px-4 pb-4 pt-2">
      <Text className="text-2xl font-extrabold text-foreground">{greeting}</Text>
      <Text className="mt-1 text-base text-muted-foreground">
        {eventCount === 0
          ? 'No upcoming events'
          : eventCount === 1
            ? '1 event'
            : `${eventCount} events`}
      </Text>
    </View>
  );
}
