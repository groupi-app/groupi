import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export function CreateEventFab() {
  return (
    <Pressable
      onPress={() => router.push('/create-event')}
      className='absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full border-[3px] border-white bg-primary shadow-floating'
      style={{ elevation: 6 }}
    >
      <Ionicons name='add' size={28} color='#ffffff' />
    </Pressable>
  );
}
