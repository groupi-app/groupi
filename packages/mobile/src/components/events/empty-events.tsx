import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/text';

export function EmptyEvents() {
  return (
    <View className='flex-1 items-center justify-center px-6'>
      <View className='mb-4 h-20 w-20 items-center justify-center rounded-full bg-muted'>
        <Ionicons name='calendar-outline' size={36} color='#9ca3af' />
      </View>
      <Text variant='h4'>No events yet</Text>
      <Text variant='muted' className='mt-2 text-center'>
        Create your first event or join one to get started
      </Text>
    </View>
  );
}
