import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCSSVariable } from 'uniwind';

import { Text } from '@/components/ui/text';

interface EmptyEventsProps {
  title?: string;
  description?: string;
}

export function EmptyEvents({
  title = 'No events yet',
  description = 'Create your first event or join one to get started',
}: EmptyEventsProps) {
  const mutedColor = String(useCSSVariable('--color-muted-foreground') ?? '');

  return (
    <View className='items-center px-6 pb-24 pt-10'>
      <View className='mb-4 h-20 w-20 items-center justify-center rounded-full bg-muted'>
        <Ionicons name='calendar-outline' size={36} color={mutedColor} />
      </View>
      <Text variant='h4'>{title}</Text>
      <Text variant='muted' className='mt-2 text-center'>
        {description}
      </Text>
    </View>
  );
}
