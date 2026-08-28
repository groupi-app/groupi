import { View } from 'react-native';
import { Text } from '@/components/ui/text';

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
    <View className='px-4 pb-4 pt-2'>
      <Text variant='h3' className='text-left'>
        {greeting}
      </Text>
      <Text variant='muted' className='mt-1'>
        {eventCount === 0
          ? 'No upcoming events'
          : eventCount === 1
            ? '1 event'
            : `${eventCount} events`}
      </Text>
    </View>
  );
}
