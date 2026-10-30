import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

export function CreateEventFab() {
  return (
    <Button
      accessibilityLabel='Create event'
      onPress={() => router.push('/create-event')}
      size='icon'
      className='absolute bottom-6 right-6 h-14 w-14 rounded-full'
    >
      <Icon as={Plus} size={28} className='text-primary-foreground' />
    </Button>
  );
}
